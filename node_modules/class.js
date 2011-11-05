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

function propmeth(cl,nom,x){
	if(nom != "self"){
		if(nom == "name")nom = "_name";
		/*if(typeof(x) == "function"){
			cl[nom] = function(){
				if("self" in this) return x.apply(this.self,arguments);
				else return x.apply(null,arguments);
			}
		}
		else{*/
			cl[nom] = x;
		//}
		if("prototype" in cl)cl.prototype[nom] = cl[nom];
	}
}

function thf(th,obj,x){ //THis Function
	var old = ("_origFunc" in obj[x] ? obj[x]._origFunc : obj[x]);
	obj[x] = function(){
		if(th != this)th.this = this;
		th.caller = arguments.callee.caller;
		var ret = old.apply(th,arguments);
		if(th != this)delete th.this;
		return ret;
	}
	obj[x]._origFunc = old;
}

function noContext(){
	return function(){
		this.name = this._name;
		this.self = this;
		var tmp = this;
		while(true) {
			for(var x in tmp){
				if(typeof(tmp[x]) == "function")thf(this,tmp,x);
			}
			if(!("uber" in tmp))break;
			tmp = tmp.uber;
			tmp.self = this;
		}

		delete tmp;
		
		if("init" in this){
			this.init.apply(this,arguments);
		}
	}
}

function Class(n,d,i){
	// Base function
	var copy,fn = noContext();
	
	if(typeof(n) == "string"){
		if(Array.isArray(d))d.push({"name":n});
		else d.name = n;
	} else {
		i = d; d = n;
	}
	
	// Do inheritance
	if(typeof(i) == "function"){
		var curu,curi; 
		fn.prototype = new i();
		curi = fn.prototype.inherits = i;
		
		// Set up super/uber to access parent's methods
		//+in context of self
		curu = fn.prototype.uber = {}
		do{
			for(x in curi){
				if(x != "super" && x != "uber"){
					if(curi == i) propmeth(curu,x,curi[x]);
					else curu[x] = curi[x];
				}
			}
		}while("uber" in curi && (curu = curu.uber = {}) && (curi = curi.uber));
		//console.log(fn.prototype.uber)
		fn.prototype["super"] = fn.prototype.uber;
		fn.uber = fn["super"] = fn.prototype.uber;
	}
	
	if(Array.isArray(d)){
		for(var i=0;i<d.length;++i){
			switch(typeof(d[i])){
				case "object": {
					for(var x in d[i])propmeth(fn,x,d[i][x]);
					break;
				} case "function": {
					propmeth(fn,d[i].name,d[i]);
					break;
				}
			}
		}
	} else {
		// Handle function definition
		if(typeof(d) == "function"){
			copy = new d();
			if("name" in d) copy.name = d.name;
		}
		// Handle object definition
		else copy = d;
	
		// Copy stuff
		propmeth(fn,"_name","");
		for(var x in copy){
			propmeth(fn,x,copy[x]);
			/*if(x != "self"){
				console.log(x);
				fn[x] = copy[x];
			}*/
		}
	}
	return fn;
}

//Export function if this is require'd by Node.JS
if(typeof(exports) != "undefined"){
	module.exports = Class;
}
