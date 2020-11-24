var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();


// TODO: modify logincheck to account for hashed passwords
// Verifies login information and sets status to online
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
				// SET STATUS TO ACTIVE

				var docClient = new AWS.DynamoDB.DocumentClient();
				var params = {
	        			TableName: "users",
	        			Key: {
	            			"username": username
	        			},
	        			UpdateExpression: "set #loggedIn = :l",
	        			ExpressionAttributeNames: {
	            			"#loggedIn": "logged_in"
	        			},
	        			ExpressionAttributeValues: {
	            			":l": true
	        			}
	    			};
  
  				docClient.update(params).promise().then(
		  			successResult => {
			  			console.log("UPDATED");
			  			console.log(successResult);
			  			callback(null, successResult);
		  			},
		  			errResult => {
			  			console.log(errResult);
			  			callback(errResult, null);
		  			});
			} else {
				// login failed due to incorrect password
				callback(err, null);
			}
	    }
	});
};

// TODO: Hash passwords
// Creates account for user
var create_account = function(username, password, name, email, affiliation, birthday, interests, callback) {
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
					}, 
					"logged_in": {
						BOOL: true
					}
				},
				TableName: "users"
			};
			
			// add new account to the table
			db.putItem(param, function(err, data) {
				if (err) {
					callback(err, null);
				} else {


					//UPLOAD INTERESTS TO TABLE



					callback(err, data.Items[0]);
				}
			});
	    }
	});
};

// Gets affiliation of user
var db_get_affiliation = function(username, callback) {
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

// Updates affiliation of user
// TODO: add conditionexpression to see if affiliation isn't already that affiliation
var db_change_affiliation = function(username, affiliation, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
	        TableName: "users",
	        Key: {
	            "username": username
	        },
	        UpdateExpression: "set #CurrAff = :a",
	        ExpressionAttributeNames: {
	            "#CurrAff": "affiliation"
	        },
	        ExpressionAttributeValues: {
	            ":a": affiliation
	        }
	    };
  
  docClient.update(params).promise().then(
		  successResult => {
			  console.log("UPDATED");
			  console.log(successResult);
			  callback(null, successResult);
		  },
		  errResult => {
			  console.log(errResult);
			  callback(errResult, null);
		  });
};


var db_get_settings = function(username, callback) {
	var userSettings = [];
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
			// affiliation not found in table, or some other error
			callback(err, null);
		} else {
			userSettings.push(data.Items[0].affiliation.S);


			var params2 = {
				KeyConditions: {
					// match the keyword with the username
					username: {
						ComparisonOperator: 'EQ',
						AttributeValueList: [ { S: username } ]
					}
				},
				TableName: "interests",
				// specify the name of the column for the attribute to get
				AttributesToGet: [ 'interest' ]
			};
		
			// query the table with params, searching for item with the specified username
			db.query(params2, function(err, data2) {
				if (err ) {
					callback(err, null);
				} else {
					for (var i=0; i < data2.Count; i++) {
						userSettings.push(data2.Items[i].friendUsername.S);
					}
					// Sends back affiliation of the user
					callback(err, userSettings);
				}
			});
	    }
	});
};


// TODO: add conditionexpression to see if email isn't already that email
var db_change_email = function(username, email, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
	        TableName: "users",
	        Key: {
	            "username": username
	        },
	        UpdateExpression: "set #CurrEm = :e",
	        ExpressionAttributeNames: {
	            "#CurrEm": "email"
	        },
	        ExpressionAttributeValues: {
	            ":e": email
	        }
	    };
  
  docClient.update(params).promise().then(
		  successResult => {
			  console.log("UPDATED");
			  console.log(successResult);
			  callback(null, successResult);
		  },
		  errResult => {
			  console.log(errResult);
			  callback(errResult, null);
		  });
};



// TODO: add conditionexpression to see if email isn't already that email
var db_change_password = function(username, password, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
	        TableName: "users",
	        Key: {
	            "username": username
	        },
	        UpdateExpression: "set #CurrPass = :p",
	        ExpressionAttributeNames: {
	            "#CurrPass": "password"
	        },
	        ExpressionAttributeValues: {
	            ":p": password
	        }
	    };
  
  docClient.update(params).promise().then(
		  successResult => {
			  console.log("UPDATED");
			  console.log(successResult);
			  callback(null, successResult);
		  },
		  errResult => {
			  console.log(errResult);
			  callback(errResult, null);
		  });
};



