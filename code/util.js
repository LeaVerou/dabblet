/**
 * Helper functions
 */
String.prototype.splice = function(i, remove, add) {
	remove = +remove || 0;
	add = add || '';
	
	return this.slice(0,i) + add + this.slice(i + remove);
};
 
 function offset(element) {
    var left = 0, top = 0, el = element;
    
    if (el.parentNode) {
		do {
			left += el.offsetLeft - el.scrollLeft;
			top += el.offsetTop - el.scrollTop;
		} while ((el = el.parentNode) && el.nodeType < 9);
	}

    return {
		top: top,
    	right: innerWidth - left - element.offsetWidth,
    	bottom: innerHeight - top - element.offsetHeight,
    	left: left,
    };
}

function xhr(o) {
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
}

function queryToObject(search) {
	var obj = {};
	
	search.slice(1).split('&').forEach(function(pair){
		var i = pair.indexOf('=');
		
		obj[pair.slice(0,i)] = pair.slice(i+1);
	});
	
	return obj;
}

function objectToQuery(obj) {
	var search = [];
	
	for(var key in obj) {
		if(key && obj[key]) {
			search.push(key + '=' + obj[key]);
		}
	}
	
	return '?' + search.join('&');
}

function script(url, callback, doc) {
	doc = doc || document;
	
	var script = doc.createElement('script');
	script.src = url;
	script.async = true;
	doc.documentElement.appendChild(script);
	
	script.onload = callback;
}