var AWS = require('aws-sdk');
AWS.config.update({region:'us-east-1'});
var db = new AWS.DynamoDB();



/**
* Adds users to a chat
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
* Gets the message history of that chat
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


var chat_db = { 
    getMessages: db_get_messages,
    addMessage: db_add_message,
    startChat: db_start_chat,
    getChatUsers: db_get_chat_users,
    joinChat: db_join_chat,
    leaveChat: db_leave_chat,
    renameChat: db_rename_chat
  };
  
  module.exports = chat_db;