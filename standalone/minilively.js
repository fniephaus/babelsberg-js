// Non-Lively Compatibility
if (!window.module) {
    window.module = function(dottedPath) {
		if (dottedPath == "") return window;
			var path = dottedPath.split("."),
	
	        name = path.pop(),
	        parent = module(path.join("."));
		if (!parent[name]) parent[name] = {
            requires: function(ignored) { return this; },
            toRun: function(code) { code(); },
            uri: function() {}
		};
		return parent[name];
    };
    JSLoader = {
    	loadJs: function() {}
    };

    window.Properties = {
	    all: function(object, predicate) {
	        var a = [];
	        for (var name in object) {
	            if ((object.__lookupGetter__(name) || !Object.isFunction(object[name]))
	              && (predicate ? predicate(name, object) : true)) a.push(name);
	        }
	        return a;
	    },

	    allOwnPropertiesOrFunctions: function(obj, predicate) {
	        var result = [];
	        Object.getOwnPropertyNames(obj).forEach(function(name){
	            if(predicate(obj, name)) 
	                result.push(name);
	        });
	        return result;
	    },
	    
	    own: function(object) {
	        var a = [];
	        for (var name in object) {
	            if (object.hasOwnProperty(name) && (object.__lookupGetter__(name) || !Object.isFunction(object[name]))) a.push(name);
	        }
	        return a;
	    },

	    forEachOwn: function(object, func, context) {
	        var result = [];
	        for (var name in object) {
	            if (!object.hasOwnProperty(name)) continue;
	            var value = object[name];
	            if (!Object.isFunction(value)) {
	                result.push(func.call(context || this, name, value));
	            }
	        }
	        return result;
	    },

	    nameFor: function(object, value) {
	        for (var name in object) { if (object[name] === value) return name; }
	        return undefined;
	    },

	    values: function(obj) {
	        var values = [];
	        for (var name in obj) { values.push(obj[name]); }
	        return values;
	    },

	    ownValues: function(obj) {
	        var values = [];
	        for (var name in obj) if (obj.hasOwnProperty(name)) values.push(obj[name]);
	        return values;
	    },

	    printObjectSize: function(obj) {
	        return Numbers.humanReadableByteSize(JSON.stringify(obj).length);
	    },

	    any: function(obj, predicate) {
	        for (var name in obj) { if (predicate(obj, name)) return true; }
	        return false;
	    },

	    allProperties: function(obj, predicate) {
	        var result = [];
	        for (var name in obj) {
	            if (predicate(obj, name)) result.push(name);
	        }
	        return result;
	    },

	    hash: function(obj) {
	        return Object.keys(obj).sort().join('').hashCode();
	    }

	};
    window.Config = {};
    window.cop = {};
    window.Global = window;
    window.lively = window; // TODO: FIXED
    lively.Module = function() { return null; };
    window.dbgOn = (function (b) { if (b) { debugger } });
    window.JSLoader = function() { throw "Stubbed JSLoader actually in use"; };

    function __oldNamespace(spec, context) {
	var	 i,N;
	context = context || window;
	spec = spec.valueOf();
	if (typeof spec === 'object') {
	    if (typeof spec.length === 'number') {//assume an array-like object
		for (i = 0,N = spec.length; i < N; i++) {
		    return namespace(spec[i], context);
		}
	    } else {//spec is a specification object e.g, {com: {trifork: ['model,view']}}
		for (i in spec) if (spec.hasOwnProperty(i)) {
		    context[i] = context[i];
		    return namespace(spec[i], context[i]);//recursively descend tree
		}
	    }
	} else if (typeof spec === 'string') {
	    (function handleStringCase() {
		var parts;
		parts = spec.split('.');
		for (i = 0, N = parts.length; i<N; i++) {
		    spec = parts[i];
		    context[spec] = context[spec] || {};
		    context = context[spec];
		}
	    })();
	    return context;
	} else {
	    throw new TypeError();
	}
    }

    function namespace(spec, context) {
	var codeDB;
	if (spec[0] == '$') {
	    codeDB = spec.substring(1, spec.indexOf('.'));
	    spec = spec.substring(spec.indexOf('.') + 1);
	}
	var ret = __oldNamespace(spec, context);
	if (codeDB) {
	    ret.fromDB = codeDB;
	}
	return ret;
    };

    Object.extend(Class, {
	isClass: function Class$isClass(object) {
            if (object === Object
		|| object === Array
		|| object === Function
		|| object === String
		|| object === Boolean
		|| object === Date
		|| object === RegExp
		|| object === Number) {
		return true;
            }
            return (object instanceof Function) && (object.superclass !== undefined);
	},
	namespaceFor: function Class$namespaceFor(className) {
	    // get the namespace object given the qualified name
	    var lastDot = className.lastIndexOf('.');
	    if (lastDot < 0) return window;
	    else return namespace(className.substring(0, lastDot));
	},
	unqualifiedNameFor: function Class$unqualifiedNameFor(name) {
	    var lastDot = name.lastIndexOf('.'); // lastDot may be -1
	    var unqualifiedName = name.substring(lastDot + 1);
	    return unqualifiedName;
	}
    });

    Object.extend(Function.prototype, {
	subclass: function(/*... */) {
	    var args = $A(arguments),
	    className = args.shift(),
	    targetScope = Global,
	    shortName = null;

	    if (className) {
		targetScope = lively.Class.namespaceFor(className);
		shortName = lively.Class.unqualifiedNameFor(className);
	    }  else {
		shortName = "anonymous_" + (lively.Class.anonymousCounter++);
		className = shortName;
	    }

	    var klass;
	    if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
		// preserve the class to allow using the subclass construct in interactive development
		klass = targetScope[shortName];
	    } else {
		klass = function() {
		    if (this.initialize) this.initialize.apply(this, arguments);
		    return this;
		};
		klass.name = shortName;
		klass.superclass = this;
		var protoclass = function() { }; // that's the constructor of the new prototype object
		protoclass.prototype = this.prototype;
		klass.prototype = new protoclass();
		klass.prototype.constructor = klass;
		klass.prototype.constructor.type = className; // KP: .name would be better but js ignores .name on anonymous functions
		klass.prototype.constructor.displayName = className; // for debugging, because name can not be assigned
		if (className) targetScope[shortName] = klass; // otherwise it's anonymous

		// remember the module that contains the class def
		if (Global.lively && lively.Module && lively.Module.current)
		    klass.sourceModule = lively.Module.current();
	    };

	    // the remaining args should be category strings or source objects
	    this.addMethods.apply(klass, args);

	    if (!klass.prototype.initialize)
		klass.prototype.initialize = function () {};

	    return klass;
	},

	addMethods: function(/*...*/) {
	    var args = arguments;
	    for (var i = 0; i < args.length; i++) {
		if (!Object.isString(args[i])) { // ignore categories
		    this.addCategorizedMethods(args[i] instanceof Function ? (args[i])() : args[i]);
		}
	    }
	},

	addCategorizedMethods: function(source) {
            var ancestor = this.superclass && this.superclass.prototype;

            var className = this.type || "Anonymous";

            for (var property in source) {

		if (property == 'constructor') continue;

		var getter = source.__lookupGetter__(property);
		if (getter) this.prototype.__defineGetter__(property, getter);
		var setter = source.__lookupSetter__(property);
		if (setter) this.prototype.__defineSetter__(property, setter);
		if (getter || setter) continue;

		var value = source[property];
		// weirdly, RegExps are functions in Safari, so testing for
		// Object.isFunction on regexp field values will return true.
		// But they're not full-blown functions and don't
		// inherit argumentNames from Function.prototype

		var hasSuperCall = ancestor && Object.isFunction(value) &&
                    value.argumentNames && value.argumentNames().first() == "$super";
		if (hasSuperCall) {
                    // wrapped in a function to save the value of 'method' for advice
                    (function() {
			var method = value;
			var advice = (function(m) {
                            return function callSuper() {
				var method = ancestor[m];
				if (!method)
                                    throw new Error(Strings.format('Trying to call super of' +
								   '%s>>%s but super method non existing in %s',
								   className, m, ancestor.constructor.type));
				return method.apply(this, arguments);
                            };
			})(property);

			advice.methodName = "$super:" + (this.superclass ? this.superclass.type + ">>" : "") + property;

			value = Object.extend(advice.wrap(method), {
                            valueOf:  function() { return method },
                            toString: function() { return method.toString() },
                            originalFunction: method
			});
			// for lively.Closures
			method.varMapping = {$super: advice};
                    })();
		}

		this.prototype[property] = value;

		if (property === "formals") { // rk FIXME remove this cruft
                    // special property (used to be pins, but now called formals to disambiguate old and new style
                    Class.addPins(this, value);
		} else if (Object.isFunction(value)) {
                    // remember name for profiling in WebKit
                    value.displayName = className + "$" + property;

                    for (; value; value = value.originalFunction) {
			if (value.methodName) {
                            //console.log("class " + this.prototype.constructor.type
                            // + " borrowed " + value.qualifiedMethodName());
			}
			value.declaredClass = this.prototype.constructor.type;
			value.methodName = property;
                    }
		}
            } // end of for (var property in source)

            return this;
	},

	binds: function() { return this; },

	getVarMapping: function() { return this.varMapping; }
    });

    window.Strings = {
	newUUID: function() {
            var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
            }).toUpperCase();
            return id;
	},

	format: function Strings$format() {
            return Strings.formatFromArray(Array.from(arguments));
	},

	// adapted from firebug lite
	formatFromArray: function Strings$formatFromArray(objects) {
            var self = objects.shift();
            if (!self) { console.log("Error in Strings>>formatFromArray, first arg is undefined"); };

            function appendText(object, string) {
		return "" + object;
            }

            function appendInteger(value, string) {
		return value.toString();
            }

            function appendFloat(value, string, precision) {
		if (precision > -1) return value.toFixed(precision);
		else return value.toString();
            }

            function appendObject(value, string) {
		return Objects.inspect(value);
            }

            var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat, o: appendObject};
            var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;

            function parseFormat(fmt) {
		var oldFmt = fmt;
		var parts = [];

		for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
                    var type = m[8] || m[5],
                    appender = type in appenderMap ? appenderMap[type] : appendObject,
                    precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
                    parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
                    parts.push({appender: appender, precision: precision});

                    fmt = fmt.substr(m.index + m[0].length);
		}
		if (fmt)
                    parts.push(fmt.toString());

		return parts;
            };

            var parts = parseFormat(self),
            str = "",
            objIndex = 0;

            for (var i = 0; i < parts.length; ++i) {
		var part = parts[i];
		if (part && typeof(part) == "object") {
                    var object = objects[objIndex++];
                    str += (part.appender || appendText)(object, str, part.precision);
		} else {
                    str += appendText(part, str);
		}
            }
            return str;
	}
    };
    Object.subclass("lively.morphic.CodeEditor", {});
}
