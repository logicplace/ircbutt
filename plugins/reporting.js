var _ = require("lodash"),
    moment = require("moment"),
    fs = require("fs");

// http://stackoverflow.com/questions/23013588/pick-for-collections-underscore-lodash
_.make = function(arr /*,  args... */) {
    var props = [].slice.call(arguments, 1);
    return arr.map(function(obj) {
        return _.pick(obj, props);
    });
};

module.exports = function Reporting(irc) {
	var memory = irc.memory, collecting = {};

	irc.on("PRIVMSG", function (data) {
		// Ignore if we're already collecting.
		if (collecting[data.sender.nick]) return false;

		// Ignore if I am not the target.
		if (data.target != memory.my("nickname")) return false;

		irc.info("Got message from " + data.sender.nick + ", waiting for more.");
		collecting[data.sender.nick] = true;
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
					"resolved": null,
				});

				// Tell the user their report was received.
				var msg = memory.config("reporting", "received", "Your report has been received! You will be contacted by a moderator shortly.");
				irc.message(data.sender.nick, msg);

				// Tell the staff, as well.
				var staff = memory.config("reporting", "staff");
				if (staff) {
					irc.message(staff, "New report from " + data.sender.nick + " received!");
				}

				// Stop locking this person
				delete collecting[data.sender.nick];
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
	irc.passive("modules-loaded", function() {
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
						return !report.handled && _.intersection(permissions.channels, report.channels).length > 0;
					});
				}

				// Sort them
				reports = _.sortByOrder(reports, "date", false);

				// and return
				return { "json": reports };
			}),
		});

		irc.emit("register-http", {
			"page": "/reports/new/since/<#uid>",
			"handler": lockdown(function (data, permissions) {
				reports = memory.retrieve("reporting.reports", function (report) {
					return !report.handled && report.UID > data.params.uid &&
						(permissions.all || _.intersection(permissions.channels, report.channels).length > 0);
				});

				// Sort them
				reports = _.sortByOrder(reports, "date", false);

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
					reports = memory.retrieve("reporting.reports", {
						"handled": true,
					});
				} else {
					// Return any reports from users in managed channels
					reports = memory.retrieve("reporting.reports", function (report) {
						return report.handled && _.intersection(permissions.channels, report.channels).length > 0;
					});
				}

				// Sort them
				reports = _.sortByOrder(reports, "date", false);

				// and return
				var perpage = data.params.perpage || 10, start = data.params.page * perpage;
				return { "json": reports.slice(start, start + perpage) };
			}),
		});

		// API call to mark a report as x
		irc.emit("register-http", {
			"page": "/reports/mark/<#uid>/<mark>",
			"handler": lockdown(function (data, permissions) {
				// Make sure mark is valid
				if (["viewed", "read", "handled"].indexOf(data.params.mark) == -1) {
					return { "json": 0 };
				}

				// Find report
				var reports = memory.retrieve("reporting.reports", { "UID": data.params.uid });

				// Make sure user can do this
				if (reports.length && (permissions.all || _.intersection(permissions.channels, reports[0].channels).length > 0)) {
					// Set mark
					reports[0][data.params.mark] = true;
					if (data.params.mark == "handled") {
						reports[0].handler = data.session.account;
						reports[0].resolved = moment().format();
						reports[0].resolution = data.get.resolution || "";
					}
					return { "json": 1 };
				}
			}),
		});

		// API call to get statuses I hate this
		irc.emit("register-http", {
			"page": "/reports/status/<#start>/<#end>",
			"handler": lockdown(function (data, permissions) {
				// Find reports
				var reports = memory.retrieve("reporting.reports", function (report) {
					 return report.UID >= data.params.start && report.UID <= data.params.end &&
						(permissions.all || _.intersection(permissions.channels, report.channels).length > 0);
				});

				return { "json": _.make(reports, "UID", "handled") };
			}),
		});
	});
}
