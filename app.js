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


//var express = require('express');
var bodyParser = require('body-parser')
//var morgan = require('morgan')
//var cookieParser = require('cookie-parser')
//var session = require('express-session')
var serveStatic = require('serve-static')
//var path = require('path')
//var app = express();
var db = require('./models/database.js');
var map = new Map()
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(morgan('combined'));
//app.use(cookieParser());
//app.use(session({secret: "secretSession"}));
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

//view visualizer
app.get('/graphof', function(req, res) {
	res.render('friendvisualizer.ejs');
});

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
               //console.log(item.friendUsername);
					let singleton  = []
					singleton.push(name)
					singleton.push(item.friendUsername)
					map.set(item.friendUsername,singleton)
					let freind = {}
					freind.name = item.friendUsername
					freind.id = item.friendUsername
					freind.children = []
					freind.data = []
					json.children.push(freind)
				} )
				res.send(json);
			}
			
	}); 
});

app.get('/getFriends/:user', function(req, res) {

   //console.log(req.params.user);
   let name = req.params.user
  let array = []
  array = array.concat(map.get(req.params.user));
  let aff = ""
  db.getAffiliation(array[0], function(err,data){
                 if (err){
                    console.log("rip this shoudln't be added'")
                 } else {
                    aff = data
                 }
  })
  //console.log(aff)
  db.getFriends(name,function(err,data){// TODO fix the name here		
        if(err){
           res.send(null)
        } else {
           // it worked so we send null message so the resturant knows to delete
           json = myFunction(array,data, array, aff)
           res.send(json);
        }
        
  }); 
});

function myFunction( array,items, array2, aff) {
 //console.log(array)
 if (array.length == 0){
     let ret = []
     items.forEach(item => {
           db.getAffiliation(item.friendUsername, function(err,data){
     if (err){
        //console.log("reip irip rip")
     } else{
        let freind = {}
        freind.name = item.friendUsername
        freind.id = item.friendUsername
        freind.children = []
        freind.data = []
        ret.push(freind)
        let singleton = []
        singleton.push(item.friendUsername)
        let array2 = [] 
        array2 = array
        array2.push(item.friendUsername)
        map.set(item.friendUsername,array2)
        }
     })
     } )
     return ret
 }
 let name = array.splice(0,1)
 let json = {};
 json.id = name
 json.name = name
 json.children = []
 json.data = []
 json.children = json.children.concat(myFunction(array, items, array2, aff))
 return json
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
app.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
