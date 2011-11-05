//Use this to generate expressions for parse speed tests

function genNumber(){
	var len = Math.round(Math.random()*3)+1, ret = "";
	for(var i=0;i<len;++i)ret += String(Math.round(Math.random()*9));
	return ret;
}

var limit = 0;
function genExpr(){
	var ret = genNumber(), len = Math.round(Math.random()*2)+1;
	if(++limit < 5){
		for(var i=0;i<len;++i){
			switch(Math.round(Math.random()*3)){
				case 0: ret += "+"+genNumber();
				case 1: ret += "*"+genNumber();
				case 2: ret += "+("+genExpr()+")";
				case 3: ret += "*("+genExpr()+")";
			}
		}
	}
	--limit;
	return ret;
}

console.log(genExpr());
