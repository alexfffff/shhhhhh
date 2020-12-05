var db = require('../models/database.js');

var getLogin = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot view the login page
		res.redirect('/home');
	} else {
		res.render('main.ejs', {message: null});
	}
};

var checkLogin = function(req, res) {
	var username = req.body.myUsername;
	var password = req.body.myPassword;

	// TODO - implement login check with username and password (almost done)
	console.log(username);
	console.log(password);
	
	db.loginCheck(username, password, function(err, data) {
		if (err) {
			// check for specific error from database call
			if (err == 5) {
				// login failed due to non-existent username or incorrect password (same error for security purposes)
				res.redirect('/?message=' + 'Username_or_password_invalid._Please_try_again.');
			} else {
				// handle error with database
				res.render('error.ejs');
			}
		} else {
			// set the session's username to reflect login, and redirect user to the home page
			req.session.username = data;
			res.redirect('/home');
		}
	});
};

var signUp = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot view the sign up page, redirect to home page
		res.redirect('/home');
	} else {
		res.render('signup.ejs', {message: null});
	}
};

// TODO
var createAccount = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot attempt to create an account, redirect to home page
		res.redirect('/home');
	} else {
		var newUser = req.body.myNewUsername;
		var newPass = req.body.myNewPassword;
		var fullName = req.body.myNewFullName;
		var email = req.body.myNewEmail;
		var affiliation = req.body.myNewAffiliation;
		var birthday = req.body.myNewBirthday;
		
		console.log("this is bday: " + birthday);
		// TODO - A new user should also declare an interest in at least two news categories.
		// array of interests, the first two are mandatory and a new user can optionally declare a maximum of five
		console.log("first int: " + req.body.myFirstInterest);	
		console.log("second int: " + req.body.mySecondInterest);
		var interests = [];
		interests.push(req.body.myFirstInterest);
		interests.push(req.body.mySecondInterest);
		
		if (req.body.myThirdInterest) {
			interests.push(req.body.myThirdInterest);
		}
		if (req.body.myFourthInterest) {
			interests.push(req.body.myFourthInterest);
		}
		if (req.body.myFifthInterest) {
			interests.push(req.body.myFifthInterest);
		}

		// attempt to create a new account with the requested username, password, full name, email, affiliation, birthday, and interests
		db.createAccount(newUser, newPass, fullName, email, affiliation, birthday, interests, function(err, data) {
			if (err) {
				// check for specific error from database call
				if (err == 4) {
					// account under the username already exists, redirect to login page
					res.redirect('/?message=' + 'Username_already_exists._Please_log_in.');
				} else {
					// handle error with database
					res.render('error.ejs');
				}
			} else {
				// new account successfully created, log in with new account and redirect to home page
				req.session.username = data;
				res.redirect('/home');
			}
		});
	}
};

// TODO
var getHome = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {

		// TODO - show the home page to the user

		// show the home page to the user
		db.getHomepagePosts(req.session.username, function(err, data) {
			if (err) {
				// TODO: Not sure how to handle error???
				//res.render('restaurants.ejs', {table: null, username: req.session.username, message: "Error in retrieving table"});
				res.render('error.ejs');
			} else {
				// pass the data from the table and render the home page to the user
				console.log(data);
				console.log(data[0].Items);
				res.render('home.ejs', {posts: data[0].Items, username: req.session.username, message: null});
			}
		});
	}
};

var getSettings = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// get the user's settings (current affiliation and news categories)
		db.getSettings(req.session.username, function(err, data) {
			if (err) {
				// error with querying table
				res.render('settings.ejs', {message: req.query.message, settings: null});
			} else {
				// TODO: Pass affiliation and news categories from "data.Items" (or other form of data) into settings.ejs
				// render the settings page, where a user can see and change their settings
				res.render('settings.ejs', {message: null, settings: data});
			}
		});
	}
}

