var
	splitter = require("splitter.js")
	,comp = require("comp")
;

var
	globals = {
		_one: "<hi=abc890+>"
		,_two: "a <b@_one> <c@_one>"
		,_thr: "3 <@_one>*"
		,_fff: "<,|b@_one>*"
	}
	,angled = new splitter("<angle>")
	,number = new splitter("<#number>")
	,limited = new splitter("<limit:x:>")
	,limited2 = new splitter("<limit=7na@>")
	,limited3 = new splitter("<limit=7na@+>")
	,limited4 = new splitter("<limit!7na@>")
	,limited5 = new splitter("<limit!7na@+>")
	,spaced = new splitter("{spaced}")
	,regex = new splitter("/regex:[abc123]+/")
	,allSimple = new splitter("Hi <angle>, {spaced}. And /regex:((good)?bye|farewell)/!")
	,multiple1 = new splitter("<params>* -- {message}")
	,multiple2 = new splitter("{oneOrTwoWords:1}*")
	,multiple3 = new splitter("{twoWords=1}*")
	,multiple4 = new splitter("/hex:[0-9a-fA-F]+/*")
	,sep1 = new splitter("<,|list1>* {,|list2}*")
	,groups = new splitter("[optional:<abc> ](a <a>)|(b <b>)")
	,ref1 = new splitter("Ref <r@_one>",globals)
	,ref2 = new splitter("Ref <r@_two>",globals)
	,ref3 = new splitter("Ref <r@_thr>",globals)
	,ref4 = new splitter("Ref <r@_fff>",globals)
	
	//Name, splitter, strToParse, expectedResult, [exceptionTypeExpected]
	,readTests = [
		["Angled 1",angled,"blargh",{angle:"blargh"}],
		["Angled 2",angled,"bl&(IHASD><.,,",{angle:"bl&(IHASD><.,,"}],
		["Angled 3 (fail)",angled,"one two",null],
		["Number 1",number,"12345",{number:"12345"}],
		["Number 2 (fail)",number,"04f3",null],
		["Limited 1.1",limited,"abcdefghijklm",{limit:"abcdefghijklm"}],
		["Limited 1.2 (fail)",limited,"nopqrstuvwxyz",null],
		["Limited 1.3 (fail)",limited,"a:b",null],
		["Limited 2.1",limited2,"a",{limit:"a"}],
		["Limited 2.2 (fail)",limited2,"a7",null],
		["Limited 3.1",limited3,"a",{limit:"a"}],
		["Limited 3.2 (fail)",limited3,"a7",{limit:"a7"}],
		["Limited 4.1",limited4,"b",{limit:"b"}],
		["Limited 4.2 (fail)",limited4,"ba7",null],
		["Limited 5.1",limited5,"b666",{limit:"b666"}],
		["Limited 5.2 (fail)",limited5,"ba7",null],
		["Spaced 1",spaced,"blargh",{spaced:"blargh"}],
		["Spaced 2",spaced,"one two",{spaced:"one two"}],
		["Regex 1",regex,"abc",{regex:"abc"}],
		["Regex 2 (fail)",regex,"abc 123",null],
		["All",allSimple,"Hi user, welcome to the test suite. And farewell!",{
			angle: "user"
			,spaced: "welcome to the test suite"
			,regex: "farewell"
		}],
		["Multiple 1",multiple1,"--pedantic -lc -ld -weee -- xyz.c abrrr.c",{
			params: ["--pedantic","-lc","-ld","-weee"],
			message: "xyz.c abrrr.c"
		}],
		["Multiple 2.1",multiple2,"one two three four",{
			oneOrTwoWords: ["one two","three four"]
		}],
		["Multiple 2.2",multiple2,"one two three",{
			oneOrTwoWords: ["one two","three"]
		}],
		["Multiple 3.1",multiple3,"one two three four",{
			twoWords: ["one two","three four"]
		}],
		["Multiple 3.2 (fail)",multiple3,"one two three",null],
		["Multiple 4",multiple4,"1f 123 6aab",{
			hex: ["1f","123","6aab"]
		}],
		["Separator 1",sep1,"this,is,list,1 and this,be list,2 arr",{
			list1: ["this","is","list","1"],
			list2: ["and this","be list","2 arr"],
		}],
		["Groups 1",groups,"a harp",{
			a: "harp"
		}],
		["Groups 2 (fail)",groups,"a harp b terraform",null],
		["Groups 3",groups,"optional:aaa b terraform",{
			abc: "aaa", b: "terraform"
		}],
		["Reference 1",ref1,"Ref ba9ca0",{r:{hi:"ba9ca0"}}],
		["Reference 2",ref2,"Ref a ba 90",{r:{b:{hi:"ba"},c:{hi:"90"}}}],
		["Reference 3",ref3,"Ref 3 b a abc0 999",{r:{hi:["b","a","abc0","999"]}}],
		["Reference 4",ref4,"Ref bb,aa,08,c",{r:{hi:["bb","aa","08","c"]}}],
	]
	
	//Name, splitter, dataToInsert, expectedResult, [exceptionTypeExpected]
	,writeTests = [
		["Angled 1",angled,{angle: "test"},"test"],
		["Angled 2 (fail)",angled,{angle: "test spaces"},null,"AssertionFailed"],
		["Number 1",number,{number:"12345"},"12345"],
		["Number 2 (fail)",number,{number:"04f3"},null,"AssertionFailed"],
		["Limited 1.1",limited,{limit:"abcdefghijklm"},"abcdefghijklm"],
		["Limited 1.2 (fail)",limited,{limit:"nopqrstuvwxyz"},null,"AssertionFailed"],
		["Limited 1.3 (fail)",limited,{limit:"a:b"},null,"AssertionFailed"],
		["Limited 2.1",limited2,{limit:"a"},"a"],
		["Limited 2.2 (fail)",limited2,{limit:"a7"},null,"AssertionFailed"],
		["Limited 3.1",limited3,{limit:"a"},"a"],
		["Limited 3.2 (fail)",limited3,{limit:"a7"},"a7"],
		["Limited 4.1",limited4,{limit:"b"},"b"],
		["Limited 4.2 (fail)",limited4,{limit:"ba7"},null,"AssertionFailed"],
		["Limited 5.1",limited5,{limit:"b666"},"b666"],
		["Limited 5.2 (fail)",limited5,{limit:"ba7"},null,"AssertionFailed"],
		["Spaced 1",spaced,{spaced:"blargh"},"blargh"],
		["Spaced 2",spaced,{spaced:"one two"},"one two"],
		["Regex 1",regex,{regex:"abc"},"abc"],
		["Regex 2 (fail)",regex,{regex:"abc 123"},null,"AssertionFailed"],
		["All",allSimple,{
			angle: "user"
			,spaced: "welcome to the test suite"
			,regex: "farewell"
		},"Hi user, welcome to the test suite. And farewell!"],
		["Multiple 1",multiple1,{
			params: ["--pedantic","-lc","-ld","-weee"],
			message: "xyz.c abrrr.c"
		},"--pedantic -lc -ld -weee -- xyz.c abrrr.c"],
		["Multiple 2.1",multiple2,{
			oneOrTwoWords: ["one two","three four"]
		},"one two three four"],
		["Multiple 2.2",multiple2,{
			oneOrTwoWords: ["one two","three"]
		},"one two three"],
		["Multiple 3.1",multiple3,{
			twoWords: ["one two","three four"]
		},"one two three four"],
		["Multiple 3.2 (fail)",multiple3,{
			twoWords: ["one two","three"]
		},null,'AssertionFailed'],
		["Multiple 4",multiple4,{
			hex: ["1f","123","6aab"]
		},"1f 123 6aab"],
		["Separator 1",sep1,{
			list1: ["this","is","list","1"],
			list2: ["and this","be list","2 arr"],
		},"this,is,list,1 and this,be list,2 arr"],
		["Groups 1",groups,{
			b: "terraform"
		},"b terraform"],
		["Groups 2",groups,{
			a: "harp", b: "terraform"
		},"a harp"],
		["Groups 3",groups,{
			abc: "aaa", b: "terraform"
		},"optional:aaa b terraform"],
	]