// TODO: Look at HW4MS1 og example for query a list of keys
var db_get_homepage_posts = function(username, callback) {
	var params = {
		KeyConditions: {
			// match the keyword with the username
			yourUsername: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [ { S: username } ]
			}
		},
		TableName: "friends",
		// specify the name of the column for the attribute to get
		AttributesToGet: [ 'friendUsername' ]
	};

	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err) {
			console.log("FIRST ERROR");
			callback(err, null);
		} else {
			console.log(data.Items[0].friendUsername.S);
			//console.log(username);
			var usernames = [];
			for (var i=0; i < data.Count; i++) {
				usernames.push(data.Items[i].friendUsername.S);
			}
			usernames.push(username);
			console.log(usernames);
			usernames = JSON.stringify(usernames);
			console.log(usernames);
			// create params to query for an item with the username and password
			var params2 = {
				KeyConditions: {
					// match the keyword with the username
					username: {
						ComparisonOperator: 'EQ',
						AttributeValueList: [ { S: usernames } ]
					}
				},
				TableName: "posts",
				// specify the name of the column for the attribute to get
				AttributesToGet: [ 'postID', 'content', 'hashtag', 'timestamp' ]
			};
			console.log(params2);

			// query the table with params, searching for item with the specified username
			db.query(params2, function(err2, data2) {
				if (err2) {
					console.log(err2);
					// some error
					callback(err2, null);
				} else {
					console.log(data2);
					callback(null, data2);
				}
			});
		}
	});

	
};


var db_get_user_posts = function(username, callback) {
	// create params to query for an item with the username
	var params = {
		KeyConditions: {
			// match the keyword with the username
			username: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [ { S: username } ]
			}
		},
		TableName: "posts"
	};

	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			callback(err, data.Items);
		}
	});
};


var db_make_post = function(postID, username, content, timestamp, hashtag, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "posts",
		Item:{
			"username": username,
			"postID": postID,
			"content": content,
			"timestamp": timestamp,
			"hashtag": hashtag
		}
	};
	//Only puts in the table if the username doesn't exist
	docClient.put(params).promise().then(
			successResult => {
		try  {
			console.log("Added item");
			callback(null, successResult);
			
		} catch (err) {
			console.log("Unable to add item.");
			callback(err, null);
		}
	},
	errResult => {
		callback(errResult, null);
	});
};

var db_get_hashtags = function(hashtag, callback) {
	// create params to query for an item with the username
	const params = {
		TableName: "posts",
		FilterExpression: '#htag = :ht',
		ExpressionAttributeNames: {
			'#htag': 'hashtag',
		},
		ExpressionAttributeValues: {
			':ht': hashtag,
		},
	};

	// query the table with params, searching for item with the specified hashtag
	db.query(params, function(err, data) {
		// TODO: FIGURE OUT WHAT TO DO IF EMPTY
		if (err) {
			callback(err, null);
		} else {
			callback(err, data.Items);
		}
	});
};



var db_delete_post = function(username, post_id, callback) {
	// TODO: CHECK IF ITS THE POSTER DELETING THE POST
	// create params with correct partition and sort key
	var params = {
		Key: {
			"username": {
				S: username
			},
			"postID": {
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


var db_get_post_comments = function(postID, callback) {
	// create params to query for an item with the postID
	var params = {
		KeyConditions: {
			// match the keyword with the username
			postID: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [ { S: postID } ]
			}
		},
		TableName: "comments"
	};

	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			callback(err, data.Items);
		}
	});
};


var db_add_comment = function(username, comment, postID, timestamp, callback) {
	// create new comment with the appropriate attributes
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "comments",
		Item:{
			"username": username,
			"postID": postID,
			"comment": comment,
			"timestamp": timestamp
		}
	};
	//Only puts in the table if the username doesn't exist
	docClient.put(params).promise().then(
			successResult => {
		try  {
			console.log("Added item");
			callback(null, successResult);
			
		} catch (err) {
			console.log("Unable to add item.");
			callback(err, null);
		}
	},
	errResult => {
		callback(errResult, null);
	});
};


