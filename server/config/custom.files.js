const express = require('express');
const path = require('path');
const fs  = require('fs');
const config = require('./config');

module.exports = function (directory) {
  const router = express.Router(); // eslint-disable-line new-cap

  router.get('/*', (req, res) => {
    fs.readFile(path.resolve(directory, req.url.slice(1)), "utf8", function (err, data) {
        if (err)
          res.status(500);
        else
          res.send(eval("`" + data + "`"));
    });
  });

  return router;
};
