var AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const saltRounds = 10;
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();



/**
* Verifies login by querying for the item keyed by the inputted username 
* and then compares the password of the item with the inputted password. If correct, 
* will update the users login status to active in the table. If something fails, will send error.
*
* @param  username  username that user typed
* @param  password password that user typed
* @return Does not return anything
*/
var my_login_check = function(username, password, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
  		TableName : "users",
		KeyConditionExpression: "username = :user",
		ExpressionAttributeValues: {
		  ":user": username
		}
  };
  
  //Queries for the username and checks if password matches
  docClient.query(params).promise().then(
		  successResult => {
				if (successResult.Count === 0) {
					callback(5, null);
				} else {
					let hash = successResult.Items[0].password;
					bcrypt.compare(password, hash, function (err, res) {
					if (res === true) {
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
								  callback(null, username);
							  },
							  errResult => {
								  console.log(errResult);
								  console.log("Something else went wrong");
								  callback(errResult, null);
							  });
					} else {
						callback("Wrong username or password", false);
					}
				});
				}
			}, errResult => {
			  	callback(errResult, null);
		  	}
		);
};




/**
* Creates a new account. First queries for inputted username to check if there is already an item with that key. 
* If so, will lead to error. Otherwise will put new item into "users" table with the inputted attributes and active status.
* Will also add interests to the "interests" table keyed by username and interest. 
*
* @param  username  username that user typed
* @param  password password that user typed
* @param  name full name that user typed
* @param  email email that user typed
* @param  affiliation affiliation that user typed/selected? NOT SURE AB THIS ONE 
* @param  birthday birthday that user typed
* @param  interests array of all of the intersts that user selected
* @return Does not return anything
*/
var create_account = function(username, password, name, email, affiliation, birthday, interests, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	// create params to query for an item with the username
	var params = {
			TableName : "users",
		  	KeyConditionExpression: "username = :user",
		  	ExpressionAttributeValues: {
				":user": username
		  	}
	};
	
	// query the table, searching for the specified username
	docClient.query(params).promise().then(
		successResult => {
			try {
				//Checks if username exists in table
				if (successResult.Count === 0) {

					bcrypt.hash(password, saltRounds, function (err, hash) {
						if (err) {
							callback(err, false);
							return;
						}

						// create new account with appropriate attributes
						var param = {
							Item: {
								"username": {
									S: username
								},
								"password": {
									S: hash
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
								console.log(err);
								callback(err, null);
							} else {
								var docClient = new AWS.DynamoDB.DocumentClient();
								var arrayOfPromises = [];
		  						//Iterates through the keywords and creates params for that keyword
		  						for (var i = 0; i < interests.length; i++) {
			  					var param2 = {
									Item: {
										"interest": interests[i],
										"username": username
									},
								TableName: "interests"
								};
			  					console.log(param2);
			  					//Promise to query the keyword is pushed to array of promises
		  						arrayOfPromises.push(docClient.put(param2).promise());
	  							}
	  							console.log(arrayOfPromises);
	  							Promise.all(arrayOfPromises).then(
			  						successResult => {
										var nameParam = {
											Item: {
												"fullname": {
													S: name
												},
												"username": {
													S: username
												}
											},
											TableName: "fullnames"
										};
										docClient.put(nameParam, function(err, data) {
											if (err) {
												console.log(err);
												callback(err, null);
											} else {
												callback(null, username);
											}
										});
			  						}, errResult => {
			  							console.log(errResult);
				  						callback(errResult, null);
								  	}
								);
							}
						});



					});

				} else {
					throw new Error("Already in db");
				}
			} catch (error) {
				callback(4, null);
			}
			
		},
		errResult => {
			callback(errResult, null);
		}
	);
};



/**
* Queries the affiliation of a user with the username parameter. 
* Can be used to see affiliation of a user.
*
* @param  username  username of some user
* @return The affiliation of the user
*/
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


