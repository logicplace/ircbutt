/* LINKS
identd: http://tools.ietf.org/html/rfc1413
irc-old: http://www.irchelp.org/irchelp/rfc/rfc.html
irc: http://tools.ietf.org/html/rfc2812
005: http://www.irc.org/tech_docs/005.html
*/

/* SUPPORT
* Evented framework
** When sending a command, you can automatically register listeners for responses
** All listeners will be able to have [[start,] middle,] end responses as well as
**+listening for multiple options. Note: there can only be one start, there can
**+be multiple middles, and only one end which unregisters the event (and all
**+sibling events).
* Bot should follow this format (obv. wait is not blocking):
** Connect (function to allow simple reconnection)
** PASS (if provided)
** NICK (act on errors, but there is no success response at this point)
** USER (wait for response)
** Run auth module (NickServ, AuthServ, etc) (wait for success return)
** Join channels
** Request channel status from ChanServ if available (may be a module)
** etc other startup stuff
* Bot should handle:
** Storing responses from NAMES, WHO, MODE, etc.
** Adusting user list based on JOIN, KICK, QUIT, PART, etc.
* Able to run as a server as well
*/
