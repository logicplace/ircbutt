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

if(typeof(window) == "undefined")window = null;
if(typeof(console) == "undefined"){
	console = {
		log: function(str){
			alert(str);
		},
		error: function(str){
			alert("Error: "+str);
		}
	};
}
function getObj(Name){
	//Convert string to original object without eval
	//First for browsers, second for Node.JS
	var tmp = (window || this)[Name];
	if(typeof(tmp) == "undefined"){
		console.error("Could not find an object named "+Name);
		return null;
	}
	else if(!is(tmp,Function)){
		console.error("Expected function name, not "+typeof(tmp));
		return null;
	}
	return tmp;
}

function is(x,type){
	if(typeof(x) == "undefined")return type == undefined;
	else if(x == null)return type == null;
	x = Object(x);
	if('constructor' in x && 'name' in x.constructor && 'name' in type){
		return x.constructor.name == type.name;
	}
	else if('constructor' in x){
		return x.constructor == type; //Scoping issues?
	}
	return false
	//return x.constructor == type; //Scoping issues?
	//return x instanceof type //This is not stringent enough :/
}

function paramNames(func,order){
	var tmp = func.toString().replace(/\/\*.*?\*\//g,"").match(/\(([\s\S]*?)\)/)[1].split(",")
	if(1 in arguments){
		for(var x=0;x<tmp.length;x++){
			order[tmp[x].trim()] = x;
		}
	}
	else{
		for(var x=0;x<tmp.length;x++){
			tmp[x] = tmp[x].trim();
		}
		return tmp;
	}
}

function _err(str){
	var tmp = 0,ca=1;
	while((tmp=str.indexOf("%",tmp)) > -1){
		var rpl=null;
		switch(str.charAt(tmp+1)){
			case 'f': {
				var t = arguments[ca++];
				rpl = (t?' "'+t+'"':""); break;
			}
			case 'i': rpl = arguments[ca++].toString(); break;
			case 's': rpl = arguments[ca++]; break;
			case 'o': {
				var t = arguments[ca++];
				rpl = (is(t,String)?t:t.name)
			}
		}
		str = str.substr(0,tmp)+rpl+str.slice(tmp+2);
		tmp += rpl.length;
	}
	console.error(str);
	return;
}

function defarg(x,d){
	return (typeof(x) == 'undefined')?d:x;
}

function def(func){
	if(is(func,Function)){
		var fname = func.name,args,optional=false,
		    order = paramNames(func);
		//Basic format: Type_name for required, Type_name$ for optional
		//Optional values are specifically set to undefined
		args = [];
		for(var i=0;i<order.length;i++){
			var tmp = order[i].match(/^([a-zA-Z$][a-zA-Z0-9$]*_|)([a-zA-Z$_][a-zA-Z0-9$_]*?)(\$?)$/);
			if(!tmp[3] && optional){
				console.error("Required arguments may not come after optional ones.");
				return null;
			}
			args.push([tmp[1]?
				getObj(tmp[1].slice(0,-1))
				:null
			,tmp[2],(optional=Boolean(tmp[3]))]);
		}
		
		return function(){
			for(var i=0;i<args.length;i++){
				if(i < arguments.length){
					if(args[i][0] != null && !is(arguments[i],args[i][0])
					&& arguments[i] != null){
						return _err("Function%f argument %i must be of type %o",fname,i,args[i][0]);
					}
				}
				else if(args[i][3])arguments[i] = undefined;
				else{
					return _err("Function%f argument %i was omitted."+(
						args[i][0]?" Must be of type %o":""),fname,i,args[i][0]
					)
				}
				func[args[i][1]] = arguments[i];
			}
			return func.apply(func,arguments);
		}
	}
}

//Export function if this is require'd by Node.JS
if(typeof(exports) != "undefined"){
	module.exports = def;
}
