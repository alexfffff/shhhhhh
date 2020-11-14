var db = require('../models/database.js');

// TODO The code for your own routes should go here

var getMain = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot view the login page
		res.redirect('/restaurants');
	} else {
		res.render('main.ejs', {message: null});
	}
};

var checkLogin = function(req, res) {
	var username = req.body.myUsername;
	var password = req.body.myPassword;
	
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
		// users logged in cannot view the sign up page
		res.redirect('/restaurants');
	} else {
		res.render('signup.ejs', {message: null});
	}
};

var createAccount = function(req, res) {
	if (req.session.username !== undefined) {
		// users logged in cannot attempt to create an account
		res.redirect('/restaurants');
	} else {
		var newUser = req.body.myNewUsername;
		var newPass = req.body.myNewPassword;
		var fullName = req.body.myFullName;
		
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

var getRestaurants = function(req, res) {
	// check if user is logged in
	if (req.session.username === undefined) {
		// redirect to the home page if not logged in
		res.redirect('/');
	} else {
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

var restaurantsList = function(req, res) {
	db.getRestaurants(function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.send(data.Items);
		}
	});
};

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
	// reset the session's username to undefined to indicate that the user has logged out, redirect to main
	req.session.username = undefined;
	res.redirect('/');
};

// TODO Don't forget to add any new functions to this class, so app.js can call them. 
// (The name before the colon is the name you'd use for the function in app.js; 
// the name after the colon is the name the method has here, in this file.)

var routes = { 
  get_main: getMain,
  check_login: checkLogin,
  sign_up: signUp,
  create_account: createAccount,
  get_restaurants: getRestaurants,
  add_restaurant: addRestaurant,
  delete_restaurant: deleteRestaurant,
  log_out: logout,
  restaurantsList: restaurantsList
};

module.exports = routes;
