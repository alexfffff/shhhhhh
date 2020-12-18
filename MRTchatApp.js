var express = require('express');
var app = require('express')();
const bodyParser = require('body-parser');
var routes = require('./routes/routes.js');
app.use(bodyParser.urlencoded({extended : true}));
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chat_db = require('./models/chat_db.js');
var db = require('./models/database.js');
var uuid = require('uuid/v4');
app.use(express.urlencoded());
//avoid MIME type mismatch errors for the external CSS
app.use(express.static('public'));

// handle sessions and cookies for users
var session = require('express-session');
var cookieParser = require('cookie-parser');
app.use(session({
    secret: 'nets212_insecure',
    resave: false,
    saveUninitialized: true
	}));
app.use(cookieParser());

/*function sendTime() {
	io.emit('message', { message: new Date().toJSON() });
}*/

//setInterval(sendTime, 10000);

var users = {};		// username -> socketID
var sockets = {};   // sockets(rooms) that user is a part of. socketID -> username
var userFullNames = {}; // username -> fullname
var chats = {};
var currentChatID;

io.on('connection', function (socket) {
	console.log("CONNECTED");
	   
	// DOUBLE CHECK WHEN REPLACING THIS W VM STUFF
	var username = 'NOT SET YET';
	var userFullname = 'NO NAME YET';

	socket.emit('welcome', { message: 'Welcome!', id: socket.id });

	socket.on('i am client', function (data) {
		username = data.username;
		sockets[socket.id] = username;
	    userFullNames[username] = data.userFullname;
	    users[username] = socket.id;
	    console.log("i am client stuff");
   });
   
	socket.on('message', function (data) {
		console.log(data.message);
   });


   	socket.on('join_DM', function(msg) { 
        joinDM(socket, msg); 
    });
    
    socket.on('accept_invite', function(msg) { 
        acceptInvite(socket, msg); 
    });
   
    socket.on('create_chat', function(msg) { createChat(socket, data); });

   //RECEIVES NEW CHAT MSG THAT USER SENT
	socket.on('newChatMsg', function(msg) { 
		newly_sent_msg(socket, msg); 
		// TODO: Add to db?
	      //Send message to everyone
	      //io.sockets.emit('newmsg', data);
	});
   
	socket.on('get_chat_invites', function(msg) {
		getChatInvites(socket, msg); 
	});
	
	
    socket.on('get_active_friends', function(msg) {
    	getOnlineFriends(socket, msg);
    });


    socket.on('startGroup', function(msg) {
		startGroupChat(socket, msg); 
	});


    socket.on('leave_chatRoom', function(roomID) {
        leaveRoom(socket, roomID);
    });
	
	
	socket.on('disconnect', function() { 
        disconnect_user(socket); 
    });


	//chat_db.getOnlineFriends(username);
});


//save and pass incoming message to all members in the chat
//timestamp of the message is attached on server side
//msg: {chatID: string, message: string, sender: string}
//output: {chatID, timestamp, message, sender's username}
var newly_sent_msg = function(socket, msg) {
	var msgObj = {chatID: msg.chatID, timestamp: Date.now(), message: msg.message, sender: msg.sender, fullname: msg.fullname};
	
	chat_db.addMessage(msg.chatID, Date.now(), msg.message, msg.sender, msg.fullname, function (err, data) {
		if (err) {
			console.log("SOMETHING WRONG W PUTTING MSG IN DB");
		} else {
			io.in(msg.chatID).emit('newmsg', msgObj);
		}
	});
}


var disconnect_user = function(socket) {
    var loggingOutUser = sockets[socket.id];
    delete sockets[socket.id];
    delete users[loggingOutUser];
    //notify_friends_logout(logout_username);
    io.emit('message', 'user left');
}



var leaveRoom = function(socket, roomID) {
    delete chats[roomID];
    socket.leave(roomID);
    //notify_friends_logout(logout_username);
    io.emit('left_room', roomID);
}




