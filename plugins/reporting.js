var _ = require("lodash"),
    moment = require("moment"),
    fs = require("fs");

module.exports = function Reporting(irc) {
	var memory = irc.memory;

	irc.on("PRIVMSG", function (data) {
		irc.collect({
			"events": ["PRIVMSG(" + data.nickname + ")"],
			"timeout": 5000,
			"handler": function (data2) {
				var list = _.unzip(data2.events)[1];
				var report = list.unshift(data.text).join("\n");

				// Store the report
				memory.store("reporting.reports", {
					"user": data.nickname,
					//"channels": memory.user(data.nickname, "channels"),
					"report": report,
					"date": moment().format(),
					"viewed": false,
					"read": false,
					"handled": false,
					"handler": null,
					"resolution": null,
				});

				// Tell the user their report was received.
				var msg = memory.config("report-received", "Your report has been received! You will be contacted by a moderator shortly.");
				irc.message(data.nickname, msg);

				// Tell the staff, as well.
				var staff = memory.config("staff");
				if (staff) {
					irc.message(staff, "New report from " + data.nickname + " received!");
				}
			},
		});
	});

	//// HTTP STUFF ////
	function lockdown(handler) {
		return function (data) {
			// If the user isn't logged in, they need to
			if (!data.session) return { "redirect": "/login" };

			// Check if the user has permission to view reports
			var permissions = memory.account(data.session.account).permissions("reporting");
			if (!permissions || !permissions.access) return { "code": "403" };

			// OK
			return handler(data, permissions);
		}
	}

	// Main page
	irc.on("modules-loaded", function() {
		irc.emit("register-http", {
			"page": "/reports",
			"handler": lockdown(function (data) {
				// Return the page
				return { "html": fs.readFileSync(__dirname + "/reporting/index.html") };
			}),
		});

		// API call for unhandled reports
		irc.emit("register-http", {
			"page": "/reports/active",
			"handler": lockdown(function (data, permissions) {
				var reports;
				if (permissions.indexOf("all") != -1) {
					// Get all unhandled reports.
					reports = memory.retrieve("reports", {
						"handled": false,
					})
				} else {
					// Return any reports from users in managed channels
					reports = memory.retrieve("reports", function (report) {
						return report.handled == false && _.intersection(permissions.channels, report.channels).length > 0;
					});
				}

				// Sort them
				_(reports).sortBy("date");

				// and return
				return { "json": reports };
			}),
		});

		// API call for handled reports
		irc.emit("register-http", {
			"page": "/reports/closed/<#page>[/<#perpage>]",
			"handler": lockdown(function (data, permissions) {
				var reports;
				if (permissions.indexOf("all") != -1) {
					// Get all unhandled reports.
					reports = memory.retrieve("reports", {
						"handled": true,
					});
				} else {
					// Return any reports from users in managed channels
					reports = memory.retrieve("reports", function (report) {
						return report.handled && _.intersection(permissions.channels, report.channels).length > 0;
					});
				}

				// Sort them
				_(reports).sortBy("date");

				// and return
				var perpage = data.params.perpage || 10, start = data.params.page * perpage;
				return { "json": reports.slice(start, start + perpage) };
			}),
		});
	});
}