/**
* Updates the affiliation of the user with the specified username (current user) to the new affiliation. 
*
* @param  username  username of current user
* @param  affiliation new affiliation that the user wants to update to
* @param  timestamp timestamp of when affiliation was changed
* @param  postID id of post
* @return Does not return anything
*/
// TODO: add conditionexpression to see if affiliation isn't already that affiliation (already taken care of in routes???)
var db_change_affiliation = function(username, affiliation, timestamp, postID, callback) {
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
			var nameParam = {
				TableName: "users",
				 KeyConditionExpression: "username = :key",
				 ExpressionAttributeValues: {
					 ":key": username
				}
			};
			
			docClient.query(nameParam).promise().then(
				successResult => {
					try {
						var param = {
							TableName : "posts",
							Item:{
								"userID": username,
								"postID": postID,
								"content": successResult.Items[0].fullname + " is now affiliated with " + affiliation,
								"timestamp": timestamp, 
								"userName": successResult.Items[0].fullname,
								"friend": false
			
							}, 
						};
						
						// add new interest to the table
						docClient.put(param).promise().then(
							successResult2 => {
								try  {
									console.log("Added item");
									callback(null, successResult2);
							
								} catch (err) {
									console.log("Unable to add item.");
									callback(err, null);
								}
							}, errResult => {
								callback(errResult, null);
							}
						);
					} catch (error) {
						callback(error, null);
					}
				}, errResult => {
						callback(errResult, null);
				}
			);
		}, errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};



/**
* Adds a new interest to the user's account if user does not already have that interest
*
* @param  username  username that user typed
* @param  interest a single additional interest
* @param  timestamp timestamp of when interest was added
* @param  postID id of this post
* @return Does not return anything
*/
var add_interest = function(username, interest, timestamp, postID, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
  		TableName : "interests",
  		KeyConditionExpression: 'interest = :hashKey and username = :rangeKey',
  		ExpressionAttributeValues: {
  			':hashKey': interest,
  			':rangeKey': username
  		}
  	};
  
  	//Queries for the username and checks if password matches
  	docClient.query(params).promise().then(
		successResult => {
			try {
				if (successResult.Count === 0) {
					var param1 = {
						Item: {
							"interest": interest,
							"username": username
						},
					TableName: "interests"
					};

					docClient.put(param1).promise().then(
						successResult => {
							try  {
								var getNameParam = {
									TableName: "users",
									 KeyConditionExpression: "username = :key",
									 ExpressionAttributeValues: {
										 ":key": username
									}
								};
								
								docClient.query(getNameParam).promise().then(
									successResult => {
										try {
											console.log(successResult);
											//NEED TO GET THE USERS FUCKING NAME
											var param = {
												TableName : "posts",
												Item:{
													"userID": username,
													"postID": postID,
													"content": successResult.Items[0].fullname + " is now interested in " + interest,
													"timestamp": timestamp,
													"userName": successResult.Items[0].fullname,
													"friend": false
												}
											};
											// add new interest to the table
											docClient.put(param).promise().then(
												successResult2 => {
													try  {
														console.log("Added item");
														callback(null, successResult2);
												
													} catch (err) {
														console.log("Unable to add item.");
														callback(err, null);
													}
												}, errResult => {
													callback(errResult, null);
												}
											);


										} catch (error) {
											callback(error, null);
										}
									}, errResult => {
											callback(errResult, null);
									}
								);
							} catch (err) {
								console.log("Unable to add item.");
								callback(err, null);
							}
						}, errResult => {
							callback(errResult, null);
						}
					);
				} else {
					throw new Error("Already interested");
				}
			} catch (error) {
			    callback(6, null);
			}
			  
		}, errResult => {
				callback(errResult, null);
		}
	);
};


/** 
* Removes an interest from a user's profile
*
* @param  username  username of current user
* @param  interest  interest of current user
* @return Does not return anything
*/
var db_remove_interest = function(username, interest, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params1 = {
		TableName: "interests",
		 IndexName: "username-index",
		 KeyConditionExpression: "username = :key",
		 ExpressionAttributeValues: {
			 ":key": username
    	}
	};
	
	docClient.query(params1).promise().then(
		successResult => {
			console.log(successResult);
			try {
				if (successResult.Count === 2) {
					throw new Error("Must have at least 2 interests");
				} else {
				var params2 = {
					Key: {
						"interest": {
							S: interest
						},
						"username": {
							S: username
						}
					},
					TableName: "interests"
				};
				
				db.deleteItem(params2, function(err, data) {
					if (err) {
						callback(err, null);
					} else {
						callback(null, data);
					}
				});
			}
			} catch (error) {
			    callback(9, null);
			}
		}, errResult => {
				callback(errResult, null);
		}
	);
};


