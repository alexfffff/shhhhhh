var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


function sendTime() {
	io.emit('message', { message: new Date().toJSON() });
}

setInterval(sendTime, 10000);

users = [];

io.on('connection', function (socket) {
   console.log("CONNECTED");
   socket.emit('welcome', { message: 'Welcome!', id: socket.id });
   
	socket.on('i am client', function (data) {
		console.log(data.message);
   });
   
	socket.on('message', function (data) {
		console.log(data.message);
   });
   
	socket.on('msg', function(data) {
	      //Send message to everyone
	      io.sockets.emit('newmsg', data);
   });
   
	socket.on('setUsername', function(data) {
	      console.log(data);
	      
	      if(users.indexOf(data) > -1) {
	         socket.emit('userExists', data + ' username is taken! Try some other username.');
	      } else {
	         users.push(data);
	         socket.emit('userSet', {username: data});
	      }
	});
});


app.get('/chat', function(req, res) {
	console.log("CHAT PAGE");
	res.render('chat.ejs');
});


http.listen(3000, function() {
   console.log('listening on localhost:3000');
});