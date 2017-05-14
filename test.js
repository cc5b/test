var startTime = new Date();

console = {
	log : function(obj) { 
		var tmp = new Date() - startTime;
		println(tmp + "ms/ " + obj);
	}
};
log = console.log;

if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      if (target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var output = {};
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source != null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

if (!Number.hasKey("MAX_SAFE_INTEGER")) {
     Number.MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
}

if (!Array.hasKey("isArray")) {
	 Array.isArray = function(arg) {
	 	function existsIndex(arg) {
			for (var i = 0, len = arg.length; i < len; i++) {
				if ((typeof arg[i]) === "undefined") return false;
			}
			return true;
		}
		if (!(arg && (typeof arg) === 'object')) return false;
//		if (/^(\[object \w+\],?)+$/.test(arg.toString())) return false;

	 	return
			arg.hasKey("length") && (typeof arg.length) === 'number' && existsIndex(arg)
			&& arg.hasKey("splice") && (typeof arg.splice) === 'function';
	 };
}

String.prototype.quart = function(q) {
	if (!q) q = "'";
	return q + this + q;
};

Object.prototype.toJSON = function() {
	function toStr(obj) {
		var ary = [];
		var props = obj.getProperties();
		for (var i = 0; i < props.length; i++) {
			var key = props[i];
			var tmp = getValue(obj[key]);
			ary.push(key.quart('"') + ':' + tmp);
		}
		return '{' + ary.join(',') + '}';
	};
	function getValue(val) {
		if (Array.isArray(val)) {
			var ary = [];
			for (var i = 0; i < val.length; i++) {
				ary.push(getValue(val[i]));
			}
			return '[' + ary.join(',') + ']';
		} else if ((typeof val) === 'object') {
			if (/^\[object \w+\]$/.test(val.toString())) {
				return toStr(val);
			} else if (val.hasKey('valueOf') && !val.hasKey('getDate')) {
				return val.valueOf().toString();
			};
			return val.toString().quart('"');
		} else if ((typeof val) === 'string') {
			return val.quart('"');
		} else if ((typeof val) === 'null' || (typeof val) === 'undefined') {
			return (typeof val);
		} else if ((typeof val) === 'number' || (typeof val) === 'boolean') {
			return val;
		}
		return toStr(val);
	}

	return getValue(this);
};
Array.prototype.toJSON = Object.prototype.toJSON;

/** 先頭を大文字化 */
String.prototype.capitalize = function(){
    return this.charAt(0).toUpperCase() + this.slice(1);
};
/** キャメルケース変換 */
String.prototype.toCamelCase = function() {
	var f = function(match, p1) {
		return p1.toUpperCase();
	};
	return this.toLowerCase().replace(/[ +_](\w)/gi, f);
};

/** XMLコメント化 */
String.prototype.toXMLComment = function(){
    return "<!-- " + this + " -->";
};

/** isEmpty */
Array.prototype.isEmpty    = function() { return this.length === 0; };
Array.prototype.isNotEmpty = function() { return this.length !== 0; };

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

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.hasKey("map")) {
  Array.prototype.map = function(callback, thisArg) {
    var T, A, k;
    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }
    // 1. Let O be the result of calling ToObject passing the |this| 
    //    value as the argument.
    var O = this;
    // 2. Let lenValue be the result of calling the Get internal 
    //    method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;
    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
//    if (typeof callback !== 'function') {
//      throw new TypeError(callback + ' is not a function');
//    }
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length > 1) {
      T = thisArg;
    }
    // 6. Let A be a new array created as if by the expression new Array(len) 
    //    where Array is the standard built-in constructor with that name and 
    //    len is the value of len.
    A = new Array(len);
    // 7. Let k be 0
    k = 0;
    // 8. Repeat, while k < len
    while (k < len) {
      var kValue, mappedValue;
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal 
      //    method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
//      if (k in O) {
        // i. Let kValue be the result of calling the Get internal 
        //    method of O with argument Pk.
        kValue = O[k];
        // ii. Let mappedValue be the result of calling the Call internal 
        //     method of callback with T as the this value and argument 
        //     list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);
        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor
        // { Value: mappedValue,
        //   Writable: true,
        //   Enumerable: true,
        //   Configurable: true },
        // and false.
        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, k, {
        //   value: mappedValue,
        //   writable: true,
        //   enumerable: true,
        //   configurable: true
        // });
        // For best browser support, use the following:
        A[k] = mappedValue;
//      }
      // d. Increase k by 1.
      k++;
    }
    // 9. return A
    return A;
  };
};