/** 
* Removes an interest from a user's profile
*
* @param  username  username of current user
* @return Array of the users interests
*/
var db_get_interests = function(username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName: "interests",
		 IndexName: "username-index",
		 KeyConditionExpression: "username = :key",
		 ExpressionAttributeValues: {
			 ":key": username
    	}
	};
	
	docClient.query(params).promise().then(
		successResult => {
			try {
				callback(null, successResult.Items);
			} catch (error) {
			    callback(error, null);
			}
		}, errResult => {
				callback(errResult, null);
		}
	);
};




/** IGNORE THIS FUNCTION
* Gets all of the settings (all columns (except password) of the "users" table for the [current] user and all of the users interests). 
* Can be used to create a page that displays all of the [current] users information.
*
* @param  username  username of current user
* @return Array that contains all of the users information. The format will be: [FIGURE OUT FORMAT OF ARRAY]
*/
var db_get_settings = function(username, callback) {
	var userSettings = [];
	// create params to query for an item with the username
	var params = {
			KeyConditions: {
				username: {
					ComparisonOperator: 'EQ',
					AttributeValueList: [ { S: username } ]
				}
			},
			TableName: "users",
			// specify the name of the columns for the attribute to get
			// TODO: ADD THE OTHER COLUMNS IN. FIGURE OUT EXACTLY WHAT NEEDS TO BE RETRIEVED
			AttributesToGet: [ 'affiliation' ]
	};
	
	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err) {
			// user not found in table, or some other error
			callback(err, null);
		} else {
			userSettings.push(data.Items[0].affiliation.S);

			//TODO: FIGURE OUT IF YOU CAN QUERY FOR ALL ITEMS WITH A CERTAIN PARTITION KEY BUT DIFF SORT KEY
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
		
			// query the table with params, searching for all items with the specified username (partition key)
			db.query(params2, function(err, data2) {
				if (err ) {
					callback(err, null);
				} else {
					for (var i=0; i < data2.Count; i++) {
						userSettings.push(data2.Items[i].friendUsername.S);
					}
					// Sends back all of the users information
					callback(err, userSettings);
				}
			});
	    }
	});
};


/**
* Updates the email of the [current] user with the specified username to the new email. 
*
* @param  username  username of current user
* @param  currEmail current email that the user types in for verification
* @param  newEmail new email that the user wants to update to
* @return Does not return anything
*/
var db_change_email = function(username, currEmail, newEmail, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
  		TableName : "users",
		KeyConditionExpression: "username = :user",
		ExpressionAttributeValues: {
		  ":user": username
		}
  	};
  
  	//Queries for the username and checks if password matches
  	docClient.query(params).promise().then(
		successResult => {
			try {
				if (successResult === null) {
					throw new Error("Something went wrong, user doesn't exist");
				} else if (successResult.Items[0].email != currEmail) {
					throw new Error("Invalid email");
				} else {
					if (currEmail === newEmail) {
						throw new Error("Need diff email");
					}
					
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
							":e": newEmail
						}
					};
			  
			  		docClient.update(params).promise().then(
					  	successResult => {
						  	console.log("UPDATED");
						  	console.log(successResult);
						  	callback(null, successResult);
					  	}, errResult => {
						  	console.log(errResult);
						  	callback(errResult, null);
					  	});

				}
			} catch (error) {
			    callback(8, null);
			}
			  
		}, errResult => {
				callback(errResult, null);
		}
	);
};


/**
* Queries the affiliation of a user with the username parameter. 
* Can be used to see affiliation of a user.
*
* @param  username  username of some user
* @return The email of the user
*/
var db_get_email = function(username, callback) {
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
			AttributesToGet: [ 'email' ]
	};
	
	// query the table with params, searching for item with the specified username
	db.query(params, function(err, data) {
		if (err || data.Items.length === 0) {
			// username not found in table, or some other error
			callback(err, null);
		} else {
			// Sends back affiliation of the user
			callback(err, data.Items[0].email.S);
	    }
	});
};


