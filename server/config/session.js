const WebSocket = require('ws');
const mongoose = require('mongoose');
const Session = require('../models/session.model');
const url = require('url');
const logger = require('log4js').getLogger();
const dataLogger = require('log4js').getLogger('data');

const apiProperties = ['_id', 'messageId', 'commitSession', 'broadcast'];

var subjectsData = {};
async function commitSession(sessionId) {
	if (!mongoose.Types.ObjectId.isValid(sessionId))
		return;

	var session = await Session.findByIdAndUpdate(sessionId, subjectsData[sessionId], { useFindAndModify: false });
	if(session) {
		delete subjectsData[sessionId];
	} else {
		logger.error('Failed to commit session', sessionId)
	}
	return session;
}

async function intervalFunc() {
	Object.keys(subjectsData).forEach(async function(sessionId) {
		var session = await commitSession(sessionId);
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
		const sessionName = socketUrl.searchParams.get('sName');

		ws.subId = subId;
		ws.sessionId = sessionId;
		ws.sessionName = sessionName;

		ws.on('error', (err) => {
			logger.error('ws error', err, 'for subId:', subId, 'sessionId', ws.sessionId, 'sessionName', ws.sessionName);
		});

		ws.on('close', (code, reason) => {
			logger.error('ws closed for subId:', subId, 'code:', code, reason, 'sessionId', ws.sessionId, 'sessionName', ws.sessionName);
		});

		ws.on('message', async function incoming(message) {
			const messageProcessingStart = new Date()

			try {
				dataLogger.info('Message from',subId, message);

				const data = JSON.parse(message);

				if ('_id' in data) {
					ws.sessionId = data._id;
					logger.info('Messsage from', subId, 'sessionId:', data._id, 'sessionName', ws.sessionName);

					// save data to subhectsData
					if (!(data._id in subjectsData))
						subjectsData[data._id] = {};

					Object.keys(data).filter(k => !apiProperties.includes(k)).forEach(k => {
						subjectsData[data._id][k] = data[k];
					});

					if ('commitSession' in data && !!data['commitSession']) {
						logger.info('Message from', subId, 'contains commitSession command', 'sessionId:', data._id, 'sessionName', ws.sessionName);
						await commitSession(data._id);
					}

					if ('broadcast' in data) {
						logger.info('Message from', subId, 'contains broadcast command', 'sessionId:', data._id, 'sessionName', ws.sessionName);
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
					const messageProcessingTotal = new Date() - messageProcessingStart;
					logger.info('Processsed message from', subId, 'in', messageProcessingTotal, 'ms', 'sessionId:', data._id, 'sessionName', ws.sessionName);
				} else {
					logger.warn('message does not contain session _id for subId:', subId, 'sessionId', ws.sessiondId, 'sessionName', ws.sessionName);
					ws.send(JSON.stringify({ error: 'session _id not found' }));
				}
			} catch (e) {
				logger.error('error processing message from:', subId, 'sessionId', ws.sessiondId, 'sessionName', ws.sessionName , e);
			}
		});

		var session;
		if (!!sessionId) {
			session = await Session.findById(sessionId);

			if (!session) {
				logger.warn('Failed to find session for websocker request with sessionId', sessionId);
			} else {
				logger.debug('session', session._doc._id, 'restored for', subId, 'sessionName', ws.sessionName);
			}
		}

		if (!session) {
			session = await new Session({
				subId: subId
			}).save();
			logger.debug('session', session._doc._id, 'created for', subId, 'sessionName', ws.sessionName);
			ws.send(JSON.stringify(session._doc));
		}

		subjectsData[session._doc._id] = session._doc;
	});
}

module.exports = configureWebSockets;
