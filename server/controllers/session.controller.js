const Session = require('../models/session.model');
const logger = require('log4js').getLogger();

module.exports = {
  getBySubdId
}

async function getBySubdId(subId) {
	if (isNaN(subId)) {
		logger.warn('getBySubId called with illegal value: ' + subId);
    	return []; 
	}

	return await Session.find({ subId: subId })
		.catch(function (e) {
			logger.error('error in getBySubId. subId=' + subId, e);
	});
}
