var
	irc = require("irc")
	,settings = require("irc/settings")
;

var settingsFile = (process.argv.length > 2)?process.argv[2]:"conf.js",host;

var host = new irc(settingsFile,function(){
	//Settings loaded, setup listening etc
	this.host();
	this.on("daemon","nick",function(data){
		if("nickname" in data){
			if(data.nickname in host.connections.nick){
				host.send(this,"433",data);
			} else {
				this.sesKnow.nick = data.nickname;
				//TODO: Dispatch nick change to people that can see this person
			}
		} else {
			host.send(this,"431");
		}
	});
	this.on("daemon","user",function(data){
		if(!("username" in this.sesKnow)){ 
			this.sesKnow.username
		}
	});
});