/**
* Updates the email of the [current] user with the specified username to the new email. 
*
* @param  username  username of current user
* @param  currPwd current password that the user typed in for security purposes
* @param  newPwd new password that the user wants to update to
* @return Does not return anything
*/
var db_change_password = function(username, currPwd, newPwd, callback) {	
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
  		TableName : "users",
		KeyConditionExpression: "username = :user",
		ExpressionAttributeValues: {
		  ":user": username
		}
  	};
  
  	//Queries for the username and checks if password matches
  	docClient.query(params).promise().then(
		successResult => {
			try {
				let oldHash = successResult.Items[0].password;
        		bcrypt.compare(currPwd, oldHash, function (err, equal) {
            		if (!equal) {
                		callback(11, null);
                		return;
            		}
            		bcrypt.hash(newPwd, saltRounds, function (err, hashed) {
                		if (err) {
                    		callback(err, null);
                    		return;
						}
						
						if (hashed === successResult.Items[0].password) {
							throw new Error("Enter new password");
						}

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
								":p": hashed
							}
						};
			  
			  			docClient.update(params).promise().then(
						  	successResult => {
							  	console.log("UPDATED");
							  	console.log(successResult);
							  	callback(null, successResult);
						  	}, errResult => {
							  	console.log(errResult);
							  	callback(errResult, null);
							}
						);
           			});
        		});
			} catch (error) {
			    callback(7, null);
			}
		}, errResult => {
			callback(errResult, null);
		}
	);
};


/** IGNORE THIS FUNCTION
* Queries the password of a user with the username parameter. 
*
* @param  username  username of some user
* @return The current password of the user
*/
var db_get_curr_password = function(username, callback) {
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
			// Sends back affiliation of the user
			callback(err, data.Items[0].password.S);
	    }
	});
};


/**
* Gets all of the information on posts/status/new friends related to the user and the users friends.
* This information will be used to render the homepage.
*
* @param  username  username of current user
* @return Array with the information of all of the posts/status updates of the current user and their friends
* in reverse chronological order
*/
//TODO: FIX THE REVERSE CHRONOLOGICAL ORDER THING. CURRENTLY THE RETURN ARRAY IS SEPARATED BY USERNAME
var db_get_homepage_posts = function(username, startTime, endTime, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
  		TableName : "friends",
		KeyConditionExpression: "yourUsername = :user",
		ExpressionAttributeValues: {
		  ":user": username
		}
  	};
	console.log(params);
  	docClient.query(params).promise().then(
		successResult => {
			try {
				console.log("BELOW IS SUCCESSRESULT.ITEMS");
				console.log(successResult.Items);
				var usernames = [];
				for (var i=0; i < successResult.Count; i++) {
					usernames.push(successResult.Items[i].friendUsername);
				}
				usernames.push(username);
				console.log("USERNAMES");
				console.log(usernames);
			
				var arrayOfPromises = [];
	  			//Iterates through the keywords and creates params for that keyword
	  			for (var i = 0; i < usernames.length; i++) {
					var params2 = {
						TableName : "posts",
						KeyConditionExpression: "#un = :userID and #ts BETWEEN :start AND :end",
						ScanIndexForward: false,
						ExpressionAttributeNames:{
							"#un": "userID",
							"#ts": "timestamp"
						},
						ExpressionAttributeValues: {
							":userID": usernames[i],
							":start": startTime,
							":end": endTime
						}
					};
					console.log("PARAMS2");
					console.log(params2);
					//Promise to query the keyword is pushed to array of promises
		  			arrayOfPromises.push(docClient.query(params2).promise());
	  			}
	  			Promise.all(arrayOfPromises).then(
			  		successResult => {
			  			console.log(successResult);
						callback(null, successResult);
					}, errResult => {
						console.log("PROMISE ALL FAIL?");
						console.log(errResult);
		  				callback(errResult, null);
					}
				);

			} catch (error) {
				console.log("in catch");
				console.log(error);
			    callback(error, null);
			}
		}, errResult => {
			console.log("first errResult");
			console.log(errResult);
				callback(errResult, null);
		}
	);
};


