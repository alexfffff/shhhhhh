const { time } = require('console');
var db = require('../models/database.js');

// helper function for sorting posts in reverse chronological order
function sortPosts(data) {
	var allPosts = [];
	
	// iterate through all posts from the database
	for (let i = 0; i < data.length; i++) {
		allPosts.push(data[i].Items);
	}
	
	// map from timestamp to a post
	let timestampToPost = new Map();
	
	// add every (non-empty) list of posts to the map, keyed by timestamp
	for (let j = 0; j < allPosts.length; j++) {
		let currPostList = allPosts[j];
		if (currPostList.length != 0) {
			// map every individual post (in each list of posts) by timestamp
			for (let k = 0; k < currPostList.length; k++) {
				timestampToPost.set(currPostList[k].timestamp, currPostList[k]);
			}
		}
	}
	
	// get array of timestamps and sort them, more recent timestamps appear first
	let timestamps = Array.from(timestampToPost.keys());
	timestamps.sort();
	timestamps.reverse();
	
	// reset all posts and push them into the array in sorted order
	allPosts = [];
	for (let t = 0; t < timestamps.length; t++) {
		allPosts.push(timestampToPost.get(timestamps[t]));
	}
	
	// return the sorted posts from the data
	return allPosts;
}

var getLogin = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot view the login page
		res.redirect('/home');
	} else {
		res.render('main.ejs', {message: req.query.message});
	}
};

var checkLogin = function(req, res) {
	var username = req.body.myUsername;
	var password = req.body.myPassword;
	
	db.loginCheck(username, password, function(err, data) {
		if (err) {
			// check for specific error from database call
			if (err == 5) {
				// login failed due to non-existent username or incorrect password (same error for security purposes)
				res.redirect('/?message=' + 'Username_or_password_invalid._Please_try_again.');
			} else {
				// handle error with database
				console.log("error with checklogin");
				res.render('error.ejs');
			}
		} else {
			// set the session's username and full name to reflect login, and redirect user to the home page
			req.session.username = username;
			req.session.fullname = data.fullname;
			res.redirect('/home');
		}
	});
};

var signUp = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot view the sign up page, redirect to home page
		res.redirect('/home');
	} else {
		res.render('signup.ejs');
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
		
		// trim any excess whitespace at the end of the full name and affiliation
		fullName = fullName.trim();
		affiliation = affiliation.trim();

		// required interests, the first two are mandatory
		var interest1 = req.body.myFirstInterest;
		var interest2 = req.body.mySecondInterest;

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
				req.session.username = newUser;
				req.session.fullname = fullName;
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
		// show only the most recent posts within the past week
		var startTime = Date.now() - 604800000; // subtracts 1 week (in milliseconds) from current time
		var endTime = Date.now();

		// show the home page to the user
		db.getHomepagePosts(req.session.username, startTime, endTime, function(err1, data1) {
			if (err1) {
				// handle error with database
				res.render('error.ejs');
			} else {
				// sort the posts returned from the database
				var allPosts = sortPosts(data1);
				
				// get all of the post IDs
				var allPostIDs = [];
				for (let p of allPosts) {
					allPostIDs.push(p.postID);
				}
				
				// get all of the comments for each post
				db.getPostComments(allPostIDs, function(err2, data2) {
					if (err2) {
						// handle error with database
						res.render('error.ejs');
					} else {
						var allComments = data2;
						
						var validComments = [];

						for (let c of allComments) {
							if (c.Count > 0) {
								validComments.push(c.Items);
							}
						}

						/*console.log("data2: ");
						console.log(data2);

						console.log("All comments look like this: ");
						console.log(validComments);

						console.log("All posts look like this: ");
						console.log(allPosts);*/

						var postsMap = new Map();
						for (let p of allPosts) {
							postsMap.set(p.postID, p);
						}

						
						// pass the data from the table and render the home page to the user
						res.render('home.ejs', {
							posts: postsMap, 
							comments: validComments, 
							username: req.session.username,
							fullname: req.session.fullname
						});
					}
				});
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
				// handle error with database
				res.render('error.ejs');
			} else {
				// store the current affiliation
				var affiliation = data1;

				// get the user's current interests
				db.getInterests(req.session.username, function(err2, data2) {
					if (err2) {
						// handle error with database
						res.render('error.ejs');
					} else {
						// store the current interests
						var interests = data2;

						// render the settings page, where a user can see and change their settings (only display interests)
						res.render('settings.ejs', {
							message: req.query.message, 
							currInterests: interests, 
							success: req.query.success, 
							username: req.session.username
						});
					}
				});
			}
		});
	}
};

