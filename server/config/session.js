const WebSocket = require('ws');
const mongoose = require('mongoose');
const Session = require('../models/session.model');
const url = require('url');
const logger = require('log4js').getLogger();
const dataLogger = require('log4js').getLogger('data');

const apiProperties = ['_id', 'messageId', 'commitSession', 'broadcast'];

var subjectsData = {};
async function commitSession(sessionId, subId) {
	if (!mongoose.Types.ObjectId.isValid(sessionId))
		return;

	var session = await Session.findByIdAndUpdate(sessionId, subjectsData[sessionId], { useFindAndModify: false });
	if(session) {
		delete subjectsData[sessionId];
	} else {
		logger.error('Failed to commit session', sessionId, 'for subId', subId)
	}
	return session;
}

async function intervalFunc() {
	Object.keys(subjectsData).forEach(async function(sessionId) {
		var session = await commitSession(sessionId, subId);
		if (session)
			logger.debug('session', sessionId, 'saved for subId', session._doc.subId);
	});
}

function configureWebSockets (server) {
	setInterval(intervalFunc, 10 * 1000); // write to db every 10 seconds

	const wss = new WebSocket.Server({
		server: server
	});

	wss.on('connection', async function connection(ws, req) {
		logger.debug('new ws connection: '  + req.url);

		var protocol = 'http';
		if (!!req.socket.encrypted)
			protocol += 's';
		const socketUrl = (new URL(req.url, `${protocol}://${req.headers.host}`));

		const subId = socketUrl.searchParams.get('subId');
		if (isNaN(subId)) {
			logger.error('Error: illegal subId for websocket', subId, req.url);
			return;
		}

		const sessionId = socketUrl.searchParams.get('sessionId');

		ws.subId = subId;

		ws.on('error', (err) => {
			logger.error('ws error for subId:', subId, err);
		});

		ws.on('message', async function incoming(message) {
			try {
				dataLogger.info('Message from',subId, message);
				logger.info('Messsage from', subId);

				const messageProcessingStart = new Date()

				const data = JSON.parse(message);

				if ('_id' in data) {
					// save data to subhectsData
					if (!(data._id in subjectsData))
						subjectsData[data._id] = {};

					Object.keys(data).filter(k => !apiProperties.includes(k)).forEach(k => {
						subjectsData[data._id][k] = data[k];
					});

					if ('commitSession' in data && !!data['commitSession']) {
						logger.info('Message from', subId, 'contains commitSession command');
						await commitSession(data._id, subId);
					}

					if ('broadcast' in data) {
						logger.info('Message from', subId, 'contains broadcast command');
						wss.clients.forEach(function each(client) {
							if (client.subId == subId &&
								client.readyState === WebSocket.OPEN) {
								client.send(JSON.stringify({ 'broadcast': data['broadcast'] }));
							}
						});
					}

					if ('messageId' in data) {
						ws.send(JSON.stringify({ messageId: data['messageId'], status: 'received' }));
					}
				} else {
					ws.send(JSON.stringify({ error: 'session _id not found' }));
				}
			} catch (e) {
				logger.error('error processing message from:', subId, e);
			} finally {
				var messageProcessingTotal = new Date() - messageProcessingStart;
				logger.info('Processsed message from', subId, 'in', messageProcessingTotal, 'ms');
			}
		});

		var session;
		if (!!sessionId) {
			session = await Session.findById(sessionId);

			if (!session) {
				logger.warn('Failed to find session for websocker request with sessionId', sessionId);
			} else {
				logger.debug('session', session._doc._id, 'restored for', subId);
			}
		}

		if (!session) {
			session = await new Session({
				subId: subId
			}).save();
			logger.debug('session', session._doc._id, 'created for', subId);
			ws.send(JSON.stringify(session._doc));
		}

		subjectsData[session._doc._id] = session._doc;
	});
}

module.exports = configureWebSockets;