var db_delete_comment = function(username, post_id, callback) {
	//TODO: QUERY AND CHECK IF USER IS THE PERSON WHO WROTE COMMENT
	//EC IDEA: LET OG POST USER ALSO DELETE COMMENTS ON THEIR POST
	// create params containing restaurant name and table
	var params = {
		Key: {
			"postID": {
				S: post_id
			}
		},
		TableName: "comments"
	};
	
	// delete the restaurant from the table
	db.deleteItem(params, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};


var db_add_friend = function(yourUsername, friendUsername, timestamp, callback) {
	// create new post with the appropriate attributes
	var param = {
		Item: {
			// Is this string or number??
			"yourUsername": {
				S: yourUsername
			},
			"friendUsername": {
				S: friendUsername
			}, 
			"timestamp": {
				N: timestamp
			}
		},
		TableName: "friends"
	};
	
	// add new post to table
	db.putItem(param, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(err, data);
		}
	});


	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "friends",
		Item:{
			"yourUsername": yourUsername,
			"friendUsername": friendUsername,
			"timestamp": timestamp
		}
	};
  
  //Queries for username to see if it exists yet
  docClient.put(params).promise().then(
		  successResult => {
			  try {
				var params2 = {
					TableName : "friends",
					Item:{
						"yourUsername": friendUsername,
						"friendUsername": yourUsername,
						"timestamp": timestamp
					}
				};
				//Only puts in the table if the username doesn't exist
				docClient.put(params2).promise().then(
						successResult => {
					try  {
						console.log("Added item");
						callback(null, successResult);
						
					} catch (err) {
						console.log("Unable to add item.");
						callback(err, null);
					}
				},
				errResult => {
					callback(errResult, null);
				});
			    } catch (error) {
			        callback(error, null);
			    }
			  
		  },
		  errResult => {
			  callback(errResult, null);
		  });


};


var db_get_friends = function(username, callback) {
	// create params to query for an item with the username
	var params = {
		KeyConditions: {
			// match the keyword with the username
			username: {
				ComparisonOperator: 'EQ',
				AttributeValueList: [ { S: username } ]
			}
		},
		TableName: "friends"
	};

	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			callback(err, data.Items);
		}
	});
};


var db_unfriend = function(yourUsername, friendUsername, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
			TableName : "friends",
			Key: {
				"yourUsername": yourUsername,
				"friendUsername": friendUsername

			}
	};
  
  docClient.delete(params).promise().then(
		  successResult => {
			var params2 = {
				TableName : "friends",
				Key: {
					"yourUsername": friendUsername,
					"friendUsername": yourUsername
	
				}
			};
			docClient.delete(params2).promise().then(
				successResult => {
					callback(null, successResult);
				},
				errResult => {
					callback(errResult, null);
				});
		  },
		  errResult => {
			  callback(errResult, null);
		  });


};

var db_logout = function(username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
	        TableName: "users",
	        Key: {
	            "username": username
	        },
	        UpdateExpression: "set #loggedIn = :l",
	        ExpressionAttributeNames: {
	            "#loggedIn": "logged_in"
	        },
	        ExpressionAttributeValues: {
	            ":l": false
	        }
	    };
  
  docClient.update(params).promise().then(
		  successResult => {
			  console.log("UPDATED");
			  console.log(successResult);
			  callback(null, successResult);
		  },
		  errResult => {
			  console.log(errResult);
			  callback(errResult, null);
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
  getAffiliation: db_get_affiliation,
  changeAffiliation: db_change_affiliation,
  getSettings: db_get_settings,
  changeEmail: db_change_email,
  changePassword: db_change_password,
  getHomepagePosts: db_get_homepage_posts,
  getUserPosts: db_get_user_posts,
  getHashtags: db_get_hashtags,
  makePost: db_make_post,
  deletePost: db_delete_post,
  getPostComments: db_get_post_comments,
  addComment: db_add_comment,
  deleteComment: db_delete_comment,
  addFriend: db_add_friend,
  getFriends: db_get_friends,
  unfriend: db_unfriend,
  logout: db_logout
};

module.exports = database;