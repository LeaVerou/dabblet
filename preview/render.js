var style = document.querySelector('style');

var domLoaded = false;

document.addEventListener('DOMContentLoaded', function() {
	domLoaded = true;
});

onmessage = function(evt) {
	if (true || evt.origin === 'http://localhost' || evt.origin === 'http://dabblet.com') {
		var info = JSON.parse(evt.data),
		    data = info.data;

		switch (info.action) {
			case 'title':
				document.title = data;
				break;
				
			case 'css':
				style.textContent = data;
				break;
				
			case 'html':
				document.body.innerHTML = data;
				break;
				
			case 'javascript':
				if (domLoaded) {
					try {
						document.body.innerHTML = document.body.innerHTML;
						eval(data);
					}
					catch (e) {
						var lineNumber = e.lineNumber - 30 + 1 || (e.stack.match(/<anonymous>:(\d+):\d+/) || [,])[1];
						
						parent.postMessage(JSON.stringify({
							action: 'jserror',
							data: {
								name: e.name,
								message: e.message,
								lineNumber: lineNumber
							}
						}), '*');
					}
				}
				else {
					document.addEventListener('DOMContentLoaded', function() {
						onmessage(evt);
					});
				}
		}
	}
};