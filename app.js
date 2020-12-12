/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

var express = require('express');
var routes = require('./routes/routes.js');
const path = require('path');
const stemmer = require('stemmer');
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

// --- IGNORE THESE THREE ROUTES FOR NOW ---
app.post('/addrestaurant', routes.add_restaurant);
app.post('/deleterestaurant', routes.delete_restaurant);
app.get('/restaurantsList', routes.restaurantsList);

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

app.get('/postonwall', routes.get_login);
app.get('/commentonpost', routes.get_login);

app.get('/searchnews', routes.get_login);
app.get('/addfriend', routes.get_login);
app.get('/deletefriend', routes.get_login);

// IGNORE BELOW
app.get('/addrestaurant', routes.get_login);
app.get('/deleterestaurant', routes.get_login);

/* Run the server */

console.log('Author: Philip Kaw (ph163k8)');
app.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
