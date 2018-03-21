var express = require('express');
var server = express();

server.use(express.static('public'));

server.listen(3000, function() {
	console.log('listening to port 3000...');
});