/** Filter */
if (!Array.hasKey("filter")) {
  Array.prototype.filter = function(fun /*, thisp */) {
    "use strict";

    if (this == null) throw new TypeError();

    var t = this,
        len = t.length >>> 0;

    if ((typeof fun) != "function") throw new TypeError();

    var res = [],
        thisp = arguments[1];

    for (var i = 0; i < len; i++) {
//      if (i in t) {
        var val = t[i]; // fun が this を変化させた場合に備えて
        if (fun.call(thisp, val, i, t)) res.push(val);
//      }
    }

    return res;
  };
}

/** FilterOne */
Array.prototype.filterOne = function(fun, dflt) {
	var res = this.filter(fun);
	if (res.length === 0) {
		return (dflt) ? dflt : null;
	}
	return res[0];
};

/** select */
Array.prototype.select = function(cond) {
	if (!cond) return this;
	if ((typeof cond) !== 'object') return [];
	return this.filter(function (e) {
		var bool = true;
		cond.getProperties().forEach(function (key) {
			if (!e.hasKey(key) || (typeof e[key]) !== (typeof cond[key]) || e[key] !== cond[key]) {
				bool = false;
			}
		});
		return bool;
	});
};

/** selectOne */
Array.prototype.selectOne = function(cond, dflt) {
	var res = this.select(cond);
	if (res.length === 0) {
		return (dflt) ? dflt : null;
	}
	return res[0];
};

/** some */
if (!Array.hasKey("some")) {
  Array.prototype.some = function(fun /*, thisp */) {

    if (this == null) throw new TypeError();

    var t = this,
        len = t.length >>> 0;

    if ((typeof fun) != "function") throw new TypeError();

    var thisp = arguments[1];

    for (var i = 0; i < len; i++) {
      if (fun.call(thisp, t[i], i, t))
        return true;
    }

    return false;
  };
}

/** 正規表現matchを配列で返す. */
RegExp.prototype.matches = function(str) {
	var ret = [];
	var copy = Object.assign({}, this);
	var tmpLastIndex = 0;
	this.global = false;
//	log("str=" + str);
	while (this.exec(str.slice(tmpLastIndex)) != null) {
		var mat = {};
		mat.index = tmpLastIndex + RegExp.index;
		mat.input = str;
		mat.lastIndex = tmpLastIndex + RegExp.lastIndex;
		mat.lastMatch = RegExp.lastMatch;
		mat.lastParen = RegExp.lastParen;
		mat.leftContext = str.slice(0, tmpLastIndex) + RegExp.leftContext;
		mat.rightContext = RegExp.rightContext;
		for (var i = 0; i < 100; i++) {
			if (!RegExp.hasKey("$" + i)) break;
			mat[i] = RegExp["$" + i];
		}
		ret.push(mat);
		tmpLastIndex = mat.lastIndex;
		if (!copy.global) break;
	}
	this.global = copy.global;

	return ret;
};

/** 文字列の埋め込み */
String.prototype.f = function(args) {
	function _f(msg, params) {
		function escape(str) {
			return str.replace(/(\W)/g, '\\$&');
		}
		var ret = msg;
		if (Array.isArray(params)) {
			/\$\{(\d+?)\}/gm.matches(msg).forEach(function(m, i) {
				ret = ret.replace(escape(m[0]), params[i]);
			});
		} else if ((typeof params) === 'object') {
			/\$\{(.+?)\}/gm.matches(msg).forEach(function(m) {
				ret = ret.replace(escape(m[0]), eval(
					'params\.' + escape(m[1])
				));
//				var tmp = params;
//				var exists = false;
	//			ret = ret.replace(m[0].replace(/(\W)/g, '\\$&'), eval(
	//				'params\.' + m[1].replace(/(\W)/g, '\\$&')
	//			));
	//			m[1].split('\.').forEach(function(k, i) {
	//				if ((exists || i === 0) && tmp.hasKey(k)) {
	//					tmp = tmp[k];
	//					exists = true;
	//				}
	//				else exists = false;
	//			});
	//			if (exists) ret = ret.replace('\'+ m[0], tmp);
			});
		} else {
			ret = _f(msg, arguments.slice(1));
		}
		return ret;
	}
    return (arguments.length === 1) ?  _f(this, args) : _f(this, arguments);
};

/** 基底クラス */
class MyObj {
	toJSON = toJSON;
}

/** カラム情報 */
class ColumnInfo extends MyObj {
	columnName; dataType; ordinalPosition; columnDefault; isNullable; dataType; 
	numericPrecision; columnType; columnKey; columnComment;
	
	function isNumeric() {
		return (this.numericPrecision != "");
	}
	
