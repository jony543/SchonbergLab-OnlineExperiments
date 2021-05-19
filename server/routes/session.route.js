const express = require('express');
const asyncHandler = require('express-async-handler');
const sessionCtrl = require('../controllers/session.controller');

const router = express.Router();
module.exports = router;

router.route('/list').get(asyncHandler(list)); // example call: GET http://localhost:4040/app/api/session/list?subId=5
router.route('/').post(asyncHandler(post));

async function list(req, res) {
	const fromDate = (req.query.from) ? new Date(req.query.from) : undefined;
	const fields = (req.query.fields) ? req.query.fields.split(',') : undefined;

	let results = await sessionCtrl.getBySubdId(req.query.subId, fields, fromDate);
	res.json(results);
}

async function post(req, res) {
	let results = await sessionCtrl.upsertMany(req.query.subId, req.body);
	res.json(results);
}
