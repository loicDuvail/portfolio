const path = require("path");
const fs = require("fs");

function serveFnGen(app) {
  return function serve(parent, absPath) {
    absPath ||= path.join(__dirname, parent);
    fs.readdir(absPath, (err, files) => {
      if (err) return console.error(err);
      files.forEach((file) => {
        const absFilePath = path.join(absPath, file);
        if (fs.statSync(absFilePath).isDirectory())
          return serve(file, absFilePath);
        app.get(`/${parent}/${file}`, (req, res) => {
          res.sendFile(absFilePath);
        });
      });
    });
  };
}

module.exports = serveFnGen;