	/** コンストラクタ */
	function ColumnInfo(arg) {
		if ((typeof arg) !== 'object') return;
		this.columnName      = arg.columnName;
		this.ordinalPosition = (arg.ordinalPosition |0);
		this.columnDefault   = arg.columnDefault;
		this.isNullable      = (arg.isNullable === 'YES');
		this.numericPrecision = arg.numericPrecision;
		this.dataType        = arg.dataType;
		this.columnType      = arg.columnType;
		this.columnKey       = arg.columnKey;
		this.columnComment   = arg.columnComment;

		if (!!arg.columnDefault) {
			if (this.isNumeric()) this.columnDefault = (this.columnDefault |0);
		} else if (this.isNullable) {
			this.columnDefault = null;
		} else {
			if (this.isNumeric()) this.columnDefault = 0;
		}
	}
	
	function getColumnNameCamelCase() {
		return this.columnName.toCamelCase();
	}

	function javaTypeMap() {
		return {
			CHAR: "String",
			VARCHAR: "String",
			LONGVARCHAR: "String",
			TINYTEXT: "String",
			TEXT: "String",
			MEDIUMTEXT: "String",
			LONGTEXT: "String",
			NUMERIC: "BigDecimal",
			DECIMAL: "BigDecimal",
			BIT: "Boolean",
			BOOL: "Boolean",
			BOOLEAN: "Boolean",
			TINYINT: "Byte",
			SMALLINT: "Short",
			MEDIUMINT: "Integer",
			INT: "Integer",
			INTEGER: "Integer",
			BIGINT: "Long",
			REAL: "Float",
			FLOAT: "Float",
			DOUBLE: "Double",
			BINARY: "Byte[]",
			VARBINARY: "Byte[]",
			LONGVARBINARY: "Byte[]",
			DATE: "Date",
			YEAR: "Date",
			TIME: "Time",
			TIMESTAMP: "Timestamp",
			TINYBLOB: "Byte[]",
			BLOB: "Byte[]",
			MEDIUMBLOB: "Byte[]",
			LONGBLOB: "Byte[]"
		};
	}
	
	function toJavaType() {
		if ((typeof this.dataType) !== 'string') return null;
		if (this.columnType === 'tinyint(1)') return 'Boolean'; 
		return this.javaTypeMap()[this.dataType.toUpperCase()];
	}
	
};

/** テーブル情報 */
class TableInfo extends MyObj {
	tableName; tableComment;
	alias; isBaseTable; columns = [];

	/** コンストラクタ */
	function TableInfo(arg) {
		if ((typeof arg) !== 'object') return;
		this.tableName = arg.tableName.toUpperCase();
		this.tableComment = arg.tableComment;
	}

	function get(columnName) {
		return this.columns.selectOne({columnName: columnName}, new ColumnInfo());
	}
	
	function exists(columnName) {
		return !!get(columnName).columnName;
	}
};

/** テーブルリスト */
class Tables extends MyObj {
	tables = [];
	
	function Tables(tables) {
		if (!Array.isArray(tables)) return;
		this.tables = tables;
	}
	
	function get(tableName) {
		return this.tables.selectOne({tableName: tableName}, new TableInfo());
	}

	function exists(tableName) {
		return !!get(tableName).tableName;
	}
	
	function getByAlias(alias) {
		return this.tables.selectOne({alias: alias}, new TableInfo());
	}
	
	function getByColumnName(columnName) {
		return this.tables.filterOne(function(e) {
			return e.exists(columnName);
		});
	}
	
	function getByAliasOrColumnName(alias, columnName) {
		var ret = this.tables.selectOne({alias: alias});
		if (!ret) {
			ret = this.getByColumnName(columnName);
		}
		return ret;
	}
	
	function getBaseTable() {
		return this.tables.selectOne({isBaseTable: true});
	}
} 

/** JSON文字列化 */
function toJSON(arg) {
	var target = ((typeof arg) === 'undefined') ? this : arg;
	if ((typeof target) !== 'object') return target; 
	var obj = {};
	target.getProperties().forEach(function(e) {
		obj[e] = target[e];
	}, target);
	return obj.toJSON.call(target);
};

/** Range */
class Range extends MyObj {
	start; end; type; step; length;

	function Range() {
		var args = arguments;
		var start, end, type, step;
		if (args.length === 1 && (typeof args[0]) === 'string') {
			var r = /(-?\d+)\s*(,|to|until)\s*(-?\d+)(\s*by\s*(-?\d*))?/i;
			var matches = r.matches(args[0]);
			if (matches.length) {
				m = matches[0];
				start = m[1];
				end = m[3];
				type = m[2];
				step = m[5];
			}
		} else if (args.length > 1) {
			start = args[0];
			end = args[1];
			type = 'until';
			step = (args.length > 2 && args[2]) ? args[2] : 1;
		}
		this.start = parseInt(start);
		this.end = parseInt(end);
		this.type = (type && type.toLowerCase() === 'to') ? 'to' : 'until';
		this.step = (parseInt(step) !== 0) ? parseInt(step) : 1;

		this.isTo = function() {
			return (type === 'to') ? 1 : 0;
		};
		
		function setLength() {
			var st = (this.start |0);
			var ed = (this.end |0);
			var step = this.step ? (this.step |0) : 1;
			this.length = Math.max(0, Math.ceil(((ed + isTo()) - st) / this.step));
		}		
		setLength();
	}	

