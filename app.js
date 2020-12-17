/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

   var express = require('express');
   var routes = require('./routes/routes.js');
   var app = express();
   //CHAT
   const io = require('socket.io');
   // CHAT PUT THIS IN MODELS
   var chat_app = require('./models/chat_app.js');
   //app.use(express.urlencoded());
   app.use(express.urlencoded({ extended: true }));
   app.use(express.cookieParser());
   app.use(express.session({secret: 'secretMsg'}));
   
   //CHAT
   io.on("connection", function(socket) {
      socket.on("chat message", obj => {
         io.to(obj.room).emit("chat message", obj);
      });
   
      socket.on("join room", obj => {
         socket.join(obj.room);
      });
   
      socket.on("leave room", obj => {
         socket.leave(obj.room);
      });
   });
   
   
   
   /* Below we install the routes. The first argument is the URL that we
      are routing, and the second argument is the handler function that
      should be invoked when someone opens that URL. Note the difference
      between app.get and app.post; normal web requests are GETs, but
      POST is often used when submitting web forms ('method="post"'). */
   
   app.get('/', routes.get_main);
   app.post('/checklogin', routes.check_login);
   app.get('/signup', routes.get_signup); 
   app.post('/createaccount', routes.create_account);
   app.get('/restaurants', routes.get_restaurants); 
   app.post('/addrestaurant', routes.add_restaurant); 
   app.get('/logout', routes.get_logout);
   
   //CHAT
   app.post('/join', (req, res) => {
      const room = req.body.room;
      console.log("JOIN WORKS");
      return res.send({
            success: true
         });
   });
   //CHAT
   app.post('/leave', (req, res) => {
      const room = req.body.room;
      console.log("LEAVE WORKS");
      return res.send({
            success: true
         });
   });
   
   /* Run the server */

   //CHAT
   chat_app.init();

   console.log('Author: Selene Li (seleneli)');
   app.listen(8080);
   console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
   