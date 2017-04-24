
/** 先頭を大文字化 */
String.prototype.capitalize = function(){
    return this.charAt(0).toUpperCase() + this.slice(1);
}
/** XMLコメント化 */
String.prototype.toXMLComment = function(){
    return '<!-- ' + this + ' -->';
}
/** 正規表現でのマッチングを配列で返す */
RegExp.prototype.matches = function(str) {
	var ret = [];
	while (true) {
		var m = this.exec(str);
		if (!m) break;
		ret.push(m);
	}
	return ret;
}

// 入力テスト
var str = "select a.X_ID as X_ID, a.X_NAME as X_NAME, b.X_NAME as X_NAME, exists(select 1 from T_C c where c.X_ID = a.X_ID) as IS_EXISTS\n"  
 + " from T_A a inner join T_B b on a.X_ID = b.X_ID and a.X_HOGE_NAME = 'aaa'\n"
 + "where a.X_ID = 23 and a.X_NAME = 'aa' and a.X_HOGE_NAME like '%aaa%' and a.X_VAL >= 12.3 and a.X_FUGA_VALUE < 123 group by a.X_ID having count(*) >= 1 and count(*) <= 3 order by a.X_ID desc, a.X_NAME limit 100 offset 20;"

str = str.trim();
var SQL_TYPE = {SELECT:1, INSERT:2, UPDATE:3, DELETE:4};
var sqlTypeName = ((str.match(/\w+/gi) || [])[0] || "").toUpperCase();
var sqlType = SQL_TYPE[sqlTypeName];

switch (sqlType) {
	case SQL_TYPE.SELECT:
		console.log("select");
		break;
	case SQL_TYPE.INSERT:
		console.log("insert");
		break;
	case SQL_TYPE.UPDATE:
		console.log("update");
		break;
	case SQL_TYPE.DELETE:
		console.log("delete");
		break;
	default:
		console.log("not found.");
}

var selectLevel = 0;
var RESERVES = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET"];
var idx = {}
var clauses = {};
var mkSqlTag = {};
for (var i in RESERVES) {
	idx[RESERVES[i]] = -1;
	clauses[RESERVES[i]] = "";
	mkSqlTag[RESERVES[i]] = false;
}
mkSqlTag["SELECT"] = mkSqlTag["FROM"] = mkSqlTag["WHERE"] = true

// 各句の抽出
var quatLevel = 0;
var r = /[\(\),;]|((group|order)\s+by)|[^\s\(\),;]+/gi

while (true) {
	var tmp = r.exec(str);
	if (!tmp) break;
	var tmpStrU = tmp[0].toUpperCase();
	switch (tmpStrU) {
		case "(":
			quatLevel++;
			break;
		case ")":
			quatLevel--;
			break;
	}
	
	if (quatLevel !== 0) {
		continue;
	}
	
	if (RESERVES.indexOf(tmpStrU.replace(/\s+/gi, ' ')) > -1) {
		idx[tmpStrU] = tmp.index;
	}
}

for (var i = 0, len = RESERVES.length; i < len; i++) {
	var lastIndex = Number.MAX_SAFE_INTEGER;
	var name = RESERVES[i];
	for (var j = i+1; j < RESERVES.length; j++) {
		lastIndex = Math.min(lastIndex, idx[RESERVES[j]])
	}
	clauses[name] = str.slice(idx[name] + name.length, lastIndex).trim();
	console.log("clauses["+name+"]=" + clauses[name]);
}

/** キャメルケース変換 */
function toCamelCase(s) {
	var replacerToCamelCase = function(match, p1) {
		return p1.toUpperCase();
	}
	return ((s || "") + "").toLowerCase().replace(/[ +_](\w)/gi, replacerToCamelCase);
}

/** sql_id 生成 */
function createSqlId(name) {
	return [toCamelCase(name).capitalize(), "Clause", "Cstm"].join("_");
}

var fields = {};

function replaceToParam(str) {
	console.log("in =" + str);
	var ret = str;
	var r = /((?:(\w+)(?:\s+)?\.)?(\w+)\s+?((?:=)|(?:<>)|(?:[<>]=?)|(?:LIKE))\s+)((?:[\d.]+)|(?:'.*?'))/gim;

	function toModel(m) {
		return {alias : m[2], column : m[3], operator : m[4], value : m[5], valIndex : (m.index + (m[1] || "").length) };
	}
	function repToParam(m) {
		var ret = "";
		
		var columnCamel = toCamelCase(m.column);
		fields[columnCamel] = 'VARCHAR'; // TODO 型
		var repStr = '#{' + columnCamel +'}';
		if (m.operator && m.operator.toUpperCase() === "LIKE") {
			var match = /'(%)?.*?(%)?'/.exec(m.value);
			var bef = !!match[1];
			var aft = !!match[2];
			if (bef || aft) {
				ret += "concat(";
				if (bef) ret += "'%', ";
				ret += repStr;
				if (aft) ret += ", '%'";
				ret += ")";
			}
		}
		if (!ret) ret += repStr;
		return ret;
	}
	while (true) {
		var match = r.exec(ret);
		if (!match) break;
		var m = toModel(match);
		var repStr = repToParam(m);
		ret = ret.slice(0,m.valIndex) + ret.slice(m.valIndex).replace(m.value, repStr);
	}
	console.log("out=" + ret);
	return ret;
}

var from = replaceToParam(clauses["FROM"]);
var where = replaceToParam(clauses["WHERE"]);
console.log("from = " + from);
console.log("where = " + where);

clauses["FROM"] = replaceToParam(clauses["FROM"]);
clauses["WHERE"] = replaceToParam(clauses["WHERE"]);


// sqlタグ
var out = "";
for (var i = 0, len = RESERVES.length; i < len; i++) {
	var sqlTag = "";
	var name = RESERVES[i];
	if (idx[name] < 0) continue;

	var sqlId = createSqlId(name);
	if (!mkSqlTag[name]) continue;
	var clause = clauses[name];
	sqlTag += '<' + 'sql id=\"' + sqlId + '\">' + '\n';
	sqlTag += '\t' + clause + '\n';
	sqlTag += '</sql>' + '\n';
	sqlTag = (name + '句').toXMLComment() + '\n' + sqlTag;
	out += sqlTag + '\n';
}
console.log(out);


// selectタグ
var out = "";
for (var i = 0, len = RESERVES.length; i < len; i++) {
	var name = RESERVES[i];
	if (idx[name] < 0) continue;
	
	if (name === "WHERE") {
		out += '<where>' + '\n'
	} else {
		out += name.toLowerCase() + '\n';
	}

	var sqlId = createSqlId(name);
	if (mkSqlTag[name]) {
		var includeTag = '<' + 'include refid=\"' + sqlId + '\" />';
		out += '\t' + includeTag + '\n';
	} else {
		out += '\t' + clauses[name] + '\n';
	}
	
	if (name === "WHERE") {
		out += '</where>' + '\n'
	}
}



var comment = 'SELECT'.toXMLComment();
out = comment + '\n'
	+ '<select id="' + 'selectCstm' + '">' + '\n' 
	+ '\t' + out.split('\n').join('\n\t');
out = out.slice(0, out.length - 1);
out += '</select>';
console.log(out);