	function inInterval(x) {
		if (step > 0)
			return x >= start && x < (end + isTo());
		else
			return x <= start && x > (end + isTo());
	}
	function toArray() {
		return new Array(length |0).map(function(_, i) {
			return start + (step * i);
		});
	}
};

/** 正規表現合致index範囲 */
class RegExpRanges extends MyObj {
	input; regexp; ranges = [];
	function RegExpRanges(input, regexp) {
		if (!input || !regexp) return;
		this.input = ((typeof input) === 'string') ? input : "";
		this.regexp = regexp;
		this.ranges = regexp.matches(input).map(function(e) { return new Range(e.index, e.lastIndex); });
	}
	function inInterval(x) {
		return ranges.some(function(e) { return e.inInterval(x); });
	}
	function slice(x) {
		var newObj = new RegExpRanges();
		newObj.input = this.input.slice(x);
		newObj.regexp = this.regexp;
		newObj.ranges = this.ranges.map(function(e){
			var newIdx = e.start - x;
			var newLastIdx = e.end - x;
			if (newIdx < 0 && newLastIdx >= 0) {
				newIdx = 0;
			}
			return new Range(newIdx, newLastIdx);
		}).filter(function(e) {
			return (e.start >= 0 && e.start < newObj.input.length
			 && e.end >= 0 && e.end < newObj.input.length);
		});
		newObj.inInterval = this.inInterval;
		return newObj;
	}
}

/** 正規表現：文字列リテラル・コメント */
var REGEX_STR_LITERAL_COMMENT = /(["']).+?\1|\/\*.+?\*\/|--(\*\w+)?\s+.+?\n/gim;

/** カーソル位置からSQLを取得. */
function getSqlByPos() {

	var tmpSrc = "";
	var pos = 0;
    
	for (var i in sources) { 
		tmpSrc += sources[i] + "\n";
		if (i < frmSql.row)
			pos += sources[i].length + "\n".length;
	}
	pos += frmSql.col;
	
	var st = ed = pos;

	var exRanges = new RegExpRanges(tmpSrc, REGEX_STR_LITERAL_COMMENT);

	do {
		st = tmpSrc.lastIndexOf(";", Math.max(st - 1, 0));
	} while (exRanges.inInterval(st));
	do {		
		ed = tmpSrc.indexOf(";", ed);
	} while (exRanges.inInterval(ed++));

    st = (st <= 0) ? 0 : st + 1;
	ed = (ed < 0) ? tmpSrc.length : ed;
	
	log("st=" + st + ", ed=" + ed + ", str=" + tmpSrc.slice(st, ed).trim().replace(/\s+/g, ' '));
	return tmpSrc.slice(st, ed).trim();
}

/** Dao */
class Dao {
	/** クエリ実行 */
	function executeQuery(sql, params) {
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
			ary.push(rowObj);
			rs.next();
		}
	    return ary;
	}
	
	/** カラム情報取得 */
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
	
		var ret = executeQuery(sql, params).map(function(e){
			return new ColumnInfo(e);
		});
		return ret;
	}
	
	/** テーブル情報取得 */
	function getTableInfo(schemaName, tableName) {
		var sql = '
			select
				*
			from
				information_schema.TABLES
			where
				TABLE_SCHEMA = :schemaName
				and TABLE_NAME = :tableName
		';
		var params = [
			{name : 'schemaName', value : schemaName, type : application.ftString, isNull : false},
			{name : 'tableName', value : tableName, type : application.ftString, isNull : false}
		];
	
		var result = executeQuery(sql, params).map(function(e){
			return new TableInfo(e);
		});
		
		if (result.length === 0) {
			alert("テーブルが存在しません。 スキーマ：" + schemaName + ", テーブル：" + tableName);
		}
		return result[0];
	}
}

/******************** メイン処理 *****************/

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
var dao = new Dao();
var schemaName = conn.getSchemaName();

var str = ((selectedText) ? selectedText : getSqlByPos()).trim();

var SQL_TYPE = {SELECT:1, INSERT:2, UPDATE:3, DELETE:4};

var exRanges = new RegExpRanges(str, REGEX_STR_LITERAL_COMMENT);
var match = (/\w+/gi).matches(str).filterOne(function(e){
	return (SQL_TYPE.hasKey(e[0].toUpperCase()) && !exRanges.inInterval(e.index));
});

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
	clauses[name] = str.slice(idx[name] + name.length, lastIdx).trim("\n");
	log("clauses["+name+"]=" + clauses[name]);
}

