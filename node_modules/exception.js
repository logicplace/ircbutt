/*
Copyright (c) 2011 Wa (logicplace.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function paramNames(func){
	var tmp = func.toString().replace(/\/\*.*?\*\//g,"").match(/\(([\s\S]*?)\)/)[1].split(",")
	for(var x=0;x<tmp.length;x++){
		tmp[x] = tmp[x].trim();
	}
	return tmp;
}

function exception(th){
	var fn = arguments.callee.caller, pn = paramNames(fn), a = fn.arguments, stackMsg = "";
	if(!(0 in arguments))th = {};
	th.type = th.name = fn.name;
	for(var i=0;i<pn.length;++i){
		th[pn[i]] = a[i];
		stackMsg += pn[i]+": "+(
			(typeof(a[i])=="string")?'"'+a[i]+'"':a[i]
		)+"  ";
	}
	if(typeof(Error) != "undefined"){
		var stack = (new Error("<message>")).stack;
		if("toString" in th && th.toString() != "[object Object]"){
			stackMsg = th.toString();
		}
		stack = stack.split("\n");
		stack[0] = stack[0].replace("Error",th.name).replace("<message>",stackMsg);
		stack.splice(1,1); //Remove place in "exception"
		th.stack = stack.join("\n");
	}
	return th;
}

//Export function if this is require'd by Node.JS
if(typeof(exports) != "undefined"){
	module.exports = exception;
}
