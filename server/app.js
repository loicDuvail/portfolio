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
const { v4 } = require("uuid");
Sessions.ageSessions(30000);

const app = express();
app.use(
  express.json(),
  cookieParser(),
  auth(["/adminSide/connected", "/private-api"], ["/adminSide", false])
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

// app.get("/project/:id", (req, res) => {
//   res.cookie("project_id", req.params.id, { sameSite: true });
//   res.sendFile(path.join(__dirname, "../public/html/project.html"));
// });

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

// app.get("/api/getProject", (req, res) => {
//   const { project_id } = req.cookies;
//   if (!project_id) return res.send({ error: "project id not specified" });

//   pool.query(
//     `SELECT * FROM projects WHERE id = "${project_id}"`,
//     (error, response) => {
//       if (error) return res.send({ error }), console.log(error);
//       res.send(response[0]);
//     }
//   );
// });

app.post("/private-api/updateProject", (req, res) => {
  const { updatedProject } = req.body;
  const {
    id,
    name,
    description,
    what_i_learned,
    img,
    git_link,
    live_demo_link,
  } = updatedProject;

  let request = `UPDATE projects SET project_name = "${name}",description = "${description}",what_i_learned = "${what_i_learned}",img = "${img}",git_link = "${git_link}",live_demo_link = "${live_demo_link}" WHERE id = ${id}`;

  pool.query(request, (err, response) => {
    if (err) return console.error(err), res.status(500).send({ error: err });
    res.status(200).send({ ok: "project successfuly updated" });
  });
});

app.post("/private-api/addProject", (req, res) => {
  const { name, description, what_i_learned, img, git_link, live_demo_link } =
    req.body;
  let query = `INSERT INTO projects (project_name, description, what_i_learned, img, git_link, live_demo_link) VALUES ("${name}","${description}","${what_i_learned}","${img}","${git_link}","${live_demo_link}")`;
  pool.query(query, (err, response) => {
    if (err) return console.error(err), res.status(500).send({ error: err });
    res.send({ ok: "new project added to DB" });
  });
});

const TWO_HOURS_ms = 7200_000;
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (
    SHA256(password) ===
    "aec4fb61a155929f2c270df1842de97feda69ac7d5ec68fadbd4275c22a627df"
  ) {
    const sessionId = Sessions.createSession(v4(), TWO_HOURS_ms);
    res.cookie("session_id", sessionId);
    res.status(200).send({ ok: "successfuly logged in as admin" });
  } else {
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
