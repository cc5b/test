
console = {
	log : function(obj) { 
		println(obj);
	}
};
log = console.log;

if (!Number.hasKey("MAX_SAFE_INTEGER")) {
     Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
}

/** 先頭を大文字化 */
String.prototype.capitalize = function(){
    return this.charAt(0).toUpperCase() + this.slice(1);
};
/** キャメルケース変換 */
String.prototype.toCamelCase = function() {
	var replacerToCamelCase = function(match, p1) {
		return p1.toUpperCase();
	};
	return this.toLowerCase().replace(/[ +_](\w)/gi, replacerToCamelCase);
};

/** XMLコメント化 */
String.prototype.toXMLComment = function(){
    return "<!-- " + this + " -->";
};

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if ( !Array.hasKey("includes") ) {
  Array.prototype.includes = function(searchElement, fromIndex) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      // var o = Object(this);
	  var o = this;
      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;
      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }
      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = (fromIndex) ? fromIndex : 0;
      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        // NOTE: === provides the correct "SameValueZero" comparison needed here.
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }
      // 8. Return false
      return false;
  };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.com/#x15.4.4.18
if ( !Array.hasKey("forEach") ) {
  Array.prototype.forEach = function( callback, thisArg ) {
    var T, k;
    if ( this == null ) {
      throw new TypeError( " this is null or not defined" );
    }
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = this;
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0; // Hack to convert O.length to a UInt32
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if ( thisArg ) {
      T = thisArg;
    }
    // 6. Let k be 0
    k = 0;
    // 7. Repeat, while k < len
    while( k < len ) {
      var kValue;
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
//      if ( k in O ) {
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];
        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call( T, kValue, k, O );
//      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}
if ( !Strings.hasKey("forEach") ) Strings.prototype.forEach = Array.prototype.forEach;



var frmSql = application.getActiveWindow();

if (frmSql.formType != "A5SqlEditor") {
	alert("アクティブウィンドウをSQLエディタにしてから実行してください。(1)");
	exit();
}

var conn = application.dbTree.getSelectedDatabaseConnection();
if (!conn) {
	alert("データベースツリーから接続して下さい。");
	exit();
}

var selectedText = frmSql.selectedText;
var sources = frmSql.source;

function getSelectedSql() {
	if (selectedText)
		return selectedText;

	var tmpSrc = "";
	var pos = 0;
    
	for (var i in sources) { 
		tmpSrc += sources[i] + "\n";
		if (i < frmSql.row)
			pos += sources[i].length + "\n".length;
	}
	pos += frmSql.col;
	
	var st = ed = pos;

	function getExcludeList() {
		var r = /(["']).+?\1|\/\*.+?\*\/|--\s+[^ ]+\n/gim;
		var match = r.exec(tmpSrc);
		var ary = [];
		match.forEach(function(e){
			var pos = (ary.length) ? ary[ary.length - 1].end + 1 : 0;
			var idx = tmpSrc.indexOf(e, pos); 
			ary.push({start : idx, end : idx + e.length - 1});
		});
//		log(match);
		return ary; 
	}
    function isExclude(list, pos) {
		var bool = false;
		list.forEach(function(e) {
			if (e.start <= pos && pos <= e.end) {
				bool = true;
				log("(" + e.start + "," + e.end + ")" + ", pos=" + pos + ", str=" + tmpSrc.slice(e.start, e.end + 1));
				return;
			}
		});
		return bool;
	}
	
	var excludeList = getExcludeList();
	do {
		st = tmpSrc.lastIndexOf(";", Math.max(st - 1, 0));
	} while (isExclude(excludeList, st));
	do {		
		ed = tmpSrc.indexOf(";", ed);
	} while (isExclude(excludeList, ed++));
    st = (st <= 0) ? 0 : st + 1;
	ed = (ed < 0) ? tmpSrc.length : ed;
	
	log("st=" + st + ", ed=" + ed + ", str=" + tmpSrc.slice(st, ed).trim().replace(/\s+/g, ' '));
	return tmpSrc.slice(st, ed).trim();
}

class ColumnInfo {
	columnInfoMap = {
		columnName 		: "columnName",
		ordinalPosition : "ordinalPosition",
		isNullable 		: "isNullable",
		dataType 		: "dataType",
		columnType 		: "columnType",
		columnKey 		: "columnKey",
		columnComment 	: "columnComment"
	};
	
	function ColumnInfo(obj) {
		columnInfoMap.getKeys().forEach(function(e) {
			var prop = columnInfoMap[e];
			this[e] = (obj.hasKey(prop)) ? obj[prop] : null;
		}, this);
	}	
};

class TableInfo {
	tableName;
	columns = [];
};

function getColumnInfo(schemaName, tableName) {
	var sql = '
		select
			*
		from
			information_schema.COLUMNS
		where
			TABLE_SCHEMA = :schemaName
			and TABLE_NAME = :tableName
		order by
			ORDINAL_POSITION;
	';
	var params = [
		{name : 'schemaName', value : schemaName, type : application.ftString, isNull : false},
		{name : 'tableName', value : tableName, type : application.ftString, isNull : false}
	];

	var ary = [];

	//	select文を実行
	var rs = conn.executeQuery(sql, params);
	rs.first();
	while (rs.eof() == false) {
		var rowObj = {};
		//	カラム数
		var max = rs.getFieldCount();
		for (var idx = 0; idx < max; idx++) {
			var fieldName  = rs.getFieldName(idx);
			var fieldValue = rs.getFieldValue(idx);
			rowObj[fieldName.toCamelCase()] = fieldValue;
		}
		ary.push(new ColumnInfo(rowObj));
		rs.next();
	}
    return ary;
};
var schemaName = conn.getSchemaName();
//var columns = getColumnInfo(schemaName, "T_USER");


// 入力テスト
var str = "select a.X_ID as X_ID, 'aaa' as X_HOGE, '(bb)b' as X_FUGA, a.X_NAME as X_NAME, b.X_NAME as X_NAME, exists(select 1 from T_C c where c.X_ID = a.X_ID) as IS_EXISTS\n"  
 + " from T_A a inner join T_B b on a.X_ID = b.X_ID and a.X_HOGE_NAME = 'aaa'\n"
 + "where a.X_ID = 23 and a.X_NAME = 'aa' and a.X_HOGE_NAME like '%aaa%' and a.X_VAL >= 12.3 and a.X_FUGA_VALUE < 123 group by a.X_ID having count(*) >= 1 and count(*) <= 3 order by a.X_ID desc, a.X_NAME limit 100 offset 20;";

var str = getSelectedSql();

str = str.trim();


var SQL_TYPE = {SELECT:1, INSERT:2, UPDATE:3, DELETE:4};

var match = (/\w+/gi).exec(str);
var sqlTypeName = (match ? match[0] : "").toUpperCase();

if (!SQL_TYPE.hasKey(sqlTypeName)) {
	alert("SQL文が読み取りできませんでした。");
	exit();
}

var sqlType = SQL_TYPE[sqlTypeName];

switch (sqlType) {
	case SQL_TYPE.SELECT:
		// console.log("select");
		break;
	case SQL_TYPE.INSERT:
		// console.log("insert");
		break;
	case SQL_TYPE.UPDATE:
		// console.log("update");
		break;
	case SQL_TYPE.DELETE:
		// console.log("delete");
		break;
	default:
		// console.log("not found.");
}

var selectLevel = 0;
var RESERVES = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "LIMIT", "OFFSET"];
var idx = {};
var clauses = {};
var mkSqlTag = {};
for (var i in RESERVES) {
	idx[RESERVES[i]] = -1;
	clauses[RESERVES[i]] = "";
	mkSqlTag[RESERVES[i]] = false;
}
mkSqlTag["SELECT"] = mkSqlTag["FROM"] = mkSqlTag["WHERE"] = true;

// 各句の抽出
var lv = 0;
var r = /[\(\),;]|((group|order)\s+by)|[^\s\(\),;]+/gim;
var tmpIdx = 0;

r.exec(str).forEach(function(e) {
	switch (e) {
		case "(": lv++; break;
		case ")": lv--; break;
	}	
	if (lv === 0) {
		var upper = e.toUpperCase();
		tmpIdx = str.indexOf(e, tmpIdx);
		if (RESERVES.includes(upper.replace(/\s+/gim, ' ')) && tmpIdx >= 0) {
			idx[upper] = tmpIdx++;
		}
	}	
});

for (var i = 0, len = RESERVES.length; i < len; i++) {
	var name = RESERVES[i];
	if (idx[name] < 0) continue;
	var lastIdx = str.length - 1;
	for (var j = i+1; j < len; j++) {
		if (idx[RESERVES[j]] < 0) continue;
		lastIdx = Math.min(lastIdx, idx[RESERVES[j]]);
	}
	clauses[name] = str.slice(idx[name] + name.length, lastIdx).trim();
	console.log("clauses["+name+"]=" + clauses[name]);
}

var from = clauses["FROM"];
var r = /(from|join)\s+(\w+)\s+(as\s+)?(\w+)?/gim;
var a = "T_USER u\n inner join T_HOGE h\n on u.ID = h.ID";
var match = r.exec("from " + a);
log(match);
log(RegExp.$1);
log(RegExp.$2);
log(RegExp.$3);
match = r.exec("from " + a);
log(match);
log(RegExp.$1);
log(RegExp.$2);
log(RegExp.$3);

/** sql_id 生成 */
function createSqlId(name) {
	return [name.toCamelCase().capitalize(), "Clause", "Cstm"].join("_");
}

var fields = {};

function replaceToParam(str) {
	// console.log("in =" + str);
	var ret = str;
	var r = /(((\w+)(\s+)?\.)?(\w+)\s+?((=)|(<>)|([<>]=?)|(LIKE))\s+)(([\d.]+)|('.*?'))/gim;

	function toModel(m) {
		var idx = ret.indexOf(m);
		return {alias : RegExp.$3, column : RegExp.$5, operator : RegExp.$6, value : RegExp.$11, valIndex : (idx + m.length) };
	}
	function repToParam(m) {
		var ret = "";
		
		var columnCamel = m.column.toCamelCase();
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
	// console.log("out=" + ret);
	return ret;
}

var from = replaceToParam(clauses["FROM"]);
var where = replaceToParam(clauses["WHERE"]);
// console.log("from = " + from);
// console.log("where = " + where);

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
	sqlTag += "<" + "sql id=\"" + sqlId + "\">" + "\n";
	sqlTag += "\t" + clause + "\n";
	sqlTag += "</sql>" + "\n";
	sqlTag = (name + "句").toXMLComment() + "\n" + sqlTag;
	out += sqlTag + "\n";
}
//console.log(out);


// selectタグ
var out = "";
for (var i = 0, len = RESERVES.length; i < len; i++) {
	var name = RESERVES[i];
	if (idx[name] < 0) continue;
	
	if (name === "WHERE") {
		out += "<where>" + "\n";
	} else {
		out += name.toLowerCase() + "\n";
	}

	var sqlId = createSqlId(name);
	if (mkSqlTag[name]) {
		var includeTag = "<" + "include refid=\"" + sqlId + "\" />";
		out += "\t" + includeTag + "\n";
	} else {
		out += "\t" + clauses[name] + "\n";
	}
	
	if (name === "WHERE") {
		out += "</where>" + "\n";
	}
}



var comment = "SELECT".toXMLComment();
out = comment + "\n"
	+ "<select id=\"" + "selectCstm" + "\">" + "\n" 
	+ "\t" + out.split("\n").join("\n\t");
out = out.slice(0, out.length - 1);
out += "</select>";

// println(out);
