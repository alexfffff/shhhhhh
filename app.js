/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

var express = require('express');
var routes = require('./routes/routes.js');
const path = require('path');
var app = express();
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
app.post('/settings', routes.update_email);
app.post('/settings', routes.update_password);
app.post('/settings', routes.update_affiliation);
// TODO: Similar route for updating news categories

// TODO: Make different routes for when a user visits their own wall vs. visiting other user's walls? Temporary answer: NO

// wall page (get route to view the page, post route to post a status update)
app.get('/wall', routes.get_wall);
app.post('/wall', routes.post_to_wall);

// routes for adding and removing friends
app.post('/addfriend', routes.add_friend);
app.post('/deletefriend', routes.delete_friend);

// support dynamic content on the home page by updating it periodically (gets the list of posts to show on the home page)
app.get('/homepageposts', routes.home_page_posts);

// allow users to make comments on any post they can see (either their own post or a friend's post)
app.post('/wall', routes.comment_on_post);

// --- IGNORE THESE THREE ROUTES FOR NOW ---
app.post('/addrestaurant', routes.add_restaurant);
app.post('/deleterestaurant', routes.delete_restaurant);
app.get('/restaurantsList', routes.restaurantsList);

app.get('/logout', routes.log_out);

// define GET routes for users that try to break the website by accessing inaccessible URLs
app.get('/createaccount', routes.get_login);
app.get('/addrestaurant', routes.get_login);
app.get('/deleterestaurant', routes.get_login);

/* Run the server */

console.log('Author: Philip Kaw (ph163k8)');
app.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