var updateEmail = function(req, res) {
	// get the user's inputted old email and new email
	var oldEmail = req.body.myOldEmail;
	var newEmail = req.body.myNewEmail;
	
	// old and new emails must be different
	if (oldEmail === newEmail) {
		res.redirect('/settings?message=' + 
				'Old_email_and_new_email_fields_must_differ._Please_enter_different_emails');
	} else {
		// query database for the user's actual old email
		db.changeEmail(req.session.username, oldEmail, newEmail, function(err, data) {
			if (err) {
				// check for the type of error
				if (err == 8) {
					// user's old email does not match, or their new email is the same as their old one
					res.redirect('/settings?message=' + 'Please_enter_the_correct_old_email_and_a_valid_new_email');
				} else {
					// error with querying database
					res.redirect('/settings?message=' + 'Database_error');
				}
			} else {
				// redirect to the settings page, email successfully updated
				res.redirect('/settings?message=' + 'Email_successfully_updated' + '&success=true');
			}
		});
	}
};

var updatePassword = function(req, res) {
	// get the user's inputted old password and new password
	var oldPass = req.body.myOldPassword;
	var newPass = req.body.myNewPassword;
	
	// old and new passwords must be different
	if (oldPass === newPass) {
		res.redirect('/settings?message=' + 
				'Old_password_and_new_password_fields_must_differ._Please_enter_different_passwords');
	} else {
		// query database for the user's actual old password
		db.changePassword(req.session.username, oldPass, newPass, function(err, data) {
			if (err) {
				// check for the type of error
				if (err == 7) {
					// user's new password is the same as their old one
					res.redirect('/settings?message=' + 'Please_enter_a_different_new_password');
				} else if (err == 11) {
					// user's inputted old password does not match their actual old password
					res.redirect('/settings?message=' + 'Password_does_not_match._Please_enter_the_correct_old_password');
				} else {
					// error with querying database
					res.redirect('/settings?message=' + 'Database_error');
				}
			} else {
				// redirect to the settings page, password successfully updated
				res.redirect('/settings?message=' + 'Password_successfully_updated' + '&success=true');
			}
		});
	}
};

var updateAffiliation = function(req, res) {
	// get the user's inputted old affiliation and new affiliation
	var oldAffiliation = req.body.myOldAffiliation;
	var newAffiliation = req.body.myNewAffiliation;
	
	// trim any excess whitespace at the end of the affiliations
	oldAffiliation = oldAffiliation.trim();
	newAffiliation = newAffiliation.trim();

	// old and new affiliations must be different
	if (oldAffiliation === newAffiliation) {
		res.redirect('/settings?message=' + 
				'Old_affiliation_and_new_affiliation_fields_must_differ._Please_enter_different_affiliations');
	} else {
		// query database for the user's actual old affiliation
		db.getAffiliation(req.session.username, function(err1, data1) {
			if (err1) {
				// error with querying database
				res.redirect('/settings?message=' + 'Database_error');
			} else {
				if (data1.localeCompare(oldAffiliation) == 0) {
					// update the user's affiliation in the database (force a status update)
					var timestamp = Date.now();
					var poster = req.session.username;
					var id = poster.concat(timestamp);
					db.changeAffiliation(poster, newAffiliation, timestamp, id, function(err2, data2) {
						if (err2) {
							// error with querying database
							res.redirect('/settings?message=' + 'Database_error');
						} else {
							// successfully changed affiliation
							res.redirect('/settings?message=' + 'Affiliation_successfully_updated' + '&success=true');
						}
					});
				} else {
					// user's input does not match affiliation of user in database, fail to change affiliation
					res.redirect('/settings?message=' + 'Old_affiliation_does_not_match');
				}
			}
		});
	}
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
				res.redirect('/settings?message=' + 'Already_interested_in_this._Please_add_a_new_interest');
			} else {
				// error with querying database
				res.redirect('/settings?message=' + 'Database_error');
			}
		} else {
			// successfully added an interest
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
			res.redirect('/settings?message=' + 'Interest_successfully_added' + '&success=true');
		}
	});
};

