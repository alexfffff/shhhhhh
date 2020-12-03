var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();

/* The function below is an example of a database method. Whenever you need to 
   access your database, you should define a function (myDB_addUser, myDB_getPassword, ...)
   and call that function from your routes - don't just call DynamoDB directly!
   This makes it much easier to make changes to your database schema. */

// TODO Your own functions for accessing the DynamoDB tables should go here

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

var create_account = function(username, password, name, callback) {
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

var add_restaurant = function(name, username, latitude, longitude, description, callback) {
	// create params to query for an item with the restaurant name
	var params = {
			KeyConditions: {
				name: {
					ComparisonOperator: 'EQ',
					AttributeValueList: [ { S: name } ]
				}
			},
			TableName: "restaurants"
	};
	
	// query the table, searching for the specified restaurant name
	db.query(params, function(err, data) {
		if (err || data.Items.length !== 0) {
			// restaurant name already exists in the table, or some other error
			callback(err, null);
		} else {
			// create new restaurant with the appropriate attributes
			var param = {
				Item: {
					"name": {
						S: name
					},
					"creator": {
						S: username
					},
					"latitude": {
						S: latitude
					},
					"longitude": {
						S: longitude
					},
					"description": {
						S: description
					}
				},
				TableName: "restaurants"
			};
			
			// add new restaurant to the table, returning the restaurant name if successful
			db.putItem(param, function(err, data) {
				if (err) {
					callback(err, null);
				} else {
					callback(err, name);
				}
			});
	    }
	});
};

var delete_restaurant = function(name, callback) {
	// create params containing restaurant name and table
	var params = {
		Key: {
			"name": {
				S: name
			}
		},
		TableName: "restaurants"
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

// TODO Don't forget to add any new functions to this class, so app.js can call them. 
// (The name before the colon is the name you'd use for the function in app.js;
// the name after the colon is the name the method has here, in this file.)

var database = { 
  loginCheck: my_login_check,
  createAccount: create_account,
  getRestaurants: get_restaurants,
  addRestaurant: add_restaurant,
  deleteRestaurant: delete_restaurant
};

module.exports = database;
                                        