const mysql = require('../config/mysql');

async function findOne(query) {
	const promise = new Promise((resolve, reject) => {
		var q = 'SELECT * FROM `user` WHERE';
		for(let k in query) {
			q += ' ' + k.toString() + '=\"' + query[k].toString() + '\"';
		}

		mysql.query(q, function (error, results) {
		  if (error) reject(error);

		  resolve(results && results[0]);
		});
	});

	return promise;	
}

async function findById(id) {
	const promise = new Promise((resolve, reject) => {
		var q = 'SELECT * FROM `user` WHERE worker_id=\"' + id.toString() + '\"';
		mysql.query(q, function (error, results) {
		  if (error) reject(error);

		  resolve(results && results[0]);
		});
	});

	return promise;	
}

module.exports = {
	findOne,
	findById
}