function getTables() {
	var from = clauses["FROM"].replace(REGEX_STR_LITERAL_COMMENT, '');
	var r = /(from|join)\s+(\w+)\s+(as\s+)?(\w+)?/gim;
	
	var tableList = r.matches("from " + from).map(function(m) {

		var tmp = {
			tableName: m[2],
			alias: m[4],
			isBaseTable: (m[1].toUpperCase() === "FROM")
		};
		var t = dao.getTableInfo(schemaName, tmp.tableName);

		t.alias = tmp.alias;
		t.isBaseTable = tmp.isBaseTable;
		t.columns = dao.getColumnInfo(schemaName, t.tableName);
	
		return t;
	});
	return new Tables(tableList);
}
var tables = getTables();

var selectClause = clauses["SELECT"];

//log(selectClause);
function fixAster() {
	log("fixAster() : start");
	var selectClause = clauses["SELECT"];
	var r = /((\w+)\s*\.\s*)?(\*)/gm;
	var exRanges = new RegExpRanges(selectClause, REGEX_STR_LITERAL_COMMENT);
//	log("selectClause=" + selectClause);
//	exRanges.ranges.forEach(function(e) {
//		log(e.start + " " + e.end + " " + exRanges.input.slice(e.start, e.end));
//	});
	selectClause = selectClause.replace(r, function(match, p1, p2, p3, offset) {
//		log("p2=${0}, p3=${1}, offset=${2}, str=${3}".f(p2, p3, offset, selectClause.slice(offset)));
		if (exRanges.inInterval(offset)) {
			return match;
		}
		var tmp = selectClause.slice(offset);
		if (tmp.slice(0, Math.max(tmp.indexOf(","), 0)).match(/\*\s*\)/)) {
			return match;
		}
		var ts = [];
		if (!!p2) {
			var tbl = tables.getByAlias(p2);
			if (!tbl.tableName) {
				alert("エイリアスが不正です。：" + p2);
				exit();
			}
			ts.push(tbl);
		} else {
			ts = tables.tables;
		}
		return ts.map(function (t) {
			return t.columns.map(function(c) {
				return ((!!t.alias) ? t.alias + "." : "") +  c.columnName;
			}).join(", ");
		}).join(", ");
	});
//	log("selectClause=" + selectClause);
	return selectClause;
	log("fixAster() : end");
}
selectClause = clauses["SELECT"] = fixAster();


function getSqlColumns() {
	log("getSqlColumns() : start");
	var r = /^((\w+)\s*\.\s*)?(\*|\w+)(\s+(as\s+)?(\w+))?$/m;
 //   selectClause.split(",").forEach(function(e) {
//		var str = e.replace(REGEX_STR_LITERAL_COMMENT, '').trim();
//		var match = r.matches(str);
//		var m = (match.length) ? match[0] : new Array(7);
//		return {
//			tableAlias: m[2],
//			columnName: m[3],
//			columnAlias: m[6]
//		};
//	});
	return selectClause.split(",").map(function(e) {
		var str = e.replace(REGEX_STR_LITERAL_COMMENT, '').trim();
		var match = r.matches(str);
		var m = (match.length) ? match[0] : new Array(7);
		return {
			tableAlias: m[2],
			columnName: m[3],
			columnAlias: m[6]
		};
	}).filter(function(c) {
		return !!c.columnName;
	});
}
//log(getSqlColumns().toJSON());


/** sql_id 生成 */
function createSqlId(name) {
	return [name.toCamelCase().capitalize(), "Clause", "Cstm"].join("_");
}

var sqlColumns = getSqlColumns();

/** 重複を排除. */
function distinctSqlColumns(sqlColumns) {
	log("distinctSqlColumns() : start");
	var ret = [];
	sqlColumns.forEach(function(e) {
		if (ret.filter(function(c) {
			return  ((!!c.columnAlias) ? c.columnAlias : c.columnName)
				=== ((!!e.columnAlias) ? e.columnAlias : e.columnName);
		}).length === 0) {
			ret.push(e);
		}
	});
	log("distinctSqlColumns() : end / size=" + ret.length);
	return ret;
}
sqlColumns = distinctSqlColumns(sqlColumns);