var removeOldInterest = function(req, res) {
	// get the user's selected old interest
	var oldInterest = req.body.myOldInterest;
	var timestamp = Date.now();
	var poster = req.session.username;
	var id = poster.concat(timestamp);

	// attempt to remove the old interest from the user's interests
	db.removeInterest(poster, oldInterest, timestamp, id, function(err, data) {
		if (err) {
			// check for the type of error
			if (err == 9) {
				// user attempted to remove an interest when they have two interests (two interests is the minimum number allowed)
				res.redirect('/settings?message=' + 'Must_have_at_least_two_interests');
			} else {
				// error with querying database
				res.redirect('/settings?message=' + 'Database_error');
			}
		} else {
			// successfully removed an interest (forces a status update)
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
		var wallToVisit = req.query.wallToVisit;
		var posts;
		var comments;
		var allPostIDs = [];
		
		// send user to their own wall if the URL parameter is missing
		if (!wallToVisit) {
			wallToVisit = req.session.username;
		}
		
		// TODO - TESTING URL ... use /wall?wallToVisit=
		console.log("Looking at wall of: " + wallToVisit);

		// check if user clicked on their own page
		if (wallToVisit === req.session.username) {
			// get the posts to display on the wall
			db.getUserWall(wallToVisit, function(err1, data1) {
				if (err1) {
					// handle database error
					res.render('error.ejs');
				} else {
					posts = sortPosts(data1);
					
					console.log("Looking at my own wall...");
					
					// get all of the post IDs

					var postsMap = new Map();
					for (let p of posts) {
						allPostIDs.push(p.postID);
						postsMap.set(p.postID, p);
					}

					console.log("postsMap looks like:");
					console.log(postsMap);
					
					// get all of the comments for each post
					db.getPostComments(allPostIDs, function(err1b, data1b) {
						if (err1b) {
							// handle error with database
							res.render('error.ejs');
						} else {
							comments = data1b;

							var validComments = [];

							for (let c of comments) {
								if (c.Count > 0) {
									validComments.push(c.Items);
								}
							}
							
							// render the user's own page if they click on their own page
							res.render('wall.ejs', {
								user: wallToVisit, 
								isFriend: false, 
								isSelf: true, 
								username: req.session.username, 
								wallPosts: postsMap, 
								wallComments: validComments,
								wallFullName: req.session.fullname
							});
						}
					});
				}
			});
		} else {
			// query database for user's friends
			db.getFriends(req.session.username, function(err2, data2) {
				if (err2) {
					// handle database error
					res.render('error.ejs');
				} else {
					// check if wall's owner is friends with the user looking at the wall
					var isMyFriend = false;
					for (let f of data2) {
						if (f.friendUsername === wallToVisit) {
							isMyFriend = true;
							break;
						}
					}
					
					// render the wall depending on whether or not the user is friends with the user looking at the wall
					if (isMyFriend) {
						// get the posts to display on the user's friend's wall
						db.getUserWall(wallToVisit, function(err3, data3) {
							if (err3) {
								// handle database error
								res.render('error.ejs');
							} else {
								posts = sortPosts(data3);
								
								console.log("Looking at a friend's wall...");
								
								var postsMap = new Map();
								// get all of the post IDs
								for (let p of posts) {
									allPostIDs.push(p.postID);
									postsMap.set(p.postID, p);
								}
								
								// get all of the comments for each post
								db.getPostComments(allPostIDs, function(err3b, data3b) {
									if (err3b) {
										// handle error with database
										res.render('error.ejs');
									} else {
										comments = data3b;

										var validComments = [];

										for (let c of comments) {
											if (c.Count > 0) {
												validComments.push(c.Items);
											}
										}

										db.getName(wallToVisit, function(err3c, data3c) {
											if (err3c) {
												// handle error with database
												res.render('error.ejs');
											} else {
												// render the user's friend's page and the posts on it
												res.render('wall.ejs', {
													user: wallToVisit, 
													isFriend: true, 
													isSelf: false, 
													username: req.session.username, 
													wallPosts: postsMap, 
													wallComments: validComments,
													wallFullName: data3c
												});
											}
										});
									}
								});
							}
						});
					} else {
						// get the posts to display on the wall of someone who is not friends with the user
						db.getUserWall(wallToVisit, function(err4, data4) {
							if (err4) {
								// handle database error
								res.render('error.ejs');
							} else {
								posts = sortPosts(data4);
								
								console.log("Looking at a non-friend's wall...");
								
								// get all of the post IDs
								var postsMap = new Map();
								// get all of the post IDs
								for (let p of posts) {
									allPostIDs.push(p.postID);
									postsMap.set(p.postID, p);
								}
								
								// get all of the comments for each post
								db.getPostComments(allPostIDs, function(err4b, data4b) {
									if (err4b) {
										// handle error with database
										res.render('error.ejs');
									} else {
										comments = data4b;

										var validComments = [];

										for (let c of comments) {
											if (c.Count > 0) {
												validComments.push(c.Items);
											}
										}

										db.getName(wallToVisit, function(err4c, data4c) {
											if (err4c) {
												// handle error with database
												res.render('error.ejs');
											} else {
												// render the non-friend page and the posts on it
												res.render('wall.ejs', {
													user: wallToVisit, 
													isFriend: false, 
													isSelf: false, 
													username: req.session.username, 
													wallPosts: postsMap, 
													wallComments: validComments,
													wallFullName: data4c
												});
											}
										});
									}
								});
							}
						});
					}
				}
			});
		}
	}
};

var postToWall = function(req, res) {
	// get the parameters to make the new post
	var posterID = req.session.username;
	var posterName = req.session.fullname;
	var content = req.body.content;
	var timestamp = Date.now();

	// generate the hashtags array from the post content
	var hashtags = [];
	// match alphanumeric characters after a hashtag, assumes that no user posts nested hashtags
	var matches = content.match(/#([A-Z0-9]|[0-9A-Z])+( |$)/gi);
	if (matches) {
		// get rid of whitespaces and # symbols before sending array to the database
		for (var word of matches) {
			hashtags.push(word.replace(/\s+/g, '').replace('#', ''));
		}
	}

	// create the post ID from the poster and timestamp
	var id = posterID.concat(timestamp);

	// the username of the current wall that the poster is looking at (extracted from URL)
	var userID = req.query.wallToVisit;
	
	// if URL parameter does not exist, user is looking at home page
	if (!userID) {
		// treat as if user was posting on their own wall
		userID = posterID;
	}

	// separates posts on a user's own wall and posts on other users' walls
	if (posterID === userID) {
		db.makePost(posterID, id, content, timestamp, hashtags, function(err1, data1) {
			if (err1) {
				// error with querying database
				res.render('error.ejs');
			} else {
				// successfully made a new post on user's own wall, sends the post information
				console.log("Successfully made post on my own wall");

				console.log("579: " + content);
				
				if (hashtags.length > 0) {
					res.send({
						userName: posterName, 
						content: content, 
						friend: false,
						postID: id, 
						userID: posterID,
						timestamp: timestamp, 
						hashtags: hashtags
					});
				} else {
					res.send({
						userName: posterName, 
						content: content, 
						friend: false,
						postID: id, 
						userID: posterID,
						timestamp: timestamp, 
					});
				}
				
			}
		});
	} else {
		// user makes a post on someone else's wall
		db.makeWallPost(userID, posterID, id, content, timestamp, hashtags, function(err2, data2) {
			if (err2) {
				// error with querying database
				res.render('error.ejs');
			} else {
				// successfully made a new post on someone else's wall, sends the post information
				console.log("Successfully made post on someone else's wall");
				res.send({
					wallsUser: userID, 
					posterID: posterID, 
					postID: id, 
					content: content, 
					timestamp: timestamp, 
					hashtags: hashtags
				});
			}
		});
	}
};

var addNewFriend = function(req, res) {
	// get the user sending the friend request and the user receiving the friend request (respectively)
	var user = req.session.username;
	var userToFriend = req.query.wallToVisit;
	var timestamp = Date.now();
	var id = user.concat(timestamp);

	db.addFriend(user, userToFriend, timestamp, id, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// successfully added a friend, redirect to new friend's page
			res.redirect('/wall?wallToVisit=' + userToFriend);
		}
	});
};

var deleteFriend = function(req, res) {
	// get the user sending the friend request and the user receiving the friend request (respectively)
	var user = req.session.username;
	var userToUnfriend = req.query.wallToVisit;

	console.log("user: " + user);
	console.log("userToUnfriend: " + userToUnfriend);

	db.unfriend(user, userToUnfriend, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// successfully deleted a friend, redirect to their page
			res.redirect('/wall?wallToVisit=' + userToUnfriend);
		}
	});
};

