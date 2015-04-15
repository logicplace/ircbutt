var _ = require("lodash"),
    moment = require("moment"),
    fs = require("fs");

module.exports = function Reporting(irc) {
	var memory = irc.memory;

	irc.on("PRIVMSG", function (data) {
		irc.info("Got message from " + data.sender.nick + ", waiting for more.");
		irc.collect({
			"events": ["PRIVMSG(" + data.sender.nick + ")"],
			"timeout": 5000,
			"handler": function (data2) {
				var list = _.unzip(data2.events)[1], same = list.length && data.UID == list[0].UID;

				for (var i = 0; i < list.length; ++i) {
					list[i] = list[i].text;
				}

				// If the first collected packet was a duplicate event of trigger, we want to ignore it
				if (!same) {
					list.unshift(data.text);
				}

				var report = list.join("\n");
				irc.info("Report finished, logging...");

				// Store the report
				memory.store("reporting.reports", {
					"user": data.sender.nick,
					//"channels": memory.user(data.sender.nick, "channels"),
					"report": report,
					"date": moment().format(),
					"viewed": false,
					"read": false,
					"handled": false,
					"handler": null,
					"resolution": null,
				});

				// Tell the user their report was received.
				var msg = memory.config("reporting", "received", "Your report has been received! You will be contacted by a moderator shortly.");
				irc.message(data.sender.nick, msg);

				// Tell the staff, as well.
				var staff = memory.config("reporting", "staff");
				if (staff) {
					irc.message(staff, "New report from " + data.sender.nick + " received!");
				}
			},
		});
	});

	//// HTTP STUFF ////
	function lockdown(handler) {
		return function (data) {
			// If the user isn't logged in, they need to
			if (!data.session) return { "redirect": "/login?" + encodeURI(data.url) };

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
				if (permissions.all) {
					// Get all unhandled reports.
					reports = memory.retrieve("reporting.reports", {
						"handled": false,
					})
				} else {
					// Return any reports from users in managed channels
					reports = memory.retrieve("reporting.reports", function (report) {
						return report.handled == false && _.intersection(permissions.channels, report.channels).length > 0;
					});
				}

				// Sort them
				_.sortBy(reports, "date");

				// and return
				return { "json": reports };
			}),
		});

		// API call for handled reports
		irc.emit("register-http", {
			"page": "/reports/closed/<#page>[/<#perpage>]",
			"handler": lockdown(function (data, permissions) {
				var reports;
				if (permissions.all) {
					// Get all unhandled reports.
					reports = memory.retrieve("reports", {
						"handled": true,
					});
				} else {
					// Return any reports from users in managed channels
					reports = memory.retrieve("reporting.reports", function (report) {
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
