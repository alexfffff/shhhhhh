const { time } = require('console');
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
	console.log("username is: " + username);
	console.log("password is: " + password);
	
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

		// required interests, the first two are mandatory
		var interest1 = req.body.myFirstInterest;
		var interest2 = req.body.mySecondInterest;

		// check that the required interests are unique first
		if (interest1 === interest2) {
			res.redirect('/signup/?message=' + 'Must_choose_at_least_two_unique_interests');
		}

		// use Set to ensure that all other interests are unique (a new user can optionally declare a maximum of five)
		let interestSet = new Set();
		interestSet.add(interest1);
		interestSet.add(interest2);
		if (req.body.myThirdInterest) {
			interestSet.add(req.body.myThirdInterest);
		}
		if (req.body.myFourthInterest) {
			interestSet.add(req.body.myFourthInterest);
		}
		if (req.body.myFifthInterest) {
			interestSet.add(req.body.myFifthInterest);
		}

		// array of interests built from the Set
		var interests = [];
		for (let i of interestSet) {
			interests.push(i);
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

var getHome = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// show only the most recent posts within the past hour
		var startTime = Date.now() - 86400000; // subtracts 1 day (in milliseconds) from current time
		var endTime = Date.now();

		// show the home page to the user
		db.getHomepagePosts(req.session.username, startTime, endTime, function(err, data) {
			if (err) {
				// handle error with database
				res.render('error.ejs');
			} else {
				var allPosts = [];
				
				// iterate through all posts from the database
				for (let i = 0; i < data.length; i++) {
					allPosts.push(data[i].Items);
				}
				
				// POSTS ARE CURRENTLY UNSORTED

				// TODO - no idea wtf this is, need to debug (!!!)
				console.log("data");
				console.log(data);

				console.log("json stringify data");
				console.log(JSON.stringify(data));

				console.log("data items");
				console.log(data.Items);

				console.log("data 0 items");
				console.log(data[0].Items);
				
				console.log("all posts");
				console.log(allPosts);

				// pass the data from the table and render the home page to the user
				res.render('home.ejs', {posts: allPosts, username: req.session.username, message: null});
			}
		});
	}
};

// get the user's affiliation and news interests to display on the settings page
var getSettings = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// get the user's current affiliation
		db.getAffiliation(req.session.username, function(err1, data1) {
			if (err1) {
				// error with querying database
				res.render('settings.ejs', {message: err1, currAffiliation: null, currInterests: null, success: null, username: req.session.username});
			} else {
				// store the current affiliation
				var affiliation = data1;

				// get the user's current interests
				db.getInterests(req.session.username, function(err2, data2) {
					if (err2) {
						// error with querying database
						res.render('settings.ejs', {message: err2, currAffiliation: null, currInterests: null, success: null, username: req.session.username});
					} else {
						// store the current interests
						var interests = data2;

						// render the settings page, where a user can see and change their settings (only affiliation and interests displayed)
						res.render('settings.ejs', {message: null, currAffiliation: affiliation, currInterests: interests, success: null, username: req.session.username});
					}
				});
			}
		});
	}
};

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
	db.changeEmail(req.session.username, oldEmail, newEmail, function(err, data) {
		if (err) {
			// check for the type of error
			if (err == 8) {
				// user's old email does not match, or their new email is the same as their old one
				res.redirect('/settings/?message=' + 'Please_enter_the_correct_old_email_and_a_valid_new_email');
			} else {
				// error with querying database
				res.redirect('/settings/?message=' + 'Database_error');
			}
		} else {
			// redirect to the settings page, email successfully updated
			res.redirect('/settings?message=' + 'Email_successfully_updated' + '&success=true');
		}
	});
};

var updatePassword = function(req, res) {
	// get the user's inputted old password and new password
	var oldPass = req.body.myOldPassword;
	var newPass = req.body.myNewPassword;
	
	// query database for the user's actual old password
	db.changePassword(req.session.username, oldPass, newPass, function(err, data) {
		if (err) {
			// check for the type of error
			if (err == 7) {
				// user's new password is the same as their old one
				res.redirect('/settings/?message=' + 'Please_enter_a_different_new_password');
			} else if (err == 11) {
				// user's inputted old password does not match their actual old password
				res.redirect('/settings/?message=' + 'Password_does_not_match._Please_enter_the_correct_old_password');
			} else {
				// error with querying database
				res.redirect('/settings/?message=' + 'Database_error');
			}
		} else {
			// redirect to the settings page, password successfully updated
			res.redirect('/settings?message=' + 'Password_successfully_updated' + '&success=true');
		}
	});
};

