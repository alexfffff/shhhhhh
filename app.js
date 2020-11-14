/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

var express = require('express');
var routes = require('./routes/routes.js');
var app = express();
app.use(express.urlencoded());

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

app.get('/', routes.get_main);

// TODO You will need to replace these routes with the ones specified in the handout

app.post('/checklogin', routes.check_login);
app.get('/signup', routes.sign_up);
app.post('/createaccount', routes.create_account);

app.get('/restaurants', routes.get_restaurants);
app.post('/addrestaurant', routes.add_restaurant);
app.post('/deleterestaurant', routes.delete_restaurant);
app.get('/restaurantsList', routes.restaurantsList);

app.get('/logout', routes.log_out);

// define GET routes for users that try to break the website by accessing inaccessible URLs
app.get('/createaccount', routes.get_main);
app.get('/addrestaurant', routes.get_main);
app.get('/deleterestaurant', routes.get_main);

/* Run the server */

console.log('Author: Philip Kaw (ph163k8)');
app.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