var showFriends = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// check if the URL has the user parameter
		if (!req.query.user) {
			// redirect to the home page if the URL has missing parameters
			res.redirect('/home');
		}
		// get the user's current list of friends
		db.getFriends(req.query.user, function(err, data) {
			if (err) {
				// error with querying database
				res.render('error.ejs');
			} else {				
				// render the friends page, where a user can see someone's friends
				res.render('friends.ejs', {friends: data, friendsOf: req.query.user, username: req.session.username});
			}
		});
	}
};

var getHomePagePosts = function(req, res) {
	// send the data from the database to display up-to-date version of the home page to the user
	var startTime = Date.now() - 5000; // show new posts from the last 5 seconds (in milliseconds)
	var endTime = Date.now();

	db.getHomepagePosts(req.session.username, startTime, endTime, function(err, data) {
		if (err) {
			// error with querying database
			res.render('error.ejs');
		} else {
			// sort the posts returned from the database
			var allPosts = sortPosts(data);
			
			// get all of the post IDs
			var allPostIDs = [];
			for (let p of allPosts) {
				allPostIDs.push(p.postID);
			}
			
			// get all of the comments for each post
			db.getPostComments(allPostIDs, function(err2, data2) {
				if (err2) {
					// handle error with database
					res.render('error.ejs');
				} else {
					var allComments = data2;
					
					console.log("AJAX SUCCESSFUL CALL every 5 seconds from routes");
					console.log("Sending the following posts (from the last 5 seconds) to home.ejs...");
					console.log(allPosts);
					console.log("Sending the following comments (from the last 5 seconds) to home.ejs...");
					console.log(allComments);
					console.log("Everything above successfully sent to home.ejs");
					
					// send the data (posts and comments)
					res.send({
						posts: allPosts, 
						comments: allComments
					})
				}
			});
		}
	});
};