/**
* Gets all of the information on posts/status related to a user
* This information will be used to render any users wall 
*
* @param  username  username of a user
* @return Array with the information of all of the posts/status updates of the user in 
* reverse chronological order
*/
var db_get_user_Wall = function(username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var arrayOfPromises = [];
	var params1 = {
		TableName : "posts",
		KeyConditionExpression: "#uid = :userID",
		FilterExpression: "#fr = :friend",
		ScanIndexForward: false,
		ExpressionAttributeNames:{
			"#uid": "userID",
			"#fr": "friend"
		},
		ExpressionAttributeValues: {
			":userID": username,
			":friend": false
		}
	};
	arrayOfPromises.push(docClient.query(params1).promise());
	var params2 = {
		TableName: "posts",
		 IndexName: "posterID-index",
		 KeyConditionExpression: "#pid = :posterID",
		 FilterExpression: "#fr = :friend",
		 ExpressionAttributeNames:{
			"#pid": "posterID",
			"#fr": "friend"
		},
		ExpressionAttributeValues: {
			":posterID": username,
			":friend": false
		},
		ScanIndexForward: false
	};
	arrayOfPromises.push(docClient.query(params2).promise());

	// query the table with params, searching for item with the specified username
	Promise.all(arrayOfPromises).then(
		successResult => {
			console.log(successResult[0]);
			console.log(successResult[1]);
			callback(null, successResult);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};


/**
* Adds post info to "posts" and "hashtags". For when user posts on someone elses wall
*
* @param  wallsUser  username of the user's wall that's getting posted on
* @param  posterID  username of the current user (person trying to make post)
* @param  postID generated postID
* @param  content post content
* @param  timestamp timestamp of when post was made
* @param  hashtags hashtags (if any) of the post. Must be in form of an array
* @return Does not return anything
*/
var db_make_wall_post = function(wallsUser, posterID, postID, content, timestamp, hashtags, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var userName;
	var posterName;
	var arrayOfPromises1 = [];
	var getNameParam1 = {
		TableName : "users",
		KeyConditionExpression: "#un = :username",
		ExpressionAttributeNames:{
			"#un": "username"
		},
		ExpressionAttributeValues: {
			":username": wallsUser
		}
	};
	arrayOfPromises1.push(docClient.query(getNameParam1).promise());

	var getNameParam2 = {
		TableName : "users",
		KeyConditionExpression: "#un = :username",
		ExpressionAttributeNames:{
			"#un": "username"
		},
		ExpressionAttributeValues: {
			":username": poster
		}
	};
	arrayOfPromises1.push(docClient.query(getNameParam2).promise());
	Promise.all(arrayOfPromises1).then(
		successResultA => {
			console.log(successResultA[0].Items[0]);
			userName = successResultA[0].Items[0].fullname;
			posterName = successResultA[1].Items[0].fullname;
			var params = {
				TableName : "posts",
				Item:{
					"userID": wallsUser,
					"postID": postID,
					"content": content,
					"timestamp": timestamp,
					"posterID": posterID,
					"userName": successResultA[0].Items[0].fullname,
					"posterName": successResultA[1].Items[0].fullname,
					"friend": false
				}
			};
			docClient.put(params).promise().then(
				successResult => {
					if (hashtags.length !== 0) {
						var arrayOfPromises = [];
						  //Iterates through the keywords and creates params for that keyword
						  for (var i = 0; i < hashtags.length; i++) {
							var params2 = {
								TableName : "hashtags",
								Item:{
									"userID": wallsUser,
									"postID": postID,
									"content": content,
									"timestamp": timestamp,
									"hashtag": hashtags[i],
									"posterID": poster,
									"userName": userName,
									"posterName": posterName
								}
							};
							//Promise to query the keyword is pushed to array of promises
							  arrayOfPromises.push(docClient.put(params2).promise());
						  }
						  Promise.all(arrayOfPromises).then(
							  successResult => {
								callback(null, successResult);
							}, errResult => {
								  callback(errResult, null);
							}
						);
		
					} else {
						callback(null, successResult);
					}
		
				}, errResult => {
					callback(errResult, null);
				});


		}, errResult => {
			callback(errResult, null);
		}
	);
};



/**
* Adds post info to "posts" and "hashtags". For when user makes post on homepage or their own wall
*
* @param  username  username of current user
* @param  postID generated postID
* @param  content post content
* @param  timestamp timestamp of when post was made
* @param  hashtags hashtags (if any) of the post. Must be in form of an array
* @return Does not return anything
*/
// FOR SOME REASON THIS WORKS BUT THE PREVIOUS DIDNT?
var db_make_post = function(username, postID, content, timestamp, hashtags, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var userName;
	var getNameParam = {
		TableName : "users",
		KeyConditionExpression: "#un = :username",
		ExpressionAttributeNames:{
			"#un": "username"
		},
		ExpressionAttributeValues: {
			":username": username
		}
	};
	docClient.query(getNameParam).promise().then(
		successResult => {
			console.log(successResult.Items[0]);
			userName = successResult.Items[0].fullname;
			var params = {
				TableName : "posts",
				Item:{
					"userID": username,
					"postID": postID,
					"content": content,
					"timestamp": timestamp,
					"userName": successResult.Items[0].fullname,
					"friend": false
				}
			};
			docClient.put(params).promise().then(
				successResult => {
					if (hashtags.length !== 0) {
						var arrayOfPromises = [];
						  //Iterates through the keywords and creates params for that keyword
						  for (var i = 0; i < hashtags.length; i++) {
							var params2 = {
								TableName : "hashtags",
								Item:{
									"userID": username,
									"postID": postID,
									"content": content,
									"timestamp": timestamp,
									"hashtag": hashtags[i],
									"userName": userName
								}
							};
							//Promise to query the keyword is pushed to array of promises
							  arrayOfPromises.push(docClient.put(params2).promise());
						  }
						  Promise.all(arrayOfPromises).then(
							  successResult => {
								callback(null, successResult);
							}, errResult => {
								  callback(errResult, null);
							}
						);
		
					} else {
						callback(null, successResult);
					}
		
				}, errResult => {
					callback(errResult, null);
				});


		}, errResult => {
			callback(errResult, null);
		}
	);
};


/**
* Gets all posts that contain a specific hashtag
*
* @param  hashtag  hashtag that you want to get
* @return Array with the information of all of the comments
*/
var db_get_hashtags = function(hashtag, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "hashtags",
		KeyConditionExpression: "#ht = :hashtag",
		ScanIndexForward: false,
		ExpressionAttributeNames:{
			"#ht": "hashtag"
		},
		ExpressionAttributeValues: {
			":hashtag": hashtag
		}
	};

	// query the table with params, searching for item with the specified username
	docClient.query(params).promise().then(
		successResult => {
			console.log(successResult);
			callback(null, successResult);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};



/** IDK IF WE SHOULD MAKE POSTS DELETABLE
* Deletes all instances of a post from the tables with the post_id. 
* Will first check if user trying to delete the post is the poster.
*
* @param  username  username of current user
* @param  post_id  id of a post
* @return Array with the information of all of the posts with specific hashtag
*/
var db_delete_post = function(username, post_id, callback) {
	// TODO: CHECK IF ITS THE POSTER DELETING THE POST
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
	
	db.deleteItem(params, function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(err, data);
		}
	});
};


/**
* Gets all comments on a specific post
*
* @param  postID  postID of the post to generate comments
* @return Array with the information of all of the comments
*/
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


/**
* Adds post comment information into "comment" table
*
* @param  username  username of current user
* @param  postID generated postID
* @param  comment comment content
* @param  timestamp timestamp of when post was made
* @return 
*/
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


//IDK IF WE SHOULD KEEP THIS. DELETING IS KINDA COMPLICATED
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


/**
* Adds friending information into "friends" table. Adds twice:
* once with yourUsername as partition key, once with friendUsername as partition key.
* Both additions will use the same timestamp.
*
* @param  yourUsername  username of current user
* @param  friendUsername username of person the user friended
* @param  timestamp timestamp of when friend was added
* @param  postID  id of post
* @return Does not return anything
*/
var db_add_friend = function(yourUsername, friendUsername, timestamp, postID, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var arrayOfPromises = [];
	var yourParam = {
		TableName : "friends",
		Item:{
			"yourUsername": yourUsername,
			"friendUsername": friendUsername
		}
	};
	//Promise to add the keyword is pushed to array of promises
	arrayOfPromises.push(docClient.put(yourParam).promise());

	var friendParam = {
		TableName : "friends",
		Item:{
			"yourUsername": friendUsername,
			"friendUsername": yourUsername
		}
	};
	arrayOfPromises.push(docClient.put(friendParam).promise());

	Promise.all(arrayOfPromises).then(
		successResult => {
			var userName;
			var posterName;
			var arrayOfPromisesNames = [];
			var getyouNameParam = {
				TableName : "users",
				KeyConditionExpression: "#un = :username",
				ExpressionAttributeNames:{
					"#un": "username"
				},
				ExpressionAttributeValues: {
					":username": yourUsername
				}
			};
			arrayOfPromisesNames.push(docClient.query(getyouNameParam).promise());

			var getfriendNameParam = {
				TableName : "users",
				KeyConditionExpression: "#un = :username",
				ExpressionAttributeNames:{
					"#un": "username"
				},
				ExpressionAttributeValues: {
					":username": friendUsername
				}
			};
			arrayOfPromisesNames.push(docClient.query(getfriendNameParam).promise());
			Promise.all(arrayOfPromisesNames).then(
				successResult => {
					var param = {
						TableName : "posts",
						Item:{
							"userID": yourUsername,
							"postID": postID,
							"content": yourUsername + " is now friends with " + friendUsername,
							"timestamp": timestamp,
							"posterID": friendUsername,
							"userName": successResult[0].Items[0].fullname,
							"posterName": successResult[1].Items[0].fullname,
							"friend": true
						}
					};
		
					docClient.put(param).promise().then(
						successResult2 => {
							callback(null, successResult2);
						}, errResult => {
							callback(errResult, null);
						}
					);
				}, errResult => {
					callback(errResult, null);
				}
			);	
		}, errResult => {
			callback(errResult, null);
		}
	);
};


/**
* Adds friending information into "friends" table. Adds twice:
* once with yourUsername as partition key, once with friendUsername as partition key.
* Both additions will use the same timestamp.
*
* @param  yourUsername  username of a user
* @return List of usernames of all of a users friends
*/
var db_get_friends = function(yourUsername, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "friends",
		KeyConditionExpression: "yourUsername = :yourUsername",
		ExpressionAttributeValues: {
			":yourUsername": yourUsername
		}
	};

	// query the table with params, searching for item with the specified username
	docClient.query(params).promise().then(
		successResult => {
			console.log(successResult);
			callback(null, successResult.Items);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};


/**
* Removes both instances of the friendship from the "friends" table
*
* @param  yourUsername  username of current user
* @param  friendUsername  username of a user that current user is trying to unfriend
* @return Does not return anything
*/
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


/**
* Changes the current users logged_in status to false in "users" table
*
* @param  username  username of current user
* @return Does not return anything
*/
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


/**
* Changes the current users logged_in status to false in "users" table
*
* @param  chatID  ID of chatroom
* @param  chatName  name of the chat
* @param  username  username of user who sent message
* @return Does not return anything
*/
var db_start_chat = function(chatID, chatName, username, friendUsername, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chats",
		Item:{
			"chatID": chatID,
			"chatName": chatName
		}
	};
	docClient.put(params).promise().then(
		successResult => {
			var params2 = {
				TableName : "chatUsers",
				Item:{
					"chatID": chatID,
					"username": username
				}
			};
			docClient.put(params2).promise().then(
				successResult2 => {
					callback(null, successResult2);
				}, errResult2 => {
					callback(errResult2, null);
				}
			);
		}, errResult => {
			callback(errResult, null);
		}
	);
};



/**
* Changes the current users logged_in status to false in "users" table
*
* @param  chatID  ID of chatroom
* @return Returns array of the message items of chat in chronological? order
*/
var db_get_messages = function(chatID, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "messages",
		KeyConditionExpression: "#ci = :chatid",
		ScanIndexForward: true, //NOT SURE IF THIS COUNTS AS CHRONOLOGICAL OR REVERSE CHRONOLOGICAL IF YOU MAKE NEWEST POP UP AT BOTTOM
		ExpressionAttributeNames:{
			"#ci": "chatID"
		},
		ExpressionAttributeValues: {
			":chatid": chatID
		}
	};

	// query the table with params
	docClient.query(params).promise().then(
		successResult => {
			console.log(successResult);
			callback(null, successResult);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};


/**
* Changes the current users logged_in status to false in "users" table
*
* @param  chatID  ID of chatroom
* @param  timestamp  time that message was sent
* @param  message  message contents
* @param  username  username of user who sent message
* @return Does not return anything
*/
var db_add_message = function(chatID, timestamp, message, username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "messages",
		Item:{
			"chatID": chatID,
			"timestamp": timestamp,
			"message": message,
			"username": username
		}
	};
	docClient.put(params).promise().then(
		successResult => {
			callback(null, successResult);
		}, errResult => {
			callback(errResult, null);
		});
};


/**
* Changes the current users logged_in status to false in "users" table
*
* @param  chatID  ID of chatroom
* @return Returns array of the usernames in that chat
*/
var db_get_chat_users = function(chatID, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chatUsers",
		KeyConditionExpression: "#ci = :chatid",
		ExpressionAttributeNames:{
			"#ci": "chatID"
		},
		ExpressionAttributeValues: {
			":chatid": chatID
		}
	};

	// query the table with params
	docClient.query(params).promise().then(
		successResult => {
			console.log(successResult);
			callback(null, successResult);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};


/**
* Changes the current users logged_in status to false in "users" table
*
* @param  chatID  ID of chatroom
* @param  username  username of user who sent message
* @return Does not return anything
*/
var db_join_chat = function(chatID, username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chatUsers",
		Item:{
			"chatID": chatID,
			"username": username
		}
	};
	docClient.put(params).promise().then(
		successResult => {
			var params2 = {
				TableName : "chatInvitations",
				Key: {
					"username": username,
					"chatID": chatID
				}
			};
		
			docClient.delete(params2).promise().then(
				successResult2 => {
					callback(null, successResult2);
				}, errResult => {
					callback(errResult, null);
				}
			);
		}, errResult => {
			callback(errResult, null);
		});
};


/**
* Removes both instances of the friendship from the "friends" table
*
* @param  chatID  id of chat user is trying to leave
* @param  username  username of user who wants to leave chat
* @return Does not return anything
*/
var db_leave_chat = function(chatID, username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chatUsers",
		Key: {
			"chatID": chatID,
			"username": username
		}
	};

  	docClient.delete(params).promise().then(
	  	successResult => {
		  	callback(null, successResult);
		}, errResult => {
			callback(errResult, null);
		}
	);
};


