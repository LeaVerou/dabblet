/**
 * Code for the code editors
 */
 
(function(){

var CRLF = crlf = /\r?\n|\r/g;

var UndoManager = function(editor) {
	this.editor = editor;
	
	this.undoStack = [];
	this.redoStack = [];
};

UndoManager.prototype = {
	action: function(action) {
		if(!action || !(action.length || action.action || action.add || action.del)) {
			return;
		}
		
		var lastAction = this.undoStack.pop() || null;

		if(lastAction) {
			var push = lastAction.action || action.action
					|| lastAction.length || action.length
					|| (action.del && lastAction.add) 
					|| (action.add && !lastAction.add)
					|| (lastAction.start + lastAction.add.length - lastAction.del.length != action.start);
			
			if(push) {
			  	this.undoStack.push(lastAction);
			  	this.undoStack.push(action);
			}
			else if(lastAction) {
				var combined = this.chain(lastAction, action);
				
				this.undoStack.push(combined);
			}
		}
		else {
			this.undoStack.push(action);
		}
		
		this.redoStack = [];
	},
	
	undo: function() {
		
		var action = this.undoStack.pop();
		
		if(!action) {
			return;
		}
		
		this.redoStack.push(action);
		
		this.applyInverse(action);
		
		this.editor.pre.onkeyup();
	},
	
	redo: function() {
		
		var action = this.redoStack.pop();
		
		if(!action) {
			return;
		}
		
		this.undoStack.push(action);
		
		this.apply(action);
		
		this.editor.pre.onkeyup();
	},
	
	chain: function(action1, action2) {
		return {
			add: action1.add + action2.add,
			del: action2.del + action1.del,
			start: action1.start
		}
	},
	
	apply: function(action) {
		if(action.length) {
			for(var i=0; i<action.length; i++) {
				this.apply(action[i]);
			}
			return;
		}
		
		var start = action.start;
			
		if(action.action) {
			this.editor.action(action.action, {
				inverse: action.inverse,
				start: start,
				end: action.end,
				noHistory: true
			});
		}
		else {	
			var element = this.editor.pre;
				
			// add added chars & remove deleted chars			
			element.textContent = element.textContent.splice(start, action.del.length, action.add);
			
			element.setSelectionRange(start, start + action.add.length);
		}
	},
	
	applyInverse: function(action) {
		if(action.length) {
			for(var i=action.length-1; i>=0; i--) {
				this.applyInverse(action[i]);
			}
			return;
		}
		
		var start = action.start;
		
		if(action.action) {
			this.editor.action(action.action, {
				inverse: !action.inverse,
				start: start,
				end: action.end,
				noHistory: true
			});
		}
		else {
			var element = this.editor.pre;
			
			// remove added chars & add deleted chars
			element.textContent = element.textContent.splice(start, action.add.length, action.del);
			
			element.setSelectionRange(start, start + action.del.length);
		}
	}
};

var _ = window.Editor = function(pre) {
	var that = this;
	
	this.pre = pre;
	this.parent = pre.parentNode;
	this.lang = pre.getAttribute('lang');
	
	this.lineHighlight = document.createElement('div');
	this.lineHighlight.className = 'line-highlight';
	
	this.parent.insertBefore(this.lineHighlight, this.pre);
	
	this.undoManager = new UndoManager(this);
	
	$u.event.bind(pre, {
		keydown: function(evt) {
			var cmdOrCtrl = evt.metaKey || evt.ctrlKey;
				
			switch(evt.keyCode) {
				case 8: // Backspace
					var ss = this.selectionStart,
						se = this.selectionEnd,
						length = ss === se? 1 : Math.abs(se - ss),
						start = se - length;
					
					that.undoManager.action({
						add: '',
						del: this.textContent.slice(start, se),
						start: start
					});
					
					break;
				case 9: // Tab
					if(!cmdOrCtrl) {
						that.action('indent', {
							inverse: evt.shiftKey
						});
						return false;
					}
					break;
				case 13:
					that.action('newline');
					return false;
				case 90:
					if(cmdOrCtrl) {
						that.undoManager[evt.shiftKey? 'redo' : 'undo']();
						return false;
					}
					
					break;
				case 191:
					if(cmdOrCtrl && !evt.altKey) {
						that.action('comment', { lang: this.id });
						return false;
					}
					
					break;
			}
		},
		
		keypress: function(evt) {
			var cmdOrCtrl = evt.metaKey || evt.ctrlKey,
				code = evt.charCode,
				ss = this.selectionStart,
				se = this.selectionEnd;
			
			if(code && !cmdOrCtrl) {
				var character = String.fromCharCode(code);
				
				that.undoManager.action({
					add: character,
					del: ss === se? '' : this.textContent.slice(ss, se),
					start: ss
				});
			}
		},
		
		cut: function() {
			ss = this.selectionStart,
			se = this.selectionEnd,
			selection = ss === se? '': this.textContent.slice(ss, se);
			
			if(selection) {
				that.undoManager.action({
					add: '',
					del: selection,
					start: ss
				});
				
				gist.saved = false;
			}
		},
		
		paste: function() {
			var pre = this,
				ss = pre.selectionStart,
				se = pre.selectionEnd,
				selection = ss === se? '': pre.textContent.slice(ss, se);
				
			gist.saved = false;
				
			setTimeout(function(){
				var newse = pre.selectionEnd,
					innerHTML = pre.innerHTML;
				
				innerHTML = pre.innerHTML
									.replace(/(<\w+)(\s.+?>)/g, '$1>')
									.replace(/<\/?pre>/g, '')
									.replace(/(<div>)?<br>|(<div>)+/gi, '\n')
									.replace(/<\/div>/gi, '')
									.replace(/&nbsp;/gi, ' ');
									
				pre.innerHTML = innerHTML;
									
				var pasted = pre.textContent.slice(ss, newse);
				
				that.undoManager.action({
					add: pasted,
					del: selection,
					start: ss
				});
				
				ss += pasted.length;
				
				pre.setSelectionRange(ss, ss);
				
				pre.onkeyup();
			}, 10);
		},
		
		keyup: function(evt) {
			var keyCode = evt && evt.keyCode || 0,
				code = this.textContent,
				id = this.id;
				
			if(keyCode < 8 || keyCode == 13 || keyCode > 32 && keyCode < 41) {
				$u.event.fire(this, 'caretmove');
			}
	
			if([
				9, 91, 93, 16, 17, 18, // modifiers
				20, // caps lock
				13, // Enter (handled by keydown)
				112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, // F[0-12]
				27 // Esc
			].indexOf(keyCode) > -1) {
				return;
			}
			
			// Show a previewer, if needed
			if(self.Previewer) {
				var selection = getSelection();
				
				if(selection.rangeCount) {
					var range = selection.getRangeAt(0),
						element = range.startContainer;
					
					if(element.nodeType == 3) {
						element = element.parentNode;
					}
					
					var type = Previewer.get(element);
					
					if(type) {
						Previewer.active = element;
						Previewer.s[type].token = element;
					}
					else {
						Previewer.hideAll();
						Previewer.active = null;
					}
				}
			}
			
			if(keyCode !== 37 && keyCode !== 39) {
				var ss = this.selectionStart,
					se = this.selectionEnd;
			
				Highlight.init(this);
				
				// Dirty fix to #2
				if(!/\n$/.test(code)) {
					this.innerHTML = this.innerHTML + '\n';
				}
	
				if(ss !== null || se !== null) {
					this.setSelectionRange(ss, se);
				}
				
				if(id === 'css') {
					document.title = Dabblet.title(code) + ' ✿ dabblet.com';
				
					Dabblet.update.CSS(code);
				}
				else {
					Dabblet.update.HTML(code);
				}
				
				if(keyCode) {
					gist.saved = false;
				}
			}
		},
		
		click: function(evt) {
			$u.event.fire(this, 'caretmove');
		},
		
		focus: function() {
			var ss = this.getAttribute('data-ss'),
				se = this.getAttribute('data-se');
	
			if(ss || se) {
				var pre = this;
				setTimeout(function(){
					pre.setSelectionRange(ss, se);
				}, 2);
			}
			
			if(this.id == 'css' && !window.Incrementable) {
				$u.script('/code/incrementable.js', function() {
					new Incrementable(css, function(evt) {
						if(evt.altKey) {
							if(evt.shiftKey) { return 10; }
							
							if(evt.ctrlKey) { return .1; }
							
							return 1;
						}
						
						return 0;
					});
				});
			}
		},
			
		blur: function() {
			if(!gist.saved) {
				// Save draft
				localStorage['dabblet.css'] = css.textContent;
				localStorage['dabblet.html'] = html.textContent;
			}
			
			self.Previewer && Previewer.hideAll();
		},
		
		mouseover: function(evt) {
			if(!self.Previewer) {
				return;
			}
			
			var target = evt.target,
			    type = Previewer.get(target);
			
			if (type) {
	
				var previewer = Previewer.s[type];
				
				if (previewer.token != target) {
					previewer.token = target;
					
					target.onmouseout = function() {
						previewer.token = this.onmouseout = null;
						
						// Show the previewer again on the active token
						var active = Previewer.active;
						
						if (active) {
							var type = Previewer.get(active);
							Previewer.s[type].token = active;
						}
					}
				}
			}
		}
	}, true);
	
	$u.event.bind(pre, 'caretmove', function() {
		var content = this.textContent,
			ss = this.selectionStart,
			se = this.selectionEnd;
		
		ss && this.setAttribute('data-ss', ss);
		se && this.setAttribute('data-se', se);
		
		// Update current line highlight
		var highlighter = that.lineHighlight,
			lines = (content.match(CRLF) || []).length,
			line = (content.slice(0, ss).match(CRLF) || []).length,
			lineHeight = parseFloat(getComputedStyle(this).height)/lines;

		highlighter.setAttribute('data-line', line + 1);
		highlighter.style.height = lineHeight + 'px';
		highlighter.style.top = line * lineHeight + 'px';
	});
	
	$u.event.fire(this.pre, 'caretmove');
};

_.prototype = {
	action: function(action, options) {
		options = options || {};
		
		var pre = this.pre,
			text = pre.textContent,
			ss = options.start || pre.selectionStart,
			se = options.end || pre.selectionEnd, 
		    state = {
				ss: ss,
				se: se,
				before: text.slice(0, ss),
				after: text.slice(se),
				selection: text.slice(ss,se)
			};
		
	  	var textAction = _.actions[action](state, options);
	
		pre.textContent = state.before + state.selection + state.after;
		
		if(textAction && !options.noHistory) {
			this.undoManager.action(textAction);
		}
		
		pre.setSelectionRange(state.ss, state.se);
		
		pre.onkeyup();
	}
};

_.actions = {
	indent: function(state, options) {
		var lf = state.before.lastIndexOf('\n') + 1;
	
		if (options.inverse) {
			if(/\s/.test(state.before.charAt(lf))) {
				state.before = state.before.splice(lf, 1);
				
				state.ss--;
				state.se--;
			}
			
			state.selection = state.selection.replace(/\r?\n\s/g, '\n');
		}
		else if (state.selection) {
			state.before = state.before.splice(lf, 0, '\t');
			state.selection = state.selection.replace(/\r?\n/g, '\n\t');
			
			state.ss++;
			state.se++;
		}
		else {
			state.before += '\t';
			
			state.ss++;
			state.se++;
			
			return {
				add: '\t',
				del: '',
				start: state.ss - 1
			};
		}
		
		state.se = state.ss + state.selection.length;
		
		return {
			action: 'indent',
			start: state.ss,
			end: state.se,
			inverse: options.inverse
		};
	},
	
	newline: function(state) {
		var ss = state.ss,
			lf = state.before.lastIndexOf('\n') + 1,
			indent = (state.before.slice(lf).match(/^\s+/) || [''])[0];
		
		state.before += '\n' + indent;
		state.selection = '';	
		
		state.ss += indent.length + 1;
		state.se = state.ss;
		
		return {
			add: '\n' + indent,
			del: state.selection,
			start: ss
		};
	},
	
	comment: function(state, options) {
		var open = options.lang === 'css'? '/*' : '<!--',
			close = options.lang === 'css'? '*/' : '-->';
		
		var start = state.before.lastIndexOf(open),
			end = state.after.indexOf(close),
			closeBefore = state.before.lastIndexOf(close),
			openAfter = state.after.indexOf(start);
			
		if(start > -1 && end > -1
		   	&& (start > closeBefore || closeBefore === -1)
		   && (end < openAfter || openAfter === -1)
		   ) {
			// Uncomment
			state.before = state.before.splice(start, open.length);
			state.after = state.after.splice(end, close.length);
			
			var textAction = [{
				add: '',
				del: open,
				start: start
			}, {
				add: '',
				del: close,
				start: state.before.length + state.selection.length + end
			}];
			
			state.ss -= open.length;
			state.se -= open.length;
			
			return textAction;
		}
		else {
			// Comment
			if(state.selection) {
				// Comment selection
				state.selection = open + state.selection + close;
				
				textAction = [{
					add: open,
					del: '',
					start: state.ss
				}, {
					add: close,
					del: '',
					start: open.length + state.se
				}];
			}
			else {
				// Comment whole line
				var start = state.before.lastIndexOf('\n') + 1,
					end = state.after.indexOf('\n');
				
				if(end === -1) {
					end = after.length;
				}
				
				while(/\s/.test(state.before.charAt(start))) {
					start++;
				}
				
				state.before = state.before.splice(start, 0, open);
				
				state.after = state.after.splice(end, 0, close);
				
				var textAction = [{
					add: open,
					del: '',
					start: start
				}, {
					add: close,
					del: '',
					start: state.before.length + end
				}];
			}
			
			state.ss += open.length;
			state.se += open.length;
			
			return textAction;
		}
	}
}

})();