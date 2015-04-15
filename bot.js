var Client = require("irc/client.js"), net = require("net");

console.log("Starting server...");
var server = net.createServer(function (c) {
	console.log("Client connected");

	function send (buffer) {
		console.log("Sending:", buffer)
		c.write(buffer)
	}

	c.on("data", function (d) {
		console.log("Received:", d.toString());
		if (d.toString().match(/^USER/m)) {
			send(":cirno.ppirc.net 001 Nao-tan :Welcome to the PPIrC IRC Network Nao-tan!~Nao-tan@localhost\r\n");
			setTimeout(function () {
				send(":Person!person@localhost PRIVMSG Nao-tan :u suck\r\n");
				send(":Person!person@localhost PRIVMSG Nao-tan :im sry\r\n");
			}, 1500)
		}
	});

	c.on("end", function (d) {
		console.log("Client Disconnected");
		server.close();
	});
});

server.listen(6667, function () {
	console.log("Server started!");

	var client = new Client({
		"password": "*",
		"nicknames": ["Nao-tan"],
		"nickpass": "petrock",
		"servers": ["localhost"],
		"specification": "rfc281x",
		"plugins": ["http", "reporting", "nickserv"],
		"email": "nao@mabinogiworld.com",
	});

	client.info("Client connecing...");
	client.connect(function (){
		client.memory.account("Kadalyn").add({
			"password": "password"
		});

		client.memory.store("reporting.reports", {
			"user": "Kadalyn",
			"channels": ["#mabinogi"],
			"report": "hello!!!",
			"date": '2015-04-14T15:31:25-07:00',
			"viewed": false,
			"read": false,
			"handled": false,
			"handler": null,
			"resolution": null,
			"resolved": null,
		})
	});
});