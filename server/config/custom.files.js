const express = require('express');
const path = require('path');
const fs  = require('fs');
const config = require('./config');

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/*', (req, res) => {
  fs.readFile(path.resolve(__dirname, '..', 'assets', req.url.slice(1)), "utf8", function (err, data) {
    console.log(data);
      if (err)
        res.status(500);
      else
        res.send(eval("`" + data + "`"));
  });
});

module.exports = router;
