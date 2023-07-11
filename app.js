const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server runs at http://localhost:3000"));
  } catch (e) {
    console.log(`Error message :${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

///1.API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE
      username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const len = password.length;
    if (len < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUser = `
        INSERT INTO 
          user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
            );`;
      const createdUser = await db.run(createUser);
      response.send("User created successfully");
    }
  }
});

////2.API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE
      username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

//3.PUT Method
app.put("/change-password", async (request, response) => {
  const { username, newPassword, oldPassword } = request.body;
  const selectUserQuery = `
    SELECT 
      *
    FROM
      user
    WHERE
      username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.send("Invalid user");
  } else {
    const pwCheck = await bcrypt.compare(oldPassword, dbUser.password);
    if (pwCheck !== true) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      const pwdLength = newPassword.length;
      if (pwdLength < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const changePwQuery = `
      UPDATE 
        user
      SET
        password = '${newHashedPassword}'
      WHERE 
        username = '${username}';`;
        const updatedPw = await db.run(changePwQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});

module.exports = app;
