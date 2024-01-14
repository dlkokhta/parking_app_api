import pg from "pg";
import express from "express";
import swaggerMiddleware from "./middlewares/swagger-middleware.js";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sensitiveHeaders } from "./mail/edge.js";
import { recoveryHeader } from "./mail/edge.js";
import CryptoJS from "crypto-js";

// import { sendVerificationLink } from "./mail/edge.js";

const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "parking",
  password: "dima123",
  port: "5432",
});

const app = express();
app.use(bodyParser.json());

app.post("/api/send", async (req, res, next) => {
  const randomString = CryptoJS.lib.WordArray.random(32).toString(
    CryptoJS.enc.Hex
  );
  console.log("randomString", randomString);
  try {
    const user = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    let isAllFieldsFilled = Object.values(user).every(
      (field) => field !== null && field !== undefined && field !== ""
    );

    const client = await pool.connect();

    const userExist = await client.query({
      text: "SELECT * FROM users WHERE username = $1 OR email = $2",
      values: [user.username, user.email],
    });

    if (!isAllFieldsFilled) {
      return res.status(400).send({ error: "All fields are required" });
    } else if (userExist.rows.length > 0) {
      return res.status(400).send({ error: "User already exist" });
    } else {
      const result = await client.query({
        text: `INSERT INTO users (username, password, email, fullname, phonenumber, userverified) VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [
          user.username,
          hashedPassword,
          user.email,
          user.fullname,
          user.phonenumber,
          false,
        ],
      });

      await client.query({
        text: `INSERT INTO userverification ( email,crypto_key ) VALUES ($1, $2)`,
        values: [user.email, randomString],
      });

      await sensitiveHeaders(
        user.email,
        user.username,
        `http://localhost:3000/verify?param=${randomString}`
      );

      res.send(`user added to database`);
    }
  } catch (error) {
    next(error);
  }
});

app.put("/api/verify", async (req, res, next) => {
  try {
    const { param } = req.body; // get the param from the query string

    const client = await pool.connect();

    // Check if the key exists in the userverification table
    const result = await client.query({
      text: "SELECT * FROM userverification WHERE crypto_key = $1",
      values: [param],
    });

    if (result.rows.length > 0) {
      // If the key exists, update the user's verification status
      const email = result.rows[0].email;
      await client.query({
        text: "UPDATE users SET userverified = true WHERE email = $1",
        values: [email],
      });

      // Delete the key from the userverification table
      await client.query({
        text: "DELETE FROM userverification WHERE email = $1",
        values: [email],
      });

      res.send({ message: "User verification status updated to true" });
    } else {
      // If the key does not exist, send an error message
      res.status(400).send({ error: "Invalid verification key" });
    }
  } catch (error) {
    next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    const user = req.body;

    const client = await pool.connect();

    const result = await client.query({
      text: "SELECT * FROM users WHERE username = $1",
      values: [user.username],
    });

    if (result.rows.length === 0) {
      return res
        .status(400)
        .send({ error: "Username or password is wrong!!!!!!!!!" });
    }

    const passwordCorrect = await bcrypt.compare(
      user.password,
      result.rows[0].password
    );

    if (!passwordCorrect) {
      return res.status(400).send({ error: "Username or password is wrong" });
    }
    const payload = {
      username: user.username,
    };
    const token = jwt.sign({ payload }, "secret", {
      expiresIn: 86400, // expires in 24 hours
    });
    res.send({ message: "user logged in", token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/recover-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the database
    const client = await pool.connect();
    const result = await client.query({
      text: "SELECT * FROM users WHERE email = $1",
      values: [email],
    });

    if (result.rows.length === 0) {
      return res.status(400).send({ error: "Email not found" });
    }

    // Generate a password reset token
    const randomString = CryptoJS.lib.WordArray.random(32).toString(
      CryptoJS.enc.Hex
    );

    await client.query({
      text: `INSERT INTO passrecovery ( email,crypto_key ) VALUES ($1, $2)`,
      values: [email, randomString],
    });

    await recoveryHeader(
      email,

      `http://localhost:3000/verify?param=${randomString}`
    );

    res.send({ message: "Password recovery email sent" });
  } catch (error) {
    next(error);
  }
});

app.use("/", ...swaggerMiddleware());

app.listen(3000, () => {
  console.log("Server is running on port 3000.");
});
