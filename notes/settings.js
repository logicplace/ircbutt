/**
* Most definitions will bubble up
**/
{
	/** HOST **
	* Network to connect to
	* Port is optional, defaults to 6667
	* Accepts string, array
	**/
	//Without port
	host: "irc.server.net",
	//With port
	host: "irc.server.net:8080",
	//Two addresses to the same network (cycle ltr)
	host: ["p1.server1.net","p2.server1.net"],
	
	/** CHANNEL **
	* Channel(s) to connect to
	* Accepts string, array
	**/
	channel: "#chat",
	//Connect to three channels simultaneously
	channel: ["#chat","#help","#bots"],
	
	/** NICK **
	* Nickname(s) to use
	* Accepts string, array
	* If all nicks are taken and nothing can be done about it, fail connection
	**/
	nick: "Nick",
	//Cycle through nicks ltr if taken
	nick: ["Nick","Bot","a","b"],
	nick: [
		//Registered nick
		{"Nick": "nickspass"},
		//Single unregistered nicks
		"Bot", {"Bot": null},
		//Group of unregistered nicks
		["a","b"],
	],
	
	/** USER **
	* Username to register as
	* If ident is enabled, it will fall back to this for the username
	* Accepts string
	*** USERMODE **
	* http://tools.ietf.org/html/rfc2812#section-3.1.5
	* Accepts string, number
	*** REAL **
	* Real name
	* Accepts string
	**/
	user: "username",
	//Sets all modes
	usermode: "iwoOrs",
	//When using number modes, it sends the number in the USER message
	//0b0000iw00  iw will be reverse interpreted on olduser form
	usermode: 8,
	real: "Ufuuu", //Default: Bot's name/advert
	
	/** PASS **
	* Connection pass
	* Does not send a pass if omitted or blank
	* Accepts string
	**/
	pass: "mypass",
	
	/** Arbitrary commands to send **/
	commands: [
		//between MOTD/auth and joining channels
		["AWAY :Leave me alone!",/*...*/],
		//after joining channels
		["PRIVMSG ChanServ op #mychan",/*...*/]
	],
	
	/** Flood control options **/
	flood: {
		//All are arrays denoting [While flood prevention is disabled, While it's enabled]
		//How many messages to send at once
		amount: [5,1], //<- Defaults
		//How long to wait between dumps (in milliseconds)
		wait: [0,2000], //<- Defaults
		//Maximum amount of characters allowed per line. If it exceeds the maximum amount
		//+(512 including \r\n and raw stuff) it will be lessened accordingly
		chars: [512,256], //<- Defaults 
	},
	
	/** Bot auth/remoting options 
	* Note that all usernames/passwords may be formatted in the following way:
	* *) No prefix or ' prefix: literal values
	* *) + prefix: md5 hash
	* *)
	**/
	//Can have up to ten passwords, blanks are placeholders
	//10 (index 9) is regarded as the super user (bot owner)
	passwords = [],
	//Used in PASS message for connecting to bot via remote IRC
	//Falls back on superuser pass if this is not supplied
	//Note: This is just to connect, other securites may be implemented
	//for after connection.
	remotePass = "",
	//Used in HttpAuth for web services
	remoteWeb = {
		"user": "pass",
		//...
	},
	//Ask a database for user information instead
	remoteUserDB = ["type",/*args...*/],
	
	/** Various options **/
	//IRC Spec to use
	//Accepts a string of: "rfc1459", "rfc281x"
	spec: "rfc1459",
	//Which method to use for authing your nick
	//NickServ and AuthServ are included, more may be added
	//May accept an array to pass arguments to module
	authMethod: "NickServ", //Default: NickServ
	//Host own ident server using settings contained herein
	hostIdent: true, //Default: false
	//Command prefix
	prefix: "!", //Default: !
	//Shorthand for logging everything
	logAll: true, //Default: false
	//Log commands sent and results
	logCommands: true, //Default: false
	//Log conversation
	logConvo: true, //Default: false
	//Log errors
	logErrors: false, //Default: true
	//Log auth changes
	logAuth: false, //Default: true
	//Log debug messages
	logDebug: true, //Default: false
	
	/** Modules **/
	modules: {
		"modname": {
			//Module options
		},
		//...
	},
	
	//Subsections
	$: {
		sectionName: { //Names are unique globally
			//Anything defined above can go in here (including $)
		},
		//...
	}
}
