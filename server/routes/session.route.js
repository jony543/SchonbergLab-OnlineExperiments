const express = require('express');
const asyncHandler = require('express-async-handler');
const sessionCtrl = require('../controllers/session.controller');

const router = express.Router();
module.exports = router;

// example call: GET http://localhost:4040/app/api/session/list?subId=5
router.route('/list').get(asyncHandler(list));

async function list(req, res) {
	const fromDate = (req.query.from) ? new Date(req.query.from) : undefined;
	const fields = (req.query.fields) ? req.query.fields.split(',') : undefined;

	let results = await sessionCtrl.getBySubdId(req.query.subId, fields, fromDate);
	res.json(results);
}
