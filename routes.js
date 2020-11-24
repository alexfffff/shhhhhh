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

	// TODO - implement login check with username and password
	
	db.loginCheck(username, password, function(err, data) {
		if (err) {
			// TODO: Handle error with db (?)
			res.render('main.ejs', {message: err});
		} else if (data) {
			// set the session's username to reflect login, and redirect user to the home page
			req.session.username = data;
			res.redirect('/home');
		} else {
			// TODO: Handle error with invalid login
			// login failed due to non-existent username or incorrect password
			res.render('main.ejs', {message: 'Username or password invalid. Please try again.'});
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
		
		// TODO - A new user should also declare an interest in at least two news categories.
		var interests = req.body.TODO; // how to store this ???

		// attempt to create a new account with the requested username, password, full name, email, affiliation, birthday, and interests
		db.createAccount(newUser, newPass, fullName, email, affiliation, birthday, interests, function(err, data) {
			if (err) {
				// TODO: Not sure how to handle error with db call?
				res.render('signup.ejs', {message: err});
			} else if (data) {
				// new account successfully created, log in with new account and redirect to home page
				req.session.username = data;
				res.redirect('/home');
			} else {
				// TODO
				// account under the username already exists in table, re-prompt for sign up
				res.render('signup.ejs', {message: 'Username already exists, please try a different username.'});
			}
		});
	}
};

// TODO
var getHome = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/login');
	} else {

		// TODO - show the home page to the user

		// show the home page to the user
		db.getHomepagePosts(req.session.username, function(err, data) {
			if (err) {
				res.render('restaurants.ejs', {table: null, username: req.session.username, message: "Error in retrieving table"});
			} else {
				// pass the array of Items from data to the table and render the page to the user
				res.render('restaurants.ejs', {table: data.Items, username: req.session.username, message: null});
			}
		});
	}
};

var getSettings = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the login page if not logged in
		res.redirect('/login');
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
		res.redirect('/login');
	} else {
		// redirect user to their wall, where they can post status updates
		res.redirect('/wall');
	}
}

var updateWall = function(req, res) {
	/*
		TODO - Each user should have a “wall” that contains posts and status updates in reverse chronological
		order. Each user should be able to post status updates (“Bob is going fishing”) on their own wall, and they
		should be able to post on their friends’ walls as well.
	*/
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

// TODO: Account for logged in / logged out status of user, need to incorporate the db method here
var logout = function(req, res) {
	// reset the session's username to undefined to indicate that the user has logged out, redirect to the login page
	req.session.username = undefined;
	res.redirect('/login');
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

	// TODO: Wall is not so simple...

	get_wall: getWall,
	update_wall: updateWall,

	log_out: logout,

  add_restaurant: addRestaurant,
  delete_restaurant: deleteRestaurant,
  
  restaurantsList: restaurantsList
};

module.exports = routes;