/**
* Join existing chat. This is either through invitation (would provide chatID) or it is between two users.
* DM chats all have same chatID format: 'user1:user2' (user1 is alphabetically before user2). DMs are essentially already existing.
*
* @param  data  data: {chatID: string, member: friendUsername (DM only)}
* @return 
*/
var joinChatroom = function(socket, data) {
    socket.join(data.chatID);
    var invitedUser = sockets[socket.id];
    var chatID = data.chatID;
    var chatName;
    // add the dm channel to persistent storage
    //IF THIS IS DM, CHECK IF YALL TALKED BEFORE
    if ('member' in data) {
        if (invitedUser < data.member) {
            chatName = invitedUser + ', ' + data.member;
        } else {
            chatName = data.member + ', ' + invitedUser;
        }
        chats[chatID] = {
            chatID: chatID,
            chatName: chatName,
            members: [invitedUser, data.member]
        };
        chat_db.startChat(chatID, chatName, [invitedUser, data.member], function(err, data) {
            if (err) {
                console.log('error adding to db, ' + err);
            } else {
            	console.log("chat started: " + data);
            	chat_db.getMessages(chatID, 0, function(err, data) {
                    if (err) {
                        console.log('get message dynamo error, ' + err);
                    } else if (data.Count === 0) {
                    	console.log("NO OLD MSGS");
                        socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:[]});
                    } else {
                    	console.log("HAS OLD MSGS");
                        socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:data});
                    }
                });
            }
        });
        
        socket.emit('get_channel', chats[chatID]);
        return;
    }
    // Gets members of this chat
    chat_db.getChatName(chatID, function(err, data) {
        if (err) {
            console.log("GET CHAT ERR" + err);
        } else {
            console.log(data);
            chatName = data.chatName;
            // gets the 50 most recent msgs
    chat_db.getMessages(chatID, 0, function(err, data) {
        if (err) {
            console.log("GET MSG ERR" + err);
        } else if (data.Count === 0) {
        	console.log("NO OLD MSGS");
            socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:[]});
        } else {
        	console.log("HAS OLD MSGS");
            socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:data});
        }
    });
        }
    });
    
    
}


var joinDM = function(socket, data) {
    socket.join(data.chatID);
    var inviterID = sockets[socket.id];
    var chatID = data.chatID;
    var chatName = data.chatName;
    // add the dm channel to persistent storage
    //IF THIS IS DM, CHECK IF YALL TALKED BEFORE
    if ('member' in data) {
        /*if (inviterID < data.member) {
            chatName = inviterID + ', ' + data.member;
        } else {
            chatName = data.member + ', ' + inviterID;
        }*/

        chat_db.inviteUser(chatID, [data.member], inviterID, userFullNames[inviterID], function(err, data) {
            if (err) {
                console.log("SOMETHING WRONG W INVITE");
            }
        });

        chats[chatID] = {
            chatID: chatID,
            chatName: data.chatName,
            members: [inviterID, data.member]
        };
        console.log(chats[chatID]);
        chat_db.startChat(chatID, data.chatName, [inviterID, data.member], function(err, data) {
            if (err) {
                console.log('error adding to db, ' + err);
            } else {
            	chat_db.getMessages(chatID, 0, function(err, data) {
                    if (err) {
                        console.log('get message dynamo error, ' + err);
                    } else if (data.Count === 0) {
                    	console.log("NO OLD MSGS");
                        socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:[]});
                    } else {
                    	console.log("HAS OLD MSGS");
                        socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:data});
                    }
                });
            }
        });
        return;
    }
}




var acceptInvite = function(socket, msg) {
    chat_db.deleteInvitation(msg.chatID, sockets[socket.id], function(err, data) {
		if (err) {
			console.log ("getOnlineFriends error: " + err);
		} else {
			joinChatroom(socket, msg);
        }
    });
}


// takes in members: [current room members array (3 usernames)]
var startGroupChat = function(socket, members) {
    console.log("ON START GROUPCHAT");
    console.log(members);
    var chatID = uuid();
    socket.join(chatID);
    //currentChatID = data.chatID;
    console.log(chatID);
    var inviterID = sockets[socket.id];
    console.log("invitation maker: " + inviterID);
    var chatName = "New Group Chat";
    // add the dm channel to persistent storage
    chats[chatID] = {
        chatID: chatID,
        chatName: chatName,
        members: members
    };
    console.log("chats: " + chats);
    chat_db.startChat(chatID, chatName, members, function(err, data) {
        if (err) {
            console.log('error adding to db, ' + err);
        } else {
            chat_db.inviteUser(chatID, members, inviterID, userFullNames[inviterID], function(err, data) {
                if (err) {
                    console.log("SOMETHING WRONG W INVITE");
                } else {
                    socket.emit('get_messages', {chatID: chatID, chatName: chatName, messages:[]});
                }
            });
        }
    });
}





var getOnlineFriends = function(socket, msg) {
	var activeFriends = [];
    // send online friend list here
    chat_db.getOnlineFriends(msg, function(err, data) {
		if (err) {
			console.log ("getOnlineFriends error: " + err);
		} else {
            data.forEach(friend => {
				var friendInfo = {username: friend.username, fullname: friend.fullname};
				activeFriends.push(friendInfo);
			});
			socket.emit('onlineFriends', activeFriends);
        }
    });
}


var getChatInvites = function(socket, msg) {
    chat_db.getInvites(msg, function(err, data) {
        if(err) {
        	console.log('Problem getting invites: '+ err);
        } else {
        	socket.emit('chatInvitations', data);
        }
    });
}







app.get('/', routes.get_main);
app.post('/checklogin', routes.check_login);
app.get('/test', routes.get_test);
app.get('/chat', routes.get_chat);
app.get('/logout', routes.get_logout);


http.listen(8080, function() {
   console.log('listening on localhost:3000');
});
