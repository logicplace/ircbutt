/* LINKS
identd: http://tools.ietf.org/html/rfc1413
irc-old: http://www.irchelp.org/irchelp/rfc/rfc.html
irc: http://tools.ietf.org/html/rfc2812
005: http://www.irc.org/tech_docs/005.html
best: http://www.alien.net.au/irc/irc2numerics.html
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

/*
Server:
irc (user connects, add connection to knowledge)
exe <- irc (emit connection event)
exe <- irc (emit PASS event)
exe (verify pass, send error message as necessary (-> irc))
exe <- irc (emit NICK event)
exe -> irc (is there a connection using the nick NICK?)
if true: exe -> irc (send error)
if false: exe -> irc (set this connection's NICK to x)
exe <- irc (emit USER event)
exe -> irc (set this connection's username, realname, and possibly modes)
exe -> irc (send welcome messages and MOTD)
exe <- irc (emit JOIN event)
exe (verify this user has access to the channel)
if true: exe -> irc (send success, add connection to CHANNEL)
if false: exe -> irc (send error) 
*/