//var updateSettings = function(req, res) {
	/* 
		TODO - Users should be able to change their affiliation after the account has been created, and
		they should be able to change the news categories they are interested in. Changes to these fields should
		result in an automatic status update (“Alice is now interested in Quantum Physics”). They should also be
		able to change their email and their password, without a status update.
	*/

	// Automatic status update - changes to affiliation, news categories
	// No status update - changes to email, password
//}

var updateEmail = function(req, res) {
	// get the user's inputted old email and new email
	var oldEmail = req.body.myOldEmail;
	var newEmail = req.body.myNewEmail;
	
	// query database for the user's actual old email
	db.changeEmail(oldEmail, newEmail, function(err, data) {
		if (err) {
			// error with querying database
			res.redirect('/settings/?message=' + 'database-error');
		} else {
			// redirect to the settings page, email successfully updated
			res.redirect('/settings');
		}
	});
}

var updatePassword = function(req, res) {
	// get the user's inputted old password and new password
	var oldPass = req.body.myOldPassword;
	var newPass = req.body.myNewPassword;
	
	// query database for the user's actual old password
	db.changePassword(oldPass, newPass, function(err, data) {
		if (err) {
			// error with querying database
			res.redirect('/settings/?message=' + 'database-error');
		} else {
			// redirect to the settings page, password successfully updated
			res.redirect('/settings');
		}
	});
}

var updateAffiliation = function(req, res) {
	// get the user's inputted old affiliation and new affiliation
	var oldAffiliation = req.body.myOldAffiliation;
	var newAffiliation = req.body.myNewAffiliation;

	// query database for the user's actual old affiliation
	db.getAffiliation(req.session.username, function(err1, data1) {
		if (err1) {
			// error with querying database
			res.redirect('/settings/?message=' + 'database-error');
		} else {
			if (data1.localeCompare(oldAffiliation) == 0) {
				// update the user's affiliation in the database
				db.changeAffiliation(req.session.username, newAffiliation, function(err2, data2) {
					if (err2) {
						// error with querying database
						res.redirect('/settings/?message=' + 'database-error');
					} else {
						// successfully changed affiliation
						// TODO: force a status update
						//res.render('settings.ejs', {message: "Affiliation updated successfully.", settings: data2});
						res.redirect('/settings');
					}
				});
			} else {
				// user's input does not match affiliation of user in database, fail to change affiliation
				res.redirect('/settings/?message=' + 'affiliation_does_not_match');
			}
		}
	});
}

var getWall = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// get the username of the wall to visit
		var wallToVisit = req.body.wallToVisit;

		db.getFriends(req.session.username, function(err, data) {
			if (err) {
				// TODO: error?
				res.render(error.ejs);
			} else {
				// render the wall depending on whether or not the user is friends with the user looking at the wall
				if (data.includes(wallToVisit)) {
					console.log(wallToVisit);
					res.render('wall.ejs', {user: wallToVisit, isFriend: true});
				} else {
					res.render('wall.ejs', {user: wallToVisit, isFriend: false});
				}
			}
		});

		//res.render('wall.ejs', {user: wallToVisit, friend: true});

		// redirect user to their wall, where they can post status updates
		//res.redirect('/wall?user=' + wallToVisit);
	}
}

var postToWall = function(req, res) {
	/*
		TODO - Each user should have a "wall" that contains posts and status updates in reverse chronological
		order. Each user should be able to post status updates ("Bob is going fishing") on their own wall, and they
		should be able to post on their friends’ walls as well.
	*/

	// get the parameters to make the new post
	var user = req.session.username;
	var content = req.body.content;
	var timestamp = req.body.timestamp;
	var hashtag = req.body.hashtag;
	var id = user.concat(timestamp);

	db.makePost(id, user, content, timestamp, hashtag, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// successfully made a new post
			// TODO: either do nothing (AJAX handles it?) or res.send
			//res.send(data);
			res.send("success");
		}
	});
}