/**
* Changes the current users logged_in status to false in "users" table
*
* @param  chatID  ID of chatroom
* @param  newName  new chat name
* @return Returns array of the usernames in that chat
*/
var db_rename_chat = function(chatID, newName, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
	    TableName: "chats",
	    Key: {
	        "chatID": chatID
	    },
	    UpdateExpression: "set #newName = :nN",
	    ExpressionAttributeNames: {
	        "#newName": "newName"
	    },
	    ExpressionAttributeValues: {
	        ":nN": newName
	    }
	};
  
  	docClient.update(params).promise().then(
		successResult => {
			console.log("UPDATED");
			console.log(successResult);
			callback(null, successResult);
		}, errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};


/**
* Gets all users whose fullnames contain a certain string
*
* @param  typedName  what the user has typed so far
* @return Array with the usernames whose partition key contains typedName
*/
//TODO: CHANGE TO A SCAN 
var db_search_name = function(typedName, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "fullnames",
		KeyConditionExpression: "begins_with (#fn, :fullname)",
		ExpressionAttributeNames:{
			"#fn": "fullname"
		},
		ExpressionAttributeValues: {
			":fullname": typedName
		}
	};

	// query the table with params
	docClient.query(params).promise().then(
		successResult => {
			console.log(successResult);
			callback(null, successResult);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
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
  addInterest: add_interest,
  removeInterest: db_remove_interest,
  getInterests: db_get_interests,
  getSettings: db_get_settings,
  changeEmail: db_change_email,
  getEmail: db_get_email,
  changePassword: db_change_password,
  getPassword: db_get_curr_password,
  getHomepagePosts: db_get_homepage_posts,
  getUserWall: db_get_user_Wall,
  getHashtags: db_get_hashtags,
  makeWallPost: db_make_wall_post,
  makePost: db_make_post,
  deletePost: db_delete_post,
  getPostComments: db_get_post_comments,
  addComment: db_add_comment,
  deleteComment: db_delete_comment,
  addFriend: db_add_friend,
  getFriends: db_get_friends,
  unfriend: db_unfriend,
  logout: db_logout,
  getMessages: db_get_messages,
  addMessage: db_add_message,
  startChat: db_start_chat,
  getChatUsers: db_get_chat_users,
  joinChat: db_join_chat,
  leaveChat: db_leave_chat,
  renameChat: db_rename_chat,
  searchName: db_search_name
};

module.exports = database;