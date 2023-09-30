"use strict";

var fs = require('fs');
var WebSocketServer = require('websocket').server;
var connections = [];
var http = require('http');


var httpServer = http.createServer({}, function(request, response) {
	console.log((new Date()) + " Received request for " + request.url);
	response.writeHead(404);
	response.end();
});

httpServer.listen(6502, function() {
	console.log((new Date()) + " Server is listening on port 6502");
});

console.log("***CREATING WEBSOCKET SERVER");
var wsServer = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: false
});

wsServer.on('request', function(request) {
	// console.log(request, request.origin);
	console.log("Request");

	let connection = request.accept("json", request.origin);
	connections.push(connection);
	
	// connection.sendUTF(JSON.stringify({message:"hi"}));

	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			console.log("Received Message: " + message.utf8Data);
			const data = JSON.parse(message.utf8Data);
			var dataResponse = {action:data.action, args:data.args};
			connections.forEach(conn => {
				if (conn != connection) {
					conn.sendUTF(JSON.stringify(dataResponse));
				}
			});
		}
	});

	connection.on('close', function(connection) {
		connections = connections.filter(function(el, idx, ar) {
			return el.connected;
		});
		console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
	});
});