const Session = require('../models/session.model');

module.exports = {
  getBySubdId
}

async function getBySubdId(subId) {
  return await Session.find({ subId: subId })
  	.catch(function (e) {
  		console.log('error in getBySubdId');
  		console.log(e);
  });
}
