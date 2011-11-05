
//TODO: --l@
// ie. XdYe{XdYe{XdY}} is the max (no third e)
//TODO: Write test file
//TODO: Write module handler
var limited = false, vars = {}, rollIdx, exprs, prolls;

//Defines
var
OP_DICE   = 1,
OP_POS    = 2,
OP_NEG    = 3,
OP_NOT    = 4,
OP_STR    = 5,
OP_NUM    = 6,
OP_ADD    = 7,
OP_SUB    = 8,
OP_MUL    = 9,
OP_DIV    = 10,
OP_MOD    = 11,
OP_BAND   = 12,
OP_BXOR   = 13,
OP_BOR    = 14,
OP_AND    = 15,
OP_OR     = 16,
OP_XOR    = 17,
OP_EQU    = 18,
OP_NEQ    = 19,
OP_LSS    = 20,
OP_LEQ    = 21,
OP_GTR    = 22,
OP_GEQ    = 23,
OP_MIN    = 36,
OP_MNE    = 37,
OP_MAX    = 38,
OP_XNE    = 39,
OP_SLSS   = 24,
OP_SLEQ   = 25,
OP_SGTR   = 26,
OP_SGEQ   = 27,
OP_COND   = 28,
OP_IDX    = 32,
OP_PARA   = 33,
OP_CTOG   = 34,
OP_IGNR   = 35,
VAL_NUM   = 29,
VAL_STR   = 30,
VAR       = 31
//39 -> 40
;

//Token class
function Token(type){
	this.type = type;
	this.result = null;
	this.resolved = false;
	this.print = "";
	this.highest = 15;
	for(var i=1;i<arguments.length;++i){
		this[i-1] = arguments[i];
	}
}

//Helper functions
function num(val){
	switch(typeof(val)){
		case "string": return val.length;
		case "number": return val;
	}
}

function str(val){
	switch(typeof(val)){
		case "string": return val;
		case "number": return val.toString();
	}
}

function qstr(val){
	return (val.indexOf("'") == -1 ? "'"+val+"'" : '"'+val+'"')
}

function qreal(val){
	switch(typeof(val)){
		case "string": return qstr(val);
		case "number": return val.toString();
	}
}

function varName(va){
	try {
		return {
			"m": "(m)in",
			"x": "ma(x)",
			"a": "(a)vg",
			"r": "(r)oll",
			"z": "expression(z)",
			"s": "(s)et",
			"c": "d(c)ount",
			"y": "zcount(y)"
		}[va];
	} catch(e) {
		return va;
	}
}

function isStr(val){ return typeof(val) == "string"; }
function strrep(astr,c){ var ret = ""; for(var i=0;i<c;++i)ret += astr; return ret; }
function strrev(astr){
	var ret = "";
	for(var i=astr.length-1;i>=0;--i)ret += astr.charAt(i);
	return ret;
}


var curOptions;

function resolve(s,ooo){
	if(curOptions.indexOf(s) != -1){
		for(var i=2;i<arguments.length;++i){
			if(!arguments[i].resolved && arguments[i].highest < ooo){
				return false;
			}
		}
		return true;
	} else return false;
}

function exeExpr(expr, options){
	for(var i=0;i<options.length;++i){
		var c = options.charAt(i),cased;
		if(curOptions.indexOf(c) == -1){
			if((cased = c.toUpperCase()) == c){
				if((cased = c.toLowerCase()) == c){
					curOptions += c;
					continue;
				}
			}
			curOptions = curOptions.replace(cased,c);
		}
	}
	var z = execute(expr);
	vars.z.push(z);
	vars.y = vars.z.length;
	z = qreal(z);
	if(expr.print && expr.print != z){
		if(resolve("p")) exprs.push(z)
		else exprs.push(expr.print+" = "+z);
	}
}

var eachDepth = 0;
function execute(token, doExec){
	var result,res,ooo,print;
	switch(token.type){
		case OP_DICE: {
			//0: Amount; 1: Sides; 2: Each
			var amount, sides, rolls = [], minRoll, maxRoll, average, total
			,right = execute(token[1]), isstr = isStr(right), each = token[2];
			//They have a minimum of 1 either way
			amount = Math.max(1,num(execute(token[0]))); sides = Math.max(1,num(right));
			
			//Enforce limits
			if(limited){
				amount = Math.min(amount,20);
				sides = Math.min(sides,1000);
			}
			
			//Base total
			if(isstr)total = "";
			else total = 0;
			
			if(sides == 1){
				//Quickie for one side rolls
				minRoll = maxRoll = average = right;
				for(var i=0;i<amount;++i){
					rolls.push(1);
					total += right;
				}
			} else {
				var numTotal = 0;
				for(var i=0;i<amount;++i){
					var r = Math.round(Math.random()*(sides-1)+1);
					if(i){
						minRoll = Math.min(minRoll,r);
						maxRoll = Math.max(maxRoll,r);
					} else minRoll = maxRoll = r;
					numTotal += r;
					if(isstr)r = right.charAt(r-1);
					total += r;
					rolls.push(r);
				}
				average = Math.floor(numTotal/sides);
				if(isstr){
					average = right.charAt(average);
					minRoll = right.charAt(minRoll);
					maxRoll = right.charAt(maxRoll);
				}
			}
			
			var rid = rollIdx;
			vars.a[rid] = average; vars.r[rid] = total;
			vars.m[rid] = minRoll; vars.x[rid] = maxRoll;
			vars.c = vars.a.length;
			
			var eprints = [], erolls = [];
			if(each){
				++eachDepth;
				var oldi = vars.i;
				for(var i=0;i<amount;++i){
					rollIdx = rid+1;
					vars.o = rolls[i];
					vars.i = i+1;
					var r = execute(each);
					eprints.push(each.print);
					if(i){
						switch(typeof(total)){
							case "number": {
								r = num(r);
								minRoll = Math.min(minRoll,r);
								maxRoll = Math.max(maxRoll,r);
								break;
							} case "string": {
								r = str(r);
								break;
							}
						}
						total += r;
					} else {
						total = r;
						if(typeof(total) == "number"){
							minRoll = maxRoll = r;
						}
					}
					erolls.push(r);
				}
				vars.i = oldi;
				
				vars.R[rid] = vars.r[rid]; vars.A[rid] = vars.a[rid];
				vars.M[rid] = vars.m[rid]; vars.X[rid] = vars.x[rid];
				if(typeof(total) == "number"){
					vars.a[rid] = Math.floor(total/sides);
					vars.m[rid] = minRoll;
					vars.x[rid] = maxRoll;
				}
				vars.r[rid] = total;
				
				--eachDepth;
			}
			
			//Print for expression
			result = total;
			ooo = 0;
			res = resolve("d",ooo,token[0],token[1]);
			print = token[0].print+"d"+token[1].print;
			//This strips out the added o
			if(each){
				//TODO: --Dv SOMEHOW
				each.print = each.print.replace(/([^'" ]+|'[^']*'|"[^"]*") /,"");
				print += "e{"+each.print+"}";
			}
			
			//Print for rolls
			if(prolls.length <= rollIdx)prolls[rid] = [];
			var tmp = [];
			if(limited && eachDepth > 0){
				tmp.totals = true;
				tmp.push(qreal(total));
			} else {
				tmp.total = qreal(total);
				for(var i=0;i<amount;++i){
					if(resolve("r")){
						if(each)tmp.push(qreal(erolls[i]));
						else tmp.push(qreal(rolls[i]));
					}
					else if(each)tmp.push("("+qreal(rolls[i])+" "
					+eprints[i].replace(/([^'" ]+|'[^']*'|"[^"]*") /,"")+") = "+qreal(erolls[i]));
					else tmp.push(qreal(rolls[i]));
				}
			}
			prolls[rid].push(tmp);
			
			rollIdx = rid + 1;
			break;
		} case OP_POS: {
			//0: Value
			result = Math.abs(num(execute(token[0])));
			ooo = 1;
			res = resolve("u",ooo,token[0]);
			print = "+"+token[0].print;
			break;
		} case OP_NEG: {
			//0: Value
			result = -num(execute(token[0]));
			ooo = 1;
			res = resolve("u",ooo,token[0]);
			print = "-"+token[0].print;
			break;
		} case OP_NOT: {
			//0: Value
			result = execute(token[0])?0:1;
			ooo = 1;
			res = resolve("u",ooo,token[0]);
			print = "~"+token[0].print;
			break;
		} case OP_STR: {
			//0: Value
			result = str(execute(token[0]));
			ooo = 1;
			res = resolve("u",ooo,token[0]);
			print = "@"+token[0].print;
			break;
		} case OP_NUM: {
			//0: Value
			var val = execute(token[0]);
			switch(typeof(val)){
				case "number": result = val; break;
				case "string": result = parseInt(val.replace(/[^0-9]/g,"")); break;
			}
			ooo = 1;
			res = resolve("u",ooo,token[0]);
			print = "#"+token[0].print;
			break;
		} case OP_ADD: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			//Concatenate : Add
			result = (isStr(left) ? left + str(right) : left + num(right));
			ooo = 3;
			res = resolve("s",ooo,token[0],token[1]);
			print = token[0].print+" + "+token[1].print;
			break;
		} case OP_SUB: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left)){
				//Remove substring from string : Chop
				result = (isStr(right) ? left.replace(new RegExp(right,"g"),"")
					: (right < 0 ? left.slice(-right) : left.slice(0,-right))
				);
			} else result = left - num(right);
			ooo = 3;
			res = resolve("s",ooo,token[0],token[1]);
			print = token[0].print+" - "+token[1].print;
			break;
		} case OP_MUL: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left)){
				//Count occurances of substring in string
				if(isStr(right))result = left.split(right).length-1;
				//Repeat string
				else {
					//Negatives reverse string
					if(right < 0){
						left = strrev(left);
						right *= -1;
					}
					result = (limited ? strrep(left,Math.min(right,20)) : strrep(left,right));
				}
			} else {
				//Numerical multiplication
				result = num(left) * num(right);
			}
			ooo = 2;
			res = resolve("m",ooo,token[0],token[1]);
			print = token[0].print+" * "+token[1].print;
			break;
		} case OP_DIV: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left)){
				result = (isStr(right) ? left.match(new RegExp(this.escape(right),"g")).join("")
					: (right < 0 ? left.slice(0,right) : left.slice(right))
				);
			} else {
				//Numerical division
				result = num(left) / num(right);
			}
			ooo = 2;
			res = resolve("m",ooo,token[0],token[1]);
			print = token[0].print+" / "+token[1].print;
			break;
		} case OP_MOD: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left)){
				//Formatted string
				result = left.replace(/(^|[^%])%(?!%)-?/g,"$1"+str(right)).replace(/%(%+)/g,"$1");
			} else {
				//Return [correct] modulo (JS's is weird)
				right = num(right);
				result = ((left%right)+right)%right;
			}
			ooo = 2;
			res = resolve("m",ooo,token[0],token[1]);
			print = token[0].print+" % "+token[1].print;
			break;
		} case OP_BAND: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left)){
				if(isStr(right)){
					//Return chars that are in both
					result = "";
					for(var i=0;i<left.length;++i){
						if(right.indexOf(left.charAt(i)) != -1)result += left.charAt(i);
					}
				} else {
					var i=0;
					result = "";
					right = Math.abs(right);
					while(right){
						if(right&1)result += left.charAt(i);
						right >>= 1; ++i;
					}
				}
			} else result = left & num(right);
			ooo = 5;
			res = resolve("b",ooo,token[0],token[1]);
			print = token[0].print+" & "+token[1].print;
			break;
		} case OP_BXOR: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left)){
				if(isStr(right)){
					//Return chars that are in both
					result = "";
					for(var i=0;i<left.length;++i){
						if(right.indexOf(left.charAt(i)) == -1)result += left.charAt(i);
					}
				} else {
					var i=0;
					result = "";
					right = Math.abs(right);
					while(right){
						if(!(right&1))result += left.charAt(i);
						right >>= 1; ++i;
					}
				}
			} else result = left ^ num(right);
			ooo = 5;
			res = resolve("b",ooo,token[0],token[1]);
			print = token[0].print+" ^ "+token[1].print;
			break;
		} case OP_BOR: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(isStr(left) && isStr(right)){
				var lr = left+right;
				result = "";
				for(var i=0;i<lr.length;++i){
					if(result.indexOf(lr.charAt(i)) != -1)result += lr.charAt(i);
				}
			} else {
				result = num(left) | num(right);
			}
			ooo = 5;
			res = resolve("b",ooo,token[0],token[1]);
			print = token[0].print+" | "+token[1].print;
			break;
		} case OP_AND: {
			//0: Left value; 1: Right value
			result = Number(execute(token[0]) && execute(token[1]));
			ooo = 6;
			res = resolve("a",ooo,token[0],token[1]);
			print = token[0].print+" && "+token[1].print;
			break;
		} case OP_OR: {
			//0: Left value; 1: Right value
			result = Number(execute(token[0]) || execute(token[1]));
			ooo = 7;
			res = resolve("o",ooo,token[0],token[1]);
			print = token[0].print+" || "+token[1].print;
			break;
		} case OP_XOR: {
			//0: Left value; 1: Right value
			result = Number(Boolean(execute(token[0])) != Boolean(execute(token[1])));
			ooo = 7;
			res = resolve("o",ooo,token[0],token[1]);
			print = token[0].print+" ^^ "+token[1].print;
			break;
		} case OP_EQU: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = Number((isStr(left) && isStr(right)) ? left == right : num(left) == num(right));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" == "+token[1].print;
			break;
		} case OP_NEQ: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = Number((isStr(left) && isStr(right)) ? left != right : num(left) != num(right));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" != "+token[1].print;
			break;
		} case OP_LSS: {
			//0: Left value; 1: Right value
			result = Number(num(execute(token[0])) < num(execute(token[1])));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" < "+token[1].print;
			break;
		} case OP_LEQ: {
			//0: Left value; 1: Right value
			result = Number(num(execute(token[0])) <= num(execute(token[1])));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <= "+token[1].print;
			break;
		} case OP_GTR: {
			//0: Left value; 1: Right value
			result = Number(num(execute(token[0])) > num(execute(token[1])));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" > "+token[1].print;
			break;
		} case OP_GEQ: {
			//0: Left value; 1: Right value
			return Number(num(execute(token[0])) >= num(execute(token[1])));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >= "+token[1].print;
			break;
		} case OP_MIN: {
			result = (num(left) < num(right) ? left : right);
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <> "+token[1].print;
			break;
		} case OP_MNE: {
			result = (num(left) == num(right) ? 0 : (num(left) < num(right) ? left : right));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <!> "+token[1].print;
			break;
		} case OP_MAX: {
			result = (num(left) > num(right) ? left : right);
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >< "+token[1].print;
			break;
		} case OP_XNE: {
			result = (num(left) == num(right) ? 0 : (num(left) > num(right) ? left : right));
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >!< "+token[1].print;
			break;
		} case OP_SLSS: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (num(left) < num(right) ? left : 0);
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" << "+token[1].print;
			break;
		} case OP_SLEQ: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (num(left) <= num(right) ? left : 0);
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <=< "+token[1].print;
			break;
		} case OP_SGTR: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (num(left) > num(right) ? left : 0);
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >> "+token[1].print;
			break;
		} case OP_SGEQ: {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (num(left) >= num(right) ? left : 0);
			ooo = 4;
			res = resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >=> "+token[1].print;
			break;
		} case OP_COND: {
			//0: Conditional expression; 1: OP_CTOGS or True expression (with no false)
			var bool = Boolean(vars.s = execute(token[0]));
			ooo = 8;
			print = token[0].print+" ?"+(bool?"":":")+" ";
			if(token[1].type == OP_CTOG){
				result = execute(token[1],Number(bool))
				print += token[1].print;
			} else if(bool) {
				result = execute(token[1]);
				print += token[1].print;
			} else {
				result = 0;
				print += "0";
			}
			res = resolve("t",ooo,token[0],token[1]);
			break;
		} case OP_CTOG: {
			//0: Execute this; 1: OP_CTOG list or Ignored expression
			var right = token, i = 0, ret, last;
			if(typeof(doExec) == "undefined")doExec = 1;
			while(right.type == OP_CTOG){
				if((i & 1) != doExec){
					if(right[0] === null){
						ret = 0;
						last = {print: "0"};
					} else ret = execute(last = right[0]);
				}
				++i;
				right = right[1];
			}
			result = ((i & 1) != doExec ? execute(right) : ret);
			ooo = 8;
			res = resolve("t",ooo,token[0],token[1]);
			print = ((i & 1) != doExec ? right : last).print;
			break;
		} case OP_IDX: {
			//0: Token to subscript; 1: Index
			var idx = execute(token[1]);
			if(token[0].type == VAR){
				var vv = vars[token[0][0]];
				idx = num(idx);
				if(Array.isArray(vv)){
					result = (idx > vv.length ? 0 : vv[idx-1]);
				} else result = vv;
				token[0].print = (resolve("n") ? varName(token[0][0]) : token[0][0]);
				token[0].highest = 10;
				token[0].resolved = resolve("v",10,token[0]);
			} else {
				var x = execute(token[0]);
				if(isStr(x)){
					if(isStr(idx)){
						result = x.indexOf(idx)+1;
					} else if(idx < 0) {
						idx = x.length+idx;
						result = (idx < 0 ? '' : x.charAt(idx));
					} else {
						result = (idx > x.length || idx == 0 ? '' : x.charAt(idx-1));
					}
				} else result = x;
			}
			ooo = 9;
			res = resolve("i",ooo,token[0],token[1]);
			print = token[0].print+"["+token[1].print+"]";
			break;
		} case OP_PARA: {
			//0: Expression
			result = execute(token[0]);
			ooo = 0;
			res = resolve("g",ooo,token[0]);
			print = "("+token[0].print+")";
			break;
		} case OP_IGNR: {
			//0: Expression to ignore the print of
			result = execute(token[0]);
			res = false;
			token[0].print = "";
			ooo = 15;
			print = "";
			break;
		} case VAL_NUM: {
			//0: Number
			result = parseInt(token[0]);
			res = true;
			ooo = 15;
			break;
		} case VAL_STR: {
			//0: String
			result = token[0];
			ooo = 15;
			res = true;
			break;
		} case VAR: {
			//0: Variable name
			var vv = vars[token[0]];
			result = (Array.isArray(vv) ? (vv.length ? vv[vv.length-1] : 0) : vv);
			ooo = 10;
			res = resolve("v");
			print = (resolve("n") ? varName(token[0]) : token[0]);
			break;
		}
	}
	token.result = result;
	token.resolved = res;
	token.highest = Math.min(token.highest,ooo);
	if(res){
		token.print = qreal(result);
	} else {
		token.print = print;
	}
	return result;
}


