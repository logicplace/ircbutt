var http = require("http"),
    URL = require("url"),
    packets = require("packets");

module.exports = function HTTPServer(irc) {
	var pages = [];

	// Create HTTP server
	var server = http.createServer(function (request, response) {
		var data = {};

		// If there's a cookie...
		if (request.headers.cookie) {
			data.cookie = crumble(request.headers.cookie, ";");

			// Check for session information
			if (data.cookie.session) {
				var session = irc.memory.retrieve("sessions", { "id": data.cookie.session });
				if (session) data.session = session[0];
				delete data.cookie.session;
			}
		}

		// Parse the URL...
		var url = URL.parse(request.url);
		if (url.query) data.get = crumble(url.query, "&");
		if (url.hash) data.hash = url.hash.substr(1);
		url = url.pathname;

		// Find matching path
		for (var i = 0; i < pages.length; ++i) {
			var page = pages[i], params = packets.readPacket(page.page, url);
			if (params && params.matched) {
				data.params = params;
				var out = page.handler(data), body, header = {};

				// It was unhandled
				if (out === false) continue;

				// Can return cookie, code, html, json, or redirect
				if ("cookie" in out) {
					var crumbs = [];
					for (var key in out) {
						// TODO: Is encodeURI necessary?
						crumbs.push(encodeURI(key) + "=" + encodeURI(out[key]));
					}
					response.setHeader("Set-Cookie", crumbs);
				}

				if ("redirect" in out) {
					response.statusCode = 302;
					response.setHeader("Location", out.redirect);
					response.end();
					return;
				} else if ("html" in out) {
					body = out.html;
					response.setHeader("Content-Type", "text/html");
				} else if ("json" in out) {
					body = JSON.serialize(out.json);
					response.setHeader("Content-Type", "application/json");
				}

				response.statusCode = out.code || 200;
				response.end(body);
				return;
			}
		}
	});

	// Listen for registrations
	irc.on("register-http", function (data) {
		pages.push({
			"page": packets.compilePacket(data.page),
			"handler": data.handler
		});
	});

	irc.emit("register-http", {
		"page": "/login",
		"handler": function (data) {
			// If they're already logged in, display the success page instead.
			if (data.session) return { "redirect": "/login/success" }

			// If not, show the login page
			return { "html": fs.readFileSync(__dirname + "/http/login.html") };
		},
	});

	irc.emit("register-http", {
		"page": "/login/<username>/<password>",
		"handler": function (data) {
			// Restful login, sets cookie.
			var account = irc.memory.account(data.params.username), success = account.login(data.params.password);
			if (success) {
				var sessionID = _.random(0, 0xfffffffffffffffffffffffffff).toString(16);
				irc.memory.store("sessions", { "id": sessionID,  })
				return { "cookie": { "session": sessionID }, "json": 1 };
			} else {
				return { "json": 0 };
			}
		},
	});

	irc.emit("register-http", {
		"page": "/login/success",
		"handler": function (data) {
			// Go back to login screen if you're not logged in
			if (!data.session) return { "redirect": "/login" }

			// Return successful login page, which offers the ability to log out
			return { "html": fs.readFileSync(__dirname + "/http/login_success.html") };
		},
	});

	irc.emit("register-http", {
		"page": "/logout",
		"handler": function (data) {
			if (data.session) {
				irc.memory.forget("sessions", { "id": data.session.id });
			}
			return { "cookie": { "session": "" }, "redirect": "/login" };
		}
	});
}

function crumble(str, separator, equals) {
	var crumbs = str.split(separator), ret = {};
	equals = equals || "=";
	for (var i = 0; i < crumbs.length; ++i) {
		var parts = crumbs[i].split(equals);
		ret[decodeURI(parts.shift().trim())] = decodeURI(parts.join(equals));
	}

	return ret;
}