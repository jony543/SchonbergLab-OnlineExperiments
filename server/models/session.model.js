const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
	subId: {
		type: Number,
		required: true
		}, 
	}, {
		versionKey: false,
		strict: false,
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
	});

module.exports = mongoose.model('Session', SessionSchema);