/*
	Default template driver for JS/CC generated parsers running as
	browser-based JavaScript/ECMAScript applications.
	
	WARNING: 	This parser template will not run as console and has lesser
				features for debugging than the console derivates for the
				various JavaScript platforms.
	
	Features:
	- Parser trace messages
	- Integrated panic-mode error recovery
	
	Written 2007, 2008 by Jan Max Meyer, J.M.K S.F. Software Technologies
	
	This is in the public domain.
*/

if(typeof(alert) == "undefined")alert = console.log;
var NODEJS__dbg_withtrace		= false;
var NODEJS__dbg_string			= new String();

function __NODEJS_dbg_print( text )
{
	NODEJS__dbg_string += text + "\n";
}

function __NODEJS_lex( info )
{
	var state		= 0;
	var match		= -1;
	var match_pos	= 0;
	var start		= 0;
	var pos			= info.offset + 1;

	do
	{
		pos--;
		state = 0;
		match = -2;
		start = pos;

		if( info.src.length <= start )
			return 63;

		do
		{

switch( state )
{
	case 0:
		if( ( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 32 ) state = 1;
		else if( info.src.charCodeAt( pos ) == 33 ) state = 2;
		else if( info.src.charCodeAt( pos ) == 35 ) state = 3;
		else if( info.src.charCodeAt( pos ) == 37 ) state = 4;
		else if( info.src.charCodeAt( pos ) == 38 ) state = 5;
		else if( info.src.charCodeAt( pos ) == 40 ) state = 6;
		else if( info.src.charCodeAt( pos ) == 41 ) state = 7;
		else if( info.src.charCodeAt( pos ) == 42 ) state = 8;
		else if( info.src.charCodeAt( pos ) == 43 ) state = 9;
		else if( info.src.charCodeAt( pos ) == 44 ) state = 10;
		else if( info.src.charCodeAt( pos ) == 45 ) state = 11;
		else if( info.src.charCodeAt( pos ) == 47 ) state = 12;
		else if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 13;
		else if( info.src.charCodeAt( pos ) == 58 ) state = 14;
		else if( info.src.charCodeAt( pos ) == 59 ) state = 15;
		else if( info.src.charCodeAt( pos ) == 60 ) state = 16;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 17;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 18;
		else if( info.src.charCodeAt( pos ) == 63 ) state = 19;
		else if( info.src.charCodeAt( pos ) == 64 ) state = 20;
		else if( info.src.charCodeAt( pos ) == 65 || info.src.charCodeAt( pos ) == 97 ) state = 21;
		else if( info.src.charCodeAt( pos ) == 68 || info.src.charCodeAt( pos ) == 100 ) state = 22;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 23;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 24;
		else if( info.src.charCodeAt( pos ) == 91 ) state = 25;
		else if( info.src.charCodeAt( pos ) == 93 ) state = 26;
		else if( info.src.charCodeAt( pos ) == 94 ) state = 27;
		else if( info.src.charCodeAt( pos ) == 123 ) state = 28;
		else if( info.src.charCodeAt( pos ) == 124 ) state = 29;
		else if( info.src.charCodeAt( pos ) == 125 ) state = 30;
		else if( info.src.charCodeAt( pos ) == 34 ) state = 47;
		else if( info.src.charCodeAt( pos ) == 126 ) state = 48;
		else if( info.src.charCodeAt( pos ) == 77 || info.src.charCodeAt( pos ) == 109 ) state = 52;
		else if( info.src.charCodeAt( pos ) == 39 ) state = 58;
		else if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 99 || info.src.charCodeAt( pos ) == 105 || ( info.src.charCodeAt( pos ) >= 114 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 121 && info.src.charCodeAt( pos ) <= 122 ) ) state = 62;
		else if( info.src.charCodeAt( pos ) == 71 || info.src.charCodeAt( pos ) == 103 ) state = 65;
		else if( info.src.charCodeAt( pos ) == 88 || info.src.charCodeAt( pos ) == 120 ) state = 66;
		else if( info.src.charCodeAt( pos ) == 76 || info.src.charCodeAt( pos ) == 108 ) state = 67;
		else if( info.src.charCodeAt( pos ) == 111 ) state = 68;
		else if( info.src.charCodeAt( pos ) == 79 ) state = 69;
		else state = -1;
		break;

	case 1:
		state = -1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		if( info.src.charCodeAt( pos ) == 60 ) state = 31;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 32;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 33;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 3:
		state = -1;
		match = 11;
		match_pos = pos;
		break;

	case 4:
		state = -1;
		match = 14;
		match_pos = pos;
		break;

	case 5:
		if( info.src.charCodeAt( pos ) == 38 ) state = 35;
		else state = -1;
		match = 29;
		match_pos = pos;
		break;

	case 6:
		state = -1;
		match = 37;
		match_pos = pos;
		break;

	case 7:
		state = -1;
		match = 38;
		match_pos = pos;
		break;

	case 8:
		state = -1;
		match = 12;
		match_pos = pos;
		break;

	case 9:
		state = -1;
		match = 7;
		match_pos = pos;
		break;

	case 10:
		state = -1;
		match = 2;
		match_pos = pos;
		break;

	case 11:
		if( info.src.charCodeAt( pos ) == 45 ) state = 70;
		else state = -1;
		match = 8;
		match_pos = pos;
		break;

	case 12:
		state = -1;
		match = 13;
		match_pos = pos;
		break;

	case 13:
		if( ( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) ) state = 13;
		else state = -1;
		match = 46;
		match_pos = pos;
		break;

	case 14:
		state = -1;
		match = 36;
		match_pos = pos;
		break;

	case 15:
		state = -1;
		match = 3;
		match_pos = pos;
		break;

	case 16:
		if( info.src.charCodeAt( pos ) == 60 ) state = 36;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 37;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 55;
		else if( info.src.charCodeAt( pos ) == 33 || info.src.charCodeAt( pos ) == 126 ) state = 71;
		else state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 17:
		if( info.src.charCodeAt( pos ) == 61 ) state = 50;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 18:
		if( info.src.charCodeAt( pos ) == 60 ) state = 38;
		else if( info.src.charCodeAt( pos ) == 62 ) state = 39;
		else if( info.src.charCodeAt( pos ) == 61 ) state = 53;
		else if( info.src.charCodeAt( pos ) == 33 || info.src.charCodeAt( pos ) == 126 ) state = 72;
		else state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 19:
		state = -1;
		match = 35;
		match_pos = pos;
		break;

	case 20:
		state = -1;
		match = 10;
		match_pos = pos;
		break;

	case 21:
		if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 73;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 22:
		state = -1;
		match = 4;
		match_pos = pos;
		break;

	case 23:
		if( info.src.charCodeAt( pos ) == 81 || info.src.charCodeAt( pos ) == 113 ) state = 60;
		else state = -1;
		match = 5;
		match_pos = pos;
		break;

	case 24:
		if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 54;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 77;
		else state = -1;
		match = 6;
		match_pos = pos;
		break;

	case 25:
		state = -1;
		match = 39;
		match_pos = pos;
		break;

	case 26:
		state = -1;
		match = 40;
		match_pos = pos;
		break;

	case 27:
		if( info.src.charCodeAt( pos ) == 94 ) state = 42;
		else state = -1;
		match = 30;
		match_pos = pos;
		break;

	case 28:
		state = -1;
		match = 41;
		match_pos = pos;
		break;

	case 29:
		if( info.src.charCodeAt( pos ) == 124 ) state = 40;
		else state = -1;
		match = 31;
		match_pos = pos;
		break;

	case 30:
		state = -1;
		match = 42;
		match_pos = pos;
		break;

	case 31:
		state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 32:
		state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 33:
		state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 34:
		state = -1;
		match = 45;
		match_pos = pos;
		break;

	case 35:
		state = -1;
		match = 32;
		match_pos = pos;
		break;

	case 36:
		state = -1;
		match = 25;
		match_pos = pos;
		break;

	case 37:
		state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 38:
		state = -1;
		match = 23;
		match_pos = pos;
		break;

	case 39:
		state = -1;
		match = 27;
		match_pos = pos;
		break;

	case 40:
		state = -1;
		match = 33;
		match_pos = pos;
		break;

	case 41:
		if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 57;
		else state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 42:
		state = -1;
		match = 34;
		match_pos = pos;
		break;

	case 43:
		if( ( info.src.charCodeAt( pos ) >= 64 && info.src.charCodeAt( pos ) <= 68 ) || info.src.charCodeAt( pos ) == 71 || info.src.charCodeAt( pos ) == 73 || ( info.src.charCodeAt( pos ) >= 76 && info.src.charCodeAt( pos ) <= 80 ) || ( info.src.charCodeAt( pos ) >= 82 && info.src.charCodeAt( pos ) <= 86 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || info.src.charCodeAt( pos ) == 103 || info.src.charCodeAt( pos ) == 105 || ( info.src.charCodeAt( pos ) >= 108 && info.src.charCodeAt( pos ) <= 112 ) || ( info.src.charCodeAt( pos ) >= 114 && info.src.charCodeAt( pos ) <= 118 ) ) state = 43;
		else state = -1;
		match = 43;
		match_pos = pos;
		break;

	case 44:
		state = -1;
		match = 22;
		match_pos = pos;
		break;

	case 45:
		state = -1;
		match = 26;
		match_pos = pos;
		break;

	case 46:
		state = -1;
		match = 28;
		match_pos = pos;
		break;

	case 47:
		if( info.src.charCodeAt( pos ) == 34 ) state = 34;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 33 ) || ( info.src.charCodeAt( pos ) >= 35 && info.src.charCodeAt( pos ) <= 254 ) ) state = 47;
		else state = -1;
		break;

	case 48:
		if( info.src.charCodeAt( pos ) == 61 ) state = 32;
		else state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 49:
		state = -1;
		match = 19;
		match_pos = pos;
		break;

	case 50:
		state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 51:
		if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 61;
		else state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 52:
		if( info.src.charCodeAt( pos ) == 88 || info.src.charCodeAt( pos ) == 120 ) state = 38;
		else if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 56;
		else if( info.src.charCodeAt( pos ) == 65 || info.src.charCodeAt( pos ) == 97 ) state = 75;
		else if( info.src.charCodeAt( pos ) == 73 || info.src.charCodeAt( pos ) == 105 ) state = 76;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 53:
		if( info.src.charCodeAt( pos ) == 62 ) state = 46;
		else state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 54:
		if( info.src.charCodeAt( pos ) == 81 || info.src.charCodeAt( pos ) == 113 ) state = 32;
		else state = -1;
		match = 16;
		match_pos = pos;
		break;

	case 55:
		if( info.src.charCodeAt( pos ) == 60 ) state = 45;
		else state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 56:
		if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 44;
		else state = -1;
		match = 21;
		match_pos = pos;
		break;

	case 57:
		state = -1;
		match = 24;
		match_pos = pos;
		break;

	case 58:
		if( info.src.charCodeAt( pos ) == 39 ) state = 34;
		else if( ( info.src.charCodeAt( pos ) >= 0 && info.src.charCodeAt( pos ) <= 38 ) || ( info.src.charCodeAt( pos ) >= 40 && info.src.charCodeAt( pos ) <= 254 ) ) state = 58;
		else state = -1;
		break;

	case 59:
		state = -1;
		match = 9;
		match_pos = pos;
		break;

	case 60:
		if( info.src.charCodeAt( pos ) == 85 || info.src.charCodeAt( pos ) == 117 ) state = 50;
		else state = -1;
		match = 15;
		match_pos = pos;
		break;

	case 61:
		state = -1;
		match = 17;
		match_pos = pos;
		break;

	case 62:
		state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 63:
		if( info.src.charCodeAt( pos ) == 81 || info.src.charCodeAt( pos ) == 113 ) state = 31;
		else state = -1;
		match = 18;
		match_pos = pos;
		break;

	case 64:
		if( info.src.charCodeAt( pos ) == 81 || info.src.charCodeAt( pos ) == 113 ) state = 33;
		else state = -1;
		match = 20;
		match_pos = pos;
		break;

	case 65:
		if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 51;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 63;
		else state = -1;
		break;

	case 66:
		if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 41;
		else if( info.src.charCodeAt( pos ) == 79 || info.src.charCodeAt( pos ) == 111 ) state = 78;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 67:
		if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 49;
		else if( info.src.charCodeAt( pos ) == 69 || info.src.charCodeAt( pos ) == 101 ) state = 64;
		else if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 74;
		else state = -1;
		break;

	case 68:
		if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 40;
		else state = -1;
		match = 44;
		match_pos = pos;
		break;

	case 69:
		if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 40;
		else state = -1;
		break;

	case 70:
		if( ( info.src.charCodeAt( pos ) >= 64 && info.src.charCodeAt( pos ) <= 68 ) || info.src.charCodeAt( pos ) == 71 || info.src.charCodeAt( pos ) == 73 || ( info.src.charCodeAt( pos ) >= 76 && info.src.charCodeAt( pos ) <= 80 ) || ( info.src.charCodeAt( pos ) >= 82 && info.src.charCodeAt( pos ) <= 86 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 100 ) || info.src.charCodeAt( pos ) == 103 || info.src.charCodeAt( pos ) == 105 || ( info.src.charCodeAt( pos ) >= 108 && info.src.charCodeAt( pos ) <= 112 ) || ( info.src.charCodeAt( pos ) >= 114 && info.src.charCodeAt( pos ) <= 118 ) ) state = 43;
		else state = -1;
		break;

	case 71:
		if( info.src.charCodeAt( pos ) == 62 ) state = 44;
		else state = -1;
		break;

	case 72:
		if( info.src.charCodeAt( pos ) == 60 ) state = 57;
		else state = -1;
		break;

	case 73:
		if( info.src.charCodeAt( pos ) == 68 || info.src.charCodeAt( pos ) == 100 ) state = 35;
		else state = -1;
		break;

	case 74:
		if( info.src.charCodeAt( pos ) == 83 || info.src.charCodeAt( pos ) == 115 ) state = 49;
		else state = -1;
		break;

	case 75:
		if( info.src.charCodeAt( pos ) == 88 || info.src.charCodeAt( pos ) == 120 ) state = 38;
		else state = -1;
		break;

	case 76:
		if( info.src.charCodeAt( pos ) == 78 || info.src.charCodeAt( pos ) == 110 ) state = 37;
		else state = -1;
		break;

	case 77:
		if( info.src.charCodeAt( pos ) == 84 || info.src.charCodeAt( pos ) == 116 ) state = 59;
		else state = -1;
		break;

	case 78:
		if( info.src.charCodeAt( pos ) == 82 || info.src.charCodeAt( pos ) == 114 ) state = 42;
		else state = -1;
		break;

}


			pos++;

		}
		while( state > -1 );

	}
	while( 1 > -1 && match == 1 );

	if( match > -1 )
	{
		info.att = info.src.substr( start, match_pos - start );
		info.offset = match_pos;
		
switch( match )
{
	case 43:
		{
		 info.att = info.att.slice(2); 
		}
		break;

	case 45:
		{
		 info.att = info.att.slice(1,-1); 
		}
		break;

}


	}
	else
	{
		info.att = new String();
		match = -1;
	}

	return match;
}


