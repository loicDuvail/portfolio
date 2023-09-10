const mysql = require("mysql2");

var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASSWORD,
    database: "portfolio",
    connectionLimit: 10,
});

pool.on("connection", function (connection) {
    console.log("DB Connection established");

    connection.on("error", function (err) {
        console.error(new Date(), "MySQL error", err.code);
    });
    connection.on("close", function (err) {
        console.error(new Date(), "MySQL close", err);
    });
});

module.exports = pool;
