/**
 * Utopia: A JavaScript util library that assumes modern standards support and doesn't fix any browser bugs
 * @author Lea Verou (http://lea.verou.me)
 * @version 0.2
 */
 
function $(expr, con) { return (con || document).querySelector(expr); }
function $$(expr, con) { return Array.prototype.slice.call((con || document).querySelectorAll(expr)); }

// Make each ID a global variable
// Many browsers do this anyway (it’s in the HTML5 spec), so it ensures consistency
$$('[id]').forEach(function(element) { window[element.id] = element; });

// Array#splice but for strings
String.prototype.splice = function(i, remove, add) {
	remove = +remove || 0;
	add = add || '';
	
	return this.slice(0,i) + add + this.slice(i + remove);
};

(function(){

var _ = window.Utopia = {
	/**
	 * Returns the [[Class]] of an object in lowercase (eg. array, date, regexp, string etc)
	 * Caution: Results for DOM elements and collections aren't reliable.
	 * @param {Object} obj
	 *
	 * @return {String}
	 */
	type: function(obj) {
		if(obj === null) { return 'null'; }

		if(obj === undefined) { return 'undefined'; }

		var ret = Object.prototype.toString.call(obj).match(/^\[object\s+(.*?)\]$/)[1];

		ret = ret? ret.toLowerCase() : '';

		if(ret == 'number' && isNaN(obj)) {
			return 'NaN';
		}

		return ret;
	},

	/**
	 * Iterate over the properties of an object. Checks whether the properties actually belong to it.
	 * Can be stopped if the function explicitly returns a value that isn't null, undefined or NaN.
	 * 
	 * @param obj {Object} The object to iterate over
	 * @param func {Function} The function used in the iteration. Can accept 2 parameters: one of the
	 * 							value of the object and one for its name.
	 * @param context {Object} Context for the above function. Default is the object being iterated.
	 *
	 * @return {Object} Null or the return value of func, if it broke the loop at some point.
	 */
	each: function(obj, func, context) {
		if(!_.type(func) == 'function') {
			throw Error('The second argument in Utopia.each() must be a function');
		};

		context = context || obj;

		for (var i in obj) {
			if(obj.hasOwnProperty && obj.hasOwnProperty(i)) {
				var ret = func.call(context, obj[i], i);

				if(!!ret || ret === 0 || ret === '') {
					return ret;
				}
			}
		}

		return null;
	},

	/**
	 * Copies the properties of one object onto another.
	 *
	 * @return {Object} destination object
	 */
	merge: function(objects) {
		var ret = {};
		
		for(var i=0; i<arguments.length; i++) {
			var o = arguments[i];
			
			for(var j in o) {
				ret[j] = o[j];
			}
		}
		
		return ret;
	},

	/**
	 * Creates a new DOM element
	 * @param options {Object} A set of key/value pairs:
	 *					options.tag: The type of the element to be created (required)
	 *					options.properties: Property-value pairs to set on the element
	 *					options.contents: String, node or document fragment to add as contents of the new element
	 *					options.inside: Add it as a child of this node
	 *
	 * @return The new DOM element
	 */
	element: {
		create: function(options) {
			if(_.type(options) === 'string') {
				options = {
					tag: options
				};
			}
	
			var element = document.createElement(options.tag);
			
			_.element.prop(element, options.properties || options.prop);
			
			_.element.attr(element, options.attributes || options.attr);
			
			_.element.contents(element, options.contents);
	
			return options.inside? options.inside.appendChild(element) : element;
		},
		
		prop: function (element, properties) {
			if (properties) {
				for (var prop in properties) {
					element[prop] = properties[prop];
				}
			}
			
			return element;
		},
		
		attr: function (element, attributes) {
			if (attributes) {
				for (attr in attributes) {
					element.setAttribute(attr, attributes[attr]);
				}
			}
			
			return element;
		},
		
		contents: function (element, contents) {
			if(contents) {
				if (_.type(contents) !== 'array') {
					contents = [contents];
				}
				
				for (var i=0; i<contents.length; i++) {
					var content = contents[i],
						child = _.type(content) === 'string'? document.createTextNode(content) : content;
									
					element.appendChild(child);
				}	
			}
			
			return element;
		}
	},
	
	event: {
		bind: function(target, event, callback, traditional) {
			if(_.type(target) === 'string') {
				$$(target).forEach(function(element) {
					_.event.bind(element, event, callback, traditional);
				});
			}
			else if(_.type(event) === 'string') {
				if(traditional) {
					target['on' + event] = callback;
				}
				else {
					target.addEventListener(event, callback, false);
				}
			}
			else {
				for (var name in event) {
					_.event.bind(target, name, event[name], arguments[2]);
				}
			}
		},
		
		/**
		 * Fire a custom event
		 */
		fire: function(target, type, properties) {
			var evt = document.createEvent("HTMLEvents");
	
			evt.initEvent(type, true, true );
			evt.custom = true;
	
			if(properties) {
				_.merge(evt, properties);
			}
	
			target.dispatchEvent(evt);
		}
	},
	
	xhr: function(o) {
		document.body.setAttribute('data-loading', '');
		
		var xhr = new XMLHttpRequest(),
			method = o.method || 'GET',
			data = o.data || '';
		
		xhr.open(method, o.url + (method === 'GET' && data? '?' + data : ''), true);
		
		if(method !== 'GET') {
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}
		
		if(o.headers) {
			for(var header in o.headers) {
				xhr.setRequestHeader(header, o.headers[header]);
			}
		}
		
		xhr.onreadystatechange = function(){
			if(xhr.readyState === 4) {
				document.body.removeAttribute('data-loading');
				
				if(xhr.responseText) {
					o.callback(xhr);
				}
			}
		};
		
		xhr.send(method === 'GET'? null : data);
	
		return xhr;
	},
	
	script: function(url, callback, doc) {
		doc = doc || document;
		
		return _.element.create({
			tag: 'script',
			properties: {
				src: url,
				async: true,
				onload: callback
			},
			inside: doc.documentElement
		});
	},
	
	offset: function(element) {
	    var left = 0, top = 0, el = element;
	    
	    if (el.parentNode) {
			do {
				left += el.offsetLeft;
				top += el.offsetTop;
			} while ((el = el.offsetParent) && el.nodeType < 9);
			
			el = element;
			
			do {
				left -= el.scrollLeft;
				top -= el.scrollTop;
			} while ((el = el.parentNode) && el.nodeType < 9);
		}
	
	    return {
			top: top,
	    	right: innerWidth - left - element.offsetWidth,
	    	bottom: innerHeight - top - element.offsetHeight,
	    	left: left,
	    };
	}
};

})();

window.$u = window.$u || Utopia;