var updateAffiliation = function(req, res) {
	// get the user's inputted old affiliation and new affiliation
	var oldAffiliation = req.body.myOldAffiliation;
	var newAffiliation = req.body.myNewAffiliation;

	// old and new affiliations must be different
	if (oldAffiliation === newAffiliation) {
		res.redirect('/settings/?message=' + 'Enter_different_affiliations');
	}

	// query database for the user's actual old affiliation
	db.getAffiliation(req.session.username, function(err1, data1) {
		if (err1) {
			// error with querying database
			res.redirect('/settings/?message=' + 'Database_error');
		} else {
			if (data1.localeCompare(oldAffiliation) == 0) {
				// update the user's affiliation in the database (force a status update)
				var timestamp = Date.now();
				var poster = req.session.username;
				var id = poster.concat(timestamp);
				db.changeAffiliation(poster, newAffiliation, timestamp, id, function(err2, data2) {
					if (err2) {
						// error with querying database
						res.redirect('/settings/?message=' + 'Database_error');
					} else {
						// successfully changed affiliation
						res.redirect('/settings?message=' + 'Affiliation_successfully_updated' + '&success=true');
					}
				});
			} else {
				// user's input does not match affiliation of user in database, fail to change affiliation
				res.redirect('/settings/?message=' + 'Old_affiliation_does_not_match');
			}
		}
	});
};

var addNewInterest = function(req, res) {
	// get the user's selected new interest and the timestamp of submission
	var newInterest = req.body.myNewInterest;
	var timestamp = Date.now();
	var poster = req.session.username;
	var id = poster.concat(timestamp);

	// attempt to add the new interest to the user's interests (force a status update)
	db.addInterest(poster, newInterest, timestamp, id, function(err, data) {
		if (err) {
			// check for the type of error
			if (err == 6) {
				// user attempted to add an interest that they are already interested in
				res.redirect('/settings/?message=' + 'Already_interested_in_this._Please_add_a_new_interest.');
			} else {
				// error with querying database
				res.redirect('/settings/?message=' + 'Database_error');
			}
		} else {
			// successfully added an interest
			res.redirect('/settings?message=' + 'Interest_successfully_added' + '&success=true');
		}
	});
};

var removeOldInterest = function(req, res) {
	// get the user's selected old interest
	var oldInterest = req.body.myOldInterest;

	// attempt to remove the old interest from the user's interests
	db.removeInterest(req.session.username, oldInterest, function(err, data) {
		if (err) {
			// check for the type of error
			if (err == 9) {
				// user attempted to remove an interest when they have two interests (two interests is the minimum number allowed)
				res.redirect('/settings/?message=' + 'Must_have_at_least_two_interests.');
			} else {
				// error with querying database
				res.redirect('/settings/?message=' + 'Database_error');
			}
		} else {
			// successfully removed an interest
			// TODO: force a status update
			res.redirect('/settings?message=' + 'Interest_successfully_removed' + '&success=true');
		}
	});
};

var getWall = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// get the username of the wall to visit
		var wallToVisit = req.body.wallToVisit;
		var posts;

		console.log("looking at wall of: " + wallToVisit);

		// check if user clicked on their own page
		if (wallToVisit === req.session.username) {
			// get the posts to display on the wall
			db.getUserWall(wallToVisit, function(err1, data1) {
				if (err1) {
					// handle database error
					res.render('error.ejs');
				} else {
					posts = data1;

					// render the user's own page if they click on their own page
					res.render('wall.ejs', {user: wallToVisit, isFriend: false, isSelf: true, username: req.session.username, wallPosts: posts});
				}
			});
		} else {
			// query database for user's friends
			db.getFriends(req.session.username, function(err2, data2) {
				if (err2) {
					// handle database error
					res.render('error.ejs');
				} else {
					// render the wall depending on whether or not the user is friends with the user looking at the wall
					if (data2.includes(wallToVisit)) {
						// get the posts to display on the user's friend's wall
						db.getUserWall(wallToVisit, function(err3, data3) {
							if (err3) {
								// handle database error
								res.render('error.ejs');
							} else {
								posts = data3;

								// render the user's friend's page and the posts on it
								res.render('wall.ejs', {user: wallToVisit, isFriend: true, isSelf: false, username: req.session.username, wallPosts: posts});
							}
						});
					} else {
						// get the posts to display on the wall of someone who is not friends with the user
						db.getUserWall(wallToVisit, function(err4, data4) {
							if (err4) {
								// handle database error
								res.render('error.ejs');
							} else {
								posts = data4;

								// render the non-friend page and the posts on it
								res.render('wall.ejs', {user: wallToVisit, isFriend: false, isSelf: false, username: req.session.username, wallPosts: posts});
							}
						});
					}
				}
			});
		}
	}
};

