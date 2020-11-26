const express = require('express');
const asyncHandler = require('express-async-handler');
const sessionCtrl = require('../controllers/session.controller');

const router = express.Router();
module.exports = router;

// example call: GET http://localhost:4040/app/api/session/list?subId=5
router.route('/list').get(asyncHandler(list));

async function list(req, res) {
  let results = await sessionCtrl.get(req.query.subId);
  res.json(results);
}
