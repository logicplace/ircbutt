var packets = require("packets"),
    _ = require("lodash");

var suite = {
	// spec: [[packet, data], [packetRead, dataOut, dataIn, packetWritten], ...]
	// Basic tests for {}
	"{spaced}": [
		["word", { "spaced": "word" }],
		["good test", { "spaced": "good test" }],
	],

	"{spaced:2}": [
		["word", { "spaced": "word" }],
		["two words", { "spaced": "two words" }],
		["three (3) words", { "spaced": "three (3) words" }],
		["four words should fail", false, { "spaced": "four words should fail" }, false],
	],

	"{spaced=2}": [
		["NG", false, { "spaced": "NG" }, false],
		["no good", false, { "spaced": "no good" }, false],
		["this should work", { "spaced": "this should work" }],
		["and this should not", false, { "spaced": "and this should not" }, false],
	],

	"{spaced?:}": [
		[":", false],
		["word", { "spaced": "word" }, { "spaced": "word" }, ":word"],
		[":word", { "spaced": "word" }],
		["no good", false],
		[":this is a sentence", { "spaced": "this is a sentence" }],
		["sanity check:", false, { "spaced": "sanity check" }, ":sanity check"],
	],

	"{spaced?>:}": [
		["word", { "spaced": "word" }, { "spaced": "word" }, "word:"],
		["word:", { "spaced": "word" }],
		["no good", false],
		["this is a sentence:", { "spaced": "this is a sentence" }],
		[":sanity check", false, { "spaced": "sanity check" }, "sanity check:"],
	],

	"{spaced??:}": [
		[":", { "spaced": "" }],
	],

	"{spaced??>:}": [
		[":", { "spaced": "" }],
	],

	// Basic tests for <>
	"<spaceless>": [
		["word", { "spaceless": "word" }],
		["bad test", false, { "spaceless": "bad test" }, false],
	],

	"<spaceless:,>": [
		["word", { "spaceless": "word" }],
		["bad test", false, { "spaceless": "bad test" }, false],
		["bad,test", false, { "spaceless": "bad,test" }, false],
		["ok.test", { "spaceless": "ok.test" }],
	],

	"<letter=drow>": [
		["w", { "letter": "w" }],
		["word", false, { "letter": "word" }, false],
	],

	"<spaceless=drow+>": [
		["word", { "spaceless": "word" }],
		["bad", false, { "spaceless": "bad" }, false],
	],

	"<letter!drow>": [
		["a", { "letter": "a" }],
		["lex", false, { "letter": "lex" }, false],
	],

	"<spaceless!drow+>": [
		["exquisite", { "spaceless": "exquisite" }],
		["crap", false, { "spaceless": "crap" }, false],
	],

	"<#numeric>": [
		["123", { "numeric": 123 }],
		["123", { "numeric": 123 }, { "numeric": "123" }, "123"],
		["123a", false, { "numeric": "123a" }, false],
		["1.2", false, { "numeric": 1.2 }, false],
	],

	"<#numeric:,.>": [
		["1,000", { "numeric": 1000 }],
		["1.2", { "numeric": 1.2 }],
		["1,000.2", { "numeric": 1000.2 }],
	],

	"<#numeric:.,>": [
		["1.000", { "numeric": 1000 }],
		["1,2", { "numeric": 1.2 }],
		["1.000,2", { "numeric": 1000.2 }],
	],

	"<#numeric:,>": [
		["1,000", { "numeric": 1000 }],
	],

	"<hex=0-9a-fA-F+>:<octet@hex>": [
		["1a3:345", { "hex": "1a3", "octet": "345" }],
	],

	"<escaped=0--9+>": [
		["-0-", { "escaped": "-0-" }],
		["1", false, { "escaped": "1" }, false],
	],

	// Basic tests for //
	"/regex:zig/": [
		["zig", { "regex": "zig" }],
		["unzig", false, { "regex": "unzig" }, false],
	],

	// TODO: Basic tests for ()

	// TODO: Basic tests for []

	// Test basic packets
	"<host> <#port> {info??:}": [
		["localhost 6667 :Bounced!!", { "host": "localhost", "port": 6667, "info": "Bounced!!" }],
	],

	"Link <version>[.<debugLevel>] <destination> <nextServer>": [
		["Link v1.4 localhost 255.255.255.255", {
			"version": "v1",
			"debugLevel": "4",
			"destination": "localhost",
			"nextServer": "255.255.255.255",
		}],
		["Link v1 localhost 255.255.255.255", {
			"version": "v1",
			"destination": "localhost",
			"nextServer": "255.255.255.255",
		}],
	],

	// Equivalence assertion tests
	"<equiv> abc <equiv> def <equiv>": [
		["hi abc hi def hi", { "equiv": "hi" }],
		["bye abc hi def hi", false],
		["hi abc bye def hi", false],
		["hi abc hi def bye", false],
	],

	// TODO: Option set tests

	// TODO: Nesting tests
}

module.exports = function TestPackets() {
	var successes = 0, failures = 0;
	for (var x in suite) {
		var packet;

		// Make sure the packet compiles!
		try {
			packet = packets.compilePacket(x);
		} catch (e) {
			console.log("FAILURE Compiling packet " + x + ": " + e.toString());
			++failures;
			continue;
		}

		// Run through suite...
		for (var i = 0; i < suite[x].length; ++i) {
			var test = suite[x][i], packetRead = test[0], dataOut = test[1], dataIn, packetWritten;
			switch (test.length) {
			case 4:
				dataIn = test[2];
				packetWritten = test[3];
				break;

			case 3:
				dataIn = test[1];
				packetWritten = test[2];
				break;
				
			case 2:
				dataIn = test[1];
				packetWritten = test[0];
				break;
			}

			var result = packets.readPacket(packet, packetRead);
			if (!result.matched) result = false;
			else delete result.matched;

			if (_.isEqual(result, dataOut)) ++successes;
			else {
				console.log("FAILURE Reading packet: '" + packetRead + "' via '" + x + "' \nGot: ", result, "\nExpects: ", dataOut);
				++failures;
			}

			if (dataIn !== false) {
				result = packets.writePacket(packet, dataIn);
				if (result === packetWritten) ++successes;
				else {
					console.log("FAILURE Writing packet: ", dataIn, " via '" + x + "' \nGot: " + result + "\nExpects: " + packetWritten);
					++failures;
				}
			}
		}
	}

	console.log("Packet Test: " + successes.toString() + " SUCCESES, " + failures.toString() + " FAILURES");
	return [successes, failures];
}