var postToWall = function(req, res) {
	/*
		TODO - Each user should have a "wall" that contains posts and status updates in reverse chronological
		order. Each user should be able to post status updates ("Bob is going fishing") on their own wall, and they
		should be able to post on their friends’ walls as well.
	*/

	// get the parameters to make the new post
	var poster = req.session.username;
	var content = req.body.content;
	var timestamp = Date.now();

	// generate the hashtags array from the post content
	var hashtags = [];
	// match alphanumeric characters after a hashtag, assumes that no user posts nested hashtags
	var matches = content.match(/#([A-Z0-9]|[0-9A-Z])+( |$)/gi);
	if (matches !== null) {
		// get rid of whitespaces and # symbols before sending array to the database
		for (var word of matches) {
			hashtags.push(word.replace(/\s+/g, '').replace('#', ''));
		}
	}

	// create the post ID from the poster and timestamp
	var id = poster.concat(timestamp);

	// the username of the current wall that the poster is looking at
	var username = req.body.currentWall;

	// separates posts on a user's own wall and posts on other users' walls
	if (poster === username) {
		db.makePost(poster, id, content, timestamp, hashtags, function(err, data) {
			if (err) {
				// error with querying database
				res.render('error.ejs');
			} else {
				// successfully made a new post on user's own wall
				// TODO: either do nothing (AJAX handles it?) or res.send
				//res.send(data);
				// I DON'T KNOW WHAT TO SEND HERE
				res.send("success");
			}
		});
	} else {
		// user makes a post on someone else's wall
		db.makeWallPost(username, poster, id, content, timestamp, hashtags, function(err, data) {
			if (err) {
				// error with querying database
				res.render('error.ejs');
			} else {
				// successfully made a new post on someone else's wall
				// TODO: either do nothing (AJAX handles it?) or res.send
				//res.send(data);
				// I DON'T KNOW WHAT TO SEND HERE
				res.send("success");
			}
		});
	}
};

var addNewFriend = function(req, res) {
	// get the user sending the friend request and the user receiving the friend request (respectively)
	var user = req.session.username;
	var userToFriend = req.body.userToFriend;
	var timestamp = Date.now();
	var id = user.concat(timestamp);

	db.addFriend(user, userToFriend, timestamp, id, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// successfully added a friend
			// TODO: either do nothing (AJAX handles it?) or res.send
			res.send("success");
		}
	});
};

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
};

var getHomePagePosts = function(req, res) {
	// send the data from the database to display up-to-date version of the home page to the user
	var startTime = Date.now() - 300000; // show new posts from the last 5 minutes (in milliseconds)
	var endTime = Date.now();

	db.getHomepagePosts(req.session.username, startTime, endTime, function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.send(data);
		}
	});
};

var commentOnPost = function(req, res) {
	// get the user, comment content, post ID, and timestamp
	var user = req.session.username;
	var content = req.body.commentContent;
	var timestamp = Date.now();
	var id = user.concat(timestamp);

	// TODO - THIS IS NOT FINISHED YET AND I DON'T KNOW WHAT TO RES.SEND

	db.addComment(user, content, id, timestamp, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// TODO: ideally have the comment appear immediately, with no redirect
			res.send(data);
		}
	});
};

// TODO - get rid of this later
var restaurantsList = function(req, res) {
	db.getRestaurants(function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.send(data.Items);
		}
	});
};

// TODO - get rid of this later
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

// TODO - get rid of this later
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

// TODO - news
var getNews = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// get the user's interests
		db.getInterests(req.session.username, function(err1, data1) {
			if (err1) {
				// handle error with querying database
				res.render('error.ejs');
			} else {
				var myInterests = data1;
				
				// TODO: change later
				var myArticles = [];
	
				// TODO: Call some db method that returns the articles ??? data1 is array of interests
				// render the news recommendations page for this user based on their interests
				res.render('news.ejs', {username: req.session.username, interests: myInterests, articles: myArticles});
			}
		});
	}
};

// TODO - news
var searchNews = function(req, res) {
	// TODO - search news
	var keyword = req.body.keyword;

	console.log("YOU SEARCHED FOR: " + keyword);

	// call db method
	// temporarily does nothing
	res.render('/newsresults.ejs', {username: req.session.username, articles: null}); // not sure about fields for ejs, need "articles" though
}

var newsFeedUpdate = function(req, res) {
	// send the data from the database to display up-to-date version of the news page to the user
	// TODO: CHANGE THIS DB METHOD TO WHATEVER RETURNS THE ARTICLES EVERY HOUR
	db.getHomepagePosts(req.session.username, function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.send(data);
		}
	});
};

var logout = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
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
	}
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
	add_interest: addNewInterest,
	remove_interest: removeOldInterest,

	// TODO: Wall is not so simple

	get_wall: getWall,
	post_to_wall: postToWall,

	add_friend: addNewFriend,
	delete_friend: deleteFriend,

	home_page_posts: getHomePagePosts,

	// TODO: Comment and other stuff below

	comment_on_post: commentOnPost,

	// TODO: News

	get_news: getNews,
	search_news: searchNews,

	news_feed_update: newsFeedUpdate,

	log_out: logout,

	// IGNORE

  add_restaurant: addRestaurant,
  delete_restaurant: deleteRestaurant,
  
  restaurantsList: restaurantsList
};

module.exports = routes;