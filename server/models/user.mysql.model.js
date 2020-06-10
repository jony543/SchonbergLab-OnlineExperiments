const mysql = require('../config/mysql');

const queryPart1 = "SELECT worker_id AS _id, username AS email, `name` AS fullname, passwordHash AS hashedPassword, GROUP_CONCAT(LOWER(r.roleList)) AS roles_list FROM `user` u INNER JOIN `user_rolelist` r ON (r.User_username = u.username)";
const queryPart3 = "GROUP BY worker_id";

function getQuery(whereClause) {
	if (whereClause) {
		return [queryPart1, whereClause, queryPart3].join(" ");
	}

	return [queryPart1, queryPart3].join(" ");
}

function editResults(results) {
	var newResults = [];
	for (var i = 0; i < results.length; i++) { //} in results) {
		var u = Object.assign({}, results[i]);

		if (!!u.roles_list) {
			u.roles = u.roles_list.split(",");
		} else {
			u.roles = [];
		}
		delete u.roles_list;	
		newResults.push(u);
	}

 	return newResults;
}

async function findOne(query) {
	const promise = new Promise((resolve, reject) => {
		var whereClause = 'WHERE';
		for(let k in query) {
			whereClause += ' ' + k.toString() + '=\"' + query[k].toString() + '\"';
		}

		mysql.query(getQuery(whereClause), function (error, results) {
		  if (error) reject(error);

		  results = editResults(results);

		  resolve(results && results[0]);
		});
	});

	return promise;	
}

async function findById(id) {
	const promise = new Promise((resolve, reject) => {
		var whereClause = 'WHERE worker_id=\"' + id.toString() + '\"';
		mysql.query(getQuery(whereClause), function (error, results) {
		  if (error) reject(error);

		  results = editResults(results);

		  resolve(results && results[0]);
		});
	});

	return promise;	
}

module.exports = {
	findOne,
	findById
}