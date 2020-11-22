const WebSocket = require('ws');
const Session = require('../models/session.model');
const url = require('url');

var subjectsData = {};
async function intervalFunc() {
	Object.keys(subjectsData).forEach(async function(id) {
		var session = await Session.findByIdAndUpdate(id, subjectsData[id], { useFindAndModify: false });	
		if(session) {
			delete subjectsData[id];						
		}
	});
}
setInterval(intervalFunc, 10 * 1000); // write to db every 10 seconds

function configureWebSockets (server) {
	const wss = new WebSocket.Server({ server });
	 
	wss.on('connection', async function connection(ws, req) {
		console.log('new ws connection: '  + req.url);

		var protocol = 'http';
		if (!!req.socket.encrypted)
			protocol += 's';
		const subId = (new URL(req.url, `${protocol}://${req.headers.host}`)).searchParams.get('subId');

		ws.on('error', (err) => {
			console.log(err);
		});

		ws.on('message', function incoming(message) {
			console.log('subId ' + subId ' message: ' + message);
			const data = JSON.parse(message);

			if ('_id' in data) {
				if (data._id in subjectsData) {
					Object.keys(data).filter(k => k != '_id').forEach(k => {
						subjectsData[data._id][k] = data[k];
					});
				} else {  
					subjectsData[data._id] = data;
				}
			} else {
				ws.send('session _id not found');
			}
		});		

		var session = await new Session({
			subId: subId
		}).save();  

		subjectsData[session._id] = session._doc;

		ws.send(JSON.stringify(session));
	});
}
 
module.exports = configureWebSockets; 