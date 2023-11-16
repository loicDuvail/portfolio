///////////// dependencies ///////////

require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const nodemailer = require("nodemailer");
const serveFnGen = require("./modules/staticServe");
const pool = require("./modules/DB-connection");
const SHA256 = require("./modules/SHA256");
const Sessions = require("./modules/sessions");
const auth = require("./modules/auth");
const FailedCnxHandler = require("./modules/failedCnxHandler");
const { v4 } = require("uuid");
Sessions.ageSessions(30000);

const app = express();
app.use(
  express.json(),
  cookieParser(),
  auth(["/adminSide/connected", "/private-api"], ["/adminSide", null])
);

const serve = serveFnGen(app);

///////////// nodemailer transporter ////////////

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  auth: {
    user: process.env.NODE_MAILER_USER,
    pass: process.env.NODE_MAILER_PASS,
  },
});

///////////// routing /////////////

serve("public", path.join(__dirname, "../public"));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/build/index.html"))
);

// -----TEMP-----
const views = [];
setInterval(() => {
  let text = "Report:\n\n";
  views.forEach((view) => {
    text += `id: ${view.id}, count: ${view.count}\n`;
  });
  transporter.sendMail({
    from: "portfolio.automated.mailer@gmail.com",
    to: "duvailloic1@gmail.com",
    text,
    subject: "Mail Report",
  });
}, 1000 * 3600 * 24);

app.get("/px/:id", (req, res) => {
  const { id } = req.params;

  let view = views.find((view) => view.id == id);
  if (view) view.count += 1;
  else views.push({ id, count: 1 });
  res.sendFile(path.join(__dirname, "./1x1.png"));
});

//----END-TEMP----

app.get("/adminSide", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/html/login.html"))
);

app.get("/adminSide/connected", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/html/adminSide.html"));
});

//////////// methods ////////////

app.post("/api/sendMail", (req, res) => {
  let { from, name, subject, message } = req.body;

  if (!from || !subject || !message)
    return res
      .send({ error: "error, missing info from input field" })
      .status(400);

  message =
    `
name: ${name}

email: ${from}
______________________________________

` + message;

  const email = {
    from: "portfolio.automated.mailer@gmail.com",
    to: "duvailloic1@gmail.com",
    subject,
    text: message,
  };

  console.log(email);

  transporter.sendMail(email, (err, info) => {
    if (err) console.error(err), res.send({ error: err }).status(500);
    else console.log(info), res.send({ ok: "ok" }).status(200);
  });
});

app.get("/api/getProjects", (req, res) => {
  pool.query(`SELECT * FROM projects`, (error, response) => {
    if (error)
      return (
        res.send({ error }).status(500),
        console.log(
          error +
            `
        `
        )
      );
    res.send(response).status(200);
  });
});

app.get("/api/getProjectsColumnNames", (req, res) => {
  pool.query(`DESCRIBE projects`, (error, response) => {
    if (!error) return res.send(response).status(200);
    res.send({ error }).status(500);
    console.log(
      error +
        `
    `
    );
  });
});

app.get("/private-api/getMailViews", (req, res) => {
  res.send(views);
});

app.post("/private-api/updateProject", (req, res) => {
  const { updatedProject } = req.body;
  let query = "UPDATE projects SET ";

  for (const key in updatedProject)
    if (key != "id") query += `${key} = "${updatedProject[key]}",`;

  query = query.slice(0, -1) + `WHERE id = ${updatedProject.id}`;

  pool.query(query, (err, response) => {
    if (err) return console.error(err), res.status(500).send({ error: err });
    res.status(200).send({ ok: "project successfuly updated" });
  });
});

app.post("/private-api/addProject", (req, res) => {
  const { newProject } = req.body;
  let query = "INSERT INTO projects ";
  let columns = "(";
  let values = "(";
  for (const key in newProject)
    if (key != "id") {
      columns += key + ",";
      values += `"newProject[key]",`;
    }
  columns = columns.slice(0, -1) + ")";
  values = values.slice(0, -1) + ")";
  query += columns + " VALUES " + values;

  pool.query(query, (err, response) => {
    if (err) return console.error(err), res.status(500).send({ error: err });
    res.send({ ok: "new project added to DB" });
  });
});

const FIVE_MINUTES_ms = 300_000;
const failedCnxHandler = new FailedCnxHandler(
  5,
  FIVE_MINUTES_ms,
  FIVE_MINUTES_ms
);
failedCnxHandler.onMaxFailedCnx = () =>
  transporter.sendMail({
    from: "portfolio.automated.mailer@gmail.com",
    to: "duvailloic1@gmail.com",
    subject: "TOO MANY FAILED ATTEMPS ON ADMIN_SIDE",
    text: failedCnxHandler.failedCnxs
      .map(
        (failedCnx) =>
          `{
          date: ${new Date(failedCnx.UTC_ms).toLocaleString("fr")}, 
          data: {
            passwordAttempt: "${failedCnx.data.passwordAttempt}"
            }
          }`
      )
      .toString(),
  });
const ONE_DAY_ms = 3600 * 1000 * 24;
app.post("/api/login", (req, res) => {
  if (!failedCnxHandler.canTryAgain())
    return res.send({
      error: `too many failed attemps, wait for ${failedCnxHandler.getRemainingBlockTime()}`,
    });

  const { password } = req.body;
  if (
    SHA256(password) ===
    "aec4fb61a155929f2c270df1842de97feda69ac7d5ec68fadbd4275c22a627df"
  ) {
    const sessionId = Sessions.createSession(v4(), ONE_DAY_ms);
    res.cookie("session_id", sessionId);
    res.status(200).send({ ok: "successfuly logged in as admin" });
    //reset failed attemps count
    failedCnxHandler.clearFailedCnx();
  } else {
    failedCnxHandler.addFailedAttemps({ passwordAttempt: password });
    res.status(401).send({ error: "Forbidden, wrong password" });
  }
});

app.post("/private-api/logout", (req, res) => {
  const { session_id } = req.cookies;
  Sessions.killSession(session_id, "user logged out");
  res.status(200).send({ ok: "successfuly logged out" });
});

/////////// error handling //////////

process.on("uncaughtException", (error) => console.error(error));

////////// server init ////////////

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
