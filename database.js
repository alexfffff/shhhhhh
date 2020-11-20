var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();

/* The function below is an example of a database method. Whenever you need to 
   access your database, you should define a function (myDB_addUser, myDB_getPassword, ...)
   and call that function from your routes - don't just call DynamoDB directly!
   This makes it much easier to make changes to your database schema. */

// TODO: modify logincheck to account for hashed passwords

var my_login_check = function(username, password, callback) {
	// create params to query for an item with the username and password
	var params = {
			KeyConditions: {
				// match the keyword with the username
				username: {
					ComparisonOperator: 'EQ',
					AttributeValueList: [ { S: username } ]
				}
			},
			TableName: "users",
			// specify the name of the column for the attribute to get
			AttributesToGet: [ 'password' ]
	};
	
	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			// check if the password attribute of the item is the same as the password argument
			if (data.Items[0].password.S.localeCompare(password) === 0) {
				// login successful, callback with username
				callback(err, username);
			} else {
				// login failed due to incorrect password
				callback(err, null);
			}
	    }
	});
};
// TODO: Hash passwords
var create_account = function(username, password, name, email, affiliation, birthday, callback) {
	// create params to query for an item with the username
	var params = {
			KeyConditions: {
				username: {
					ComparisonOperator: 'EQ',
					AttributeValueList: [ { S: username } ]
				}
			},
			TableName: "users"
	};
	
	// query the table, searching for the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length !== 0) {
			// username already exists in the table, or some other error
			callback(err, null);
		} else {
			// create new account with appropriate attributes
			var param = {
				Item: {
					"username": {
						S: username
					},
					"password": {
						S: password
					},
					"fullname": {
						S: name
					}, 
					"email": {
						S: email
					},
					"affiliation": {
						S: affiliation
					},
					"birthday": {
						S: birthday
					}
				},
				TableName: "users"
			};
			
			// add new account to the table, returning the username if successful
			db.putItem(param, function(err, data) {
				if (err) {
					callback(err, null);
				} else {
					callback(err, username);
				}
			});
	    }
	});
};


var db_getSettings = function(username, callback) {
	// create params to query for an item with the username and password
	var params = {
			KeyConditions: {
				// match the keyword with the username
				username: {
					ComparisonOperator: 'EQ',
					AttributeValueList: [ { S: username } ]
				}
			},
			TableName: "users",
			// specify the name of the column for the attribute to get
			AttributesToGet: [ 'affiliation' ]
	};
	
	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			// Sends back affiliation of the user
			callback(err, data.Items[0].affiliation.S);
	    }
	});
};

var db_change_settings = function(username, affiliation, callback) {
	// create params to query for an item with the username and password
	var params = {
			KeyConditions: {
				// match the keyword with the username
				username: {
					ComparisonOperator: 'EQ',
					AttributeValueList: [ { S: username } ]
				}
			},
			TableName: "users",
			// specify the name of the column for the attribute to get
			AttributesToGet: [ 'affiliation' ]
	};
	
	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			// Sends back new affiliation of the user
			callback(err, data.Items[0].affiliation.S);
	    }
	});


	var params = {
		TableName:"users",
		Key:{
			"username": username,
		},
		UpdateExpression: "set info.affiliation = :a",
		ExpressionAttributeValues:{
			":a": affiliation
		},
		ReturnValues:"UPDATED_NEW"
	};
	
	console.log("Updating the item...");
	docClient.update(params, function(err, data) {
		if (err) {
			// Something went wrong (ex: username not in table)
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};



var get_restaurants = function(callback) {
	// scan the restaurant table to get every item
	var params = {
			TableName: "restaurants"
	};
	db.scan(params, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(err, data);
		}
	});
};


var db_make_post = function(postID, username, content, timestamp, hashtag, callback) {
	// create new post with the appropriate attributes
	var param = {
		Item: {
			// Is this string or number??
			"postID": {
				S: postID
			},
			"username": {
				S: username
			},
			"content": {
				S: content
			}, 
			"timestamp": {
				S: timestamp
			},
			"hashtag": {
				S: hashtag
			}
		},
		TableName: "posts"
	};
	
	// add new post to table
	db.putItem(param, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(err, data);
		}
	});
};



var db_delete_post = function(post_id, callback) {
	// create params containing restaurant name and table
	var params = {
		Key: {
			"postID": {
				// Is this a number or string???
				S: post_id
			}
		},
		TableName: "posts"
	};
	
	// delete the restaurant from the table
	db.deleteItem(params, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(err, data);
		}
	});
};

/* We define an object with one field for each method. For instance, below we have
   a 'lookup' field, which is set to the myDB_lookup function. In routes.js, we can
   then invoke db.lookup(...), and that call will be routed to myDB_lookup(...). */

// (The name before the colon is the name you'd use for the function in app.js;
// the name after the colon is the name the method has here, in this file.)

var database = { 
  loginCheck: my_login_check,
  createAccount: create_account,
  getSettings: db_getSettings,
  changeSettings: db_change_settings,
  makePost: db_make_post,
  deletePost: db_delete_post
};

module.exports = database;
                                        