function __NODEJS_parse( src, err_off, err_la )
{
	var		sstack			= new Array();
	var		vstack			= new Array();
	var 	err_cnt			= 0;
	var		act;
	var		go;
	var		la;
	var		rval;
	var 	parseinfo		= new Function( "", "var offset; var src; var att;" );
	var		info			= new parseinfo();
	
/* Pop-Table */
var pop_tab = new Array(
	new Array( 0/* ExprList' */, 1 ),
	new Array( 47/* ExprList */, 3 ),
	new Array( 47/* ExprList */, 3 ),
	new Array( 47/* ExprList */, 1 ),
	new Array( 48/* ExprOpts */, 2 ),
	new Array( 48/* ExprOpts */, 1 ),
	new Array( 48/* ExprOpts */, 0 ),
	new Array( 49/* Expr */, 1 ),
	new Array( 50/* Conditional */, 3 ),
	new Array( 50/* Conditional */, 1 ),
	new Array( 51/* CondSwap */, 2 ),
	new Array( 51/* CondSwap */, 3 ),
	new Array( 51/* CondSwap */, 1 ),
	new Array( 52/* LogicalOrs */, 3 ),
	new Array( 52/* LogicalOrs */, 3 ),
	new Array( 52/* LogicalOrs */, 1 ),
	new Array( 53/* LogicalAnd */, 3 ),
	new Array( 53/* LogicalAnd */, 1 ),
	new Array( 54/* BitwiseOr */, 3 ),
	new Array( 54/* BitwiseOr */, 1 ),
	new Array( 55/* BitwiseXor */, 3 ),
	new Array( 55/* BitwiseXor */, 1 ),
	new Array( 56/* BitwiseAnd */, 3 ),
	new Array( 56/* BitwiseAnd */, 1 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 3 ),
	new Array( 57/* Comparisons */, 1 ),
	new Array( 58/* AddSub */, 3 ),
	new Array( 58/* AddSub */, 3 ),
	new Array( 58/* AddSub */, 1 ),
	new Array( 59/* MulDivMod */, 3 ),
	new Array( 59/* MulDivMod */, 3 ),
	new Array( 59/* MulDivMod */, 3 ),
	new Array( 59/* MulDivMod */, 1 ),
	new Array( 60/* Dice */, 7 ),
	new Array( 60/* Dice */, 3 ),
	new Array( 60/* Dice */, 1 ),
	new Array( 61/* Unary */, 2 ),
	new Array( 61/* Unary */, 2 ),
	new Array( 61/* Unary */, 2 ),
	new Array( 61/* Unary */, 2 ),
	new Array( 61/* Unary */, 2 ),
	new Array( 61/* Unary */, 1 ),
	new Array( 62/* Value */, 1 ),
	new Array( 62/* Value */, 4 ),
	new Array( 62/* Value */, 1 ),
	new Array( 62/* Value */, 4 ),
	new Array( 62/* Value */, 1 ),
	new Array( 62/* Value */, 6 ),
	new Array( 62/* Value */, 3 ),
	new Array( 62/* Value */, 2 ),
	new Array( 62/* Value */, 2 )
);

/* Action-Table */
var act_tab = new Array(
	/* State 0 */ new Array( 43/* "Options" */,3 , 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 , 63/* "$" */,-6 , 2/* "," */,-6 , 3/* ";" */,-6 ),
	/* State 1 */ new Array( 3/* ";" */,28 , 2/* "," */,29 , 63/* "$" */,0 ),
	/* State 2 */ new Array( 63/* "$" */,-3 , 2/* "," */,-3 , 3/* ";" */,-3 ),
	/* State 3 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 4 */ new Array( 63/* "$" */,-5 , 2/* "," */,-5 , 3/* ";" */,-5 ),
	/* State 5 */ new Array( 35/* "?" */,31 , 63/* "$" */,-7 , 2/* "," */,-7 , 3/* ";" */,-7 , 38/* ")" */,-7 , 40/* "]" */,-7 , 42/* "}" */,-7 ),
	/* State 6 */ new Array( 63/* "$" */,-9 , 2/* "," */,-9 , 3/* ";" */,-9 , 35/* "?" */,-9 , 38/* ")" */,-9 , 40/* "]" */,-9 , 42/* "}" */,-9 ),
	/* State 7 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 8 */ new Array( 34/* "XOR" */,33 , 33/* "OR" */,34 , 36/* ":" */,35 , 63/* "$" */,-12 , 2/* "," */,-12 , 3/* ";" */,-12 , 35/* "?" */,-12 , 38/* ")" */,-12 , 40/* "]" */,-12 , 42/* "}" */,-12 ),
	/* State 9 */ new Array( 32/* "AND" */,36 , 36/* ":" */,-15 , 63/* "$" */,-15 , 2/* "," */,-15 , 3/* ";" */,-15 , 35/* "?" */,-15 , 33/* "OR" */,-15 , 34/* "XOR" */,-15 , 38/* ")" */,-15 , 40/* "]" */,-15 , 42/* "}" */,-15 ),
	/* State 10 */ new Array( 31/* "|" */,37 , 36/* ":" */,-17 , 63/* "$" */,-17 , 2/* "," */,-17 , 3/* ";" */,-17 , 35/* "?" */,-17 , 33/* "OR" */,-17 , 34/* "XOR" */,-17 , 32/* "AND" */,-17 , 38/* ")" */,-17 , 40/* "]" */,-17 , 42/* "}" */,-17 ),
	/* State 11 */ new Array( 30/* "^" */,38 , 36/* ":" */,-19 , 63/* "$" */,-19 , 2/* "," */,-19 , 3/* ";" */,-19 , 35/* "?" */,-19 , 33/* "OR" */,-19 , 34/* "XOR" */,-19 , 32/* "AND" */,-19 , 31/* "|" */,-19 , 38/* ")" */,-19 , 40/* "]" */,-19 , 42/* "}" */,-19 ),
	/* State 12 */ new Array( 29/* "&" */,39 , 36/* ":" */,-21 , 63/* "$" */,-21 , 2/* "," */,-21 , 3/* ";" */,-21 , 35/* "?" */,-21 , 33/* "OR" */,-21 , 34/* "XOR" */,-21 , 32/* "AND" */,-21 , 31/* "|" */,-21 , 30/* "^" */,-21 , 38/* ")" */,-21 , 40/* "]" */,-21 , 42/* "}" */,-21 ),
	/* State 13 */ new Array( 28/* ">=>" */,40 , 27/* ">>" */,41 , 26/* "<=<" */,42 , 25/* "<<" */,43 , 24/* "XNE" */,44 , 23/* "MAX" */,45 , 22/* "MNE" */,46 , 21/* "MIN" */,47 , 20/* "LEQ" */,48 , 19/* "LSS" */,49 , 18/* "GEQ" */,50 , 17/* "GTR" */,51 , 16/* "NEQ" */,52 , 15/* "EQU" */,53 , 36/* ":" */,-23 , 63/* "$" */,-23 , 2/* "," */,-23 , 3/* ";" */,-23 , 35/* "?" */,-23 , 33/* "OR" */,-23 , 34/* "XOR" */,-23 , 32/* "AND" */,-23 , 31/* "|" */,-23 , 30/* "^" */,-23 , 29/* "&" */,-23 , 38/* ")" */,-23 , 40/* "]" */,-23 , 42/* "}" */,-23 ),
	/* State 14 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-38 , 63/* "$" */,-38 , 2/* "," */,-38 , 3/* ";" */,-38 , 35/* "?" */,-38 , 33/* "OR" */,-38 , 34/* "XOR" */,-38 , 32/* "AND" */,-38 , 31/* "|" */,-38 , 30/* "^" */,-38 , 29/* "&" */,-38 , 15/* "EQU" */,-38 , 16/* "NEQ" */,-38 , 17/* "GTR" */,-38 , 18/* "GEQ" */,-38 , 19/* "LSS" */,-38 , 20/* "LEQ" */,-38 , 21/* "MIN" */,-38 , 22/* "MNE" */,-38 , 23/* "MAX" */,-38 , 24/* "XNE" */,-38 , 25/* "<<" */,-38 , 26/* "<=<" */,-38 , 27/* ">>" */,-38 , 28/* ">=>" */,-38 , 38/* ")" */,-38 , 40/* "]" */,-38 , 42/* "}" */,-38 ),
	/* State 15 */ new Array( 14/* "%" */,56 , 13/* "/" */,57 , 12/* "*" */,58 , 36/* ":" */,-41 , 63/* "$" */,-41 , 2/* "," */,-41 , 3/* ";" */,-41 , 35/* "?" */,-41 , 33/* "OR" */,-41 , 34/* "XOR" */,-41 , 32/* "AND" */,-41 , 31/* "|" */,-41 , 30/* "^" */,-41 , 29/* "&" */,-41 , 15/* "EQU" */,-41 , 16/* "NEQ" */,-41 , 17/* "GTR" */,-41 , 18/* "GEQ" */,-41 , 19/* "LSS" */,-41 , 20/* "LEQ" */,-41 , 21/* "MIN" */,-41 , 22/* "MNE" */,-41 , 23/* "MAX" */,-41 , 24/* "XNE" */,-41 , 25/* "<<" */,-41 , 26/* "<=<" */,-41 , 27/* ">>" */,-41 , 28/* ">=>" */,-41 , 7/* "+" */,-41 , 8/* "-" */,-41 , 38/* ")" */,-41 , 40/* "]" */,-41 , 42/* "}" */,-41 ),
	/* State 16 */ new Array( 36/* ":" */,-45 , 63/* "$" */,-45 , 2/* "," */,-45 , 3/* ";" */,-45 , 35/* "?" */,-45 , 33/* "OR" */,-45 , 34/* "XOR" */,-45 , 32/* "AND" */,-45 , 31/* "|" */,-45 , 30/* "^" */,-45 , 29/* "&" */,-45 , 15/* "EQU" */,-45 , 16/* "NEQ" */,-45 , 17/* "GTR" */,-45 , 18/* "GEQ" */,-45 , 19/* "LSS" */,-45 , 20/* "LEQ" */,-45 , 21/* "MIN" */,-45 , 22/* "MNE" */,-45 , 23/* "MAX" */,-45 , 24/* "XNE" */,-45 , 25/* "<<" */,-45 , 26/* "<=<" */,-45 , 27/* ">>" */,-45 , 28/* ">=>" */,-45 , 7/* "+" */,-45 , 8/* "-" */,-45 , 12/* "*" */,-45 , 13/* "/" */,-45 , 14/* "%" */,-45 , 38/* ")" */,-45 , 40/* "]" */,-45 , 42/* "}" */,-45 ),
	/* State 17 */ new Array( 4/* "d" */,59 , 36/* ":" */,-48 , 63/* "$" */,-48 , 2/* "," */,-48 , 3/* ";" */,-48 , 35/* "?" */,-48 , 33/* "OR" */,-48 , 34/* "XOR" */,-48 , 32/* "AND" */,-48 , 31/* "|" */,-48 , 30/* "^" */,-48 , 29/* "&" */,-48 , 15/* "EQU" */,-48 , 16/* "NEQ" */,-48 , 17/* "GTR" */,-48 , 18/* "GEQ" */,-48 , 19/* "LSS" */,-48 , 20/* "LEQ" */,-48 , 21/* "MIN" */,-48 , 22/* "MNE" */,-48 , 23/* "MAX" */,-48 , 24/* "XNE" */,-48 , 25/* "<<" */,-48 , 26/* "<=<" */,-48 , 27/* ">>" */,-48 , 28/* ">=>" */,-48 , 7/* "+" */,-48 , 8/* "-" */,-48 , 12/* "*" */,-48 , 13/* "/" */,-48 , 14/* "%" */,-48 , 38/* ")" */,-48 , 40/* "]" */,-48 , 42/* "}" */,-48 ),
	/* State 18 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 19 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 20 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 21 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 22 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 23 */ new Array( 6/* "n" */,65 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 , 4/* "d" */,-54 , 36/* ":" */,-54 , 63/* "$" */,-54 , 2/* "," */,-54 , 3/* ";" */,-54 , 35/* "?" */,-54 , 33/* "OR" */,-54 , 34/* "XOR" */,-54 , 32/* "AND" */,-54 , 31/* "|" */,-54 , 30/* "^" */,-54 , 29/* "&" */,-54 , 15/* "EQU" */,-54 , 16/* "NEQ" */,-54 , 17/* "GTR" */,-54 , 18/* "GEQ" */,-54 , 19/* "LSS" */,-54 , 20/* "LEQ" */,-54 , 21/* "MIN" */,-54 , 22/* "MNE" */,-54 , 23/* "MAX" */,-54 , 24/* "XNE" */,-54 , 25/* "<<" */,-54 , 26/* "<=<" */,-54 , 27/* ">>" */,-54 , 28/* ">=>" */,-54 , 7/* "+" */,-54 , 8/* "-" */,-54 , 12/* "*" */,-54 , 13/* "/" */,-54 , 14/* "%" */,-54 , 38/* ")" */,-54 , 5/* "e" */,-54 , 40/* "]" */,-54 , 42/* "}" */,-54 ),
	/* State 24 */ new Array( 4/* "d" */,-55 , 36/* ":" */,-55 , 63/* "$" */,-55 , 2/* "," */,-55 , 3/* ";" */,-55 , 35/* "?" */,-55 , 33/* "OR" */,-55 , 34/* "XOR" */,-55 , 32/* "AND" */,-55 , 31/* "|" */,-55 , 30/* "^" */,-55 , 29/* "&" */,-55 , 15/* "EQU" */,-55 , 16/* "NEQ" */,-55 , 17/* "GTR" */,-55 , 18/* "GEQ" */,-55 , 19/* "LSS" */,-55 , 20/* "LEQ" */,-55 , 21/* "MIN" */,-55 , 22/* "MNE" */,-55 , 23/* "MAX" */,-55 , 24/* "XNE" */,-55 , 25/* "<<" */,-55 , 26/* "<=<" */,-55 , 27/* ">>" */,-55 , 28/* ">=>" */,-55 , 7/* "+" */,-55 , 8/* "-" */,-55 , 12/* "*" */,-55 , 13/* "/" */,-55 , 14/* "%" */,-55 , 46/* "Number" */,-55 , 45/* "String" */,-55 , 44/* "Variable" */,-55 , 37/* "(" */,-55 , 6/* "n" */,-55 , 38/* ")" */,-55 , 5/* "e" */,-55 , 40/* "]" */,-55 , 42/* "}" */,-55 ),
	/* State 25 */ new Array( 39/* "[" */,67 , 4/* "d" */,-57 , 36/* ":" */,-57 , 63/* "$" */,-57 , 2/* "," */,-57 , 3/* ";" */,-57 , 35/* "?" */,-57 , 33/* "OR" */,-57 , 34/* "XOR" */,-57 , 32/* "AND" */,-57 , 31/* "|" */,-57 , 30/* "^" */,-57 , 29/* "&" */,-57 , 15/* "EQU" */,-57 , 16/* "NEQ" */,-57 , 17/* "GTR" */,-57 , 18/* "GEQ" */,-57 , 19/* "LSS" */,-57 , 20/* "LEQ" */,-57 , 21/* "MIN" */,-57 , 22/* "MNE" */,-57 , 23/* "MAX" */,-57 , 24/* "XNE" */,-57 , 25/* "<<" */,-57 , 26/* "<=<" */,-57 , 27/* ">>" */,-57 , 28/* ">=>" */,-57 , 7/* "+" */,-57 , 8/* "-" */,-57 , 12/* "*" */,-57 , 13/* "/" */,-57 , 14/* "%" */,-57 , 46/* "Number" */,-57 , 45/* "String" */,-57 , 44/* "Variable" */,-57 , 37/* "(" */,-57 , 6/* "n" */,-57 , 38/* ")" */,-57 , 5/* "e" */,-57 , 40/* "]" */,-57 , 42/* "}" */,-57 ),
	/* State 26 */ new Array( 39/* "[" */,68 , 4/* "d" */,-59 , 36/* ":" */,-59 , 63/* "$" */,-59 , 2/* "," */,-59 , 3/* ";" */,-59 , 35/* "?" */,-59 , 33/* "OR" */,-59 , 34/* "XOR" */,-59 , 32/* "AND" */,-59 , 31/* "|" */,-59 , 30/* "^" */,-59 , 29/* "&" */,-59 , 15/* "EQU" */,-59 , 16/* "NEQ" */,-59 , 17/* "GTR" */,-59 , 18/* "GEQ" */,-59 , 19/* "LSS" */,-59 , 20/* "LEQ" */,-59 , 21/* "MIN" */,-59 , 22/* "MNE" */,-59 , 23/* "MAX" */,-59 , 24/* "XNE" */,-59 , 25/* "<<" */,-59 , 26/* "<=<" */,-59 , 27/* ">>" */,-59 , 28/* ">=>" */,-59 , 7/* "+" */,-59 , 8/* "-" */,-59 , 12/* "*" */,-59 , 13/* "/" */,-59 , 14/* "%" */,-59 , 46/* "Number" */,-59 , 45/* "String" */,-59 , 44/* "Variable" */,-59 , 37/* "(" */,-59 , 6/* "n" */,-59 , 38/* ")" */,-59 , 5/* "e" */,-59 , 40/* "]" */,-59 , 42/* "}" */,-59 ),
	/* State 27 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 28 */ new Array( 43/* "Options" */,3 , 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 , 63/* "$" */,-6 , 2/* "," */,-6 , 3/* ";" */,-6 ),
	/* State 29 */ new Array( 43/* "Options" */,3 , 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 , 63/* "$" */,-6 , 2/* "," */,-6 , 3/* ";" */,-6 ),
	/* State 30 */ new Array( 63/* "$" */,-4 , 2/* "," */,-4 , 3/* ";" */,-4 ),
	/* State 31 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 32 */ new Array( 63/* "$" */,-10 , 2/* "," */,-10 , 3/* ";" */,-10 , 35/* "?" */,-10 , 38/* ")" */,-10 , 40/* "]" */,-10 , 42/* "}" */,-10 ),
	/* State 33 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 34 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 35 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 36 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 37 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 38 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 39 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 40 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 41 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 42 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 43 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 44 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 45 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 46 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 47 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 48 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 49 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 50 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 51 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 52 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 53 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 54 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 55 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 56 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 57 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 58 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 59 */ new Array( 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 60 */ new Array( 4/* "d" */,-49 , 36/* ":" */,-49 , 63/* "$" */,-49 , 2/* "," */,-49 , 3/* ";" */,-49 , 35/* "?" */,-49 , 33/* "OR" */,-49 , 34/* "XOR" */,-49 , 32/* "AND" */,-49 , 31/* "|" */,-49 , 30/* "^" */,-49 , 29/* "&" */,-49 , 15/* "EQU" */,-49 , 16/* "NEQ" */,-49 , 17/* "GTR" */,-49 , 18/* "GEQ" */,-49 , 19/* "LSS" */,-49 , 20/* "LEQ" */,-49 , 21/* "MIN" */,-49 , 22/* "MNE" */,-49 , 23/* "MAX" */,-49 , 24/* "XNE" */,-49 , 25/* "<<" */,-49 , 26/* "<=<" */,-49 , 27/* ">>" */,-49 , 28/* ">=>" */,-49 , 7/* "+" */,-49 , 8/* "-" */,-49 , 12/* "*" */,-49 , 13/* "/" */,-49 , 14/* "%" */,-49 , 38/* ")" */,-49 , 5/* "e" */,-49 , 40/* "]" */,-49 , 42/* "}" */,-49 ),
	/* State 61 */ new Array( 4/* "d" */,-50 , 36/* ":" */,-50 , 63/* "$" */,-50 , 2/* "," */,-50 , 3/* ";" */,-50 , 35/* "?" */,-50 , 33/* "OR" */,-50 , 34/* "XOR" */,-50 , 32/* "AND" */,-50 , 31/* "|" */,-50 , 30/* "^" */,-50 , 29/* "&" */,-50 , 15/* "EQU" */,-50 , 16/* "NEQ" */,-50 , 17/* "GTR" */,-50 , 18/* "GEQ" */,-50 , 19/* "LSS" */,-50 , 20/* "LEQ" */,-50 , 21/* "MIN" */,-50 , 22/* "MNE" */,-50 , 23/* "MAX" */,-50 , 24/* "XNE" */,-50 , 25/* "<<" */,-50 , 26/* "<=<" */,-50 , 27/* ">>" */,-50 , 28/* ">=>" */,-50 , 7/* "+" */,-50 , 8/* "-" */,-50 , 12/* "*" */,-50 , 13/* "/" */,-50 , 14/* "%" */,-50 , 38/* ")" */,-50 , 5/* "e" */,-50 , 40/* "]" */,-50 , 42/* "}" */,-50 ),
	/* State 62 */ new Array( 4/* "d" */,-51 , 36/* ":" */,-51 , 63/* "$" */,-51 , 2/* "," */,-51 , 3/* ";" */,-51 , 35/* "?" */,-51 , 33/* "OR" */,-51 , 34/* "XOR" */,-51 , 32/* "AND" */,-51 , 31/* "|" */,-51 , 30/* "^" */,-51 , 29/* "&" */,-51 , 15/* "EQU" */,-51 , 16/* "NEQ" */,-51 , 17/* "GTR" */,-51 , 18/* "GEQ" */,-51 , 19/* "LSS" */,-51 , 20/* "LEQ" */,-51 , 21/* "MIN" */,-51 , 22/* "MNE" */,-51 , 23/* "MAX" */,-51 , 24/* "XNE" */,-51 , 25/* "<<" */,-51 , 26/* "<=<" */,-51 , 27/* ">>" */,-51 , 28/* ">=>" */,-51 , 7/* "+" */,-51 , 8/* "-" */,-51 , 12/* "*" */,-51 , 13/* "/" */,-51 , 14/* "%" */,-51 , 38/* ")" */,-51 , 5/* "e" */,-51 , 40/* "]" */,-51 , 42/* "}" */,-51 ),
	/* State 63 */ new Array( 4/* "d" */,-52 , 36/* ":" */,-52 , 63/* "$" */,-52 , 2/* "," */,-52 , 3/* ";" */,-52 , 35/* "?" */,-52 , 33/* "OR" */,-52 , 34/* "XOR" */,-52 , 32/* "AND" */,-52 , 31/* "|" */,-52 , 30/* "^" */,-52 , 29/* "&" */,-52 , 15/* "EQU" */,-52 , 16/* "NEQ" */,-52 , 17/* "GTR" */,-52 , 18/* "GEQ" */,-52 , 19/* "LSS" */,-52 , 20/* "LEQ" */,-52 , 21/* "MIN" */,-52 , 22/* "MNE" */,-52 , 23/* "MAX" */,-52 , 24/* "XNE" */,-52 , 25/* "<<" */,-52 , 26/* "<=<" */,-52 , 27/* ">>" */,-52 , 28/* ">=>" */,-52 , 7/* "+" */,-52 , 8/* "-" */,-52 , 12/* "*" */,-52 , 13/* "/" */,-52 , 14/* "%" */,-52 , 38/* ")" */,-52 , 5/* "e" */,-52 , 40/* "]" */,-52 , 42/* "}" */,-52 ),
	/* State 64 */ new Array( 4/* "d" */,-53 , 36/* ":" */,-53 , 63/* "$" */,-53 , 2/* "," */,-53 , 3/* ";" */,-53 , 35/* "?" */,-53 , 33/* "OR" */,-53 , 34/* "XOR" */,-53 , 32/* "AND" */,-53 , 31/* "|" */,-53 , 30/* "^" */,-53 , 29/* "&" */,-53 , 15/* "EQU" */,-53 , 16/* "NEQ" */,-53 , 17/* "GTR" */,-53 , 18/* "GEQ" */,-53 , 19/* "LSS" */,-53 , 20/* "LEQ" */,-53 , 21/* "MIN" */,-53 , 22/* "MNE" */,-53 , 23/* "MAX" */,-53 , 24/* "XNE" */,-53 , 25/* "<<" */,-53 , 26/* "<=<" */,-53 , 27/* ">>" */,-53 , 28/* ">=>" */,-53 , 7/* "+" */,-53 , 8/* "-" */,-53 , 12/* "*" */,-53 , 13/* "/" */,-53 , 14/* "%" */,-53 , 38/* ")" */,-53 , 5/* "e" */,-53 , 40/* "]" */,-53 , 42/* "}" */,-53 ),
	/* State 65 */ new Array( 4/* "d" */,-63 , 36/* ":" */,-63 , 63/* "$" */,-63 , 2/* "," */,-63 , 3/* ";" */,-63 , 35/* "?" */,-63 , 33/* "OR" */,-63 , 34/* "XOR" */,-63 , 32/* "AND" */,-63 , 31/* "|" */,-63 , 30/* "^" */,-63 , 29/* "&" */,-63 , 15/* "EQU" */,-63 , 16/* "NEQ" */,-63 , 17/* "GTR" */,-63 , 18/* "GEQ" */,-63 , 19/* "LSS" */,-63 , 20/* "LEQ" */,-63 , 21/* "MIN" */,-63 , 22/* "MNE" */,-63 , 23/* "MAX" */,-63 , 24/* "XNE" */,-63 , 25/* "<<" */,-63 , 26/* "<=<" */,-63 , 27/* ">>" */,-63 , 28/* ">=>" */,-63 , 7/* "+" */,-63 , 8/* "-" */,-63 , 12/* "*" */,-63 , 13/* "/" */,-63 , 14/* "%" */,-63 , 46/* "Number" */,-63 , 45/* "String" */,-63 , 44/* "Variable" */,-63 , 37/* "(" */,-63 , 6/* "n" */,-63 , 38/* ")" */,-63 , 5/* "e" */,-63 , 40/* "]" */,-63 , 42/* "}" */,-63 ),
	/* State 66 */ new Array( 6/* "n" */,65 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 , 4/* "d" */,-62 , 36/* ":" */,-62 , 63/* "$" */,-62 , 2/* "," */,-62 , 3/* ";" */,-62 , 35/* "?" */,-62 , 33/* "OR" */,-62 , 34/* "XOR" */,-62 , 32/* "AND" */,-62 , 31/* "|" */,-62 , 30/* "^" */,-62 , 29/* "&" */,-62 , 15/* "EQU" */,-62 , 16/* "NEQ" */,-62 , 17/* "GTR" */,-62 , 18/* "GEQ" */,-62 , 19/* "LSS" */,-62 , 20/* "LEQ" */,-62 , 21/* "MIN" */,-62 , 22/* "MNE" */,-62 , 23/* "MAX" */,-62 , 24/* "XNE" */,-62 , 25/* "<<" */,-62 , 26/* "<=<" */,-62 , 27/* ">>" */,-62 , 28/* ">=>" */,-62 , 7/* "+" */,-62 , 8/* "-" */,-62 , 12/* "*" */,-62 , 13/* "/" */,-62 , 14/* "%" */,-62 , 38/* ")" */,-62 , 5/* "e" */,-62 , 40/* "]" */,-62 , 42/* "}" */,-62 ),
	/* State 67 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 68 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 69 */ new Array( 38/* ")" */,102 ),
	/* State 70 */ new Array( 63/* "$" */,-2 , 2/* "," */,-2 , 3/* ";" */,-2 ),
	/* State 71 */ new Array( 63/* "$" */,-1 , 2/* "," */,-1 , 3/* ";" */,-1 ),
	/* State 72 */ new Array( 63/* "$" */,-8 , 2/* "," */,-8 , 3/* ";" */,-8 , 35/* "?" */,-8 , 38/* ")" */,-8 , 40/* "]" */,-8 , 42/* "}" */,-8 ),
	/* State 73 */ new Array( 32/* "AND" */,36 , 36/* ":" */,-14 , 63/* "$" */,-14 , 2/* "," */,-14 , 3/* ";" */,-14 , 35/* "?" */,-14 , 33/* "OR" */,-14 , 34/* "XOR" */,-14 , 38/* ")" */,-14 , 40/* "]" */,-14 , 42/* "}" */,-14 ),
	/* State 74 */ new Array( 32/* "AND" */,36 , 36/* ":" */,-13 , 63/* "$" */,-13 , 2/* "," */,-13 , 3/* ";" */,-13 , 35/* "?" */,-13 , 33/* "OR" */,-13 , 34/* "XOR" */,-13 , 38/* ")" */,-13 , 40/* "]" */,-13 , 42/* "}" */,-13 ),
	/* State 75 */ new Array( 63/* "$" */,-11 , 2/* "," */,-11 , 3/* ";" */,-11 , 35/* "?" */,-11 , 38/* ")" */,-11 , 40/* "]" */,-11 , 42/* "}" */,-11 ),
	/* State 76 */ new Array( 31/* "|" */,37 , 36/* ":" */,-16 , 63/* "$" */,-16 , 2/* "," */,-16 , 3/* ";" */,-16 , 35/* "?" */,-16 , 33/* "OR" */,-16 , 34/* "XOR" */,-16 , 32/* "AND" */,-16 , 38/* ")" */,-16 , 40/* "]" */,-16 , 42/* "}" */,-16 ),
	/* State 77 */ new Array( 30/* "^" */,38 , 36/* ":" */,-18 , 63/* "$" */,-18 , 2/* "," */,-18 , 3/* ";" */,-18 , 35/* "?" */,-18 , 33/* "OR" */,-18 , 34/* "XOR" */,-18 , 32/* "AND" */,-18 , 31/* "|" */,-18 , 38/* ")" */,-18 , 40/* "]" */,-18 , 42/* "}" */,-18 ),
	/* State 78 */ new Array( 29/* "&" */,39 , 36/* ":" */,-20 , 63/* "$" */,-20 , 2/* "," */,-20 , 3/* ";" */,-20 , 35/* "?" */,-20 , 33/* "OR" */,-20 , 34/* "XOR" */,-20 , 32/* "AND" */,-20 , 31/* "|" */,-20 , 30/* "^" */,-20 , 38/* ")" */,-20 , 40/* "]" */,-20 , 42/* "}" */,-20 ),
	/* State 79 */ new Array( 28/* ">=>" */,40 , 27/* ">>" */,41 , 26/* "<=<" */,42 , 25/* "<<" */,43 , 24/* "XNE" */,44 , 23/* "MAX" */,45 , 22/* "MNE" */,46 , 21/* "MIN" */,47 , 20/* "LEQ" */,48 , 19/* "LSS" */,49 , 18/* "GEQ" */,50 , 17/* "GTR" */,51 , 16/* "NEQ" */,52 , 15/* "EQU" */,53 , 36/* ":" */,-22 , 63/* "$" */,-22 , 2/* "," */,-22 , 3/* ";" */,-22 , 35/* "?" */,-22 , 33/* "OR" */,-22 , 34/* "XOR" */,-22 , 32/* "AND" */,-22 , 31/* "|" */,-22 , 30/* "^" */,-22 , 29/* "&" */,-22 , 38/* ")" */,-22 , 40/* "]" */,-22 , 42/* "}" */,-22 ),
	/* State 80 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-37 , 63/* "$" */,-37 , 2/* "," */,-37 , 3/* ";" */,-37 , 35/* "?" */,-37 , 33/* "OR" */,-37 , 34/* "XOR" */,-37 , 32/* "AND" */,-37 , 31/* "|" */,-37 , 30/* "^" */,-37 , 29/* "&" */,-37 , 15/* "EQU" */,-37 , 16/* "NEQ" */,-37 , 17/* "GTR" */,-37 , 18/* "GEQ" */,-37 , 19/* "LSS" */,-37 , 20/* "LEQ" */,-37 , 21/* "MIN" */,-37 , 22/* "MNE" */,-37 , 23/* "MAX" */,-37 , 24/* "XNE" */,-37 , 25/* "<<" */,-37 , 26/* "<=<" */,-37 , 27/* ">>" */,-37 , 28/* ">=>" */,-37 , 38/* ")" */,-37 , 40/* "]" */,-37 , 42/* "}" */,-37 ),
	/* State 81 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-36 , 63/* "$" */,-36 , 2/* "," */,-36 , 3/* ";" */,-36 , 35/* "?" */,-36 , 33/* "OR" */,-36 , 34/* "XOR" */,-36 , 32/* "AND" */,-36 , 31/* "|" */,-36 , 30/* "^" */,-36 , 29/* "&" */,-36 , 15/* "EQU" */,-36 , 16/* "NEQ" */,-36 , 17/* "GTR" */,-36 , 18/* "GEQ" */,-36 , 19/* "LSS" */,-36 , 20/* "LEQ" */,-36 , 21/* "MIN" */,-36 , 22/* "MNE" */,-36 , 23/* "MAX" */,-36 , 24/* "XNE" */,-36 , 25/* "<<" */,-36 , 26/* "<=<" */,-36 , 27/* ">>" */,-36 , 28/* ">=>" */,-36 , 38/* ")" */,-36 , 40/* "]" */,-36 , 42/* "}" */,-36 ),
	/* State 82 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-35 , 63/* "$" */,-35 , 2/* "," */,-35 , 3/* ";" */,-35 , 35/* "?" */,-35 , 33/* "OR" */,-35 , 34/* "XOR" */,-35 , 32/* "AND" */,-35 , 31/* "|" */,-35 , 30/* "^" */,-35 , 29/* "&" */,-35 , 15/* "EQU" */,-35 , 16/* "NEQ" */,-35 , 17/* "GTR" */,-35 , 18/* "GEQ" */,-35 , 19/* "LSS" */,-35 , 20/* "LEQ" */,-35 , 21/* "MIN" */,-35 , 22/* "MNE" */,-35 , 23/* "MAX" */,-35 , 24/* "XNE" */,-35 , 25/* "<<" */,-35 , 26/* "<=<" */,-35 , 27/* ">>" */,-35 , 28/* ">=>" */,-35 , 38/* ")" */,-35 , 40/* "]" */,-35 , 42/* "}" */,-35 ),
	/* State 83 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-34 , 63/* "$" */,-34 , 2/* "," */,-34 , 3/* ";" */,-34 , 35/* "?" */,-34 , 33/* "OR" */,-34 , 34/* "XOR" */,-34 , 32/* "AND" */,-34 , 31/* "|" */,-34 , 30/* "^" */,-34 , 29/* "&" */,-34 , 15/* "EQU" */,-34 , 16/* "NEQ" */,-34 , 17/* "GTR" */,-34 , 18/* "GEQ" */,-34 , 19/* "LSS" */,-34 , 20/* "LEQ" */,-34 , 21/* "MIN" */,-34 , 22/* "MNE" */,-34 , 23/* "MAX" */,-34 , 24/* "XNE" */,-34 , 25/* "<<" */,-34 , 26/* "<=<" */,-34 , 27/* ">>" */,-34 , 28/* ">=>" */,-34 , 38/* ")" */,-34 , 40/* "]" */,-34 , 42/* "}" */,-34 ),
	/* State 84 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-33 , 63/* "$" */,-33 , 2/* "," */,-33 , 3/* ";" */,-33 , 35/* "?" */,-33 , 33/* "OR" */,-33 , 34/* "XOR" */,-33 , 32/* "AND" */,-33 , 31/* "|" */,-33 , 30/* "^" */,-33 , 29/* "&" */,-33 , 15/* "EQU" */,-33 , 16/* "NEQ" */,-33 , 17/* "GTR" */,-33 , 18/* "GEQ" */,-33 , 19/* "LSS" */,-33 , 20/* "LEQ" */,-33 , 21/* "MIN" */,-33 , 22/* "MNE" */,-33 , 23/* "MAX" */,-33 , 24/* "XNE" */,-33 , 25/* "<<" */,-33 , 26/* "<=<" */,-33 , 27/* ">>" */,-33 , 28/* ">=>" */,-33 , 38/* ")" */,-33 , 40/* "]" */,-33 , 42/* "}" */,-33 ),
	/* State 85 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-32 , 63/* "$" */,-32 , 2/* "," */,-32 , 3/* ";" */,-32 , 35/* "?" */,-32 , 33/* "OR" */,-32 , 34/* "XOR" */,-32 , 32/* "AND" */,-32 , 31/* "|" */,-32 , 30/* "^" */,-32 , 29/* "&" */,-32 , 15/* "EQU" */,-32 , 16/* "NEQ" */,-32 , 17/* "GTR" */,-32 , 18/* "GEQ" */,-32 , 19/* "LSS" */,-32 , 20/* "LEQ" */,-32 , 21/* "MIN" */,-32 , 22/* "MNE" */,-32 , 23/* "MAX" */,-32 , 24/* "XNE" */,-32 , 25/* "<<" */,-32 , 26/* "<=<" */,-32 , 27/* ">>" */,-32 , 28/* ">=>" */,-32 , 38/* ")" */,-32 , 40/* "]" */,-32 , 42/* "}" */,-32 ),
	/* State 86 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-31 , 63/* "$" */,-31 , 2/* "," */,-31 , 3/* ";" */,-31 , 35/* "?" */,-31 , 33/* "OR" */,-31 , 34/* "XOR" */,-31 , 32/* "AND" */,-31 , 31/* "|" */,-31 , 30/* "^" */,-31 , 29/* "&" */,-31 , 15/* "EQU" */,-31 , 16/* "NEQ" */,-31 , 17/* "GTR" */,-31 , 18/* "GEQ" */,-31 , 19/* "LSS" */,-31 , 20/* "LEQ" */,-31 , 21/* "MIN" */,-31 , 22/* "MNE" */,-31 , 23/* "MAX" */,-31 , 24/* "XNE" */,-31 , 25/* "<<" */,-31 , 26/* "<=<" */,-31 , 27/* ">>" */,-31 , 28/* ">=>" */,-31 , 38/* ")" */,-31 , 40/* "]" */,-31 , 42/* "}" */,-31 ),
	/* State 87 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-30 , 63/* "$" */,-30 , 2/* "," */,-30 , 3/* ";" */,-30 , 35/* "?" */,-30 , 33/* "OR" */,-30 , 34/* "XOR" */,-30 , 32/* "AND" */,-30 , 31/* "|" */,-30 , 30/* "^" */,-30 , 29/* "&" */,-30 , 15/* "EQU" */,-30 , 16/* "NEQ" */,-30 , 17/* "GTR" */,-30 , 18/* "GEQ" */,-30 , 19/* "LSS" */,-30 , 20/* "LEQ" */,-30 , 21/* "MIN" */,-30 , 22/* "MNE" */,-30 , 23/* "MAX" */,-30 , 24/* "XNE" */,-30 , 25/* "<<" */,-30 , 26/* "<=<" */,-30 , 27/* ">>" */,-30 , 28/* ">=>" */,-30 , 38/* ")" */,-30 , 40/* "]" */,-30 , 42/* "}" */,-30 ),
	/* State 88 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-29 , 63/* "$" */,-29 , 2/* "," */,-29 , 3/* ";" */,-29 , 35/* "?" */,-29 , 33/* "OR" */,-29 , 34/* "XOR" */,-29 , 32/* "AND" */,-29 , 31/* "|" */,-29 , 30/* "^" */,-29 , 29/* "&" */,-29 , 15/* "EQU" */,-29 , 16/* "NEQ" */,-29 , 17/* "GTR" */,-29 , 18/* "GEQ" */,-29 , 19/* "LSS" */,-29 , 20/* "LEQ" */,-29 , 21/* "MIN" */,-29 , 22/* "MNE" */,-29 , 23/* "MAX" */,-29 , 24/* "XNE" */,-29 , 25/* "<<" */,-29 , 26/* "<=<" */,-29 , 27/* ">>" */,-29 , 28/* ">=>" */,-29 , 38/* ")" */,-29 , 40/* "]" */,-29 , 42/* "}" */,-29 ),
	/* State 89 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-28 , 63/* "$" */,-28 , 2/* "," */,-28 , 3/* ";" */,-28 , 35/* "?" */,-28 , 33/* "OR" */,-28 , 34/* "XOR" */,-28 , 32/* "AND" */,-28 , 31/* "|" */,-28 , 30/* "^" */,-28 , 29/* "&" */,-28 , 15/* "EQU" */,-28 , 16/* "NEQ" */,-28 , 17/* "GTR" */,-28 , 18/* "GEQ" */,-28 , 19/* "LSS" */,-28 , 20/* "LEQ" */,-28 , 21/* "MIN" */,-28 , 22/* "MNE" */,-28 , 23/* "MAX" */,-28 , 24/* "XNE" */,-28 , 25/* "<<" */,-28 , 26/* "<=<" */,-28 , 27/* ">>" */,-28 , 28/* ">=>" */,-28 , 38/* ")" */,-28 , 40/* "]" */,-28 , 42/* "}" */,-28 ),
	/* State 90 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-27 , 63/* "$" */,-27 , 2/* "," */,-27 , 3/* ";" */,-27 , 35/* "?" */,-27 , 33/* "OR" */,-27 , 34/* "XOR" */,-27 , 32/* "AND" */,-27 , 31/* "|" */,-27 , 30/* "^" */,-27 , 29/* "&" */,-27 , 15/* "EQU" */,-27 , 16/* "NEQ" */,-27 , 17/* "GTR" */,-27 , 18/* "GEQ" */,-27 , 19/* "LSS" */,-27 , 20/* "LEQ" */,-27 , 21/* "MIN" */,-27 , 22/* "MNE" */,-27 , 23/* "MAX" */,-27 , 24/* "XNE" */,-27 , 25/* "<<" */,-27 , 26/* "<=<" */,-27 , 27/* ">>" */,-27 , 28/* ">=>" */,-27 , 38/* ")" */,-27 , 40/* "]" */,-27 , 42/* "}" */,-27 ),
	/* State 91 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-26 , 63/* "$" */,-26 , 2/* "," */,-26 , 3/* ";" */,-26 , 35/* "?" */,-26 , 33/* "OR" */,-26 , 34/* "XOR" */,-26 , 32/* "AND" */,-26 , 31/* "|" */,-26 , 30/* "^" */,-26 , 29/* "&" */,-26 , 15/* "EQU" */,-26 , 16/* "NEQ" */,-26 , 17/* "GTR" */,-26 , 18/* "GEQ" */,-26 , 19/* "LSS" */,-26 , 20/* "LEQ" */,-26 , 21/* "MIN" */,-26 , 22/* "MNE" */,-26 , 23/* "MAX" */,-26 , 24/* "XNE" */,-26 , 25/* "<<" */,-26 , 26/* "<=<" */,-26 , 27/* ">>" */,-26 , 28/* ">=>" */,-26 , 38/* ")" */,-26 , 40/* "]" */,-26 , 42/* "}" */,-26 ),
	/* State 92 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-25 , 63/* "$" */,-25 , 2/* "," */,-25 , 3/* ";" */,-25 , 35/* "?" */,-25 , 33/* "OR" */,-25 , 34/* "XOR" */,-25 , 32/* "AND" */,-25 , 31/* "|" */,-25 , 30/* "^" */,-25 , 29/* "&" */,-25 , 15/* "EQU" */,-25 , 16/* "NEQ" */,-25 , 17/* "GTR" */,-25 , 18/* "GEQ" */,-25 , 19/* "LSS" */,-25 , 20/* "LEQ" */,-25 , 21/* "MIN" */,-25 , 22/* "MNE" */,-25 , 23/* "MAX" */,-25 , 24/* "XNE" */,-25 , 25/* "<<" */,-25 , 26/* "<=<" */,-25 , 27/* ">>" */,-25 , 28/* ">=>" */,-25 , 38/* ")" */,-25 , 40/* "]" */,-25 , 42/* "}" */,-25 ),
	/* State 93 */ new Array( 8/* "-" */,54 , 7/* "+" */,55 , 36/* ":" */,-24 , 63/* "$" */,-24 , 2/* "," */,-24 , 3/* ";" */,-24 , 35/* "?" */,-24 , 33/* "OR" */,-24 , 34/* "XOR" */,-24 , 32/* "AND" */,-24 , 31/* "|" */,-24 , 30/* "^" */,-24 , 29/* "&" */,-24 , 15/* "EQU" */,-24 , 16/* "NEQ" */,-24 , 17/* "GTR" */,-24 , 18/* "GEQ" */,-24 , 19/* "LSS" */,-24 , 20/* "LEQ" */,-24 , 21/* "MIN" */,-24 , 22/* "MNE" */,-24 , 23/* "MAX" */,-24 , 24/* "XNE" */,-24 , 25/* "<<" */,-24 , 26/* "<=<" */,-24 , 27/* ">>" */,-24 , 28/* ">=>" */,-24 , 38/* ")" */,-24 , 40/* "]" */,-24 , 42/* "}" */,-24 ),
	/* State 94 */ new Array( 14/* "%" */,56 , 13/* "/" */,57 , 12/* "*" */,58 , 36/* ":" */,-40 , 63/* "$" */,-40 , 2/* "," */,-40 , 3/* ";" */,-40 , 35/* "?" */,-40 , 33/* "OR" */,-40 , 34/* "XOR" */,-40 , 32/* "AND" */,-40 , 31/* "|" */,-40 , 30/* "^" */,-40 , 29/* "&" */,-40 , 15/* "EQU" */,-40 , 16/* "NEQ" */,-40 , 17/* "GTR" */,-40 , 18/* "GEQ" */,-40 , 19/* "LSS" */,-40 , 20/* "LEQ" */,-40 , 21/* "MIN" */,-40 , 22/* "MNE" */,-40 , 23/* "MAX" */,-40 , 24/* "XNE" */,-40 , 25/* "<<" */,-40 , 26/* "<=<" */,-40 , 27/* ">>" */,-40 , 28/* ">=>" */,-40 , 7/* "+" */,-40 , 8/* "-" */,-40 , 38/* ")" */,-40 , 40/* "]" */,-40 , 42/* "}" */,-40 ),
	/* State 95 */ new Array( 14/* "%" */,56 , 13/* "/" */,57 , 12/* "*" */,58 , 36/* ":" */,-39 , 63/* "$" */,-39 , 2/* "," */,-39 , 3/* ";" */,-39 , 35/* "?" */,-39 , 33/* "OR" */,-39 , 34/* "XOR" */,-39 , 32/* "AND" */,-39 , 31/* "|" */,-39 , 30/* "^" */,-39 , 29/* "&" */,-39 , 15/* "EQU" */,-39 , 16/* "NEQ" */,-39 , 17/* "GTR" */,-39 , 18/* "GEQ" */,-39 , 19/* "LSS" */,-39 , 20/* "LEQ" */,-39 , 21/* "MIN" */,-39 , 22/* "MNE" */,-39 , 23/* "MAX" */,-39 , 24/* "XNE" */,-39 , 25/* "<<" */,-39 , 26/* "<=<" */,-39 , 27/* ">>" */,-39 , 28/* ">=>" */,-39 , 7/* "+" */,-39 , 8/* "-" */,-39 , 38/* ")" */,-39 , 40/* "]" */,-39 , 42/* "}" */,-39 ),
	/* State 96 */ new Array( 36/* ":" */,-44 , 63/* "$" */,-44 , 2/* "," */,-44 , 3/* ";" */,-44 , 35/* "?" */,-44 , 33/* "OR" */,-44 , 34/* "XOR" */,-44 , 32/* "AND" */,-44 , 31/* "|" */,-44 , 30/* "^" */,-44 , 29/* "&" */,-44 , 15/* "EQU" */,-44 , 16/* "NEQ" */,-44 , 17/* "GTR" */,-44 , 18/* "GEQ" */,-44 , 19/* "LSS" */,-44 , 20/* "LEQ" */,-44 , 21/* "MIN" */,-44 , 22/* "MNE" */,-44 , 23/* "MAX" */,-44 , 24/* "XNE" */,-44 , 25/* "<<" */,-44 , 26/* "<=<" */,-44 , 27/* ">>" */,-44 , 28/* ">=>" */,-44 , 7/* "+" */,-44 , 8/* "-" */,-44 , 12/* "*" */,-44 , 13/* "/" */,-44 , 14/* "%" */,-44 , 38/* ")" */,-44 , 40/* "]" */,-44 , 42/* "}" */,-44 ),
	/* State 97 */ new Array( 36/* ":" */,-43 , 63/* "$" */,-43 , 2/* "," */,-43 , 3/* ";" */,-43 , 35/* "?" */,-43 , 33/* "OR" */,-43 , 34/* "XOR" */,-43 , 32/* "AND" */,-43 , 31/* "|" */,-43 , 30/* "^" */,-43 , 29/* "&" */,-43 , 15/* "EQU" */,-43 , 16/* "NEQ" */,-43 , 17/* "GTR" */,-43 , 18/* "GEQ" */,-43 , 19/* "LSS" */,-43 , 20/* "LEQ" */,-43 , 21/* "MIN" */,-43 , 22/* "MNE" */,-43 , 23/* "MAX" */,-43 , 24/* "XNE" */,-43 , 25/* "<<" */,-43 , 26/* "<=<" */,-43 , 27/* ">>" */,-43 , 28/* ">=>" */,-43 , 7/* "+" */,-43 , 8/* "-" */,-43 , 12/* "*" */,-43 , 13/* "/" */,-43 , 14/* "%" */,-43 , 38/* ")" */,-43 , 40/* "]" */,-43 , 42/* "}" */,-43 ),
	/* State 98 */ new Array( 36/* ":" */,-42 , 63/* "$" */,-42 , 2/* "," */,-42 , 3/* ";" */,-42 , 35/* "?" */,-42 , 33/* "OR" */,-42 , 34/* "XOR" */,-42 , 32/* "AND" */,-42 , 31/* "|" */,-42 , 30/* "^" */,-42 , 29/* "&" */,-42 , 15/* "EQU" */,-42 , 16/* "NEQ" */,-42 , 17/* "GTR" */,-42 , 18/* "GEQ" */,-42 , 19/* "LSS" */,-42 , 20/* "LEQ" */,-42 , 21/* "MIN" */,-42 , 22/* "MNE" */,-42 , 23/* "MAX" */,-42 , 24/* "XNE" */,-42 , 25/* "<<" */,-42 , 26/* "<=<" */,-42 , 27/* ">>" */,-42 , 28/* ">=>" */,-42 , 7/* "+" */,-42 , 8/* "-" */,-42 , 12/* "*" */,-42 , 13/* "/" */,-42 , 14/* "%" */,-42 , 38/* ")" */,-42 , 40/* "]" */,-42 , 42/* "}" */,-42 ),
	/* State 99 */ new Array( 5/* "e" */,103 , 36/* ":" */,-47 , 63/* "$" */,-47 , 2/* "," */,-47 , 3/* ";" */,-47 , 35/* "?" */,-47 , 33/* "OR" */,-47 , 34/* "XOR" */,-47 , 32/* "AND" */,-47 , 31/* "|" */,-47 , 30/* "^" */,-47 , 29/* "&" */,-47 , 15/* "EQU" */,-47 , 16/* "NEQ" */,-47 , 17/* "GTR" */,-47 , 18/* "GEQ" */,-47 , 19/* "LSS" */,-47 , 20/* "LEQ" */,-47 , 21/* "MIN" */,-47 , 22/* "MNE" */,-47 , 23/* "MAX" */,-47 , 24/* "XNE" */,-47 , 25/* "<<" */,-47 , 26/* "<=<" */,-47 , 27/* ">>" */,-47 , 28/* ">=>" */,-47 , 7/* "+" */,-47 , 8/* "-" */,-47 , 12/* "*" */,-47 , 13/* "/" */,-47 , 14/* "%" */,-47 , 38/* ")" */,-47 , 40/* "]" */,-47 , 42/* "}" */,-47 ),
	/* State 100 */ new Array( 40/* "]" */,104 ),
	/* State 101 */ new Array( 40/* "]" */,105 ),
	/* State 102 */ new Array( 39/* "[" */,106 , 4/* "d" */,-61 , 36/* ":" */,-61 , 63/* "$" */,-61 , 2/* "," */,-61 , 3/* ";" */,-61 , 35/* "?" */,-61 , 33/* "OR" */,-61 , 34/* "XOR" */,-61 , 32/* "AND" */,-61 , 31/* "|" */,-61 , 30/* "^" */,-61 , 29/* "&" */,-61 , 15/* "EQU" */,-61 , 16/* "NEQ" */,-61 , 17/* "GTR" */,-61 , 18/* "GEQ" */,-61 , 19/* "LSS" */,-61 , 20/* "LEQ" */,-61 , 21/* "MIN" */,-61 , 22/* "MNE" */,-61 , 23/* "MAX" */,-61 , 24/* "XNE" */,-61 , 25/* "<<" */,-61 , 26/* "<=<" */,-61 , 27/* ">>" */,-61 , 28/* ">=>" */,-61 , 7/* "+" */,-61 , 8/* "-" */,-61 , 12/* "*" */,-61 , 13/* "/" */,-61 , 14/* "%" */,-61 , 46/* "Number" */,-61 , 45/* "String" */,-61 , 44/* "Variable" */,-61 , 37/* "(" */,-61 , 6/* "n" */,-61 , 38/* ")" */,-61 , 5/* "e" */,-61 , 40/* "]" */,-61 , 42/* "}" */,-61 ),
	/* State 103 */ new Array( 41/* "{" */,107 ),
	/* State 104 */ new Array( 4/* "d" */,-56 , 36/* ":" */,-56 , 63/* "$" */,-56 , 2/* "," */,-56 , 3/* ";" */,-56 , 35/* "?" */,-56 , 33/* "OR" */,-56 , 34/* "XOR" */,-56 , 32/* "AND" */,-56 , 31/* "|" */,-56 , 30/* "^" */,-56 , 29/* "&" */,-56 , 15/* "EQU" */,-56 , 16/* "NEQ" */,-56 , 17/* "GTR" */,-56 , 18/* "GEQ" */,-56 , 19/* "LSS" */,-56 , 20/* "LEQ" */,-56 , 21/* "MIN" */,-56 , 22/* "MNE" */,-56 , 23/* "MAX" */,-56 , 24/* "XNE" */,-56 , 25/* "<<" */,-56 , 26/* "<=<" */,-56 , 27/* ">>" */,-56 , 28/* ">=>" */,-56 , 7/* "+" */,-56 , 8/* "-" */,-56 , 12/* "*" */,-56 , 13/* "/" */,-56 , 14/* "%" */,-56 , 46/* "Number" */,-56 , 45/* "String" */,-56 , 44/* "Variable" */,-56 , 37/* "(" */,-56 , 6/* "n" */,-56 , 38/* ")" */,-56 , 5/* "e" */,-56 , 40/* "]" */,-56 , 42/* "}" */,-56 ),
	/* State 105 */ new Array( 4/* "d" */,-58 , 36/* ":" */,-58 , 63/* "$" */,-58 , 2/* "," */,-58 , 3/* ";" */,-58 , 35/* "?" */,-58 , 33/* "OR" */,-58 , 34/* "XOR" */,-58 , 32/* "AND" */,-58 , 31/* "|" */,-58 , 30/* "^" */,-58 , 29/* "&" */,-58 , 15/* "EQU" */,-58 , 16/* "NEQ" */,-58 , 17/* "GTR" */,-58 , 18/* "GEQ" */,-58 , 19/* "LSS" */,-58 , 20/* "LEQ" */,-58 , 21/* "MIN" */,-58 , 22/* "MNE" */,-58 , 23/* "MAX" */,-58 , 24/* "XNE" */,-58 , 25/* "<<" */,-58 , 26/* "<=<" */,-58 , 27/* ">>" */,-58 , 28/* ">=>" */,-58 , 7/* "+" */,-58 , 8/* "-" */,-58 , 12/* "*" */,-58 , 13/* "/" */,-58 , 14/* "%" */,-58 , 46/* "Number" */,-58 , 45/* "String" */,-58 , 44/* "Variable" */,-58 , 37/* "(" */,-58 , 6/* "n" */,-58 , 38/* ")" */,-58 , 5/* "e" */,-58 , 40/* "]" */,-58 , 42/* "}" */,-58 ),
	/* State 106 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 107 */ new Array( 36/* ":" */,7 , 7/* "+" */,18 , 8/* "-" */,19 , 9/* "NOT" */,20 , 10/* "@" */,21 , 11/* "#" */,22 , 46/* "Number" */,24 , 45/* "String" */,25 , 44/* "Variable" */,26 , 37/* "(" */,27 ),
	/* State 108 */ new Array( 40/* "]" */,110 ),
	/* State 109 */ new Array( 42/* "}" */,111 ),
	/* State 110 */ new Array( 4/* "d" */,-60 , 36/* ":" */,-60 , 63/* "$" */,-60 , 2/* "," */,-60 , 3/* ";" */,-60 , 35/* "?" */,-60 , 33/* "OR" */,-60 , 34/* "XOR" */,-60 , 32/* "AND" */,-60 , 31/* "|" */,-60 , 30/* "^" */,-60 , 29/* "&" */,-60 , 15/* "EQU" */,-60 , 16/* "NEQ" */,-60 , 17/* "GTR" */,-60 , 18/* "GEQ" */,-60 , 19/* "LSS" */,-60 , 20/* "LEQ" */,-60 , 21/* "MIN" */,-60 , 22/* "MNE" */,-60 , 23/* "MAX" */,-60 , 24/* "XNE" */,-60 , 25/* "<<" */,-60 , 26/* "<=<" */,-60 , 27/* ">>" */,-60 , 28/* ">=>" */,-60 , 7/* "+" */,-60 , 8/* "-" */,-60 , 12/* "*" */,-60 , 13/* "/" */,-60 , 14/* "%" */,-60 , 46/* "Number" */,-60 , 45/* "String" */,-60 , 44/* "Variable" */,-60 , 37/* "(" */,-60 , 6/* "n" */,-60 , 38/* ")" */,-60 , 5/* "e" */,-60 , 40/* "]" */,-60 , 42/* "}" */,-60 ),
	/* State 111 */ new Array( 36/* ":" */,-46 , 63/* "$" */,-46 , 2/* "," */,-46 , 3/* ";" */,-46 , 35/* "?" */,-46 , 33/* "OR" */,-46 , 34/* "XOR" */,-46 , 32/* "AND" */,-46 , 31/* "|" */,-46 , 30/* "^" */,-46 , 29/* "&" */,-46 , 15/* "EQU" */,-46 , 16/* "NEQ" */,-46 , 17/* "GTR" */,-46 , 18/* "GEQ" */,-46 , 19/* "LSS" */,-46 , 20/* "LEQ" */,-46 , 21/* "MIN" */,-46 , 22/* "MNE" */,-46 , 23/* "MAX" */,-46 , 24/* "XNE" */,-46 , 25/* "<<" */,-46 , 26/* "<=<" */,-46 , 27/* ">>" */,-46 , 28/* ">=>" */,-46 , 7/* "+" */,-46 , 8/* "-" */,-46 , 12/* "*" */,-46 , 13/* "/" */,-46 , 14/* "%" */,-46 , 38/* ")" */,-46 , 40/* "]" */,-46 , 42/* "}" */,-46 )
);