function getSqlParams(str) {
	log("getSqlParams() : start");
	function toModel(m) {
		return {tableAlias : m[3], columnName : m[5], operator : m[6], value : m[7]
		, index: m.index, lastIndex: m.lastIndex, valIndex : m.lastIndex - m[7].length };
	}

	var ary = [];
	var r = /(((\w+)(\s+)?\.)?(\w+)\s+?(=|<>|[<>]=?|LIKE)\s+)([\d.]+|'.*?')/gim;
	ary = r.matches(str).map(function(m) {
		return toModel(m);
	});
//	var match = [], pos = 0;
//	do {
//		match = r.matches(str.slice(pos));
//		if (match.length === 0) break;
//		var m = toModel(match[0], pos);
//		ary.push(m);
//		pos += m.lastIndex;
//	} while (match.length > 0);
		
	log("getSqlParams() : end / size=" + ary.length);
	return ary;
}

/** 重複を排除. */
function distinctSqlParams(sqlParams) {
	log("distinctSqlParams() : start");
	var ret = [];
	sqlParams.forEach(function(e) {
		if (ret.select({columnName: e.columnName}).length === 0)
			ret.push(e);
	});
	log("distinctSqlParams() : end / size=" + ret.length);
	return ret;
}

var sqlParams = getSqlParams(str);
var distinctSqlParams = distinctSqlParams(sqlParams);


function replaceToParam(str) {
//	log("in =" + str);

	function toModel(m) {
		return {tableAlias : m[3], columnName : m[5], operator : m[6], value : m[11]
		, index: m.index, lastIndex: m.lastIndex, valIndex : m.lastIndex - m[11].length };
	}

	var ret = str;
	var r = /(((\w+)(\s+)?\.)?(\w+)\s+?((=)|(<>)|([<>]=?)|(LIKE))\s+)(([\d.]+)|('.*?'))/im;
	var match = [], pos = 0;
	do {
		match = r.matches(ret.slice(pos));
//		log("pos=${0}, match=${1}".f(pos, match.toJSON()));
		if (match.length === 0) break;
		var m = toModel(match[0]);
		var clm = tables.getByAlias(m.tableAlias).get(m.columnName);
		var after = '#{${columnName},jdbcType=${dataType}}'
				.f({columnName: m.columnName.toCamelCase(),
				dataType: clm.dataType.toUpperCase()});
		ret = ret.slice(0, pos + m.valIndex)
			+ ret.slice(pos + m.valIndex).replace(m.value, after);
		pos += m.lastIndex;
	} while (match.length > 0);
	
//	log("out=" + ret);
	return ret;
}

clauses["FROM"] = replaceToParam(clauses["FROM"]);
clauses["WHERE"] = replaceToParam(clauses["WHERE"]);

function createResultClassName(tables) {
	return 'CstmResult';
}
function createParamsClassName(tables) {
	var baseTable = tables.getBaseTable();
	return baseTable.tableName.toCamelCase().capitalize() + "Param";
}
function createMapperId(tables) {
	return "selectCstm";
}
function createResultMapId(sqlColumns) {
	return "Cstm_ResultMap";
}


var out = "";

/** タブ区切り一覧(params) */
function createTabListForParams(sqlParams) {
	log("createTabListForParams() : start");
	var ret = "";
		ret += ["No.", "論理名", "物理名", "型"].join("\t") + "\n";
		ret += sqlParams.map(function(e, i) {
			var tbl = tables.getByAliasOrColumnName(e.tableAlias, e.columnName);
			var clm = tbl.get(e.columnName);
			var tmp = [(i+1), clm.columnComment, clm.columnName.toCamelCase()
			, clm.toJavaType()].join("\t") + "\n";
			
			return tmp;
		}).join("");
	log("createTabListForParams() : end");
	return ret;
}
var tmp = createTabListForParams(distinctSqlParams);
out += tmp;
//log(tmp);

/** タブ区切り一覧(select) */
function createTabListForSelect(sqlColumns) {
	log("createTabListForSelect() : start");

	var ret = "";
		ret += ["No.", "論理名", "", "物理名", "", "型", "NULL"].join("\t") + "\n";
		ret += sqlColumns.map(function(e, i) {
			var tbl = tables.getByAliasOrColumnName(e.tableAlias, e.columnName);
			var clm = tbl.get(e.columnName);
			var tmp = [(i+1), tbl.tableComment, clm.columnComment, tbl.tableName, clm.columnName, clm.columnType
				, (clm.isNullable ? '〇' : '×') ].join("\t") + "\n"; 
			return tmp;
		}).join("");
	log("createTabListForSelect() : end");
	return ret;
}
var tmp = createTabListForSelect(sqlColumns);
out += tmp;
//log(tmp);

