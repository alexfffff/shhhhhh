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
	var email = req.body.myEmail;

	// TODO - implement login check with username, password, and email
	
	db.loginCheck(username, password, function(err, data) {
		if (err) {
			res.render('main.ejs', {message: err});
		} else if (data) {
			// set the session's username to reflect login, and redirect user to the restaurants page
			req.session.username = data;
			res.redirect('/restaurants');
		} else {
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

		// attempt to create a new account with the requested username, password, and full name
		db.createAccount(newUser, newPass, fullName, function(err, data) {
			if (err) {
				res.render('signup.ejs', {message: err});
			} else if (data) {
				// new account successfully created, log in with new account and redirect to see restaurants
				req.session.username = data;
				res.redirect('/restaurants');
			} else {
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

		// show the restaurants page to the user
		db.getRestaurants(function(err, data) {
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
		// render the settings page, where a user can see and change their settings
		res.render('settings.ejs', {message: null});
	}
}

var updateSettings = function(req, res) {
	/* 
		TODO - Users should be able to change their affiliation after the account has been created, and
		they should be able to change the news categories they are interested in. Changes to these fields should
		result in an automatic status update (“Alice is now interested in Quantum Physics”). They should also be
		able to change their email and their password, without a status update.
	*/

	// Automatic status update - changes to affiliation, news categories
	// No status update - changes to email, password
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
	update_settings: updateSettings,
	get_wall: getWall,
	update_wall: updateWall,

	log_out: logout,

  add_restaurant: addRestaurant,
  delete_restaurant: deleteRestaurant,
  
  restaurantsList: restaurantsList
};

module.exports = routes;
