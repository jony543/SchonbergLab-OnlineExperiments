const Session = require('../models/session.model');
const logger = require('log4js').getLogger();

module.exports = {
  getBySubdId
}

async function getBySubdId(subId, fields, fromDate) {
	if (isNaN(subId)) {
		logger.warn('getBySubId called with illegal value: ' + subId);
    	return []; 
	}

	var query = Session.find({ subId: subId });	
	if (fromDate) {
		query.where('updated_at').gt(fromDate);
	}

	if (fields) {
		query.select(fields.concat(['created_at', 'updated_at']));
	}

	return await query.exec()
		.catch(function (e) {
			logger.error('error in getBySubId. subId=' + subId, e);
	});
}
