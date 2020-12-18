/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

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
   // avoid MIME type mismatch errors for the external CSS
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
   
   // FROM DI AND PHILIP
   const path = require('path');
   const stemmer = require('stemmer');
   var serveStatic = require('serve-static');
   var db = require('./models/database.js');
   var map = new Map();
   app.use(serveStatic(path.join(__dirname, 'public')));
   
   


/* Below we install the routes. The first argument is the URL that we
   are routing, and the second argument is the handler function that
   should be invoked when someone opens that URL. Note the difference
   between app.get and app.post; normal web requests are GETs, but
   POST is often used when submitting web forms ('method="post"'). */

// login page
app.get('/', routes.get_login);
app.post('/checklogin', routes.check_login);

// sign up (create account) page
app.get('/signup', routes.sign_up);
app.post('/createaccount', routes.create_account);

// home page for users logged in (unique to each user)
app.get('/home', routes.get_home);

// pages for changing a user's account settings (get route to view the page, post routes to modify account and redirect to settings)
app.get('/settings', routes.get_settings);
app.post('/updateemail', routes.update_email);
app.post('/updatepassword', routes.update_password);
app.post('/updateaffiliation', routes.update_affiliation);
app.post('/addinterest', routes.add_interest);
app.post('/removeinterest', routes.remove_interest);

// wall page (get route to view the page, post route to make posts)
app.get('/wall', routes.get_wall);
app.post('/postonwall', routes.post_to_wall);

// view a page displaying a user's list of friends
app.get('/friendsof', routes.get_friends);

// view visualizer
app.get('/graphof', function(req, res) {
	res.render('friendvisualizer.ejs');
});

app.get('/livy', function(req,res){
	const { exec } = require('child_process');

	exec('cd .. \n cd HW3 \n mvn exec:java@livy', (error, stdout, stderr) => {
		if (error) {
			console.log(error);
		}
	
		if (stderr) {
			console.log(stderr);
		}
		
		console.log(stdout);
	});
})

app.get('/friendvisualization', function(req, res) {
	let name = req.session.username;
	console.log("doing database")
	db.getFriends(name,function(err,data){// TODO fix the name here		
			if(err){
				res.send(null)
			} else {
				let json = {}
				json.id = name// TODO get username
				json.name = name // TODO get name?
				json.children = []
				json.data = []
				// it worked so we send null message so the resturant knows to delete
				data.forEach(item => {
								let singleton  = []
								singleton.push(name)
								singleton.push(item.friendUsername)
								map.set(item.friendUsername,singleton)
								let friend = {}
								friend.name = item.friendUsername
								friend.id = item.friendUsername
								friend.children = []
								friend.data = []
								json.children.push(friend)
				} )
				res.send(json);
			}
			
	}); 
});

app.get('/getFriends/:user', function(req, res) {

   let name = req.params.user
	let array = []
	array = array.concat(map.get(req.params.user));
	let aff = "sfasfadsf"
	db.getAffiliation(array[0], function(err,data){
						if (err){
							console.log(err)
						} else {
							aff = data
							db.getFriends(name,function(err,data){// TODO fix the name here		
									if(err){
										res.send(null)
									} else {
										let list = []
										let list1 = []
										data.forEach( f =>{
												list.push(f.friendUsername)
											}
										)
										db.getAllAffiliations(list, function(err,data){
													if (err){
														console.log(err)
														return ret
													} else{
														data.forEach(temp => {
															let check = temp.Items[0].affiliation
															if (check == aff){
																	list1.push(temp.Items[0].username)
															}
														})
														json = myFunction(array,list1, array, aff)
														res.send(json);
													}
										})
										// it worked so we send null message so the resturant knows to delete

									}
									
							}); 
						}
	})

});

function myFunction( array,items, array2, aff) {
  if (array.length == 0){
		let ret = []
		items.forEach(temp => {
			let freind = {}
			freind.name = temp
			freind.id = temp
			freind.children = []
			freind.data = []
			ret.push(freind)
			
			let array2 = [] 
			array2 = array
			array2.push(temp)
			map.set(temp,array2)
		})
		return ret
  } else {
	  let name = array.splice(0,1)
	  let json = {};
	  json.id = name
	  json.name = name
	  json.children = []
	  json.data = []
	  let y = myFunction(array, items, array2, aff)
	  json.children = json.children.concat(y)
	  return json
	}

}

// SELENE'S CHAT
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


// routes for adding and removing friends
app.post('/addfriend', routes.add_friend);
app.post('/deletefriend', routes.delete_friend);

// support dynamic content on the home page by updating it periodically (gets the list of posts to show on the home page)
app.get('/homepageposts', routes.home_page_posts);

// allow users to make comments on any post they can see (either their own post or a friend's post)
app.post('/commentonpost', routes.comment_on_post);

// show the user their own personalized news recommendations page and allow them to search for news articles
app.get('/news', routes.get_news);
app.post('/searchnews', routes.search_news);

// support dynamic content on the news page by updating it hourly (gets the list of articles to show on the news page)
app.get('/newsfeedupdate', routes.news_feed_update);

// enable users to like articles
app.post('/likearticle', routes.like_article);

// shows the full names of users from search
app.get('/usersearch', routes.search_user);

// results from searching for users
app.post('/searchforuser', routes.search_user_submit);

// shows all posts under a certain hashtag
app.get('/postswith', routes.get_posts_from_hashtag);

// SELENE'S CHAT
app.get('/chat', routes.get_chat);

// AJAX call for getting chat invitations
app.get('/chatinvites', routes.get_chat_invites);

// logs the user out of their account
app.get('/logout', routes.log_out);

/* 
 * Define GET routes for users that try to break the website by accessing inaccessible URLs
 * Uses home route for users not logged in (redirects to login page)
 * Uses login route for users logged in (redirects to home page)
 */
app.get('/createaccount', routes.get_home);
app.get('/checklogin', routes.get_home);

app.get('/updateemail', routes.get_login);
app.get('/updatepassword', routes.get_login);
app.get('/updateaffiliation', routes.get_login);
app.get('/addinterest', routes.get_login);
app.get('/removeinterest', routes.get_login);

//app.get('/postonwall', routes.get_login);
app.get('/commentonpost', routes.get_login);

app.get('/searchnews', routes.get_login);
app.get('/addfriend', routes.get_login);
app.get('/deletefriend', routes.get_login);

/* Run the server */

console.log('Authors: Philip Kaw (ph163k8), Selene Li (seleneli), Alex Dong (adong9), Di Lu (dlu36)');
//app.listen(8080);
//console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
http.listen(8080, function() {
	console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
 });