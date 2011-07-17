var
	net = require("net")
	,settings = require("settings")
;

function clientConnect(conn){
	//TODO: Register lisenters for all messages
	//TODO: Resolve hostname/check ident
}

function onUSER(){
	//TODO: If NICK hasn't been set, throw error
	//TODO: Otherwise, check PASS if required
	//TODO: and register user and send init numerics
}

//TODO: Parse settings

var daemon = net.createServer(clientConnect);
daemon.listen(settings.server.port);
