const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  subId: {
    type: Number,
    required: true
  }, 
}, {
  versionKey: false,
  strict: false
});


module.exports = mongoose.model('Session', SessionSchema);
