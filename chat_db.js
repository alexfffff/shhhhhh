var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();



/**
* Adds users to a chat. If it is a DM chat, will also add to table again but
* this will not change anything. DM chats do not technically have nameable chats
*
* @param  chatID  ID of chatroom
* @param  chatName  name of the chat
* @param  members  array of usernames of people who will be in new chat
* @return Does not return anything
*/
var db_start_chat = function(chatID, chatName, members, callback) {
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
			var arrayOfPromises = [];
			members.forEach(member => {
				var params2 = {
					TableName : "chatUsers",
					Item:{
						"chatID": chatID,
						"username": member
					}
				};
				arrayOfPromises.push(docClient.put(params2).promise());
			});
			Promise.all(arrayOfPromises).then(
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
* Gets the message history of that chat
*
* @param  chatID  ID of chatroom
* @param  iteration  which round of messages to get (iteration*50 - (iteration+1)*50-1)
* @return Returns array of the message items of chat in chronological? order
*/
var db_get_messages = function(chatID, iteration, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "messages",
		KeyConditionExpression: "#ci = :chatid",
		ScanIndexForward: false, //NOT SURE IF THIS COUNTS AS CHRONOLOGICAL OR REVERSE CHRONOLOGICAL IF YOU MAKE NEWEST POP UP AT BOTTOM
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
			//TODO: SEE FORMAT TO PROEPRLY GET SUBSET
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
* @param  fullname  fullname of user who sent message
* @return Does not return anything
*/
var db_add_message = function(chatID, timestamp, message, username, fullname, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "messages",
		Item:{
			"chatID": chatID,
			"timestamp": timestamp,
			"message": message,
			"username": username,
			"fullname": fullname
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
			callback(null, successResult.Items);
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
* @return Returns array of the usernames in that chat
*/
var db_get_chat_name = function(chatID, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chats",
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
			callback(null, successResult.Items[0].chatName);
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
	    UpdateExpression: "set #newName = :cn",
	    ExpressionAttributeNames: {
	        "#newName": "chatName"
	    },
	    ExpressionAttributeValues: {
	        ":cn": newName
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
* Gets list of usernames and fullnames of current user's friends who are online
*
* @param  username  username of current user
* @return Returns array of the usernames of current users friends who are online
*/
var db_get_online_friends = function(username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var friendParams = {
		TableName : "friends",
		KeyConditionExpression: "#yu = :yourUsername",
		ExpressionAttributeNames:{
			"#yu": "yourUsername"
		},
		ExpressionAttributeValues: {
			":yourUsername": username
		}
	};

	// query the table with params
	docClient.query(friendParams).promise().then(
		successResult => {
			//DOUBLE CHECK FORMAT OF successResult
			console.log(successResult);
			var arrayOfPromises = [];
			successResult.Items.forEach(friend => {
				var params = {
					TableName : "users",
					KeyConditionExpression: "#un = :username",
					FilterExpression: "#li = :logged_in",
					ExpressionAttributeNames:{
						"#un": "username",
						"#li": "logged_in"
					},
					ExpressionAttributeValues: {
						":username": friend.friendUsername,
						":logged_in": true
					}
				};
				console.log(params);
				arrayOfPromises.push(docClient.query(params).promise());
			});

			Promise.all(arrayOfPromises).then(
				successResult => {
					var results = [];
					console.log(successResult);
					successResult.forEach(result => {
						if (result.Count !== 0) {
							results.push({username: result.Items[0].username, fullname: result.Items[0].fullname});
						}
					});
					callback(null, results);
				},
				errResult => {
					console.log(errResult);
					callback(errResult, null);
				}
			);
		},
		errResult => {
			console.log(errResult);
			callback(errResult, null);
		}
	);
};



/**
* Creates invitation for user
*
* @param  chatID  ID of chatroom
* @param  invitedUserID  username of person getting invited
* @param  inviterID  username of person who sent invitation
* @param  inviterName  fullname of person who sent invitation
* @return Does not return anything
*/
var db_invite_user = function(chatID, invitedUserID, inviterID, inviterName, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chatInvitations",
		Item:{
			"username": invitedUserID,
			"chatID": chatID,
			"inviterID": inviterID,
			"inviterName": inviterName
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
* Gets all of a users invitations
*
* @param  username username of person we want the invitations for
* @return Does not return anything
*/
var db_get_invites = function(username, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chatInvitations",
		KeyConditionExpression: "#un = :username",
		ExpressionAttributeNames:{
			"#un": "username"
		},
		ExpressionAttributeValues: {
			":username": username
		}
	};

	// query the table with params
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
* Deletes chat invitation from table
*
* @param  chatID  ID of chatroom
* @param  invitedUserID  username of person who was invited
* @return Does not return anything
*/
var db_delete_invitation = function(chatID, invitedUserID, callback) {
	var docClient = new AWS.DynamoDB.DocumentClient();
	var params = {
		TableName : "chatInvitations",
		Key: {
			"username": invitedUserID,
			"chatID": chatID
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





var chat_db = { 
    getMessages: db_get_messages,
    addMessage: db_add_message,
    startChat: db_start_chat,
	getChatUsers: db_get_chat_users,
	getChatName: db_get_chat_name,
    joinChat: db_join_chat,
    leaveChat: db_leave_chat,
	renameChat: db_rename_chat,
	getOnlineFriends: db_get_online_friends,
	inviteUser: db_invite_user,
	getInvites: db_get_invites,
	deleteInvitation: db_delete_invitation
  };
  
  module.exports = chat_db;