const Session = require('../models/session.model');
const logger = require('log4js').getLogger();

module.exports = {
  getBySubdId,
  upsertMany
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
      throw e;
	});
}

async function upsertMany(subId, docs) {
  logger.info('upsertMany was called', subId);

  if (isNaN(subId)) {
		logger.warn('upsertMany called with illegal value: ' + subId);
    return { 'error': 'illegal subId' };
	}

  var bulkOps = [];
  docs.forEach((doc) => {
    doc.patched_at = Date.now();
    if (!!doc._id) {
      doc.patchStatus = 'patched';
      bulkOps.push({
        'updateOne': {
          'filter': { '_id': doc._id },
          'update': doc,
        }
      });
    } else {
      doc.patchStatus = 'inserted';
      bulkOps.push({
        'insertOne': {
          'document': doc,
        }
      });
    }
  });

  return await Session.bulkWrite(bulkOps)
		.catch(function (e) {
      logger.error('error in upsertMany. subId=' + subId, e);
      throw e;
	});
}
