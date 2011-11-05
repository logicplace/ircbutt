var Parser = require('jison').Parser;

//Case Insensitive
function ci(s){
	var lower = "abcdefghijklmnopqrstuvwxyz";
	function rplTest(a,ba,bl,bs,bc,br,all,slsh,chr){
		if(ba){
			return bl + (
				(bs.length & 1) ? ba : bs + bc.toLowerCase()+bc.toUpperCase()
			) + br;
		} else {
			return (slsh.length & 1) ? all : slsh + "["+chr.toLowerCase()+chr.toUpperCase()+"]";
		}
	}
	for(var i=0;i<lower.length;++i){
		s = s.replace(new RegExp("((\\[.*)(\\\\*)("+lower.charAt(i)
		+")(.*\\]))|((\\\\*)("+lower.charAt(i)+"))","ig"),rplTest);
	}
	return s;
}

var grammar = {
    "lex": {
        "rules": [
            ["\\s+"                         , "/* skip whitespace */"],
            [","                            , "return ',';"],
            [";"                            , "return ',';"],
            [ci("d")                        , "return 'd';"],
            [ci("e")                        , "return 'e';"],
            [ci("n")                        , "return 'n';"],
            ["\\+"                          , "return '+';"],
            ["\\-"                          , "return '-';"],
            [ci("!|~|not")                  , "return 'NOT';"],
            ["@"                            , "return '@';"],
            ["#"                            , "return '#';"],
            ["\\*"                          , "return '*';"],
            ["/"                            , "return '/';"],
            ["%"                            , "return '%';"],
            [ci("=|==|equ?")                , "return 'EQU';"],
            [ci("!=|~=|neq?")               , "return 'NEQ';"],
            [ci(">|gtr?")                   , "return 'GTR';"],
            [ci(">=|!<|geq?")               , "return 'GEQ';"],
            [ci("<|lt|lss")                 , "return 'LSS';"],
            [ci("<=|!>|leq?")               , "return 'LEQ';"],
            [ci("<>|mi?n")                  , "return 'MIN';"],
            [ci("<~>|<!>|nn|mne")           , "return 'MNE';"],
            [ci("><|ma?x")                  , "return 'MAX';"],
            [ci(">~<|>!<|xne?")             , "return 'XNE';"],
            ["<<"                           , "return '<<';"],
            ["<=<"                          , "return '<=<';"],
            [">>"                           , "return '>>';"],
            [">=>"                          , "return '>=>';"],
            ["&"                            , "return '&';"],
            ["\\^"                          , "return '^';"],
            ["\\|"                          , "return '|';"],
            [ci("&&|and")                   , "return 'AND';"],
            [ci("\\|\\||or")                , "return 'OR';"],
            [ci("\\^\\^|xor")               , "return 'XOR';"],
            ["\\?"                          , "return '?';"],
            [":"                            , "return ':';"],
            ["\\("                          , "return '(';"],
            ["\\)"                          , "return ')';"],
            ["\\["                          , "return '[';"],
            ["\\]"                          , "return ']';"],
            ["\\{"                          , "return '{';"],
            ["\\}"                          , "return '}';"],
            [ci("\-\-[prgdumscbaotivln@]+") , "yytext = yytext.slice(2); return 'Options'"],
            ["[mxasrzcyMXARoi]"             , "return 'Variable';"],
            ["'([^']*)'|\"([^\"]*)\""       , "yytext = yytext.slice(1, -1); return 'String'"],
            ["\\d+"                         , "return 'Number';"],
            ["$"                            , "return 'EOF';"],
        ]
    },

    "bnf": {
		"Exprs":    [["ExprList EOF"                , ""]],
		"ExprList": [["ExprList , ExprOpts"         , ""],
		             ["ExprOpts"                    , ""]],
		"ExprOpts": [["Options Expr"                , "yy.exeExpr($2,$1);"],
		             ["Expr"                        , "yy.exeExpr($1,null);"]],
    }
};

var parser = new Parser(grammar);

//Token class
parser.yy.Token = function(args){
	this.type = args[0];
	this.result = null;
	this.resolved = false;
	this.print = "";
	this.highest = 15;
	for(var i=1;i<args.length;++i){
		this[i-1] = args[i];
	}
}

//Look, new yy.Token would look terrible
parser.yy.makeToken = function(){ return new this.Token(arguments); }