/* Goto-Table */
var goto_tab = new Array(
	/* State 0 */ new Array( 47/* ExprList */,1 , 48/* ExprOpts */,2 , 49/* Expr */,4 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 1 */ new Array(  ),
	/* State 2 */ new Array(  ),
	/* State 3 */ new Array( 49/* Expr */,30 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 4 */ new Array(  ),
	/* State 5 */ new Array(  ),
	/* State 6 */ new Array(  ),
	/* State 7 */ new Array( 51/* CondSwap */,32 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 8 */ new Array(  ),
	/* State 9 */ new Array(  ),
	/* State 10 */ new Array(  ),
	/* State 11 */ new Array(  ),
	/* State 12 */ new Array(  ),
	/* State 13 */ new Array(  ),
	/* State 14 */ new Array(  ),
	/* State 15 */ new Array(  ),
	/* State 16 */ new Array(  ),
	/* State 17 */ new Array(  ),
	/* State 18 */ new Array( 61/* Unary */,60 , 62/* Value */,23 ),
	/* State 19 */ new Array( 61/* Unary */,61 , 62/* Value */,23 ),
	/* State 20 */ new Array( 61/* Unary */,62 , 62/* Value */,23 ),
	/* State 21 */ new Array( 61/* Unary */,63 , 62/* Value */,23 ),
	/* State 22 */ new Array( 61/* Unary */,64 , 62/* Value */,23 ),
	/* State 23 */ new Array( 62/* Value */,66 ),
	/* State 24 */ new Array(  ),
	/* State 25 */ new Array(  ),
	/* State 26 */ new Array(  ),
	/* State 27 */ new Array( 49/* Expr */,69 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 28 */ new Array( 48/* ExprOpts */,70 , 49/* Expr */,4 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 29 */ new Array( 48/* ExprOpts */,71 , 49/* Expr */,4 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 30 */ new Array(  ),
	/* State 31 */ new Array( 51/* CondSwap */,72 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 32 */ new Array(  ),
	/* State 33 */ new Array( 53/* LogicalAnd */,73 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 34 */ new Array( 53/* LogicalAnd */,74 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 35 */ new Array( 51/* CondSwap */,75 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 36 */ new Array( 54/* BitwiseOr */,76 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 37 */ new Array( 55/* BitwiseXor */,77 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 38 */ new Array( 56/* BitwiseAnd */,78 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 39 */ new Array( 57/* Comparisons */,79 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 40 */ new Array( 58/* AddSub */,80 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 41 */ new Array( 58/* AddSub */,81 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 42 */ new Array( 58/* AddSub */,82 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 43 */ new Array( 58/* AddSub */,83 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 44 */ new Array( 58/* AddSub */,84 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 45 */ new Array( 58/* AddSub */,85 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 46 */ new Array( 58/* AddSub */,86 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 47 */ new Array( 58/* AddSub */,87 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 48 */ new Array( 58/* AddSub */,88 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 49 */ new Array( 58/* AddSub */,89 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 50 */ new Array( 58/* AddSub */,90 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 51 */ new Array( 58/* AddSub */,91 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 52 */ new Array( 58/* AddSub */,92 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 53 */ new Array( 58/* AddSub */,93 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 54 */ new Array( 59/* MulDivMod */,94 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 55 */ new Array( 59/* MulDivMod */,95 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 56 */ new Array( 60/* Dice */,96 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 57 */ new Array( 60/* Dice */,97 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 58 */ new Array( 60/* Dice */,98 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 59 */ new Array( 61/* Unary */,99 , 62/* Value */,23 ),
	/* State 60 */ new Array(  ),
	/* State 61 */ new Array(  ),
	/* State 62 */ new Array(  ),
	/* State 63 */ new Array(  ),
	/* State 64 */ new Array(  ),
	/* State 65 */ new Array(  ),
	/* State 66 */ new Array( 62/* Value */,66 ),
	/* State 67 */ new Array( 49/* Expr */,100 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 68 */ new Array( 49/* Expr */,101 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 69 */ new Array(  ),
	/* State 70 */ new Array(  ),
	/* State 71 */ new Array(  ),
	/* State 72 */ new Array(  ),
	/* State 73 */ new Array(  ),
	/* State 74 */ new Array(  ),
	/* State 75 */ new Array(  ),
	/* State 76 */ new Array(  ),
	/* State 77 */ new Array(  ),
	/* State 78 */ new Array(  ),
	/* State 79 */ new Array(  ),
	/* State 80 */ new Array(  ),
	/* State 81 */ new Array(  ),
	/* State 82 */ new Array(  ),
	/* State 83 */ new Array(  ),
	/* State 84 */ new Array(  ),
	/* State 85 */ new Array(  ),
	/* State 86 */ new Array(  ),
	/* State 87 */ new Array(  ),
	/* State 88 */ new Array(  ),
	/* State 89 */ new Array(  ),
	/* State 90 */ new Array(  ),
	/* State 91 */ new Array(  ),
	/* State 92 */ new Array(  ),
	/* State 93 */ new Array(  ),
	/* State 94 */ new Array(  ),
	/* State 95 */ new Array(  ),
	/* State 96 */ new Array(  ),
	/* State 97 */ new Array(  ),
	/* State 98 */ new Array(  ),
	/* State 99 */ new Array(  ),
	/* State 100 */ new Array(  ),
	/* State 101 */ new Array(  ),
	/* State 102 */ new Array(  ),
	/* State 103 */ new Array(  ),
	/* State 104 */ new Array(  ),
	/* State 105 */ new Array(  ),
	/* State 106 */ new Array( 49/* Expr */,108 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 107 */ new Array( 49/* Expr */,109 , 50/* Conditional */,5 , 51/* CondSwap */,6 , 52/* LogicalOrs */,8 , 53/* LogicalAnd */,9 , 54/* BitwiseOr */,10 , 55/* BitwiseXor */,11 , 56/* BitwiseAnd */,12 , 57/* Comparisons */,13 , 58/* AddSub */,14 , 59/* MulDivMod */,15 , 60/* Dice */,16 , 61/* Unary */,17 , 62/* Value */,23 ),
	/* State 108 */ new Array(  ),
	/* State 109 */ new Array(  ),
	/* State 110 */ new Array(  ),
	/* State 111 */ new Array(  )
);



/* Symbol labels */
var labels = new Array(
	"ExprList'" /* Non-terminal symbol */,
	"WHITESPACE" /* Terminal symbol */,
	"," /* Terminal symbol */,
	";" /* Terminal symbol */,
	"d" /* Terminal symbol */,
	"e" /* Terminal symbol */,
	"n" /* Terminal symbol */,
	"+" /* Terminal symbol */,
	"-" /* Terminal symbol */,
	"NOT" /* Terminal symbol */,
	"@" /* Terminal symbol */,
	"#" /* Terminal symbol */,
	"*" /* Terminal symbol */,
	"/" /* Terminal symbol */,
	"%" /* Terminal symbol */,
	"EQU" /* Terminal symbol */,
	"NEQ" /* Terminal symbol */,
	"GTR" /* Terminal symbol */,
	"GEQ" /* Terminal symbol */,
	"LSS" /* Terminal symbol */,
	"LEQ" /* Terminal symbol */,
	"MIN" /* Terminal symbol */,
	"MNE" /* Terminal symbol */,
	"MAX" /* Terminal symbol */,
	"XNE" /* Terminal symbol */,
	"<<" /* Terminal symbol */,
	"<=<" /* Terminal symbol */,
	">>" /* Terminal symbol */,
	">=>" /* Terminal symbol */,
	"&" /* Terminal symbol */,
	"^" /* Terminal symbol */,
	"|" /* Terminal symbol */,
	"AND" /* Terminal symbol */,
	"OR" /* Terminal symbol */,
	"XOR" /* Terminal symbol */,
	"?" /* Terminal symbol */,
	":" /* Terminal symbol */,
	"(" /* Terminal symbol */,
	")" /* Terminal symbol */,
	"[" /* Terminal symbol */,
	"]" /* Terminal symbol */,
	"{" /* Terminal symbol */,
	"}" /* Terminal symbol */,
	"Options" /* Terminal symbol */,
	"Variable" /* Terminal symbol */,
	"String" /* Terminal symbol */,
	"Number" /* Terminal symbol */,
	"ExprList" /* Non-terminal symbol */,
	"ExprOpts" /* Non-terminal symbol */,
	"Expr" /* Non-terminal symbol */,
	"Conditional" /* Non-terminal symbol */,
	"CondSwap" /* Non-terminal symbol */,
	"LogicalOrs" /* Non-terminal symbol */,
	"LogicalAnd" /* Non-terminal symbol */,
	"BitwiseOr" /* Non-terminal symbol */,
	"BitwiseXor" /* Non-terminal symbol */,
	"BitwiseAnd" /* Non-terminal symbol */,
	"Comparisons" /* Non-terminal symbol */,
	"AddSub" /* Non-terminal symbol */,
	"MulDivMod" /* Non-terminal symbol */,
	"Dice" /* Non-terminal symbol */,
	"Unary" /* Non-terminal symbol */,
	"Value" /* Non-terminal symbol */,
	"$" /* Terminal symbol */
);


	
	info.offset = 0;
	info.src = src;
	info.att = new String();
	
	if( !err_off )
		err_off	= new Array();
	if( !err_la )
	err_la = new Array();
	
	sstack.push( 0 );
	vstack.push( 0 );
	
	la = __NODEJS_lex( info );

	while( true )
	{
		act = 113;
		for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
		{
			if( act_tab[sstack[sstack.length-1]][i] == la )
			{
				act = act_tab[sstack[sstack.length-1]][i+1];
				break;
			}
		}

		if( NODEJS__dbg_withtrace && sstack.length > 0 )
		{
			__NODEJS_dbg_print( "\nState " + sstack[sstack.length-1] + "\n" +
							"\tLookahead: " + labels[la] + " (\"" + info.att + "\")\n" +
							"\tAction: " + act + "\n" + 
							"\tSource: \"" + info.src.substr( info.offset, 30 ) + ( ( info.offset + 30 < info.src.length ) ?
									"..." : "" ) + "\"\n" +
							"\tStack: " + sstack.join() + "\n" +
							"\tValue stack: " + vstack.join() + "\n" );
		}
		
			
		//Panic-mode: Try recovery when parse-error occurs!
		if( act == 113 )
		{
			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "Error detected: There is no reduce or shift on the symbol " + labels[la] );
			
			err_cnt++;
			err_off.push( info.offset - info.att.length );			
			err_la.push( new Array() );
			for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
				err_la[err_la.length-1].push( labels[act_tab[sstack[sstack.length-1]][i]] );
			
			//Remember the original stack!
			var rsstack = new Array();
			var rvstack = new Array();
			for( var i = 0; i < sstack.length; i++ )
			{
				rsstack[i] = sstack[i];
				rvstack[i] = vstack[i];
			}
			
			while( act == 113 && la != 63 )
			{
				if( NODEJS__dbg_withtrace )
					__NODEJS_dbg_print( "\tError recovery\n" +
									"Current lookahead: " + labels[la] + " (" + info.att + ")\n" +
									"Action: " + act + "\n\n" );
				if( la == -1 )
					info.offset++;
					
				while( act == 113 && sstack.length > 0 )
				{
					sstack.pop();
					vstack.pop();
					
					if( sstack.length == 0 )
						break;
						
					act = 113;
					for( var i = 0; i < act_tab[sstack[sstack.length-1]].length; i+=2 )
					{
						if( act_tab[sstack[sstack.length-1]][i] == la )
						{
							act = act_tab[sstack[sstack.length-1]][i+1];
							break;
						}
					}
				}
				
				if( act != 113 )
					break;
				
				for( var i = 0; i < rsstack.length; i++ )
				{
					sstack.push( rsstack[i] );
					vstack.push( rvstack[i] );
				}
				
				la = __NODEJS_lex( info );
			}
			
			if( act == 113 )
			{
				if( NODEJS__dbg_withtrace )
					__NODEJS_dbg_print( "\tError recovery failed, terminating parse process..." );
				break;
			}


			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "\tError recovery succeeded, continuing" );
		}
		
		/*
		if( act == 113 )
			break;
		*/
		
		
		//Shift
		if( act > 0 )
		{			
			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "Shifting symbol: " + labels[la] + " (" + info.att + ")" );
		
			sstack.push( act );
			vstack.push( info.att );
			
			la = __NODEJS_lex( info );
			
			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "\tNew lookahead symbol: " + labels[la] + " (" + info.att + ")" );
		}
		//Reduce
		else
		{		
			act *= -1;
			
			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "Reducing by producution: " + act );
			
			rval = void(0);
			
			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "\tPerforming semantic action..." );
			
switch( act )
{
	case 0:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 1:
	{
		rval = vstack[ vstack.length - 3 ];
	}
	break;
	case 2:
	{
		rval = vstack[ vstack.length - 3 ];
	}
	break;
	case 3:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 4:
	{
		 exeExpr(vstack[ vstack.length - 1 ],vstack[ vstack.length - 2 ]) 
	}
	break;
	case 5:
	{
		 exeExpr(vstack[ vstack.length - 1 ],'');  
	}
	break;
	case 6:
	{
		 exeExpr(new Token(VAL_NUM,0),''); 
	}
	break;
	case 7:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 8:
	{
		 rval = new Token(OP_COND,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 9:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 10:
	{
		 rval = new Token(OP_CTOG,null,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 11:
	{
		 rval = new Token(OP_CTOG,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 12:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 13:
	{
		 rval = new Token(OP_OR,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 14:
	{
		 rval = new Token(OP_XOR,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 15:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 16:
	{
		 rval = new Token(OP_AND,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 17:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 18:
	{
		 rval = new Token(OP_BOR,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 19:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 20:
	{
		 rval = new Token(OP_BXOR,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 21:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 22:
	{
		 rval = new Token(OP_BAND,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 23:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 24:
	{
		 rval = new Token(OP_EQU,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 25:
	{
		 rval = new Token(OP_NEQ,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 26:
	{
		 rval = new Token(OP_GTR,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 27:
	{
		 rval = new Token(OP_GEQ,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 28:
	{
		 rval = new Token(OP_LSS,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 29:
	{
		 rval = new Token(OP_LEQ,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 30:
	{
		 rval = new Token(OP_MIN,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 31:
	{
		 rval = new Token(OP_MNE,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 32:
	{
		 rval = new Token(OP_MAX,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 33:
	{
		 rval = new Token(OP_XNE,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 34:
	{
		 rval = new Token(OP_SLSS,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 35:
	{
		 rval = new Token(OP_SLEQ,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 36:
	{
		 rval = new Token(OP_SGTR,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 37:
	{
		 rval = new Token(OP_SGEQ,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 38:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 39:
	{
		 rval = new Token(OP_ADD,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 40:
	{
		 rval = new Token(OP_SUB,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 41:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 42:
	{
		 rval = new Token(OP_MUL,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 43:
	{
		 rval = new Token(OP_DIV,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 44:
	{
		 rval = new Token(OP_MOD,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ]); 
	}
	break;
	case 45:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 46:
	{
		 rval = new Token(OP_DICE,vstack[ vstack.length - 7 ],vstack[ vstack.length - 5 ],vstack[ vstack.length - 2 ]); 
	}
	break;
	case 47:
	{
		 rval = new Token(OP_DICE,vstack[ vstack.length - 3 ],vstack[ vstack.length - 1 ],null); 
	}
	break;
	case 48:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 49:
	{
		 rval = new Token(OP_POS,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 50:
	{
		 rval = new Token(OP_NEG,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 51:
	{
		 rval = new Token(OP_NOT,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 52:
	{
		 rval = new Token(OP_STR,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 53:
	{
		 rval = new Token(OP_NUM,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 54:
	{
		rval = vstack[ vstack.length - 1 ];
	}
	break;
	case 55:
	{
		 rval = new Token(VAL_NUM,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 56:
	{
		 rval = new Token(OP_IDX,new Token(VAL_STR,vstack[ vstack.length - 4 ]),vstack[ vstack.length - 2 ]); 
	}
	break;
	case 57:
	{
		 rval = new Token(VAL_STR,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 58:
	{
		 rval = new Token(OP_IDX,new Token(VAR,vstack[ vstack.length - 4 ]),vstack[ vstack.length - 2 ]); 
	}
	break;
	case 59:
	{
		 rval = new Token(VAR,vstack[ vstack.length - 1 ]); 
	}
	break;
	case 60:
	{
		 rval = new Token(OP_IDX,new Token(OP_PARA,vstack[ vstack.length - 5 ]),vstack[ vstack.length - 2 ]); 
	}
	break;
	case 61:
	{
		 rval = new Token(OP_PARA,vstack[ vstack.length - 2 ]); 
	}
	break;
	case 62:
	{
		 rval = vstack[ vstack.length - 1 ] 
	}
	break;
	case 63:
	{
		 rval = new Token(OP_IGNR,vstack[ vstack.length - 2 ]); 
	}
	break;
}



			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "\tPopping " + pop_tab[act][1] + " off the stack..." );
				
			for( var i = 0; i < pop_tab[act][1]; i++ )
			{
				sstack.pop();
				vstack.pop();
			}
									
			go = -1;
			for( var i = 0; i < goto_tab[sstack[sstack.length-1]].length; i+=2 )
			{
				if( goto_tab[sstack[sstack.length-1]][i] == pop_tab[act][0] )
				{
					go = goto_tab[sstack[sstack.length-1]][i+1];
					break;
				}
			}
			
			if( act == 0 )
				break;
				
			if( NODEJS__dbg_withtrace )
				__NODEJS_dbg_print( "\tPushing non-terminal " + labels[ pop_tab[act][0] ] );
				
			sstack.push( go );
			vstack.push( rval );			
		}
		
		if( NODEJS__dbg_withtrace )
		{		
			alert( NODEJS__dbg_string );
			NODEJS__dbg_string = new String();
		}
	}

	if( NODEJS__dbg_withtrace )
	{
		__NODEJS_dbg_print( "\nParse complete." );
		alert( NODEJS__dbg_string );
	}
	
	return err_cnt;
}



function processCode(code,printHandler,errorHandler){
	var errCount, errOffsets = [], errExpects = [];
	vars = {
		m: [], x: [], a: [], r: [],
		M: [], X: [], A: [], R: [],
		o: 0, c: 0, z: [], y: 0, s: 0, i: 0,
	}
	curOptions = "PRGdUMSCBAOTiVLN";
	rollIdx = 0;
	exprs = [];
	prolls = [];
	code = code.replace(/(([^'"e]*|'[^']*'|"[^"]*")*e *\{)/g,"$1o ");
	if((errCount = __NODEJS_parse(code, errOffsets, errExpects)) > 0){
		var moreThanOneLine = code.split("\n").length > 1;
		for(var i=0;i<errCount;++i){
			var tcode = code.slice(0,errOffsets[i]+5).replace(/(([^'"e]*|'[^']*'|"[^"]*")*e *\{)o /g,"$1")
			, spl = tcode.slice(0,-5).split("\n")
			, line = spl.length
			, col = spl[line-1].length;
			errorHandler(i, line, col, errExpects[i], tcode.slice(-8), moreThanOneLine);
		}
		return false;
	}
	
	function nrJoin(arr,x,rep){ //No Repeats
		var last = null, ret;
		for(var i=0;i<arr.length;++i){
			if(arr[i] === last)ret += rep
			else if(i) ret += x+arr[i];
			else ret = String(arr[i]);
			last = arr;
		}
		return ret;
	}
	
	for(var i=0;i<prolls.length;++i){
		var pri = prolls[i]
		, is1 = (pri.length == 1);
		for(var j=0;j<pri.length;++j){
			var pr;
			pr = (limited ? nrJoin(pri[j],", ",".") : pri[j].join(", "))+" ]";
			if(!pri[j].totals){
				pr += " = "+pri[j].total;
			}
			printHandler("Set "+(i+1)+(is1?"":"."+(j+1))+": [ "+pr);
		}
	}
	for(i=0;i<exprs.length;++i){
		printHandler(exprs[i]);
	}
	return true;
}

if(typeof(prompt) != "undefined"){
	processCode(prompt("Enter code:"),function (idx, offset, expects){
		alert("ERROR("+idx+"): At character "+offset+". Expecting:\n  "+expects.join("  "));
	});
}else if(require("path").basename(process.argv[1]).slice(0,5) == "dice."){
	//Command Line
	var code;
	limited = false;
	if(process.argv[2] == "-e"){
		//Execute arguments
		code = process.argv.slice(3).join(" ")
	} else {
		//Load from file
		code = require("fs").readFileSync(process.argv[2],"utf8");
	}
	var time = Date.now();
	processCode(code,console.log,function (idx, line, col, expects, bit, mtol){
		if(mtol){
			console.log("ERROR("+idx+"): At line "+line+" offset "+col+". Near:\n"
			+"  "+bit+"\nExpecting:\n  "+expects.join("  "));
		} else {
			console.log("ERROR("+idx+"): At character "+col+". Near:\n"
			+"  "+bit+"\nExpecting:\n  "+expects.join("  "));
		}
	});
	console.log("Execution took "+(Date.now()-time)+" milliseconds.");
} else {
	//Module
	limited = true;
}

