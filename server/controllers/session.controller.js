const Session = require('../models/session.model');

module.exports = {
  get
}

async function get(subId) {
  return await Session.find({ subId: subId });
}