//Helper functions
parser.yy.num = function(val){
	switch(typeof(val)){
		case "string": return val.length;
		case "number": return val;
	}
}

parser.yy.str = function(val){
	switch(typeof(val)){
		case "string": return val;
		case "number": return val.toString();
	}
}

parser.yy.qstr = function(val){
	return (val.indexOf("'") == -1 ? "'"+val+"'" : '"'+val+'"')
}

parser.yy.qreal = function(val){
	switch(typeof(val)){
		case "string": return this.qstr(val);
		case "number": return val.toString();
	}
}

parser.yy.varName = function(va){
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

parser.yy.isStr = function(val){ return typeof(val) == "string"; }
parser.yy.strrep = function(astr,c){ var ret = ""; for(var i=0;i<c;++i)ret += astr; return ret; }
parser.yy.strrev = function(astr){
	var ret = "";
	for(var i=astr.length-1;i>=0;--i)ret += astr.charAt(i);
	return ret;
}


//var curOptions;

parser.yy.resolve = function(s,ooo){
	if(this.curOptions.indexOf(s) != -1){
		for(var i=2;i<arguments.length;++i){
			if(!arguments[i].resolved && arguments[i].highest < ooo){
				return false;
			}
		}
		return true;
	} else return false;
}

parser.yy.exeExpr = function(expr, options){
	for(var i=0;i<options.length;++i){
		var c = options.charAt(i),cased;
		if(this.curOptions.indexOf(c) == -1){
			if((cased = c.toUpperCase()) == c){
				if((cased = c.toLowerCase()) == c){
					this.curOptions += c;
					continue;
				}
			}
			this.curOptions = this.curOptions.replace(cased,c);
		}
	}
	var z = execute(expr);
	this.vars.z.push(z);
	this.vars.y = this.vars.z.length;
	z = this.qreal(z);
	if(expr.print && expr.print != z){
		if(this.resolve("p")) this.exprs.push(z)
		else this.exprs.push(expr.print+" = "+z);
	}
}

//var eachDepth = 0;
parser.yy.execute = function(token, doExec){
	var result,res,ooo,print;
	switch(token.type){
		case "OP_DICE": {
			//0: Amount; 1: Sides; 2: Each
			var amount, sides, rolls = [], minRoll, maxRoll, average, total
			,right = execute(token[1]), isstr = this.isStr(right), each = token[2];
			//They have a minimum of 1 either way
			amount = Math.max(1,this.num(execute(token[0]))); sides = Math.max(1,this.num(right));
			
			//Enforce limits
			if(this.limited){
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
			
			var rid = this.rollIdx;
			this.vars.a[rid] = average; this.vars.r[rid] = total;
			this.vars.m[rid] = minRoll; this.vars.x[rid] = maxRoll;
			this.vars.c = this.vars.a.length;
			
			var eprints = [], erolls = [];
			if(each){
				++this.eachDepth;
				var oldi = this.vars.i;
				for(var i=0;i<amount;++i){
					this.rollIdx = rid+1;
					this.vars.o = rolls[i];
					this.vars.i = i+1;
					var r = execute(each);
					eprints.push(each.print);
					if(i){
						switch(typeof(total)){
							case "number": {
								r = this.num(r);
								minRoll = Math.min(minRoll,r);
								maxRoll = Math.max(maxRoll,r);
								break;
							} case "string": {
								r = this.str(r);
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
				this.vars.i = oldi;
				
				this.vars.R[rid] = this.vars.r[rid]; this.vars.A[rid] = this.vars.a[rid];
				this.vars.M[rid] = this.vars.m[rid]; this.vars.X[rid] = this.vars.x[rid];
				if(typeof(total) == "number"){
					this.vars.a[rid] = Math.floor(total/sides);
					this.vars.m[rid] = minRoll;
					this.vars.x[rid] = maxRoll;
				}
				this.vars.r[rid] = total;
				
				--this.eachDepth;
			}
			
			//Print for expression
			result = total;
			ooo = 0;
			res = this.resolve("d",ooo,token[0],token[1]);
			print = token[0].print+"d"+token[1].print;
			//This strips out the added o
			if(each){
				//TODO: --Dv SOMEHOW
				each.print = each.print.replace(/([^'" ]+|'[^']*'|"[^"]*") /,"");
				print += "e{"+each.print+"}";
			}
			
			//Print for rolls
			if(this.prolls.length <= this.rollIdx)this.prolls[rid] = [];
			var tmp = [];
			if(this.limited && this.eachDepth > 0){
				tmp.totals = true;
				tmp.push(this.qreal(total));
			} else {
				tmp.total = this.qreal(total);
				for(var i=0;i<amount;++i){
					if(this.resolve("r")){
						if(each)tmp.push(this.qreal(erolls[i]));
						else tmp.push(this.qreal(rolls[i]));
					}
					else if(each)tmp.push("("+this.qreal(rolls[i])+" "
					+eprints[i].replace(/([^'" ]+|'[^']*'|"[^"]*") /,"")+") = "+this.qreal(erolls[i]));
					else tmp.push(this.qreal(rolls[i]));
				}
			}
			this.prolls[rid].push(tmp);
			
			this.rollIdx = rid + 1;
			break;
		} case "OP_POS": {
			//0: Value
			result = Math.abs(this.num(execute(token[0])));
			ooo = 1;
			res = this.resolve("u",ooo,token[0]);
			print = "+"+token[0].print;
			break;
		} case "OP_NEG": {
			//0: Value
			result = -this.num(execute(token[0]));
			ooo = 1;
			res = this.resolve("u",ooo,token[0]);
			print = "-"+token[0].print;
			break;
		} case "OP_NOT": {
			//0: Value
			result = execute(token[0])?0:1;
			ooo = 1;
			res = this.resolve("u",ooo,token[0]);
			print = "~"+token[0].print;
			break;
		} case "OP_STR": {
			//0: Value
			result = this.str(execute(token[0]));
			ooo = 1;
			res = this.resolve("u",ooo,token[0]);
			print = "@"+token[0].print;
			break;
		} case "OP_NUM": {
			//0: Value
			var val = execute(token[0]);
			switch(typeof(val)){
				case "number": result = val; break;
				case "string": result = parseInt(val.replace(/[^0-9]/g,"")); break;
			}
			ooo = 1;
			res = this.resolve("u",ooo,token[0]);
			print = "#"+token[0].print;
			break;
		} case "OP_ADD": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			//Concatenate : Add
			result = (this.isStr(left) ? left + this.str(right) : left + this.num(right));
			ooo = 3;
			res = this.resolve("s",ooo,token[0],token[1]);
			print = token[0].print+" + "+token[1].print;
			break;
		} case "OP_SUB": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left)){
				//Remove substring from string : Chop
				result = (this.isStr(right) ? left.replace(new RegExp(right,"g"),"")
					: (right < 0 ? left.slice(-right) : left.slice(0,-right))
				);
			} else result = left - this.num(right);
			ooo = 3;
			res = this.resolve("s",ooo,token[0],token[1]);
			print = token[0].print+" - "+token[1].print;
			break;
		} case "OP_MUL": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left)){
				//Count occurances of substring in string
				if(this.isStr(right))result = left.split(right).length-1;
				//Repeat string
				else {
					//Negatives reverse string
					if(right < 0){
						left = this.strrev(left);
						right *= -1;
					}
					result = (this.limited ? this.strrep(left,Math.min(right,20)) : this.strrep(left,right));
				}
			} else {
				//Numerical multiplication
				result = this.num(left) * this.num(right);
			}
			ooo = 2;
			res = this.resolve("m",ooo,token[0],token[1]);
			print = token[0].print+" * "+token[1].print;
			break;
		} case "OP_DIV": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left)){
				result = (this.isStr(right) ? left.match(new RegExp(this.escape(right),"g")).join("")
					: (right < 0 ? left.slice(0,right) : left.slice(right))
				);
			} else {
				//Numerical division
				result = this.num(left) / this.num(right);
			}
			ooo = 2;
			res = this.resolve("m",ooo,token[0],token[1]);
			print = token[0].print+" / "+token[1].print;
			break;
		} case "OP_MOD": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left)){
				//Formatted string
				result = left.replace(/(^|[^%])%(?!%)-?/g,"$1"+this.str(right)).replace(/%(%+)/g,"$1");
			} else {
				//Return [correct] modulo (JS's is weird)
				right = this.num(right);
				result = ((left%right)+right)%right;
			}
			ooo = 2;
			res = this.resolve("m",ooo,token[0],token[1]);
			print = token[0].print+" % "+token[1].print;
			break;
		} case "OP_BAND": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left)){
				if(this.isStr(right)){
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
			} else result = left & this.num(right);
			ooo = 5;
			res = this.resolve("b",ooo,token[0],token[1]);
			print = token[0].print+" & "+token[1].print;
			break;
		} case "OP_BXOR": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left)){
				if(this.isStr(right)){
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
			} else result = left ^ this.num(right);
			ooo = 5;
			res = this.resolve("b",ooo,token[0],token[1]);
			print = token[0].print+" ^ "+token[1].print;
			break;
		} case "OP_BOR": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			if(this.isStr(left) && this.isStr(right)){
				var lr = left+right;
				result = "";
				for(var i=0;i<lr.length;++i){
					if(result.indexOf(lr.charAt(i)) != -1)result += lr.charAt(i);
				}
			} else {
				result = this.num(left) | this.num(right);
			}
			ooo = 5;
			res = this.resolve("b",ooo,token[0],token[1]);
			print = token[0].print+" | "+token[1].print;
			break;
		} case "OP_AND": {
			//0: Left value; 1: Right value
			result = Number(execute(token[0]) && execute(token[1]));
			ooo = 6;
			res = this.resolve("a",ooo,token[0],token[1]);
			print = token[0].print+" && "+token[1].print;
			break;
		} case "OP_OR": {
			//0: Left value; 1: Right value
			result = Number(execute(token[0]) || execute(token[1]));
			ooo = 7;
			res = this.resolve("o",ooo,token[0],token[1]);
			print = token[0].print+" || "+token[1].print;
			break;
		} case "OP_XOR": {
			//0: Left value; 1: Right value
			result = Number(Boolean(execute(token[0])) != Boolean(execute(token[1])));
			ooo = 7;
			res = this.resolve("o",ooo,token[0],token[1]);
			print = token[0].print+" ^^ "+token[1].print;
			break;
		} case "OP_EQU": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = Number((this.isStr(left) && this.isStr(right)) ? left == right : this.num(left) == this.num(right));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" == "+token[1].print;
			break;
		} case "OP_NEQ": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = Number((this.isStr(left) && this.isStr(right)) ? left != right : this.num(left) != this.num(right));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" != "+token[1].print;
			break;
		} case "OP_LSS": {
			//0: Left value; 1: Right value
			result = Number(this.num(execute(token[0])) < this.num(execute(token[1])));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" < "+token[1].print;
			break;
		} case "OP_LEQ": {
			//0: Left value; 1: Right value
			result = Number(this.num(execute(token[0])) <= this.num(execute(token[1])));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <= "+token[1].print;
			break;
		} case "OP_GTR": {
			//0: Left value; 1: Right value
			result = Number(this.num(execute(token[0])) > this.num(execute(token[1])));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" > "+token[1].print;
			break;
		} case "OP_GEQ": {
			//0: Left value; 1: Right value
			return Number(this.num(execute(token[0])) >= this.num(execute(token[1])));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >= "+token[1].print;
			break;
		} case "OP_MIN": {
			result = (this.num(left) < this.num(right) ? left : right);
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <> "+token[1].print;
			break;
		} case "OP_MNE": {
			result = (this.num(left) == this.num(right) ? 0 : (this.num(left) < this.num(right) ? left : right));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <!> "+token[1].print;
			break;
		} case "OP_MAX": {
			result = (this.num(left) > this.num(right) ? left : right);
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >< "+token[1].print;
			break;
		} case "OP_XNE": {
			result = (this.num(left) == this.num(right) ? 0 : (this.num(left) > this.num(right) ? left : right));
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >!< "+token[1].print;
			break;
		} case "OP_SLSS": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (this.num(left) < this.num(right) ? left : 0);
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" << "+token[1].print;
			break;
		} case "OP_SLEQ": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (this.num(left) <= this.num(right) ? left : 0);
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" <=< "+token[1].print;
			break;
		} case "OP_SGTR": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (this.num(left) > this.num(right) ? left : 0);
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >> "+token[1].print;
			break;
		} case "OP_SGEQ": {
			//0: Left value; 1: Right value
			var left = execute(token[0])
			, right = execute(token[1]);
			result = (this.num(left) >= this.num(right) ? left : 0);
			ooo = 4;
			res = this.resolve("c",ooo,token[0],token[1]);
			print = token[0].print+" >=> "+token[1].print;
			break;
		} case "OP_COND": {
			//0: Conditional expression; 1: OP_CTOGS or True expression (with no false)
			var bool = Boolean(this.vars.s = execute(token[0]));
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
			res = this.resolve("t",ooo,token[0],token[1]);
			break;
		} case "OP_CTOG": {
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
			res = this.resolve("t",ooo,token[0],token[1]);
			print = ((i & 1) != doExec ? right : last).print;
			break;
		} case "OP_IDX": {
			//0: Token to subscript; 1: Index
			var idx = execute(token[1]);
			if(token[0].type == VAR){
				var vv = this.vars[token[0][0]];
				idx = this.num(idx);
				if(Array.isArray(vv)){
					result = (idx > vv.length ? 0 : vv[idx-1]);
				} else result = vv;
				token[0].print = (this.resolve("n") ? this.varName(token[0][0]) : token[0][0]);
				token[0].highest = 10;
				token[0].resolved = this.resolve("v",10,token[0]);
			} else {
				var x = execute(token[0]);
				if(this.isStr(x)){
					if(this.isStr(idx)){
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
			res = this.resolve("i",ooo,token[0],token[1]);
			print = token[0].print+"["+token[1].print+"]";
			break;
		} case "OP_PARA": {
			//0: Expression
			result = execute(token[0]);
			ooo = 0;
			res = this.resolve("g",ooo,token[0]);
			print = "("+token[0].print+")";
			break;
		} case "OP_IGNR": {
			//0: Expression to ignore the print of
			result = execute(token[0]);
			res = false;
			token[0].print = "";
			ooo = 15;
			print = "";
			break;
		} case "VAL_NUM": {
			//0: Number
			result = parseInt(token[0]);
			res = true;
			ooo = 15;
			break;
		} case "VAL_STR": {
			//0: String
			result = token[0];
			ooo = 15;
			res = true;
			break;
		} case "VAR": {
			//0: Variable name
			var vv = this.vars[token[0]];
			result = (Array.isArray(vv) ? (vv.length ? vv[vv.length-1] : 0) : vv);
			ooo = 10;
			res = this.resolve("v");
			print = (this.resolve("n") ? this.varName(token[0]) : token[0]);
			break;
		}
	}
	token.result = result;
	token.resolved = res;
	token.highest = Math.min(token.highest,ooo);
	if(res){
		token.print = this.qreal(result);
	} else {
		token.print = print;
	}
	return result;
}

//===== RUNTIME STUFF ======//
parser.yy.processCode = function(code,printHandler,errorHandler){
	var errCount, errOffsets = [], errExpects = [];
	this.vars = {
		m: [], x: [], a: [], r: [],
		M: [], X: [], A: [], R: [],
		o: 0, c: 0, z: [], y: 0, s: 0, i: 0,
	}
	this.curOptions = "PRGdUMSCBAOTiVLN";
	this.rollIdx = 0;
	this.eachDepth = 0;
	this.exprs = [];
	this.prolls = [];
	code = code.replace(/(([^'"e]*|'[^']*'|"[^"]*")*e *\{)/g,"$1o ");
	if((errCount = this.parse(code, errOffsets, errExpects)) > 0){
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
	
	for(var i=0;i<this.prolls.length;++i){
		var pri = this.prolls[i]
		, is1 = (pri.length == 1);
		for(var j=0;j<pri.length;++j){
			var pr;
			pr = (this.limited ? nrJoin(pri[j],", ",".") : pri[j].join(", "))+" ]";
			if(!pri[j].totals){
				pr += " = "+pri[j].total;
			}
			printHandler("Set "+(i+1)+(is1?"":"."+(j+1))+": [ "+pr);
		}
	}
	for(i=0;i<this.exprs.length;++i){
		printHandler(this.exprs[i]);
	}
	return true;
}

if(typeof(prompt) != "undefined"){
	parser.yy.processCode(prompt("Enter code:"),alert,function (idx, offset, expects){
		alert("ERROR("+idx+"): At character "+offset+". Expecting:\n  "+expects.join("  "));
	});
}else if(require("path").basename(process.argv[1]).slice(0,5) == "dice."){
	//Command Line
	var code;
	parser.yy.limited = false;
	if(process.argv[2] == "-e"){
		//Execute arguments
		code = process.argv.slice(3).join(" ")
	} else {
		//Load from file
		code = require("fs").readFileSync(process.argv[2],"utf8");
	}
	var time = Date.now();
	parser.yy.processCode(code,console.log,function (idx, line, col, expects, bit, mtol){
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
	parser.yy.limited = true;
}