;

function printException(e){
	if("message" in e){
		var str="",nm=null;
		if("type" in e)nm = "type";
		else if("name" in e)nm = "name";
		str += (nm?e[nm]+": ":"")+e.message;
		if(nm)delete e[nm];
		delete e.message;
		if("stack" in e)delete e.stack;
		if("arguments" in e)delete e.arguments;
		console.log(str);
		//Ensure something is in e before printing
		for(var x in e) {
			console.log(e);
			break;
		}
	} else {
		console.log(e);
	}
}

console.log("====== Read Tests ======");
for(var i=0;i<readTests.length;++i){
	var th = readTests[i];
	try {
		//Perform test
		var tmp = th[1].read(th[2]);
		if(comp(tmp,th[3]))console.log(th[0]+": Success");
		else {
			console.log(th[0]+": Failed (expected and returned below)");
			console.log(th[3]);
			console.log(tmp);
		}
	} catch(e) {
		//Exception thrown version
		if(4 in th && "type" in e && e.type == th[4]){
			console.log(th[0]+": Success (exception thrown correctly)");
		} else {
			console.log(th[0]+": Exception thrown (below)");
			delete e.stack;
			printException(e);
		}
	}
}
console.log("\n====== Write Tests ======");
for(var i=0;i<writeTests.length;++i){
	var th = writeTests[i];
	try {
		//Perform test
		var tmp = th[1].write(th[2]);
		if(tmp == th[3])console.log(th[0]+": Success");
		else {
			console.log(th[0]+": Failed (expected and returned below)");
			console.log(th[3]);
			console.log(tmp);
		}
	} catch(e) {
		//Exception thrown version
		if(4 in th && "type" in e && e.type == th[4]){
			console.log(th[0]+": Success (exception thrown correctly)");
		} else {
			console.log(th[0]+": Exception thrown (below)");
			delete e.stack;
			printException(e);
		}
	}
}