var commentOnPost = function(req, res) {
	// get the user, comment content, and timestamp
	var user = req.session.username;
	var content = req.body.commentContent;
	var timestamp = Date.now();
	
	// get the postID, indicates which post is being commented on
	var postID = req.body.postID;
	console.log("postID: " + postID);
	
	// commentID is postID + commenter's username + timestamp of comment
	var commentID = postID.concat(user).concat(timestamp);
	console.log("commentID: " + commentID);

	db.addComment(commentID, user, content, postID, timestamp, function(err, data) {
		if (err) {
			// error with querying database
			console.log("addComment error with database");
			res.render('error.ejs');
		} else {
			// TODO: ideally have the comment appear immediately, with no redirect
			// successfully added a new comment, send the comment information
			res.send({
				commentID: commentID, 
				username: user, 
				comment: content, 
				postID: postID, 
				timestamp: timestamp
			});
		}
	});
};

// TODO - news, may need updating depending on database.js
var getNews = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/');
	} else {
		// get the user's news feed
		db.getArticleRecs(req.session.username, function(err, data) {
			if (err) {
				// handle error with querying database
				res.render('error.ejs');
			} else {
				var myArticles = data;
				
				// TODO: delete these print statements later
				console.log("recommended articles are");
				console.log(myArticles);
				
				// render the news recommendations page for this user based on their interests
				res.render('news.ejs', {username: req.session.username, articles: myArticles});
			}
		});
	}
};

// TODO - may need updating depending on database.js
var searchNews = function(req, res) {
	var keyword = req.body.keyword;

	// query the database with the keyword and username to get the articles
	db.newsSearch(keyword, req.session.username, function(err, data) {
		if (err) {
			// handle database error
			res.render('error.ejs');
		} else {
			// render the news search results page, and the resulting articles based on keyword
			res.render('newsresults.ejs', {
				username: req.session.username, 
				articles: data, 
				keyword: keyword
			});
		}
	});
}

// TODO - may need updating depending on database.js
var newsFeedUpdate = function(req, res) {
	// send the data from the database to display up-to-date version of the news page to the user
	db.getArticleRecs(req.session.username, function(err, data) {
		if (err) {
			// handle error with querying database
			res.render('error.ejs');
		} else {
			// send the data for the most updated news feed
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
		// invoke database method to set the status of user to logged off
		db.logout(req.session.username, function(err, data) {
			if (err) {
				res.render('error.ejs');
			} else {
				// reset the session's username and full name to undefined to indicate that the user has logged out
				req.session.username = undefined;
				req.session.fullname = undefined;
				
				// redirect to the login page
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
	
	get_friends: showFriends,

	add_friend: addNewFriend,
	delete_friend: deleteFriend,

	home_page_posts: getHomePagePosts,

	// TODO: Comment and other stuff below

	comment_on_post: commentOnPost,

	// TODO: News

	get_news: getNews,
	search_news: searchNews,

	news_feed_update: newsFeedUpdate,

	log_out: logout
};

module.exports = routes;