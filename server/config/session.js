const WebSocket = require('ws');
const mongoose = require('mongoose');
const Session = require('../models/session.model');
const url = require('url');

var subjectsData = {};
async function commitSession(sessionId) {
	if (!mongoose.Types.ObjectId.isValid(sessionId))
		return;
	
	var session = await Session.findByIdAndUpdate(sessionId, subjectsData[sessionId], { useFindAndModify: false });	
	if(session) {
		delete subjectsData[sessionId];						
	}
	return session;
}

async function intervalFunc() {
	Object.keys(subjectsData).forEach(async function(sessionId) {		
		var session = await commitSession(sessionId);
		if (session)
			console.log('session saved for subId ' + session._doc.subId);
	});
}

function configureWebSockets (server) {
	setInterval(intervalFunc, 10 * 1000); // write to db every 10 seconds

	const wss = new WebSocket.Server({ 
		server: server
	 });
	 
	wss.on('connection', async function connection(ws, req) {
		console.log('new ws connection: '  + req.url);

		var protocol = 'http';
		if (!!req.socket.encrypted)
			protocol += 's';
		const subId = (new URL(req.url, `${protocol}://${req.headers.host}`)).searchParams.get('subId');

		ws.subId = subId;

		ws.on('error', (err) => {
			console.log('ws error for subId' + subId + ': ');
			console.log(err);
		});

		ws.on('message', async function incoming(message) {
			try {
				const data = JSON.parse(message);

				if ('_id' in data) {
					if (data._id in subjectsData) {
						Object.keys(data).filter(k => k != '_id' && k != 'messageId').forEach(k => {
							subjectsData[data._id][k] = data[k];
						});
					} else {  
						subjectsData[data._id] = data;
					}

					if ('commitSession' in data && !!data['commitSession']) {
						await commitSession(data._id);
					}

					if ('broadcast' in data) {
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
				console.log('error processing message from ' + subId + ': ' + message);
				console.log(e);
			}
		});	

		var session = await new Session({
			subId: subId
		}).save();  

		subjectsData[session._doc._id] = session._doc;
		ws.send(JSON.stringify(session._doc));
	});
}
 
module.exports = configureWebSockets; 