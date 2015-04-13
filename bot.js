var Client = require("irc/client.js"), net = require("net");

console.log("Starting server...");
var server = net.createServer(function (c) {
	console.log("Client connected");

	c.on("data", function (d) {
		console.log("Received:", d.toString());
		if (d.toString().match(/^USER/m)) {
			var buffer = ":cirno.ppirc.net 001 Nao-tan :Welcome to the PPIrC IRC Network Nao-tan!~Nao-tan@localhost\r\n";
			console.log("Sending:", buffer)
			c.write(buffer)
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
		"plugins": ["nickserv"],
		"email": "nao@mabinogiworld.com",
	});

	client.info("Client connecing...");
	client.connect();
});