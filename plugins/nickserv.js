// For client communications with NickServ service

// Some NickServ variabilities:
//  * Group/account support that collects multiple nicks under an account name
//    This can alter how to identify
//  * Nick protection: time til rename, time til kill (either can be 0)
//    This alters how to identify if used
//  * Default modes
//  * Optional email for registration, usually required.

module.exports = function NickServ(irc) {
	irc.memory.installPackets({
		"msg": {
			"000-NS_NOTREGISTERED": {
				"use": "S2C",
				"EN": "Your nick is not registered.",
			},

			"000-NS_ALREADYID": {
				"use": "S2C",
				"EN": "You are already identified for nick <nickname>.",
			},

			"GHOST": {
				"use": "C2S",
				"*": "GHOST <nickname> <password>"
			},

			"GIDENTIFY": {
				"use": "C2S",
				"*": "GIDENTIFY[ <nickname>] <password>"
			},

			"HELP": {
				"use": "C2S",
				"*": "HELP",
			},

			"IDENTIFY": {
				"use": "C2S",
				"*": "IDENTIFY[ <nickname>] <password>"
			},

			"REGISTER": {
				"use": "C2S",
				"*": "REGISTER <password> <email>"
			},
		},

		"specification": {
			"anope": {},
			"atheme": {},
			"chatservices": {},
			"hybserv": {},
			"srvx": {},
		},
	}, "nickserv");

	function recv(data) {
		if (data.sender.nick == irc.memory.config("nickserv", "name", "NickServ")) {
			var ret = memory.packet({ "numeric": "000", "header": "nickserv" }).read(data.text);
			if (ret === false) {
				ret = data;
				ret.event = "NickServ(Unhandled)";
			}
			return ret;
		}
		return false;
	}

	irc.on("PRIVMSG", recv);
	irc.on("NOTICE", recv);

	irc.on("connected", function () {
		var nick = irc.memory.my("nickname"), pass = irc.memory.my("nickpass"),
		    preferred = irc.memory.my("nicknames")[0];
		if (nick != preferred) {
			var data = { "nickname": nick, "password": pass }
			if (irc.memory.supports("NickServ.GIDENTIFY")) {
				send("GIDENTIFY", data);
			} else {
				send("GHOST", data);
				if (irc.memory.supports("NickServ.SIDENTIFY")) {
					send("SIDENTIFY", data);
				} else {
					send("NICK", data);
					send("IDENTIFY", data);
				}
			}
		} else {
			send("IDENTIFY", { "password": pass });
		}
	});

	irc.on("NS_NOTREGISTERED", function (data) {
		var nick = irc.memory.my("nickname"), preferred = irc.memory.my("nicknames")[0];

		// If this is the preferred nickname we should register it
		if (nick == nickname) {
			var buff = irc.memory.my(["nickpass", "email"]);
			buff.password = buff.nickpass;
			delete buff.nickpass;
			send("REGISTER", buff);
			// We can assume this IDs after registration
		}
	});

	function send(command, data) {
		data.target = irc.memory.config("nickserv", "name", "NickServ");
		data.text = irc.memory.packet(command, "nickserv");
		irc.send(irc.memory.config("nickserv", "mode", "PRIVMSG"), data);
	}

	function research() {
		irc.send("HELP", {}, { "events": ["NickServ(Unhandled)"] });
	}
}