var addNewFriend = function(req, res) {
	// get the user sending the friend request and the user receiving the friend request (respectively)
	var user = req.session.username;
	var userToFriend = req.body.userToFriend;
	var timestamp = req.body.timestamp;

	db.addFriend(user, userToFriend, timestamp, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// successfully added a friend
			// TODO: either do nothing (AJAX handles it?) or res.send
			res.send("success");
		}
	});
}

var deleteFriend = function(req, res) {
	// get the user sending the friend request and the user receiving the friend request (respectively)
	var user = req.session.username;
	var userToFriend = req.body.userToFriend;

	db.unfriend(user, userToFriend, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// successfully deleted a friend
			// TODO: either do nothing (AJAX handles it?) or res.send
			res.send("success");
		}
	});
}

var getHomePagePosts = function(req, res) {
	// send the data from the database to display up-to-date version of the home page to the user
	db.getHomepagePosts(req.session.username, function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.send(data);
		}
	});
}

var commentOnPost = function(req, res) {
	// get the user, comment content, post ID, and timestamp
	var user = req.session.username;
	var content = req.body.comment;
	// TODO: Figure out how to get ID and timestamp of a post from the comment field (ejs)
	//var id = req ...
	//var timestamp = req ...
	
	db.addComment(user, content, id, timestamp, function(err, data) {
		if (err) {
			res.render('error.ejs');
		} else {
			// TODO: ideally have the comment appear immediately, with no redirect
			res.send(data);
		}
	});
}

// TODO
var restaurantsList = function(req, res) {
	db.getRestaurants(function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.send(data.Items);
		}
	});
};

// TODO
var addRestaurant = function(req, res) {
	var name = req.body.newName;
	var latitude = req.body.newLatitude;
	var longitude = req.body.newLongitude;
	var description = req.body.newDescription;
	
	// add a new restaurant to the table
	db.addRestaurant(name, req.session.username, latitude, longitude, description, function(err, data) {
		if (err) {
			res.render('restaurants.ejs', {table: null, username: req.session.username, message: err});
		} else if (data) {
			// new restaurant successfully added, send the data
			res.send(data);
		} else {
			// restaurant under this name already exists in table, send error message
			res.send({
			    error: "Error: Restaurant already exists, please add a new restaurant."
			});
		}
	});
};

// TODO
var deleteRestaurant = function(req, res) {
	var name = req.body.name;
	
	// delete a restaurant from the table
	db.deleteRestaurant(name, function(err, data) {
		if (err) {
			res.render('restaurants.ejs', {table: null, username: req.session.username, message: err});
		} else {
			res.render('restaurants.ejs', {table: data.Items, username: req.session.username, message: null});
		}
	});
};

var logout = function(req, res) {
	// invoke db method to set the status of user to logged off
	db.logout(req.session.username, function(err, data) {
		if (err) {
			res.render('error.ejs');
		} else {
			// reset the session's username to undefined to indicate that the user has logged out, redirect to the login page
			req.session.username = undefined;
			res.redirect('/');
		}
	});
};

// Don't forget to add any new functions to this class, so app.js can call them. 
// (The name before the colon is the name you'd use for the function in app.js; 
// the name after the colon is the name the method has here, in this file.)

var routes = {
	get_login: getLogin,
	check_login: checkLogin,
	sign_up: signUp,
	create_account: createAccount,

	get_home: getHome,
	get_settings: getSettings,
	update_email: updateEmail,
	update_password: updatePassword,
	update_affiliation: updateAffiliation,

	// TODO: Wall is not so simple

	get_wall: getWall,
	post_to_wall: postToWall,

	add_friend: addNewFriend,
	delete_friend: deleteFriend,

	home_page_posts: getHomePagePosts,

	comment_on_post: commentOnPost,

	// TODO: Below :(

	log_out: logout,

  add_restaurant: addRestaurant,
  delete_restaurant: deleteRestaurant,
  
  restaurantsList: restaurantsList
};

module.exports = routes;