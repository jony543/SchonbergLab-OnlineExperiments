const config = require('./config');
const mysql = require('mysql');
const debug = require('debug')('express-mysql-es6-rest-api:index');

const pool = mysql.createPool({
		connectionLimit: 5,
		host: config.mysql.url, 
		user: config.mysql.user, 
		password: config.mysql.password, 
		database: config.mysql.database, 
		port: 3306, 
		ssl: true,
	});

pool.getConnection(function(err, connection) {
	if (err) {
		//throw err; 
		console.log('not connected to mysql!');
	} else {
		console.log('connected to mysql as id ' + connection.threadId);
		connection.release();
	}
});

module.exports = pool;