/** Resultモデル(Backbone.js) */
function createResBBJS(sqlColumns) {
	log("createResBBJS() : start");

	var ret = "";
	var type = createResultClassName(tables);
		ret += 
'var ${type} = Backbone.Model.extend({
	defaults: {
'			.f({type : type});
		ret += sqlColumns.map(function(e) {
			var clm = tables.getByAlias(e.tableAlias).get(e.columnName);
			var defVal = null;
			if (!clm){
			} else if (!!clm.columnDefault) {
				if (clm.isNumeric()) defVal = clm.columnDefault;
				else defVal = clm.columnDefault.quart();
			} else if (!clm.isNullable) {
				defVal = "''";
			}
			
			var tmp = 
'		${clm.columnName.toCamelCase()}: ${defVal}, // ${clm.columnComment}
';
			return tmp.f({clm: clm, defVal: defVal});
		}).join('');
		ret += "\t" + '},' + "\n";
		
		ret += sqlColumns.map(function(e) {
			var clm = tables.getByAlias(e.tableAlias).get(e.columnName);
			var columnNameCamel = clm.getColumnNameCamelCase();
			var tmp = 
'	/** ' + clm.columnComment + ' を取得. */
	get' + columnNameCamel.capitalize() + ': function() {
		return this.get(' + columnNameCamel.quart() + ');
	},
	/** ' + clm.columnComment + ' を設定. */
	set' + columnNameCamel.capitalize() + ': function(val) {
		this.set(' + columnNameCamel.quart() + ', val);
	}, 
';
			return tmp;			
		}).join('');
	
		
		ret += '});' + "\n";
	log("createResBBJS() : end");
	return ret;
}
var tmp = createResBBJS(sqlColumns);
out += tmp;
//log(tmp);

/** Resultモデルフィールド */
function createResultClassText(sqlColumns) {
	log("createResultClassText() : start");

	var ret = "";
	var type = createResultClassName(tables);
		ret += "public class ${type} {\n".f({type : type});
		ret += sqlColumns.map(function(e) {
			var clm = tables.getByAlias(e.tableAlias).get(e.columnName);
			var tmp = 
'	/** ${clm.columnComment} */
	private ${clm.toJavaType()} ${clm.columnName.toCamelCase()};
';
			return tmp.f({clm: clm});
		}).join("\n") + "\n";
		ret += '}' + "\n";
	log("createResultClassText() : end");
	return ret;
}
var tmp = createResultClassText(sqlColumns);
out += tmp;
//log(tmp);

/** MapperIF */
function createMapperIFText(sqlParams) {
	log("createMapperIFText() : start");

	var ret = "";
	var type = createResultClassName(tables);
	var id = createMapperId(tables);
	var jdc = "", met = "";
		met += "	List<${type}> ${id}(\n".f({type : type, id: id});
		met += sqlParams.map(function(e) {
			var tbl = tables.getByAliasOrColumnName(e.tableAlias, e.columnName);
			var clm = tbl.get(e.columnName);
			var columnName = clm.getColumnNameCamelCase();
			var javaType = clm.toJavaType();
			var tmp = '		@Param("${columnName}") ${javaType} ${columnName}';
			return tmp.f({columnName: columnName, javaType: javaType});
		}).join(",\n") + "\n";
		met += "	);\n";
		
	ret = jdc + met;
	log("createMapperIFText() : end");
	return ret;
}
var tmp = createMapperIFText(distinctSqlParams);
out += tmp;
//log(tmp);


/** MapperIF (Object版) */
function createMapperIFTextForObj(sqlParams) {
	log("createMapperIFTextForObj() : start");

	var ret = "";
	var type = createResultClassName(tables);
	var id = createMapperId(tables);
	var paramType = createParamsClassName(tables);
	var jdc = "", met = "";
		met += "	List<${type}> ${id}(${paramType} params);\n"
				.f({type : type, id: id, paramType: paramType}) + "\n";
		
	ret = jdc + met;
	log("createMapperIFTextForObj() : end");
	return ret;
}
var tmp = createMapperIFTextForObj(distinctSqlParams);
out += tmp;
//log(tmp);

/** MapperParameterクラス */
function createMapperParamClass(sqlParams) {
	log("createMapperParamClass() : start");

	var ret = "";
	var type = createParamsClassName(tables);
	var ret = "";
		ret += "public class ${type} {\n".f({type: type});
		ret += sqlParams.map(function(e) {
			var tbl = tables.getByAliasOrColumnName(e.tableAlias, e.columnName);
			var clm = tbl.get(e.columnName);
			var tmp = 
'	/** ${clm.columnComment} */
	private ${clm.toJavaType()} ${clm.columnName.toCamelCase()};
';
			return tmp.f({clm: clm});
		}).join("\n") + "\n";
		ret += '}' + "\n";
	log("createMapperParamClass() : end");
	return ret;
}
var tmp = createMapperParamClass(distinctSqlParams);
out += tmp;
//log(tmp);

function escapeCDATA(str) {
	return str.replace(/\s+([<>]=?|<>|\&)\s+/gm, ' <![CDATA[ $1 ]]> ');
}

function createXMLTag(args) {
	var params = {
		comment: (args.hasKey("comment")) ? args.comment.toXMLComment() : '',
		tagName: args.tagName,
		attrs: (args.hasKey("attrs") && (typeof args.attrs) === 'object') ? args.attrs : {},
		text: (args.hasKey("text")) ? escapeCDATA(args.text) : null,
		indent: (args.hasKey("indent")) ? (args.indent | 0) : 0,
		br: (args.hasKey("br") && !!args.br) ? '\n' : ''
	};
	var ret = "";
	params.indentStr = new Array(params.indent + 1).join("\t");
	params.attrsStr = params.attrs.map(function(e) {
		return '${name}="${value}"'.f(e);
	}).join(' ');
	if (params.indent && params.br) {
		params.text = params.text.split("\n").join("\n" + params.indentStr);
	}
	if (params.br) {
		params.text = "\n" + "\t" 
		+ ((params.indent) ? params.indentStr : '')
		+ params.text + "\n"
		+ ((params.indent) ? params.indentStr : '');
	}
	var tmp = 
'${indentStr}${comment}
${indentStr}<${tagName} ${attrsStr}>${text}</${tagName}>
';
	ret = tmp.f(params);
	return ret;
}


/** ResultMap 生成 */
function createResultMap(sqlColumns) {
	var ret = "";
	var id = createResultMapId(sqlColumns);
	var type = createResultClassName(tables);
	var columnsStr = sqlColumns.map(function(e) {
			var tbl = tables.getByAliasOrColumnName(e.tableAlias, e.columnName);
			var clm = tbl.get(e.columnName);
			var tagName = (clm.columnKey === 'PRI' && tbl.isBaseTable) ? 'id' : 'result';
			var tmp =
'		<${tagName} column="${clm.columnName}" property="${clm.columnName.toCamelCase()}" jdbcType="${clm.dataType.toUpperCase()}" />'
				.f({clm: clm, tagName: tagName});
			return tmp;
		}).join("\n");
		ret += 
'	${id.toXMLComment()}
	<resultMap id="${id}" type="${type}">
${columnsStr}
	</resultMap>

'
			.f({id: id, type: type, columnsStr: columnsStr});
		return ret;
}
var tmp = createResultMap(sqlColumns);
out += tmp;
//log(tmp);



/** sqlタグ */
function createSqlTag(comment, sqlId, text) {
	return createXMLTag({
		comment: comment,
		tagName: 'sql',
		attrs: [{name: 'id', value: sqlId}],
		text: text,
		br: true,
		indent: 1
	});
}

// selectタグ
function createSelectTag() {
	log("createSelectTag() : start");

	function _sqlTags() {
		var ret = "";
		for (var i = 0, len = RESERVES.length; i < len; i++) {
			var name = RESERVES[i];
		
			if (!mkSqlTag[name]) continue;
		
			var comment = (name.toLowerCase() + "句");	    
			var sqlId = createSqlId(name);
			var text = clauses[name];
		
			ret += createSqlTag(comment, sqlId, text) + "\n";
		
		}
		return ret;
	}

	var tmp = "";
	for (var i = 0, len = RESERVES.length; i < len; i++) {
		var name = RESERVES[i];
		if (idx[name] < 0) continue;
		
		if (name === "WHERE") {
			tmp += "\t" + "<where>" + "\n";
		} else {
			tmp += "\t" + name.toLowerCase() + "\n";
		}
	
		var sqlId = createSqlId(name);
		if (mkSqlTag[name]) {
			var includeTag = "<" + "include refid=\"" + sqlId + "\" />";
			tmp += "\t\t" + includeTag + "\n";
		} else {
			tmp += "\t\t" + clauses[name] + "\n";
		}
		
		if (name === "WHERE") {
			tmp += "\t" + "</where>" + "\n";
		}
	}
	
	var mapperId = createMapperId(tables);
	var comment = mapperId;
	var resultMapId = createResultMapId(tables);
	var params = {
		comment : comment,
		tagName: "select",
		attrs: [
			{name: "id", value: mapperId}, 
			{name: "resultMap", value: resultMapId}
		],
		text: tmp.trim(),
		br: true,
		indent: 1
	};
	var selectTag = createXMLTag(params);
	var ret = _sqlTags() + "\n" + selectTag;
	
	// Object版
	params.attrs.push({name: "parameterType", value: createParamsClassName(tables)});
	var selectTagForObj = createXMLTag(params);
	ret += "\n" + selectTagForObj;
	
	log("createSelectTag() : end");
	return ret;
}
var tmp = createSelectTag();
out += tmp;
//log(tmp);

Clipboard.asText = out;

alert("クリップボードにコピーしました.");
exit();
