// Core layer
var beforeFocusEvent = new Event('beforefocus');
var dragEvent = new Event('drag');
var afterDragEvent = new Event('afterdrag');
var afterDragNoMoveEvent = new Event('afterdragnomove');
var beforeDragEvent = new Event('beforedrag');

function Element(arg1, arg2){
	var self = this;
	var args;
	if (arg1 instanceof Node){
		args = arg2?arg2:{};
		this.element = arg1;
	}
	else if (typeof arg1 === "string"){
		args = arg2?arg2:{};
		this.element = document.querySelector(arg1);
		if (this.element === null){
			this.element = document.createElement(args.tagName || "div");
		}
	}
	else{
		args=arg1?arg1:{};
		this.element = document.createElement(args.tagName || "div");
	}
	
	this.e = this.element;
	this.element.wfElement = this;
	this.wfe = this;
	this.$element = $(this.element);
	this.$ = this.$element;

	this.container = this.element; // Temporary.
	this.eventListeners;
	this.addClass(args.className);
	if (args.content !== undefined){
		this.append(args.content);
	}
	
	if(args.appendTo instanceof Element){
		args.appendTo.append(self);
	}
	else if(args.appendTo instanceof Node){
		args.appendTo.appendChild(this.element);
	}
	if(args.focusable){
		this.focusable();
	}
}

Element.prototype.value = function(value){
	if(value){
		this.$.val(value);
	}
	else{
		return this.$.val();
	}
}

Element.prototype.setAttribute = function(key, value){
	if (typeof value === "string"){
		this.e.setAttribute(key, value);
	}
	else if(value instanceof Value){
		this.e.setAttribute(key, value.getAsString());
		value.onChange(function(){
			this.e.setAttribute(key, value.getAsString());
		});
	}
	
}

Element.prototype.getAttribute = function(key){
	return this.e.getAttribute(key);
}


Element.prototype.attr = function(key, value){
	if (value !== undefined){
		this.setAttribute(key, value);
	}
	else{
		return this.getAttribute(key);
	}
}

Element.prototype.style = function(args){
	if (typeof args !== "object"){
		return;
	}
	for (var i in args){
		this.e.style[i] = args[i];
	}
}

Element.prototype.append = function(element){
	if (element === undefined || element === null){
		return;
	}
	else if(element instanceof Node){
		this.element.appendChild(element);
	}
	else if(element instanceof Text){
		// var elem = document.createElement('span');
		// elem.appendChild(element);
		// this.element.appendChild(elem);
		this.element.appendChild(element);
	}
	else if(element instanceof Element ||
			(SVGElement !== undefined && element instanceof SVGElement)){
		this.element.appendChild(element.element);
		element.parent = this;
	}
	else if(false && element instanceof Array){
		for (var i in element){
			this.append(element[i]);
		}
	}
	else if(element instanceof Value){
		var elem = element.getAsNode();
		this.append(elem);
	}
	else if(typeof element === "string" || typeof element === "number" ){
		var elem = document.createElement('span');
		// elem.appendChild(new Text(String(element)));
		//var elem = new Text(String(element));
		elem.textContent = element;
		this.element.appendChild(elem);
	}
}

// To be improved
Element.prototype.prepend = function(element){
	$(this.element).prepend(element.element);
	return this;
}

Element.prototype.removeAllChildren = function(element){
	while(this.e.firstChild){
		this.e.removeChild(this.e.firstChild);
	}
}

Element.prototype.hide = function(){
	this.addClass('hidden');
	this.dispatchEvent('hide');
}

Element.prototype.show = function(){
	this.removeClass('hidden');
	this.dispatchEvent('show');
}

Element.prototype.getHandle = function(args){
	args = args || {};
	args.container = this;
	var handle = new ContainerHandle(args);
	return handle;
};

Element.prototype.close = function(){
	//this.hide();
	//console.log("closing");
	this.element.parentNode.removeChild(this.element);
	this.dispatchEvent('closed');
}

Element.prototype.isAncestorOf = function(element){
	if(!(element instanceof Node)){
		return false;
	}
	var node = element.parentNode;
	while(node!=null){
		if(node == this.element){
			return true;
		}
		else{
			node = node.parentNode;
		}
	}
	return false;
};

Element.prototype.isParentOf = function(element){
	if(element instanceof Element){
		element = element.element;
	}
	else if(!(element instanceof Node)){
		return false;
	}
	if (this.element === element.parentNode){
		return true;
	}
	return false;
};

Element.prototype.positionWithinWindow = function(){
	var temp = this.e;
	var offset = [0,0];
	while (temp !== null){
		offset[0] += temp.offsetLeft;
		offset[1] += temp.offsetTop;
		temp = temp.offsetParent;
	}

	return offset;
}

Element.prototype.addClass = function(className){
	var self = this;
	if(typeof className == "string"){
		var classList = className.split(' ');
		for(var i in classList){
			if (classList[i] !==""){
				this.element.classList.add(classList[i]);
			}
		}
	}
	else if (className instanceof Value){
		this.addClass(String(className.get()));
		className.onChange(function(d){
			self.removeClass(String(d.oldValue));
			self.addClass(String(d.value));
		});
	}
	return this;
}

Element.prototype.removeClass = function(className){
	var classList = className.split(' ');
	for(var i in classList){
		this.element.classList.remove(classList[i]);
	}
	return this;
}

Element.prototype.flipClass = function(add, remove){
	this.addClass(add);
	this.removeClass(remove);
}

Element.prototype.addEventListener = function(type, handler, useCapture){
	var useCapture = useCapture || false;
	if (typeof type == "string" && typeof handler == "function"){
		var events = type.split(" ");
		for (var i in events){
			this.element.addEventListener(events[i], handler, useCapture);
		}
	}
}

Element.prototype.removeEventListener = function(type, handler){
	this.e.removeEventListener(type, handler);
}

Element.prototype.dispatchEvent = function(eventKey, e){
	var self = this;
	var event = new CustomEvent(eventKey, {
		detail:e,
	});
	this.element.dispatchEvent(event);
	return this;
}

Element.prototype.on = Element.prototype.addEventListener;

Element.prototype.focusable = function(args){
	var self = this;
	var args = args || {};
	if (self.isFocusable){
		return;
	}
	this.element.setAttribute('tabindex',args.tabIndex || 1);
	this.addEventListener('focusout', function(e){
		if(!(self.element == e.relatedTarget) && !self.e.contains(e.relatedTarget)){
			self.dispatchEvent('focusaway', e);
		}
	});
	this.addEventListener('touchstart mousedown', function(e){
		//console.log("touchstart focusable"+e.type);
		self.focus();
		//e.preventDefault();
		e.stopPropagation();
	});
	if(args.onFocus){
		this.addEventListener('focus', function(e){
			args.onFocus({
				value:self.$element.val(),
			});
		});
	}

	if(args.onBlur){
		this.addEventListener('blur', function(e){
			args.onBlur({
				value:self.$element.val(),
			});
		});
	}
	this.isFocusable = true;
}

Element.prototype.focusing = function(focusingElement){
	var self = this;
	this.focusingElement = focusingElement;

	this.element.addEventListener('mousedown touchstart',function(e){
		self.focusingElement.focus(e);
		e.stopPropagation();
		e.preventDefault();
	});
}

Element.prototype.focus = function(handler){
	if(typeof handler == "function"){
		if(this.focusingElement && this.focusingElement != this){
			this.focusingElement.focus(handler);
		}
		else{
			this.addEventListener('DOMFocusIn',handler);
		}
	}
	else if(this.focusingElement && this.focusingElement != this){
		this.focusingElement.focus();
		return false;
	}
	else {
		this.element.dispatchEvent(beforeFocusEvent);
		//document.activeElement.blur();
		this.e.focus();
	}
}

// Experimental
Element.prototype.blur = function(handler){
	if(typeof handler == "function"){
		this.addEventListener('DOMFocusOut',handler);
	}
	else if(this.focusingElement !== undefined){
		if(this.focusingElement == this){
			this.element.dispatchEvent(beforeBlurEvent);
			this.e.blur();
		}
		else{
			this.focusingElement.blur();
			return false;
		}
	}
	else{
		this.e.blur();
	}
}

Element.prototype.maximize = function(args){
	this.addClass('maximized');
	this.maximized = true;
}

Element.prototype.unmaximize = function(args){
	this.removeClass('maximized');
	//this.addClass('unmaximized');
	this.maximized = false;
}

Element.prototype.setWindowMode = function(val){
	console.log("Setting window mode");
	var ev = {
		oldValue: this.windowMode,
		value: val,
		target: this,
	};
	if(ev.oldValue === "floating" && ev.value !== "floating"){
		this.notDraggable();
	}
	this.windowMode = val;
	if(this.windowMode === "floating"){
		if(this.draggedBy instanceof Element){
			this.draggedBy.draggable({
				target: this,
			})
		}
		else{
			this.draggable({

			});
		}
		
	}

	this.flipClass('window-mode-'+ev.value, 'window-mode-'+ev.oldValue);
	this.dispatchEvent('windowmodechange', ev);
}

Element.prototype.onViewConstraint = function(constraints, handler){
	if(this.viewConstraints === undefined){
		this.viewConstraints = [];
	}
	else if(!(this.viewConstraints instanceof Array)){
		return
	}

	this.viewConstraints.push({
		constraints: constraints,
		handler: handler,
	});
};

Element.prototype.prepareForViewData = function(data, done){
	if(this.viewConstraints instanceof Array){
		var width = data.width;
		var height = data.height;
		for (var i in this.viewConstraints){
			var cs = this.viewConstraints[i].constraints;
			if(cs === "xs" && width < 768) {
				this.viewConstraints[i].handler(); 
				break;
			}
			else if((cs === "s" || cs === "xs") && width >= 768) {
				this.viewConstraints[i].handler(); 
				break;
			}
			else if((cs === "m" || cs === "s" || cs === "xs") && width >= 970) {
				this.viewConstraints[i].handler(); 
				break;
			}
			else if((cs === "l" || cs === "m" || cs === "s" || cs === "xs") && width >= 1170) {
				this.viewConstraints[i].handler(); 
				break;
			}
			else if(typeof cs === "object"){
				if(typeof cs.minWidth === "number" && width < cs.minWidth) continue;
				if(typeof cs.maxWidth === "number" && width > cs.maxWidth) continue;
				if(typeof cs.minHeight === "number" && height < cs.minHeight) continue;
				if(typeof cs.maxHeight === "number" && height > cs.maxHeight) continue;
				this.viewConstraints[i].handler(); 
				break;
			}
			
		}
	}
};

Element.prototype.beforeFocus = function(handler){
	if(typeof handler == "function"){
		this.addEventListener('beforefocus',handler);
	}
	else if(this.focusingElement){
		if(this.focusingElement == this){
			this.element.dispatchEvent(beforeFocusEvent);
		}
		else{
			this.focusingElement.focus();
		}
	}
}

Element.prototype.setFocusingElement = function(elem){
	this.focusingElement = elem.focusingElement || elem;
}

Element.prototype.tabIndex = function(tabIndex){
	if(tabIndex){
		this.element.setAttribute('tabindex',tabIndex);
	}
	else {
		return this.element.getAttribute('tabindex');
	}
}

Element.prototype.editable = function(args){
	var self = this;
	if(args.value){
		this.value = args.value;
	}
	else{
		this.value = new Value({
			value:"",
		});
	}
	this.element.value = this.value.get();
	
	this.value.addEventListener('change',function(e){
		self.element.value = e.value;
		if(document.activeElement == self.element){
			if(e.firstPart != undefined && e.selection != undefined){
				self.element.setSelectionRange(e.firstPart.length, e.firstPart.length + e.selection.length);
			}
		}
			
	});
	this.focusable(args);
	if(this.element.tagName != 'input' && this.element.tagName != 'textarea'){
		this.element.setAttribute('contenteditable','true');
	}
	else if(this.element.tagName == 'input'){
		this.element.setAttribute('type','text');
	}
	this.addEventListener('keypress',function(e){
		self.value.insert({
			value: self.element.value,
			selectionStart: self.element.selectionStart,
			selectionEnd: self.element.selectionEnd,
			replacement:String.fromCharCode(e.which),
			firstPart:self.element.value.substr(0,self.element.selectionStart),
			secondPart:self.element.value.substr(self.element.selectionEnd,self.element.value.length - self.element.selectionEnd),
			selection:self.element.value.substring(self.element.selectionEnd, self.element.selectionStart),
		});		
		e.preventDefault();
	});

	this.addEventListener('keydown',function(e){
		var firstPart, secondPart, selection;
		if(e.which == 8){
			if(self.element.selectionStart === self.element.selectionEnd){
				firstPart = self.element.value.substr(0,self.element.selectionStart - 1);
				selection = self.element.value.substr(self.element.selectionStart - 1, 1);
				secondPart = self.element.value.substr(self.element.selectionEnd,self.element.value.length - self.element.selectionEnd)
			}
			else{
				firstPart = self.element.value.substr(0,self.element.selectionStart);
				selection = self.element.value.substr(self.element.selectionStart, self.element.selectionEnd - self.element.selectionStart);
				secondPart = self.element.value.substr(self.element.selectionEnd,self.element.value.length - self.element.selectionEnd)
			
			}
			self.value.insert({
				value: String.fromCharCode(e.which),
				selectionStart: self.element.selectionStart,
				selectionEnd: self.element.selectionEnd,
				replacement:'',
				firstPart:firstPart,
				secondPart:secondPart,
				selection:selection,
			});
			e.preventDefault();
		}
	});
	this.isEditable = true;
}

Element.prototype.edit = function(changes){
	if(this.isEditable){
		if(changes.selectionEnd >= 0 ){
			this.element.value = changes.value;
			//this.element.selectionStart = changes.selectionStart + changes.delta.length;
			//this.element.selectionEnd = changes.selectionStart + changes.delta.length;
			if(document.activeElement == this.element)
				this.element.setSelectionRange(changes.selectionStart + changes.delta.length, changes.selectionStart + changes.delta.length);
			//this.element.setRangeText(changes.delta);
			//this.element.selectionStart = changes.selectionStart + changes.delta.length;
		}
		else{
			//this.$.val(changes.value);
		}
		
	}
}

// Clickable
Element.prototype.clickable = function(args){
	var self = this;
	args = args || {};
	this.focusable(args);
	this.addClass("clickable");
	if(typeof args.onClick == "function"){
		this.addAction(args.onClick);
	}
	this.isClickable = true;
}

Element.prototype.setAction = function(action){
	if (typeof action !== "function"){
		return;
	}
	if (typeof this.removeAction === "function"){
		this.removeAction();
	}
	if (this.isClickable === undefined){
		this.clickable();
	}
	var self = this;
	var onClick = function(e){
		//console.log("onClick");
		if(!self.disabled){
			action(e);
		}
		e.preventDefault();
		e.stopPropagation();
	};
	var onTouchStart = function(e){
		//e.preventDefault();
		//console.log("onTouchStart");
		//self.touched = true;

		var onTouchEnd = function(e){
			//console.log("onTouchEnd");
			
			action(e);
			//delete self.moved;
			self.removeEventListener('touchend', onTouchEnd);
			self.removeEventListener('touchmove', onTouchMove);
			self.removeEventListener('touchcancel', onTouchCancel);
			e.preventDefault();
			e.stopPropagation();

		};
		var onTouchMove = function(e){
			//console.log("onTouchMove");
			//self.moved = true;
			self.removeEventListener('touchend', onTouchEnd);
			self.removeEventListener('touchmove', onTouchMove);
			self.removeEventListener('touchcancel', onTouchCancel);

		};
		var onTouchCancel = function(e){
			self.removeEventListener('touchend', onTouchEnd);
			self.removeEventListener('touchmove', onTouchMove);
			self.removeEventListener('touchcancel', onTouchCancel);
		};
		if(!this.disabled){
			self.addEventListener('touchmove', onTouchMove);
			self.addEventListener('touchend', onTouchEnd);
			self.addEventListener('touchcancel', onTouchCancel);
		}
		
	};
	var onMouseDown = function(e){
		console.log('onmousedown');
		if(self.disabled){
			e.preventDefault();
			e.stopPropagation();
		}
		e.stopPropagation();
		e.preventDefault();
	};
	var onSpaceOrEnter = function(e){
		if(e.which == 13 || e.which == 32){
			action();
		}
	}
	this.addEventListener('mousedown', onMouseDown);
	this.addEventListener('click', onClick);
	this.addEventListener('touchstart', onTouchStart);
	this.addEventListener('keydown',onSpaceOrEnter);
	this.removeAction = function(){
		this.removeEventListener('click', onClick);
		this.removeEventListener('touchstart', onTouchStart);
		this.removeEventListener('mousedown', onMouseDown);
		this.removeEventListener('keydown', onSpaceOrEnter);
		delete this.removeAction;
	};
};

Element.prototype.click = function(handler){
	if(typeof handler == "function"){
		this.addEventListener('click',handler);
	}
}

Element.prototype.disable = function(){
	this.addClass('disabled');
	this.disabled = true;
};

Element.prototype.activate = function(){
	this.removeClass('disabled');
	delete this.disabled;
}

// Fullscreen methods are based on https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
Element.prototype.requestFullscreen = function(){
	if (this.e.requestFullscreen) {
		this.e.requestFullscreen();
	} 
	else if (this.e.webkitRequestFullscreen) {
		this.e.webkitRequestFullscreen();
	}
	else if (this.e.mozRequestFullScreen) {
		this.e.mozRequestFullScreen();
	} 
	else if (this.e.msRequestFullscreen) {
		this.e.msRequestFullscreen();
	} 
}

Element.prototype.exitFullscreen = function(){
	console.log("Edocument.exitFullscreen()");
	if(document.exitFullscreen){
		document.exitFullscreen();
	}
	else if(document.webkitExitFullscreen){
		document.webkitExitFullscreen();
	}
	else if(document.mozCancelFullScreen){
		document.mozCancelFullScreen();
	}
	else if(document.msExitFullscreen){
		document.msExitFullscreen();
	}
}

Element.prototype.isFullscreen = function(){
	return !!document.fullscreenElement || 
			!!document.mozFullScreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement;
}

Element.prototype.toggleFullscreen = function(){
	if(!document.fullscreenElement && 
			!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement){
		this.requestFullscreen();
	}
	else{
		this.exitFullscreen();
	}
}

Element.prototype.draggable = function(args){
	var self = this;
	var args = args || {};
	var dragged = false;
	var minX, maxX, minY, maxY;
	var position = [0,0];
	var newPositionY = 0;
	var newPositionX = 0;
	var target = args.target instanceof Element ? args.target : this;
	this.draggingMode = args.mode || 'hv';
	if(this.draggingMode == 'h'){
		this.vDraggable = false;
		this.hDraggable = true;
	}
	else if(this.draggingMode == 'v'){
		this.vDraggable = true;
		this.hDraggable = false;
	}
	else{
		this.vDraggable = true;
		this.hDraggable = true;
	}
	this.addClass('draggable');
	this.documentOnMove = function(e){
		var shift = [0,0];
		dragged = true;
		if(self.vDraggable){
			shift[1] = e.pageY - self.latestMouseDownPosition[1];
		}
		if(self.hDraggable){
			shift[0] = e.pageX - self.latestMouseDownPosition[0];
		}
		newPositionX = position[0] + shift[0];
		newPositionY = position[1] + shift[1];
		if(newPositionX<minX){
			newPositionX = minX;
		}
		else if(newPositionX>maxX){
			newPositionX = maxX;
		}
		if(newPositionY<minY){
			newPositionY = minY;
		}
		else if(newPositionY>maxY){
			newPositionY = maxY;
		}

		//self.$.css({
			//'-webkit-transform': ,
			//left:newPositionX,
			//top:newPositionY,
		//});
		target.e.style.webkitTransform = 'translate('+newPositionX+'px, '+newPositionY+'px)';
		//console.log('translate('+newPositionX+', '+newPositionY+')');
		e.stopPropagation();
		e.preventDefault();
	}

	this.documentOnMouseUp = function(e){
		position = [newPositionX, newPositionY];
		document.removeEventListener('mousemove', self.documentOnMove);
		document.removeEventListener('mouseup', self.documentOnMouseUp);
		if(dragged){
			self.element.dispatchEvent(afterDragEvent);
		}
		else{
			self.element.dispatchEvent(afterDragNoMoveEvent);
		}
		dragged = false;
	}
	if(typeof args.afterDrag == "function"){
		this.addEventListener('afterdrag',args.afterDrag);
	}


	if(typeof args.afterNoMove == "function"){
		this.addEventListener('afterdragnomove',args.afterNoMove);
	}

	this.onMouseDown = function(e){
		console.log("draggable(); onmousedown");
		if(e.which === 1){
			dragged = false;
			if(typeof args.minX == "function"){
				minX = args.minX();
			}
			else{
				minX = args.minX;
			}
			if(typeof args.maxX == "function"){
				maxX = args.maxX();
			}
			else{
				maxX = args.maxX;
			}
			if(typeof args.minY == "function"){
				minY = args.minY();
			}
			else{
				minY = args.minY;
			}
			if(typeof args.maxY == "function"){
				maxY = args.maxY();
			}
			else{
				maxY = args.maxY;
			}
			self.latestMouseDownPosition = [e.pageX, e.pageY];
			//self.latestElementPositionOnMD = self.$.position();
			document.addEventListener('mousemove',self.documentOnMove);
			document.addEventListener('mouseup',self.documentOnMouseUp);
			//e.preventDefault();
			e.stopPropagation();
		}
	};
	

	this.addEventListener('mousedown',this.onMouseDown);

	this.addEventListener('click',function(e){
		e.stopPropagation();
		e.preventDefault();
	});
}

Element.prototype.notDraggable = function(){
	this.removeEventListener('mousedown',this.onMouseDown);
	this.e.style.webkitTransform = '';
	document.removeEventListener('mouseup',this.documentOnMouseUp);
	document.removeEventListener('mousemove',this.documentOnMove);
};

Object.defineProperty(Element.prototype, "display", {
	set: function(val){
		var self = this;
		if (typeof val === "string"){
			this.e.style.display = val;
		}
		else if(val instanceof Value){
			if (val.value === true){
				this.e.style.display = '';
			}
			else if (val.value === false){
				this.e.style.display = 'none';
			}
			else{
				this.e.style.display = val.getAsString();
			}
			val.onChange(function(d){
				if (d.value === true){
					self.e.style.display = '';
				}
				else if (d.value === false){
					self.e.style.display = 'none';
				}
				else{
					self.e.style.display = val.getAsString();
				}
				
			});
		}
		else if(typeof val === "boolean"){
			if(val){
				this.e.style.display = '';
			}
			else{
				this.e.style.display = 'none';
			}
		}
	}
});

Object.defineProperty(Element.prototype, "visibility", {
	set: function(val){
		var self = this;
		if (typeof val === "string"){
			this.e.style.visibility = val;
		}
		else if(val instanceof Value){
			if (val.value === true){
				this.e.style.visibility = '';
			}
			else if (val.value === false){
				this.e.style.visibility = 'hidden';
			}
			else{
				this.e.style.visibility = val.getAsString();
			}
			val.onChange(function(d){
				if (d.value === true){
					self.e.style.visibility = '';
				}
				else if (d.value === false){
					self.e.style.visibility = 'hidden';
				}
				else{
					self.e.style.visibility = val.getAsString();
				}
				
			});
		}
		else if(typeof val === "boolean"){
			if(val){
				this.e.style.visibility = '';
			}
			else{
				this.e.style.visibility = 'hidden';
			}
		}
	}
});

function TextElement(args){
	var text = "";
	if(typeof args == "string"){
		text = args;
		args = {};
	}
	else if(typeof args == "object"){
		text = args.text || args.value || "";
	}
	else{
		args = {};
	}
	this.element = document.createTextNode();
}

// Text input
// To be renamed to TextInput
function TextInputCore(args){
	var self = this;
	args = args?args:{};
	args.tagName = "input";
	Element.call(this,args);
	this.addClass("text-input");
	this.setAttribute('type', 'text');
	this.focusable(); // Testing
}

TextInputCore.prototype = Object.create(Element.prototype);

TextInputCore.prototype.getValue = function(){
	return this.e.value;
}

TextInputCore.prototype.setValue = function(value){
	if(typeof value === "string"){
		this.e.value = value;
	}
}

function Clickable(args){
	var self = this;
	args = args?args:{};
	Element.call(this,{
		//tagName:typeof args.tagName == "string"?args.tagName:"button",
		className:args.className,
	});

	this.addClass("clickable");
	this.clickable(args);
}

Clickable.prototype = Object.create(Element.prototype);

function Label(args){
	var self = this;
	args = args?args:{};
	args.tagName = 'span';
	Element.call(this,args);
	this.icon = new Element({
		tagName:"span",
		className:"fa label-icon",
	});
	this.addClass('label');
	this.text = new Element({
		tagName:"span",
		className:"label-text",
	});

	this.setText(args.text);
	if(typeof args.icon == "string"){
		this.setIcon(args.icon);
	}
	else{
		this.addClass("noicon");
		//this.icon.addClass("hidden");
	}

	//if(typeof args.text)

	this.append(this.icon);
	this.append(this.text);
}

Label.prototype = Object.create(Element.prototype);

Label.prototype.setIcon = function(iconTag){
	this.removeClass("noicon");
	this.icon.removeClass('fa-'+this.iconTag);
	this.icon.addClass('fa-'+iconTag);
	this.iconTag = iconTag;
}

Label.prototype.setText = function(text){
	if(typeof text == "string"){
		if (text == ""){
			this.text.element.innerHTML = text;
			this.addClass("notext");
		}
		else{
			this.removeClass("notext");
			this.text.element.innerHTML = text;
		}
	}
	else if(text instanceof Text){
		this.removeClass("notext");
		this.text.element.innerHTML = '';
		this.text.element.appendChild(text);

	}
	else if(text instanceof Value){
		this.removeClass("notext");
		this.text.element.innerHTML = '';
		this.text.element.appendChild(text.addBroadcaster());

	}
	else if(text == undefined){
		this.addClass('notext');
		this.text.element.innerHTML = '';
	}
	return this;
}

Label.prototype.removeIcon = function(){
	this.addClass("noicon");
}

Label.prototype.removeText = function(){
	this.addClass("notext");
}

window.f = {};

f.classWithEvents = function(arg){
	arg.prototype.addEventListener = function(event, handler){
		if(typeof this.eventListeners == "undefined"){
			this.eventListeners = {};
		}
		if(typeof this.eventListeners[event] == "undefined"){
			this.eventListeners[event] = [];
		}
		this.eventListeners[event].push(handler);
		return this;
	}

	arg.prototype.on = arg.prototype.addEventListener;

	arg.prototype.removeEventListener = function(event, handler){
		if(typeof this.eventListeners == "undefined"){
			return;
		}
		var i = this.eventListeners[event].indexOf(handler);
		if(i > -1){
			this.eventListeners[event].splice(i, 1);
		}
		return this;
	}

	arg.prototype.dispatchEvent = function(event, e){
		if(typeof this.eventListeners == "undefined"){
			return this;
		}
		var self = this;
		if(typeof event == "string"){
			for (var i in this.eventListeners[event]){
				this.eventListeners[event][i](e);
			}
		}
		return this;
	}

	arg.prototype.trigger = arg.prototype.dispatchEvent;

}
;
function Model(args){
	var self = this;
	var args = args || {};
	if(args.value instanceof Value){
		this.adaptTo(args.value, function(args){
			return args[0].get();
		});
		this.setValue(args.value.get());
	}
	else{
		this.set({
			value:args.value,
		});
	}
}

var Value = Model;
// function Value(args){
// 	var self = this;
// 	args = args || {};
// 	if(args.value instanceof Value){
// 		this.adaptTo(args.value, function(args){
// 			return args[0].get();
// 		});
// 		this.setValue(args.value.get());
// 	}
// 	else{
// 		this.set({
// 			value:args.value,
// 		});
// 	}

// }

Value.prototype.addEventListener = function(event, handler){
	if(typeof this.eventListeners == "undefined"){
		this.eventListeners = {};
	}
	if(typeof this.eventListeners[event] == "undefined"){
		this.eventListeners[event] = [];
	}
	this.eventListeners[event].push(handler);
	return this;
}

Value.prototype.on = Value.prototype.addEventListener;

Value.prototype.removeEventListener = function(event, handler){
	if(typeof this.eventListeners == "undefined"){
		return;
	}
	var i = this.eventListeners[event].indexOf(handler);
	if(i > -1){
		this.eventListeners[event].splice(i, 1);
	}
	return this;
}

Value.prototype.adaptTo = function(){
	var self = this;
	if(arguments.length < 2){
		return;
	}
	var func = arguments[arguments.length - 1];
	if(typeof func != 'function'){
		return;
	}
	var args = [];
	/*for(var i = 0; i < arguments.length - 1; i++){
		args.push(arguments[i]);
	}*/
	var f = function(){
		self.setValue(func.call(self, args));
	};
	for(var i = 0; i < arguments.length - 1; i++){
		args.push(arguments[i]);
		if(arguments[i] instanceof Value){
			arguments[i].onChange(f);
		}
	}
	//f();
};

Value.prototype.listenTo = function(){
	if(arguments.length < 2){
		return;
	}
	var func = arguments[arguments.length - 1];
	if(typeof func != 'function'){
		return;
	}
	var f = function(){
		func.call(this, args);
	};
	for(var i = 0; i < arguments.length - 1; i++){
		if(arguments[i] instanceof Value){
			arguments[i].onChange(f);
		}
	}
};

Value.prototype.onChange = function(handler){
	return this.addEventListener('change', handler);
}

Value.prototype.setValue = function(value, args){
	var args = args || {};
	args.value = value;
	this.set(args);
}

Value.prototype.getBroadcaster = function(args){
	if (typeof this.broadcasters === "undefined"){
		this.broadcasters = [];
	}
	var broadcaster = document.createTextNode(this.value !== undefined ? this.toString() : '');
	this.broadcasters.push(broadcaster);
	return broadcaster;
}

Value.prototype.addBroadcaster = Value.prototype.getBroadcaster;

Value.prototype.removeBroadcaster = function(element){
	if (this.broadcasters === undefined){
		return;
	}
	var i = this.broadcasters.indexOf(element);
	if (i > -1) {
    	this.broadcasters.splice(i, 1);
	}
	return this;
}

Value.prototype.broadcast = function(changes){
	if (this.broadcasters === undefined){
		return;
	}
	var self = this;
	for (var i in this.broadcasters){
		this.broadcasters[i].nodeValue = changes.value.toString();
	}
}

Value.prototype.dispatchEvent = function(event, e){
	if(typeof this.eventListeners == "undefined"){
		return this;
	}
	var self = this;
	if(typeof event == "string"){
		for (var i in this.eventListeners[event]){
			this.eventListeners[event][i](e);
		}
	}
	return this;
}

Value.prototype.trigger = Value.prototype.dispatchEvent;

Value.prototype.addFilter = function(filter, handler){
	if (this.filters === undefined){
		this.filters = {};
	}
	if(typeof this.filters[filter] == "undefined"){
		this.filters[filter] = [];
	}
	this.filters[filter].push(handler);
	return this;
}

Value.prototype.filter = Value.prototype.addFilter;

Value.prototype.removeFilter = function(filter, handler){
	if (this.filters === undefined){
		return
	}
	var i = this.filters[filter].indexOf(handler);
	if(i > -1){
		this.filters[filter].splice(i, 1);
	}
	return this;
}

Value.prototype.applyFilter = function(filter, data){
	if (this.filters === undefined){
		return data;
	}
	var self = this;
	if(typeof filter == "string"){
		for (var i in this.filters[filter]){
			data = this.filters[filter][i](data) || data;
		}
	}
	return data;
}


Value.prototype.set = function(args){
	if(typeof args !== "object"){
		args = {
			value:args,
		}
	}
	else if(typeof args === "undefined"){
		args = {};
	}
	args.oldValue = this.value;
	args = this.applyFilter('set', args);
	if(args.cancel == true){
		return;
	}
	if(this.value !== args.value){
		this.value = args.value;
	}
	else{
		return;
	}
	this.dispatchEvent('change',args);
	this.broadcast(args);
}

Value.prototype.get = function(args){
	args = args || {};
	args.value = this.value;
	args.originalValue = this.value;
	args = this.applyFilter('get',args);
	return args.value;
}

Value.prototype.insert = function(insertedData){
	var self = this;
	var selectionStart, selectionEnd, candidateValue, tempValue;
	insertedData = insertedData || {
		value:'',
		firstPart:'',
		secondPart:'',
		selection:'',
		replacement:'',
	};
	insertedData = this.applyFilter('insert', insertedData);
	if(insertedData.cancel == true === true){
		this.dispatchEvent('insert-cancel == truee{{d');
		this.dispatchEvent('change-cancel == truee{{d');
		return this;
	}

	var setData = insertedData;

	setData.value = setData.firstPart + setData.replacement + setData.secondPart;
	setData.firstPart = setData.firstPart + setData.replacement;
	setData.selection = '';
	this.set(setData);
}

Value.prototype.deleteAt = function(value, selectionStart, selectionEnd){
	selectionEnd = selectionEnd || selectionStart;
	var firstPart = this.value.slice(0,selectionStart);
	var lastPart = this.value.slice(selectionStart,this.value.length);
	this.value = firstPart + value + lastPart;
	var e = {
		selectionStart:selectionStart,
		selectionEnd:selectionEnd,
		delta:value,
		value:this.value,
	}
	this.dispatchEvent('change',e);
}

Value.prototype.valueOf = function(){
	return this.get();
};

Value.prototype.toString = function(){
	return String(this.get());
}

Value.prototype.getAsString = function(){
	return String(this.get());
}

Value.prototype.getAsNode = function(){
	return this.getBroadcaster();
}

;
function BooleanModel(args){
	var args, self;
	args = args || {};
	if(typeof arguments[0] === "boolean"){
		args = typeof arguments[1] === "object" ? arguments[1] : {};
		args.value = arguments[0];
	}
	else if(typeof arguments[0] === "object"){
		args = arguments[0];
	}
	args.value = Boolean(args.value);
	Model.call(this, args);
	self = this;
	this.addFilter('set', function(d){
		if(!d.value){
			d.value = false;
		}
		else{
			d.value = true;
		}
		return d;
	});
	this.onChange(function(d){
		if(d.value){
			self.dispatchEvent('on');
			if(typeof args.onOn === "function"){
				args.onOn(d);
			}
		}
		else{
			self.dispatchEvent('off');
			if(typeof args.onOff === "function"){
				args.onOff(d);
			}
		}
	});
}

BooleanModel.prototype = Object.create(Model.prototype);

BooleanModel.prototype.flip = function(args){
	if(this.value){
		this.setValue(false, args);
	}
	else{
		this.setValue(true, args);
	}
}

BooleanModel.prototype.true = function(args){
	this.setValue(true, args);
}

BooleanModel.prototype.false = function(args){
	this.setValue(false, args);
}

BooleanModel.prototype.onTrue = function(handler, check){
	this.addEventListener('on', handler);
	if (check==true && this.value === true){
		handler();
	}
}

BooleanModel.prototype.onFalse = function(handler, check){
	this.addEventListener('off', handler);
	if (check==true && this.value === false){
		handler();
	}
}

BooleanModel.prototype.and = function(arg){
	var self = this;
	var newBool = new BooleanModel({
		value:this.value && arg.value,
	});
	this.onChange(function(d){
		newBool.setValue(d.value && arg.value);
	});

	arg.onChange(function(d){
		newBool.setValue(d.value && self.value);
	});

	return newBool;
}

BooleanModel.prototype.switchClass = function(elem, onTrue, onFalse){
	this.onTrue(function(){
		if (elem instanceof Element){
			elem.addClass(onTrue);
			elem.removeClass(onFalse);
		}
	}, 1);
	this.onFalse(function(){
		if (elem instanceof Element){
			elem.addClass(onFalse);
			elem.removeClass(onTrue);
		}
	}, 1);

};



function DataTableModel(args){
	var self = this;
	var args = args || {};
	var row;
	args.value = args.value || [];

	this.filter('newrow', function(row){
		if(typeof row !== "object"){
			row = {};
		}
		return row;
	});

	this.filter('set', function(data){
		var table = [];
		if(data.value instanceof Array){
			for (var i in data.value){
				var row = data.value[i];
				if(typeof row === "object"){
					row = self.applyFilter('newrow', row);
					table.push(row);
				}
				else{
					continue;
				}
			}
		}
		data.value = table;
		return data;
	});

	Model.call(this, args);
}

DataTableModel.prototype = Object.create(Model.prototype);

DataTableModel.prototype.extract = function(){
	var out = {
		rows:[],
		range:{},
	};
	for(var i in this.value){
		var row = this.value[i];
		Object.keys(row).forEach(function(key){
			if(out.range[key] === undefined){
				out.range[key] = [undefined, undefined];
				if(row[key] !== null){
					out.range[key] = [row[key], row[key]];
				}
			}
			else if(row[key] !== null){
				if(out.range[key][0] === undefined || out.range[key][0] > row[key]){
					out.range[key][0] = row[key];
				}
				if(out.range[key][1] === undefined || out.range[key][1] < row[key]){
					out.range[key][1] = row[key];
				}
			}

		});
		out.rows.push(row);
	}
	return out;
};


function DateModel(args){
	var self = this;
	if (typeof args == 'number'){
		self.value = Date(Number(args));
	}
	else if (typeof args == 'object') {
		self.value = args.value;
	}



}

DateModel.prototype = Object.create(Value.prototype);

DateModel.startClock = function(){
	DateModel.minClock = setInterval(function(){
		var now = new Date();
		for (var i in DateModel.HBroadcastedDatesMin){
			var item = DateModel.HBroadcastedDatesMin[i];
			var interval = now - item['date'];
			if (interval < 60 * 1000){
				item['node'].nodeValue = "just now";
			}
			else if (interval < 60 * 60 * 1000){
				item['node'].nodeValue = String(Math.round(interval / (60 * 1000))) + " min ago";
			}
			else if (interval < 24 * 60 * 60 * 1000){
				item['node'].nodeValue = String(Math.round(interval / (60 * 60 * 1000))) + " hrs ago";
			}
			else {
				item['node'].nodeValue = String(DateModel.monthAbbr[item.date.getMonth()]) + ' ' + String(item.date.getDate());
			}
		}
	}, 60000);
}

DateModel.stopClock = function(){
	stopInterval(DateModel.minClock);
	delete DateModel.minClock;
}

DateModel.HBroadcastedDatesMin = [];

DateModel.monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

DateModel.getHBroadcaster = function(date){
	//var item = {}
	if (date instanceof Date){
		var item = {
			date:date,
			node:new Text(),
		};

		var now = new Date();

		var interval = now - date;

		if (interval < 60 * 1000){
			item['node'].nodeValue = "just now";
		}
		else if (interval < 60 * 60 * 1000){
			item['node'].nodeValue = String(Math.round(interval / (60 * 1000))) + " min ago";
		}
		else if (interval < 24 * 60 * 60 * 1000){
			item['node'].nodeValue = String(Math.round(interval / (60 * 60 * 1000))) + " hrs ago";
		}
		else {
			item['node'].nodeValue = String(DateModel.monthAbbr[date.getMonth()]) + ' ' + String(date.getDate());
		}

		DateModel.HBroadcastedDatesMin.push(item);
		if (DateModel.minClock === undefined){
			DateModel.startClock();
		}

		return item['node'];
	}

	
}

DateModel.prototype.getHBroadcaster = function(){

}

function StringModel(args){
	var args;
	if (args == undefined){
		args = {};
	}
	else if (typeof args === "string"){
		args = {
			value:args,
		}
	}

	if(args.value === undefined){
		args.value = '';
	}
	 
	Model.call(this, {
		value:String(args.value),
	});
	this.filter('set', function(d){
		d.value = String(d.value);
		return d;
	});
}

StringModel.prototype = Object.create(Model.prototype);

function NumberModel(args){
	if (args == undefined){
		args = {};
	}
	else if (typeof args === "number"){
		args = {
			value:args,
		}
	}
	if (args.value === undefined || Number(args.value) == NaN){
		args.value = 0;
	}

	Model.call(this, {
		value: Number(args.value),
	});
	this.filter('set', function(d){
		d.value = Number(d.value);
		if(d.value == NaN){
			d.cancel = true;
		}
		return d;
	});
}

NumberModel.prototype = Object.create(Model.prototype);

function RangeModel(args){
	var self = this;
	this.filter('set', function(d){
		if(typeof d.value !== "object"){
			d.value = {};
		}
		return d;
	});
	Model.call(this, args);
}

RangeModel.prototype = Object.create(Model.prototype);

RangeModel.prototype.setMin = function(val){
	this.value.min = val;
}

RangeModel.prototype.setMax = function(val){
	this.value.max = val;
}

RangeModel.prototype.getMin = function(){
	return this.value.min;
}

RangeModel.prototype.getMax = function(){
	return this.value.max;
}

Object.defineProperty(RangeModel.prototype, 'min', {
	get: function(){
		return this.value.min;
	},
	set: function(val){
		this.value.min = val;
	}
});
;
function Container(args){
	var self = this;
	args = args?args:{};
	Element.call(this,args);
	this.addClass("container");
	this.contentType = new Value({
		//value: "blocks",
	});

	this.displayType = new Value({
		//value: "new-line",
	});

	this.hidden = new BooleanModel({
		value:false,
	});
	this.displayed = new BooleanModel({
		value:true,
	});
	this.displayed.adaptTo(this.hidden, function(args){
		return !args[0].get();
	});
	this.hidden.adaptTo(this.displayed, function(args){
		return !args[0].get();
	});

	//this.displayed.addFilter

	this.position = this.displayType;

	this.maximized = new BooleanModel(true);
	this.share = new Value();

	this.contentDirection = new Value();

	this.maximized.addEventListener('change',function(d){
		if(d.value){
			self.element.style.flex = self.share.get();
		}
		else{
			self.element.style.flex = '';
		}
	});

	this.hidden.onTrue(function(){
		self.addClass('hidden');
		self.dispatchEvent('hidden');
	});

	this.hidden.onFalse(function(){
		/*var displayType = self.displayType.get();
		if(displayType === 'unmaximized'){
			//self.parent.
		}
		else if(displayType === 'maximized'){
			if(typeof self.parent.activeMaximizedContainer !== 'undefined'){
				self.parent.activeMaximizedContainer.hide();
			}
			else if(typeof self.parent.activeContainer !== 'undefined'){
				self.parent.activeContainer.hide();
			}
			if(typeof self.parent.activeUnmaximizedContainers !== 'undefined'){
				for (i in self.parent.activeUnmaximizedContainers){
					self.parent.activeUnmaximizedContainers[i].hide();
				}
			}
			self.parent.activeMaximizedContainer = self;
			
		}*/
		self.dispatchEvent('before-displayed');
		self.removeClass('hidden');
		self.dispatchEvent('displayed');
	});

	this.contentDirection.addFilter('set', function(d){
		if(d.value == "horizontal" || d.value == "h"){
			d.value = "horizontal";
		}
		else{
			d.value = "vertical";
		}
		return d;
	});

	this.displayType.addFilter('set', function(d){
		if(Container.displayTypes.indexOf(d.value) == -1){
			d.cancel = true;
		}
		return d;
	});

	this.contentType.addFilter('set', function(d){
		if(d.value == "lines"){
			d.value = "lines";
		}
		else{
			d.value = "blocks";
		}
		return d;
	});

	this.contentDirection.addEventListener('change',function(){
		var direction = self.contentDirection.get();
		if(direction == "vertical"){
			self.element.classList.remove("content-direction-horizontal");
			self.addClass("content-direction-vertical");
		}
		else if(direction == "horizontal"){
			self.element.classList.remove("content-direction-vertical");
			self.addClass("content-direction-horizontal");
		}
	});

	if(args.flex){
		this.element.style.flex = args.flex;
	}

	if(args.hidden){
		this.hidden.true();
	}
	if(args.closeable){
		this.closeable = true;
	}

	//args.displayType = args.displayType || args.position;
	/*if(typeof args.contentType == "string"){
		if(args.contentType === "blocks"){
			this.contentType.set("blocks");
		}
		else if(args.contentType === "lines"){
			this.contentType.set("lines");
		}
	}
	if(typeof args.displayType == "string"){
		if(args.displayType === "inline"){
			this.displayType.set("inline");
		}
		else if(args.displayType === "new-line"){
			this.displayType.set("new-line");
		}
		else if(args.displayType === "none"){
			this.displayType.set("none");
		}
	}*/

	//this.contentType.addEventListener('change',onContentTypeOrPositionChange);
	//this.displayType.addEventListener('change',onContentTypeOrPositionChange);

	this.contentType.addEventListener('change',function(d){
		if(d.oldValue !== undefined){
			self.removeClass('content-type-' + d.oldValue);
		}
		self.addClass('content-type-'+d.value);
	});

	this.displayType.addEventListener('change',function(d){
		if(d.oldValue !== undefined){
			self.removeClass('display-type-' + d.oldValue);
		}
		self.addClass('display-type-'+d.value);
		if(d.oldValue === 'unmaximized'){
			if(d.value === 'unmaximized-pinned'){
				//var i = self.parent.activeUnmaximizedContainers.indexOf(self);
				//if(i != -1){
				//	self.parent.activeUnmaximizedContainers.splice(i,1);
				//}
				
			}
			else if(d.value === 'maximized'){
				var i = self.parent.activeUnmaximizedContainers.indexOf(self);
				self.parent.activeUnmaximizedContainers.splice(i,1);
				if(self.displayed.value){
					if(typeof self.parent.displayedMaximized !== 'undefined'){
						self.parent.displayedMaximized.hide();
					}
					self.parent.displayedMaximized = self;
				}

				self.$.css({
					'z-index':'',
					top:'',
					left:'',
				});
				self.notDraggable();
			}
		}
		else if(d.oldValue === 'unmaximized-pinned'){

		}
		else if(d.oldValue === 'maximized'){
			if(d.value === 'unmaximized' || d.value === 'unmaximized-pinned'){
				if(typeof self.parent.previousMaximized !== 'undefined'){
					self.parent.previousMaximized.show();
				}
				self.parent.activeUnmaximizedContainers.push(self);
				self.parent.displayedMaximized = self.parent.previousMaximized;
				self.parent.previousMaximized = undefined;
				self.draggable();
				self.$.css({
					//'z-inde'
					top:0,
					left:0,
				});
			}
		}
		else if(d.value === 'unmaximized' || d.value === 'unmaximized-pinned' || d.value === 'maximized'){
			//self.focusable();
			//self.addEventListener('focusin', function(){
				//self.top();
			//});
			self.e.addEventListener('mousedown', function(){
				self.parent.switchTo(self);
			}, true);
			if(d.value === 'unmaximized-pinned' || d.value === 'unmaximized'){
				self.draggable();
				self.$.css({
					//'z-inde'
					top:0,
					left:0,
				});
			}
			//self.draggable();
		}
	});
	//this.displayType.addEventListener('change',onContentTypeOrPositionChange);

	/*var onContentTypeOrPositionChange = function(){
		var c = self.contentType.get();
		var p = self.displayType.get();
		if(c === "blocks" && p === "inline"){
			self.element.style.display = 'inline-flex';
		}
		else if(c === "blocks" && p === "new-line"){
			self.element.style.display = 'flex';
		}
		else if(c === "lines" && p === "inline"){
			self.element.style.display = 'inline-block';
		}
		else if(c === "lines" && p === "new-line"){
			self.element.style.display = 'block';
		}
	};

	onContentTypeOrPositionChange();*/
	
	/*if(typeof args.direction === "string"){
		if(args.direction === "v"){
			this.contentDirection.set("vertical");
			this.addClass("content-direction-vertical");
			this.element.style.flexDirection = "column";
		}
		else if(args.direction === "h"){
			this.contentDirection.set("horizontal");
			this.addClass("content-direction-horizontal");
			this.element.style.flexDirection = "row";
		}
	}
	*/

	this.displayType.set({
		value:args.displayType || args.position || 'new-line',
	});

	this.contentType.set({
		value:args.contentType,
	});
	
	this.contentDirection.set({
		value:args.contentDirection,
	});

	if(typeof args.share === "number"){
		this.share.set({
			value:args.share,
		});
		if(args.maximized == undefined){
			this.maximized.set({
				value:true,
			});
			self.element.style.flex = self.share.get();
		}
		else{
			this.maximized.set({
				value:args.maximized,
			});
		}
	}
	else{
		this.maximized.set({
			value:args.maximized,
		});
	}

	/*if(typeof args.share !== "undefined"){
		this.element.style.flex = args.share;
	}*/

	if(args.mode == "full"){
		this.addClass("container-full");
	}

	//this.container.appendChild(this.contentBlock);


}

Container.prototype = Object.create(Element.prototype);

Container.displayTypes = ['inline', 'new-line', 'unmaximized', 'maximized', 'unmaximized-pinned'];

Container.prototype.hide = function(){
	this.hidden.true();
};

Container.prototype.show = function(){
	this.hidden.false();
};

Container.prototype.setDisplayType = function(displayType){
	this.displayType.setValue(displayType);
	this.dispatchEvent('display-type-changed');
};

Container.prototype.getDisplayType = function(){
	return this.displayType.get();
};

Container.prototype.getHandle = function(args){
	args = args || {};
	args.container = this;
	var handle = new ContainerHandle(args);
	return handle;
};

Container.prototype.top = function(){
	if(this.displayType.value === 'unmaximized'){
		this.e.style.zIndex = this.parent.topZIndex + 1;
		this.parent.topZIndex += 1;
		if(this.parent.topWindow instanceof Element){
			this.parent.topWindow.dispatchEvent('untopped');
		}
		this.parent.topWindow = this;
		this.dispatchEvent('topped');
	}
};

Container.prototype.onHidden = function(handler){
	this.addEventListener('hidden', handler);
};


Container.prototype.onDisplayed = function(handler){
	this.addEventListener('displayed', handler);
};


Container.prototype.onClosed = function(handler){
	this.addEventListener('closed', handler);
};

function ContainerHandle(args){
	var self = this;
	args = args?args:{};
	Element.call(this,args);
	if(args.container === undefined){
		return;
	}

	this.focusable();
	this.container = args.container;
	this.addClass('container-handle');
	this.color = this.container.color || args.color || 'gainsboro';
	this.addClass(this.color);
	this.text = this.container.title || args.text || "Container";
	this.append(new Label({
		text:this.text || 'Container',
	}));
	this.attr('title', this.text);
	if(this.container.windowMode){
		this.addClass('container-handle-'+this.container.windowMode);
	}

	this.container.on('activated', function(){
		self.addClass('active');
		self.removeClass('inactive');
	});
	this.container.on('deactivated', function(){
		self.addClass('inactive');
		self.removeClass('active');
	});
	this.container.on('closed',function(){
		self.close();
	});

	/*if(this.container.displayed.get()){
		self.addClass('active');
		self.removeClass('inactive');
	}*/

	this.addEventListener('focus', function(e){
		self.container.parent.switchTo(self.container);
	});

	/*this.$.on('touchstart mousedown', function(e){
		console.log(e.type);
		if(e.which === 1 || e.type === "touchstart"){
			if(self.container.parent.activeContainer == self.container){
				//if(container.displayType.value !== 'maximized'){
				//	//container
				//	container.parent.switchTo();
				//	container.hide();
				//}
			}
			else{
				self.container.parent.switchTo(self.container);
			}
		}
		
		e.preventDefault();
		//container.show();
	});*/

	if(args.closeable){
		var closeButton = new Button({
			icon:'close',
			className:'tab-close red quiet',
			action:function(e){
				//console.log("closeButton pressed");
				self.container.parent.remove(self.container);
				//self.container.close();
			},
		});
		//closeButton.addClass(this.color);
		self.append(closeButton);
	}
	
}

ContainerHandle.prototype = Object.create(Element.prototype);


function ContainerStack(args){
	var self = this;
	args = args?args:{};
	Container.call(this,args);
	this.addClass('containers-stack');
	this.activeUnmaximizedContainers = [];
	this.containers = [];
	this.topZIndex = 200;
	this.activeContainer;
	this.activeMaximizedContainer = this.activeContainer;
}

ContainerStack.prototype = Object.create(Container.prototype);

ContainerStack.prototype.append = function(container){
	var self = this;
	var displayType;
	if (container.displayType === undefined){
		container.displayType = new Value({
			value:'maximized'
		});
	}
	if(['maximized', 'unmaximized', 'unmaximized-pinned'].indexOf(container.displayType.get()) == -1){
		container.displayType.setValue('maximized');
		displayType = 'maximized';
	}
	else{
		displayType = container.displayType.get();
	}

	if(displayType === 'unmaximized' || displayType === 'unmaximized-pinned'){
		if(typeof this.activeUnmaximizedContainers === 'undefined'){
			this.activeUnmaximizedContainers = [];
			this.topZIndex = 200;
		}
		this.activeUnmaximizedContainers.push(container);

	}

	if(this.activeContainer == undefined){
		this.switchTo(container);
	}
	else{
		container.hide();
	}

	container.parent = this;
	if(typeof container.windowMode === 'undefined'){
		container.windowMode = 'extended';
	}
	if(container.windowMode === 'unmaximized'){

	}
	else{
		this.containers.push(container);
		if(this.containers.length == 1){
			this.switchTo(container);
		}
		else{
			container.hide();
		}
	}
	
	
	Container.prototype.append.call(this, container);
	/*container.on('closed',function(){
		var i = self.containers.indexOf(container);
		self.containers.splice(i,1);
		if(self.activeContainer == container){
			if(i == 0){
				if(self.containers.length > 0){
					self.switchTo(self.containers[0]);
				}
			}
			else{
				self.switchTo(self.containers[i-1]);
			}
		}
		container.removeEventListener
	});*/
	this.dispatchEvent('container-added', {
		container:container,
	});
};

ContainerStack.prototype.remove = function(container){
	var i = this.containers.indexOf(container);
	if(i != -1){
		if(this.activeContainer == container){
			if(i == 0){
				if(this.containers.length > 0){
					this.switchTo(this.containers[0]);
				}
			}
			else{
				this.switchTo(this.containers[i-1]);
			}
		}
		//this.element.removeChild(container.element);
		container.close();
		this.containers.splice(i, 1);
	}
};

ContainerStack.prototype.getHandleFor = function(container, handleArgs){
	var self = this;
	var handle = new Element(handleArgs);
	handle.addClass('container-handle white');
	if(container.title === undefined){
		container.title = "Tab";
	}

	handle.append(new Label({
		text:container.title,
	}));
	if(container.hidden.get()){
		handle.addClass('inactive');
	}
	else{
		handle.addClass('active');
	}
	/*container.hidden.onTrue(function(){
		handle.addClass('inactive');
		handle.removeClass('active');
	});
	container.hidden.onFalse(function(){
		handle.addClass('active');
		handle.removeClass('inactive');
	});*/
	container.on('activated', function(){
		handle.addClass('active');
		handle.removeClass('inactive');
	});
	container.on('deactivated', function(){
		handle.addClass('inactive');
		handle.removeClass('active');
	});
	container.on('closed',function(){
		handle.close();
	});
	container.displayType.onChange(function(d){
		if(d.value === 'maximized'){
			handle.addClass('tab');
		}
		else if(d.value === 'unmaximized-pinned'){
			handle.addClass('pinned');
		}
		if(d.oldValue === 'maximized'){
			handle.removeClass('tab');
		}
		else if(d.oldValue === 'unmaximized-pinned'){
			handle.removeClass('pinned');
		}
	});
	handle.on('contextmenu', function(e){
		//e.stopPropagation();
		e.preventDefault();
	});
	handle.on('mousedown', function(e){
		//e.stopPropagation();
		handle.savedPos = e.pageY;
		handle.pressed = true;
		handle.moved = false;
		e.preventDefault();
		handle.wasActive = container.parent.activeContainer == container;
		var onMouseMove = function(e){
			if(handle.pressed){
				handle.moved = true;
				var shift = e.pageY - handle.savedPos;
				var displayType = container.displayType.value;
				if(displayType === 'unmaximized'){
					if(shift >=5){
						container.displayType.setValue('maximized');
						console.log('Maximized');
						handle.savedPos = handle.savedPos + 5;
					}else if(shift <= -5){
						container.displayType.setValue('unmaximized-pinned');
						console.log('Pinned');
						handle.savedPos = handle.savedPos - 5;
					}
				}
				else if(displayType === 'unmaximized-pinned'){
					if(shift >= 5){
						container.displayType.setValue('unmaximized');
						console.log('Unpinned');
						handle.savedPos = handle.savedPos + 5;
					}
				}
				else if(displayType === 'maximized'){
					if(shift <= -5){
						container.displayType.setValue('unmaximized');
						console.log('Unmaximized');
						handle.savedPos = handle.savedPos - 5;
					}
				}
				e.preventDefault();
			}
		};
		var onMouseUp = function(e){
			handle.pressed = false;
			document.removeEventListener(onMouseMove);
			document.removeEventListener(onMouseUp);
			if(!handle.moved && handle.wasActive){
				if(container.parent.activeContainer == container){
					if(container.displayType.value !== 'maximized'){
						//container
						container.parent.switchTo();
						container.hide();
					}
				}
				else{
					//self.switchTo(container);
					container.hide();
				}
			}
		};
		document.addEventListener('mousemove',onMouseMove);
		document.addEventListener('mouseup',onMouseUp);
	});
	
	handle.$.on('mousedown', function(e){
		handle.moved = false;
		if(e.which === 1){
			if(container.parent.activeContainer == container){
				//if(container.displayType.value !== 'maximized'){
				//	//container
				//	container.parent.switchTo();
				//	container.hide();
				//}
			}
			else{
				self.switchTo(container);
			}
		}
		else if(e.which === 2){
			if(container.parent.activeContainer == container){
				if(container.displayType.value !== 'maximized'){
					//container
					container.parent.switchTo();
					container.hide();
				}
			}
			else{
				//self.switchTo(container);
				container.hide();
			}
		}
		
		
		//container.show();
	});
	container.on('topped', function(){
		handle.addClass('topped');
	});
	container.on('untopped', function(){
		handle.removeClass('topped');
	});
	if(container.closeable){
		handle.append(new Button({
			icon:'times',
			className:'tab-close red quiet',
			onClick:function(){
				self.remove(container);
			},
		}));
	}
	if(container.displayType.get() === 'maximized'){
		handle.addClass('tab');
	}
	else if(container.displayType.get() === 'unmaximized-pinned'){
		handle.addClass('pinned');
	}
	
	container.handle = handle;
	return handle;
};

ContainerStack.onContainerClosed = function(){};

ContainerStack.prototype.appendAndShow = function(container){
	this.append(container);
	this.switchTo(container);
};

ContainerStack.prototype.switchTo = function(container){
	if(container === this.activeContainer){
		return;
	}
	else if(typeof container === 'undefined'){
		if(typeof this.activeContainer !== 'undefined'){
			this.activeContainer.dispatchEvent('deactivated');
			this.activeContainer = undefined;
		}
		
	}
	else if(container instanceof Container){
		var displayType = container.displayType.get();
		this.previousContainer = this.activeContainer;
		if(displayType === 'maximized'){
			//this.previousMaximized
			if(typeof this.activeContainer !== 'undefined'){
				this.activeContainer.dispatchEvent('deactivated');
				for (var i in this.activeUnmaximizedContainers){
					if(this.activeUnmaximizedContainers[i].displayType.value !== 'unmaximized-pinned'){
						this.activeUnmaximizedContainers[i].hide();
					}
					
				}
				if(this.activeContainer.displayType.value !== 'unmaximized-pinned'){
					this.activeContainer.hide();
				}
				
			}
			if(this.displayedMaximized != container && this.displayedMaximized != undefined){
				this.previousMaximized = this.displayedMaximized;
				this.displayedMaximized.hide();
			}
			this.activeContainer = container;
			this.displayedMaximized = container;
			container.dispatchEvent('activated');
			container.show();
		}
		else if(displayType === 'unmaximized' || displayType === 'unmaximized-pinned'){
			if(typeof this.activeContainer !== 'undefined'){
				this.activeContainer.dispatchEvent('deactivated');
			}
			
			//this.activeContainer.hide();
			this.activeContainer = container;
			container.dispatchEvent('activated');
			container.e.style.zIndex = this.topZIndex + 1;
			this.topZIndex += 1;
			container.show();

		}else if(displayType ==='unmaximized-pinned'){

		}
	}



	/*var i = this.containers.indexOf(container);
	if(i != -1){
		if(this.activeContainer != undefined){
			//this.activeContainer.e.style.position = 'absolute';
			this.activeContainer.$.css({
				position:'absolute',
				top:0,
				bottom:0,
				right:0,
				left:0,
			});
			//this.activeContainer.hide();
		}
		container.show();
		if(this.activeContainer != undefined){
			this.activeContainer.hide();
			this.activeContainer.e.style.position = '';
		}
		this.activeContainer = container;
	}
	else{
		container.show();
	}*/
}

ContainerStack.prototype.fadeTo = function(args){
	if(args instanceof Element){
		args = {
			container:args,
		}
	}
	var container = args.container;
	var replacedContainer;
	var direction;
	if(this.containers.indexOf(container) == -1){
		return;
	}
	if(args.replacedContainer == undefined){
		replacedContainer = this.activeContainer;
	}
	else{
		replacedContainer = args.replacedContainer;
	}
	this.activeContainer = container;
	if(this.fading){
		return;
	}
	else{
		this.fading = true;
	}
	var self = this;

	replacedContainer.$.css({
		height:replacedContainer.$.height(),
		width:replacedContainer.$.width(),
		position:'absolute',
		opacity:1,
		'z-index':100,
		top:0,
		left:0,
	});
	container.$.css({
		//opacity:0,
	});
	container.show();

	var done1 = function(){
		replacedContainer.hide();
		replacedContainer.$.css({
			height:'',
			right:'',
			left:'',
			opacity:'',
			'z-index':'',
			width:'',
			position:'',
		});
		self.fading = false;

		if(self.activeContainer != container){
			self.fadeTo(self.activeContainer);
		}
	};

	var done2 = function(){
		replacedContainer.hide();
		/*container.$.css({
			opacity:'',
		});*/

		self.fading = false;
		//container.show();
		if(self.activeContainer != container){
			self.fadeTo(self.activeContainer);
		}
	};
	replacedContainer.$.animate({
		opacity:'0',
	}, 40,done1);
	/*container.$.animate({
		opacity:'1',
	}, 'fast',done2);*/
}


ContainerStack.prototype.slideTo = function(args, direction){
	if(args instanceof Element){
		args = {
			container:args,
			direction:direction,
		}
	}
	this.switchTo(args.container);
	return;
	var container = args.container;
	var replacedContainer;
	var direction;
	if(this.containers.indexOf(container) == -1){
		return;
	}
	if(args.replacedContainer == undefined){
		replacedContainer = this.activeContainer;
	}
	else{
		replacedContainer = args.replacedContainer;
	}
	if(args.direction == undefined){
		direction = 'left';
	}
	else{
		direction = args.direction;
	}
	this.activeContainer = container;
	if(this.sliding){
		return;
	}
	else{
		this.sliding = true;
	}
	var self = this;

	replacedContainer.$.css({
		height:replacedContainer.$.height(),
		width:replacedContainer.$.width(),
		position:'absolute',
		top:0,
		left:0,
	});
	this.$.css({
		overflow:'hidden',
	});
	if(direction == 'left'){
		container.$.css({
			left:'100%',
		});
	}
	else if(direction == 'right'){
		container.$.css({
			right:'100%',
		});
	}
	container.show();

	var done1 = function(){
		replacedContainer.$.css({
			height:'',
			right:'',
			left:'',
			//overflow:'',
			width:'',
			position:'',
		});
	};

	var done2 = function(){
		replacedContainer.hide();
		container.$.css({
			left:'',
			right:'',
		});

		self.sliding = false;
		container.show();
		if(self.activeContainer != container){
			self.slideTo(self.activeContainer, container);
		}
		self.$.css({
			overflow:'',
		});
	};

	if(direction == 'left'){
		replacedContainer.$.animate({
			right:'100%',
		}, 'fast',done1);
		container.$.animate({
			left:0,
		}, 'fast',done2);
	}
	else if(direction == 'right'){
		replacedContainer.$.animate({
			left:'100%',
		}, 'fast', done1);
		container.$.animate({
			right:0,
		}, 'fast', done2);
	}

	


}

ContainerStack.prototype.getNext = function(){
	if(this.containers.length > 1){
		var i = this.containers.indexOf(this.activeContainer);
		if(i+1 == this.containers.length){
			return this.containers[0];
		}
		else{
			return this.containers[i+1];
		}
	}
	else{
		return undefined;
	}
}

ContainerStack.prototype.next = function(){
	if(this.containers.length > 1){
		var i = this.containers.indexOf(this.activeContainer);
		if(i+1 == this.containers.length){
			this.switchTo(this.containers[0]);
		}
		else{
			this.switchTo(this.containers[i+1]);
		}
	}
	
}

ContainerStack.prototype.prev = function(){
	if(this.containers.length > 1){
		var i = this.containers.indexOf(this.activeContainer);
		if(i == 0){
			this.switchTo(this.containers[this.containers.length - 1]);
		}
		else{
			this.switchTo(this.containers[i-1]);
		}
	}
	
}

ContainerStack.prototype.withLoader = function(){
	this.loader = new Loader();
	this.append(this.loader);
};

ContainerStack.prototype.startLoader = function(){
	//this.switchTo(this.loader);
	//this.locked = true;
	if(this.loader == undefined){
		this.withLoader();
	}
	this.switchTo(this.loader);
};

ContainerStack.prototype.stopLoader = function(){
	this.switchTo(this.main);
};

function Tabs(args){
	var self = this;
	args=args?args:{};
	Container.call(this,{
		contentDirection:args.direction,
		contentType:'lines',
	});
	this.addClass('tabs');

	if(args.containers instanceof ContainerStack){
		this.containers = args.containers;
	}
	else{
		this.containers = new ContainerStack({
			share:1,
		});
	}
	this.containers.addClass('tabs-containers');

	this.containers.on('container-added', function(e){
		self.addContainerTab(e.detail.container);
	});

	for (var i in this.containers.containers){
		var cont = this.containers.containers[i];
		this.addContainerTab(cont);

	}

}

Tabs.prototype = Object.create(Container.prototype);

Tabs.prototype.addContainerTab = function(container){
	var self = this;
	var tab = new Container({
		contentDirection:'horizontal',
		displayType:'inline',
		className:'tab',
	});
	container.tab = tab;
	if(container.hidden.get()){
		tab.addClass('inactive');
	}
	else{
		tab.addClass('active');
	}
	container.hidden.onTrue(function(){
		tab.addClass('inactive');
		tab.removeClass('active');
	});
	container.hidden.onFalse(function(){
		tab.addClass('active');
		tab.removeClass('inactive')
	});
	container.on('closed',function(){
		tab.close();
	});
	if(container.title == undefined){
		container.title = new Value({
			value:'Tab',
		});
	}
	else{
		tab.append(new Label({
			text:container.title,
		}));
	}
	if(container.closeable){
		tab.append(new Button({
			icon:'times',
			className:'tab-close red quiet',
			onClick:function(){
				self.containers.remove(container);
			},
		}));
	}
	tab.addEventListener('click',function(){
		self.containers.switchTo(container);
	});
	this.append(tab);
}

/*Tabs.prototype.append = function(container, args){
	var args = args || {};

	this.tabs.push(container);

	container.tab = new Toolbar();
}*/

function Panel(args){
	var self = this;
	args = args?args:{};
	Container.call(this,args);

	this.addClass('panel');
}

Panel.prototype = Object.create(Container.prototype);

function Loader(args){
	var self = this;
	args = args?args:{};
	args.share = 1;
	//args.contentType = 'lines';
	Panel.call(this,args);

	var cont = new Element({
		className:'loader-inner',
		appendTo:self,
	});
	this.message = new Element({
		className:'loader-message',
		appendTo:cont,
	});
	var spinner = new Element({
		className:'spinner',
		//appendTo:cont,
	});
	spinner.e.innerHTML = '<div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div>';

	this.addClass('loader');
}

Loader.prototype = Object.create(Panel.prototype);

Loader.prototype.setMessage = function(message){
	if(typeof message === 'string'){
		this.message.e.innerHTML = message;
	}
};

function Toolbar2(args){
	var self = this;
	args = args || {};
	Element.call(this, {});
}

Toolbar2.prototype = Object.create(Element.prototype);

function Toolbar(args){
	var self = this;
	args = args?args:{};
	args.contentDirection = args.contentDirection || "horizontal";
	Panel.call(this,args);

	this.addClass("toolbar");

	this.left = new Container({
		contentDirection:args.contentDirection,
	});
	this.center = new Container({
		contentDirection:args.contentDirection,
	});
	this.right = new Container({
		contentDirection:args.contentDirection,
	});

	this.moreButton = new Dropdown({
		appendTo:this.right,
		icon:'ellipsis-v'
	});
	this.moreButton.$.hide();

	this.moreContainer = this.moreButton.panel;

	this.right.append(this.moreButton);

	this.element.appendChild(this.left.element);
	this.element.appendChild(this.center.element);
	this.element.appendChild(this.right.element);
}

Toolbar.prototype = Object.create(Panel.prototype);

Toolbar.prototype.append = function(element,align){
	if(element === undefined){
		return;
	}
	else if(align === "right"){
		this.right.append(element);
	}
	else if(align === "center"){
		this.center.append(element);
	}
	else{
		this.left.append(element);
	}
	return this;
}

Toolbar.prototype.addToMore = function(element){
	this.moreContainer.append(element);
	this.moreButton.$.show();
}

function Window(args){
	var self = this;
	args = args?args:{};
	Container.call(this,{
		className:args.className,
		share:args.share,
		maximized:args.maximized,
		hidden:args.hidden,
	});

	this.rolledUp = new Value();

	this.addClass('window');

	this.content = new Container({
		className:"window-content",
		share:1,
	});
	this.body = new Container({
		className:"window-body",
		share:1,
		contentDirection:"horizontal",
		maximized:true,
	});
	//this.verticalScrollContainer = new Container();
	//this.horizontalScrollContainer = new Container();
	this.titleBar = new Toolbar({
		className:"window-titlebar",
		contentDirection:"horizontal",
	});

	this.titleValue = new Value({
		value:args.title,
	});

	this.hideShowButton = new Button({
		//icon:'minus',
		onClick:function(){
			self.rolledUp.set({
				value:!self.rolledUp.get(),
			});
		},
	});

	this.rolledUp.addEventListener('set',function(d){
		if(d.value){
			d.value = true;
		}
		else{
			d.value = false;
		}
	});

	this.rolledUp.addEventListener('change',function(d){
		if(d.value){
			self.maximized.savedValue = self.maximized.get();
			self.maximized.set({
				value:false,
			})
			self.body.$.hide();
			self.hideShowButton.label.setIcon("plus");
		}
		else{
			self.maximized.set({
				value:self.maximized.savedValue == undefined?self.maximized.get():self.maximized.savedValue,
				//value:args
			});
			self.body.$.show();
			self.hideShowButton.label.setIcon("minus");
		}
	});

	this.rolledUp.set({
		value:args.rolledUp,
	});

	this.title = new Label({
		text:self.titleValue.get(),
		icon:args.icon,
	});

	this.titleBar.append(self.title);
	this.titleBar.append(self.hideShowButton,"right");

	if(args.closeable){
		this.closeable();
	}


	this.body.append(this.content)
		//.append(this.verticalScrollContainer);

	this.element.appendChild(this.titleBar.element);
	this.element.appendChild(this.body.element);
	//this.element.appendChild(this.horizontalScrollContainer.element);
}

Window.prototype = Object.create(Container.prototype);

Window.prototype.append = function(element){
	this.content.append(element);
	return this;
}

Window.prototype.closeable = function(){
	var self = this;
	this.closeButton = new Button({
		icon:'times',
		onClick:function(){
			self.element.parentNode.removeChild(self.element);
		}
	});
	this.titleBar.append(this.closeButton,"right");
}


function MessageBox(args){
	var self = this;
	args = args || {};
	//args.className = 'messagebox';
	Panel.call(this, args);
	this.addClass('messagebox');
	this.message = new Element({
	});
	this.append(this.message);
}

MessageBox.prototype = Object.create(Panel.prototype);


MessageBox.prototype.setMessage = function(message){
	this.message.e.innerHTML = message;
}

;
function Base(args){
	args=args?args:{};
	args.tag = args.tag ? args.tag : "div";
	this.container = document.createElement(args.tag);

	this.container.className = "element-container";
	if(args.className){
		this.container.className += " " + args.className;
	}

	/*$(this.container).mousedown(function(e){
		e.stopPropagation();
		e.preventDefault();
		return false;
	})*/
}

// HTML Elements layer

//
Base.prototype.append = function(element){
	this.container.appendChild(element.container);
	return this;
}

Base.prototype.addClass = function(className){
	this.container.classList.add(className);
	return this;
}

Base.prototype.removeClass = function(className){
	this.container.classList.remove(className);
	return this;
}

function Block(args){
	var self = this;
	args = args?args:{};
	Element.call(this,{
		className: "block-container"
	});

}

Block.prototype = Object.create(Element.prototype);

function Control(args){
	var self = this;
	args = args?args:{};
	Element.call(this,args);
	this.addClass('control');
	this.addClass(args.className);
	this.focusingElement = this;

	this.label = new Label({
		text:args.label,
		icon:args.icon,
	});
	this.label.focusing(this);

	this.append(this.label);
}

Control.prototype = Object.create(Element.prototype);

function Button(args){
	var self = this;
	args = args || {};
	Element.call(this, {
		className: args.className,
	});
	this.addClass("clickable button");
	this.focusable();
	if(typeof args.action == "function"){
		this.setAction(args.action);
	}
	else if(typeof args.onClick == "function"){
		this.setAction(args.onClick);
	}
	if(args.icon !== undefined){
		this.appendIcon(args.icon);
	}
	else if(args.iconBefore !== undefined){
		this.append(args.iconBefore);
	}
	args.text = args.text || args.caption || args.label;
	if(args.text !== undefined){
		this.setText(args.text);
	}
	if(args.iconAfter !== undefined){
		this.append(args.iconAfter);
	}
}

Button.prototype = Object.create(Element.prototype);

Button.prototype.appendIcon = function(arg){
	if (arg instanceof Icon){
		this.append(arg);
	}
	else if (arg !== undefined){
		var icon = new SVGIcon(arg);
		this.icon = icon;
		this.append(icon);
		return icon;
	}
}

Button.prototype.setText = function(arg1){
	if (this.text === undefined){
		this.text = new Element({
			tagName:'span',
		});
		this.append(this.text);
	}
	if (typeof arg1 === "string" || typeof arg1 === "number"){
		this.text.e.textContent = arg1;
	}
	else if(arg1 instanceof Value){
		this.text.append(arg1);
	}
}

Button.prototype.setCaption = Button.prototype.setText;

function ToggleButton2(args){
	var self = this;
	args = args?args:{};



	Button.call(this,args);



	this.setAction(function(){
		if (typeof self.value !== "boolean" || self.value === false){
			self.value = true;
		}
		else{
			self.value = false;
		}
	});
	if(typeof args.onOn === "function"){
		this.addEventListener('on', args.onOn);
	}
	if(typeof args.onOff === "function"){
		this.addEventListener('off', args.onOff);
	}

}

ToggleButton2.prototype = Object.create(Button.prototype);

ToggleButton2.prototype.onOn = function(){
	this.addClass('active on');
	this.removeClass('off');
	this.dispatchEvent('on');
}

ToggleButton2.prototype.onOff = function(){
	this.removeClass('active on');
	this.addClass('off');
	this.dispatchEvent('off');
}

ToggleButton2.prototype.setValueCarrier = function(arg){
	var self = this;
	if(arg instanceof BooleanModel){
		this.valueCarrier = arg;
		arg.onChange(function(d){
			if(d.value){
				self.onOn();
			}
			else{
				self.onOff();
			}
		});
	}
}

Object.defineProperty(ToggleButton2.prototype, "value", {
	get: function(){
		var self = this;
		if (self.valueCarrier instanceof BooleanModel){
			return self.valueCarrier.get();
		}
		else{
			return Boolean(self.valueCarrier);
		}
	},
	set: function(val){
		var self = this;
		if (val == this.value){
			return;
		}
		if (typeof val === "boolean"){
			if (self.valueCarrier instanceof BooleanModel){
				self.valueCarrier.setValue(val);
			}
			else{
				self.valueCarrier = val;
				if(val){
					self.onOn();
				}
				else{
					self.onOff();
				}
			}
		}
	}
});

// To be rewritten
function ToggleButton(args){
	var self = this;
	args = args?args:{};
	Button.call(this,args);

	if(args.value instanceof BooleanModel){
		this.value = args.value;
	}
	else{
		this.value = new BooleanModel({
			onOn: function(){
				console.log("on");
				self.removeClass('inactive');
				self.addClass('active');
				if(args.onIcon != undefined){
					self.label.setIcon(args.onIcon);
				}
				if(typeof args.onOn === "function"){
					args.onOn();
				}
			},
			onOff:function(){
				console.log("off");
				self.removeClass('active');
				self.addClass('inactive');
				if(args.offIcon != undefined){
					self.label.setIcon(args.offIcon);
				}
				if(typeof args.onOff === "function"){
					args.onOff();
				}
			},
		});
		this.value.setValue(args.defaultValue == undefined ? false : args.defaultValue);
	}

	/*this.addEventListener('mousedown touchstart',function(e){
		console.log(e.type);
		if(!self.value.get()){
			self.value.true();
			e.preventDefault();
			self.pressed = true;
			//e.stopPropagation();
		}
		else{
			self.pressed = false;
		}
		//self.value.flip();
		//e.preventDefault();
		e.stopPropagation();
	});
	this.addEventListener('mouseup touchend',function(e){
		console.log(e.type);
		if(self.pressed){
			self.pressed = false;
		}
		else{
			self.value.false();
		}
		//self.value.false();
		
		//self.value.flip();
		e.preventDefault();
		e.stopPropagation();
	});*/
	this.setAction(function(){
		self.value.flip();
	});;
}

ToggleButton.prototype = Object.create(Button.prototype);

ToggleButton.prototype.onOn = function(handler){
	this.value.onTrue(handler);
};

ToggleButton.prototype.onOff = function(handler){
	this.value.onFalse(handler);
};

function Dropdown(args, dropdownArgs){
	var self = this;
	var args = args || {};
	Element.call(this,{});
	this.addClass('dropdown-container group');

	dropdownArgs = dropdownArgs || {};
	// this.pointer = new Element({
	// 	className:'dropdown-pointer',
	// 	appendTo:this,
	// });
	// this.pointerBack = new Element({
	// 	className:'dropdown-pointer-back',
	// 	appendTo:this,
	// });
	this.panelContainer = new Container({
		className:'dropdown-panel-container',
		appendTo:this,
	});
	this.panel = new Container(dropdownArgs);
	this.panel.addClass('dropdown');
	this.panelContainer.addEventListener('before-displayed', function(){
		self.panelContainer.e.style.visibility = 'hidden';
		self.panel.e.style.left = '';
		self.panel.e.style.bottom = '';
		self.panelContainer.removeClass('hidden');
		var width = self.panel.e.offsetWidth;
		var screenWidth = window.innerWidth;
		var height = self.panel.e.offsetHeight;
		var screenHeight = window.innerHeight;
		var positionWW; // Position within window
		positionWW = self.panel.positionWithinWindow(); // Temporary
		var offset;


		if (width >= screenWidth){
			if (positionWW === undefined){
				positionWW = self.panel.positionWithinWindow();
			}
			offset = positionWW[0];
			self.panel.e.style.left = (-offset)+"px";
			self.panel.e.style.right = (-offset + screenWidth - width) + "px";
		}
		else{
			var offset = self.panel.positionWithinWindow()[0];
			if (offset > screenWidth / 2){
				self.panel.e.style.left = Math.max(( -width + self.panel.e.offsetParent.offsetWidth), -offset) + "px";
			}
			else if(offset < 0){
				self.panel.e.style.left = (offset) + "px";
			}
		}
		if (height + positionWW[1] >= screenHeight){
			if (positionWW === undefined){
				positionWW = self.panel.positionWithinWindow();
			}
			self.panel.e.style.bottom = (-(screenHeight - positionWW[1])) + "px";
		}
		self.panelContainer.e.style.visibility = 'visible';
		//alert(self.panel.e.offsetLeft);
		//self.hidden.false();
	});
	this.panelDisplayed = this.panelContainer.displayed;
	//this.panelContainer.display = this.panelDisplayed;
	args.style = args.buttonStyle;
	args.value = this.panelDisplayed;
	this.button = new ToggleButton2(args);
	this.button.setValueCarrier(this.panelDisplayed);
	this.panel.on('click', function(e){
		e.stopPropagation();
		e.preventDefault();
	});
	this.panel.on('mousedown', function(e){
		e.stopPropagation();
		//e.preventDefault();
	});
	this.panelContainer.on('displayed', function(){
		self.panel.focus();
	});
	this.button.on('mousedown',function(e){
		e.preventDefault();
		e.stopPropagation();
	})
	this.panel.focusable();
	this.button.on('focusout', function(e){
		if(self.button.value && e.relatedTarget !== self.panel.e && !self.panel.isAncestorOf(e.relatedTarget)){
			self.button.value.false();
		}
	});
	this.panel.on('focusaway',function(e){
		if(e.detail.relatedTarget !== self.button.e){
			self.panelContainer.hide();
		}
		
	});
	this.panelContainer.hide();
	this.append(this.button);
	this.panelContainer.append(this.panel);
}

Dropdown.prototype = Object.create(Element.prototype);

function Toggle(args){
	var self = this;
	args=args?args:{};
	Control.call(this,{
		tagName:"span",
		label:args.label,
		icon:args.icon
	});
	this.addClass('control-toggle toggle');

	if(!args.value){
		this.value = 0;
	}
	else{
		this.value = 1;
	}
	this.toggleElement = new Element({
		className:"toggle-main"
	});
	this.switcher = new Element({
		className:"toggle-switcher"
	});

	this.toggleElement.focusing(this.switcher);
	this.switcher.focusable(args);
	this.switcher.draggable({
		mode:'h',
		minX:0,
		maxX:function(){
			return self.toggleElement.$.width() / 2;
		},
		afterNoMove:function(e){
			self.toggle();
		},
		afterDrag:function(e){
			var pos = self.switcher.$.position().left;
			var limit = self.toggleElement.$.width() / 4;
			if(self.value == 0){
				if(pos > limit){
					self.toggle();
				}
				else{
					self.switcher.$.animate({
						left:0,
					});
				}
			}
			else if(self.value == 1){
				if(pos < limit){
					self.toggle();
				}
				else{
					self.switcher.$.animate({
						left:'50%',
					});
				}
			}
		},
	});
	this.setFocusingElement(this.switcher);
	this.switcher.addClass("toggle-switcher");

	if(this.value == 1){
		this.value = 1;
		this.addClass("on");
		this.switcher.addClass("on");
	}
	else{
		this.value = 0;
		this.addClass("off");
		this.switcher.addClass("off");
	}

	if(args.onToggle){
		this.onToggle = args.onToggle;
	}
	else{
		this.onToggle = function(){};
	}

	this.toggleElement.$element.click(function(){
		self.toggle();
	});

	this.$element.keydown(function(e){
		if(e.which == 13 || e.which == 32){
			self.toggle();
		}
		else if(e.which == 39){
			if(!self.value){
				self.toggle();
			}
		}
		else if(e.which == 37){
			if(self.value){
				self.toggle();
			}
		}
	});

	this.toggleElement.element.appendChild(this.switcher.element);
	this.element.appendChild(this.toggleElement.element);

	//return elem;
}

Toggle.prototype = Object.create(Control.prototype);

Toggle.prototype.on = function(){
	if(this.value == 0){
		this.value = 1;
		this.switcher.$
			.stop()
			.animate({
				left:'50%',
			},'fast')
			.addClass("on")
			.removeClass("off");

		this.addClass("on");
		this.removeClass("off");
	}
	
}

Toggle.prototype.off = function(){
	if(this.value == 1){
		this.value = 0;
		this.switcher.$
			.stop()
			.animate({
				left:'0',
			},'fast')
			.addClass("off")
			.removeClass("on");
		this.addClass("off");
		this.removeClass("on");
	}
	
}

Toggle.prototype.toggle = function(){
	if(this.value == 0){
		this.on();
	}
	else{
		this.off();
	}
	this.onToggle({
		value:this.value,
	});
	
}

function List(args){
	Base.call(this,{
		tag:"ul",
		className:"list",
	});
	args = args?args:{};
	var self = this;


}

List.prototype = Object.create(Base.prototype);

List.prototype.append = function(element){
	var li = document.createElement('li');
	li.appendChild(element.container);
}

function Slider(args){
	var self = this;
	args=args?args:{};
	Control.call(this,{
		tagName:"span",
		label:args.label,
		icon:args.icon
	});
	this.addClass('slider');

	this.start = args.start ? args.start : 0;
	this.end = args.end ? args.end : 100;

	if(!args.value){
		this.value = 0;
	}
	else{
		if(args.value>this.end){
			this.value = this.end;
		}
		else if(args.value<this.start){
			this.value = this.start;
		}
		else{
			this.value = args.value;
		}
	}
	this.sliderContainer = new Element({
		tagName:"span",
		className:"slider-container"
	});

	this.sliderLine = new Element({
		tagName:"span",
		className:"slider-line"
	});

	this.sliderButton = new Element({
		tagName:"span",
		className:"slider-button"
	});

	this.sliderProgress = new Element({
		tagName:"span",
		className:"slider-progress"
	});

	if(args.tabIndex){
		this.sliderButton.element.setAttribute('tabindex',args.tabIndex);
	}
	else{
		this.sliderButton.element.setAttribute('tabindex','-1');
	}

	this.sliderButton.$element.keydown(function(e){
		if(e.which == 39){
			self.increaseBy((self.end - self.start) / 20);
		}
		else if(e.which == 37){
			self.increaseBy( - (self.end - self.start) / 20);
		}
	});

	this.label.$element.click(function(){
		self.sliderButton.$element.focus();
	});
	this.label.$element.mousedown(function(){
		return false;
	});

	this.progressValue = 0;

	var pressed = false;
	var initialMousePosition;
	var savedPosition;

	var savedMouseUp;
	var savedMouseMove;

	this.sliderButton.$element.mousedown(function(e){
		if(e.which == 1){
			self.sliderButton.$element.focus();
			self.sliderButton.element.classList.add('active');
			pressed = true;
			initialMousePosition = e.pageX;
			savedPosition = self.sliderButton.$element.position().left;

			$(document).bind('mouseup',function(e){
				if(e.which == 1){
					self.sliderButton.element.classList.remove('active');
					pressed = false;
					if(args.onChanged){
						args.onChanged({
							progress:self.progressValue,
							value:self.getValue(),
						});
					}
					$(document).unbind('mouseup');
					$(document).unbind('mousemove');
				}
				return false;
			});

			$(document).bind('mousemove',function(e){
				if(pressed){
					var shift = e.pageX - initialMousePosition;
					var newPosition = savedPosition + shift;
					if(newPosition < -5){
						newPosition = -5;
					}
					else if(newPosition >= self.sliderContainer.$element.width()-6){
						newPosition = self.sliderContainer.$element.width() - 6;
					}
					self.progressValue = 100 * (newPosition +5) / (self.sliderContainer.$element.width() - 1);
					self.sliderButton.$element.css({left:newPosition + "px"});
					self.sliderProgress.$element.css({width:newPosition + "px"});
					if(args.onChange){
						args.onChange({
							progress:self.progressValue,
							value:self.getValue(),
						});
					}
			
				}
				return false;
			});

		}
		return false;
	});

	if(args.onChange){
		this.onChange = args.onChange;
	}
	else{
		this.onChange = function(){};
	}

	if(args.onChanged){
		this.onChanged = args.onChanged;
	}
	else{
		this.onChanged = function(){};
	}

	this.sliderContainer.$element.mousedown(function(){
		return false;
	});

	this.sliderContainer.$element.click(function(e){
		self.sliderButton.$element.focus();
		var newPosition = e.pageX - self.sliderContainer.$element.offset().left;
		if(newPosition <0){
			newPosition = 0;
		}
		else if(newPosition >= self.sliderContainer.$element.width()){
			newPosition = self.sliderContainer.$element.width() - 6;
		}
		self.progressValue = 100 * (newPosition) / (self.sliderContainer.$element.width() - 1);
		self.setValueByProgress(self.progressValue/100);
		return false;
	});

	this.element.appendChild(this.label.element);
	this.element.appendChild(this.sliderContainer.element);
	this.sliderContainer.element.appendChild(this.sliderLine.element);
	this.sliderContainer.element.appendChild(this.sliderProgress.element);
	this.sliderContainer.element.appendChild(this.sliderButton.element);
}

Slider.prototype = Object.create(Control.prototype);

Slider.prototype.increaseBy=function(val){
	var newValue = this.value + val;
	if(newValue>this.end){
		newValue = this.end;
	}
	else if(newValue<this.start){
		newValue = this.start;
	}
	if(this.value !== newValue){
		this.setValue(newValue);
	}
}

Slider.prototype.setValue = function(val){
	this.value = val;
	var newProgress = val / (this.end - this.start);
	var newPosition = newProgress * (this.sliderContainer.$element.width() - 1);
	this.sliderButton.$element.stop().animate({left:newPosition - 5},'fast');
	this.sliderProgress.$element.stop().animate({width:newPosition - 5},'fast');
	this.onChange({
		progress:newProgress,
		value:val,
	});
	this.onChanged({
		progress:newProgress,
		value:val,
	});
}

Slider.prototype.setValueByProgress = function(progress){
	var newValue = progress * (this.end - this.start);
	if(newValue>this.end){
		newValue = this.end;
	}
	else if(newValue<this.start){
		newValue = this.start;
	}
	this.setValue(newValue);
}

Slider.prototype.getProgress = function(){
	return $(sliderButton).position;
}

Slider.prototype.getValue = function(){
	return this.start + (this.progressValue * 1.0 * (this.end - this.start) / 100)
}

Slider.prototype.setPosition = function(newPosition){

}

function Txt(args){
	var elem=document.createElement('span');
	args=args?args:{};

	elem.innerHTML=args.value?args.value:"Some text.";

	if(args.className){
		elem.classList.add(args.className);
	}

	this.setValue=function(value){
		elem.innerHTML=value;
	};

	this.getElement=function(){
		return elem;
	}

	//return elem;

};


function TextInput(args){
	var self = this;
	args=args?args:{};
	Control.call(this,{
		label:args.label,
		icon:args.icon
	});
	this.addClass('control control-text-input');
	this.addClass('text-input');

	/*if(!args.value){
		this.value = '';
	}
	else{
		this.value = args.value;
	}*/

	this.input = new TextInputCore({
		value:args.value,
		onChange:args.onChange,
	});
	this.value = this.input.value;
	this.setFocusingElement(this.input);

	this.input.addClass("text-input-input");

	this.input.addEventListener('keydown',function(e){
		if(e.which == 13){
			if(args.onEnter){
				args.onEnter({
					value:self.input.$element.val(),
				});
			}
		}
	});

	this.append(this.input);
}

TextInput.prototype = Object.create(Control.prototype);

TextInput.prototype.addButton = function(args){
	var button = new Button(args);
	this.append(button);
	return button;
}

function Span(args){
	args=args?args:{};
	args.className = "span inline";
	Base.call(this,args);
	var self = this;

	if(args.value){
		this.container.innerHTML = args.value;
	}


}

/*
 Dont like it.
 Requires optimization.
 Dropdown list need to be abstracted.
*/

function Checkbox(args){
	var self = this;
	args = args || {};
	args.tagName = 'input';
	Element.call(this, args);
	this.attr('type', 'checkbox');
	this.addClass('checkbox');
	//this.addClass()
}

Checkbox.prototype = Object.create(Element.prototype);

function RadioButton(args){
	var self = this;
	args = args || {};
	args.tagName = 'input';
	Element.call(this, args);
	this.attr('type', 'radio');
	this.addClass('radio');
	//this.addClass()
}

RadioButton.prototype = Object.create(Element.prototype);

function Select(args){
	var self = this;
	args=args?args:{};
	Control.call(this,{
		label:args.label,
		icon:args.icon
	});
	this.addClass('control control-select');
	this.addClass('select');

	this.button = new Button({
		tabIndex:args.tabIndex,
		//label:"",
		icon:"caret-down",
	});
	this.button.addClass('select-button');
	this.focusingElement = this.button.focusingElement;
	this.selectContainer = new Element({
		tagName:"div",
		className:"select-container",
	});

	this.optionsContainer = new Element({
		tagName:"div",
		className:"select-options",
	});
	this.selectedSpan = new Element({
		tagName:"span",
		className:"select-current",
	});

	this.active = false;
	this.flag = 0;

	this.button.addEventListener('mousedown',function(){
		self.flag = 4;
	});

	this.button.$element.click(function(){
		if(self.active){
			self.fold();
			self.button.focus();
		}
		else{
			self.show();
			self.optionsContainer.$element.find('.select-option.focused').focus();
			self.flag = 3;
		}
		return false;
	});

	this.button.$element.keydown(function(e){
		if(e.which == 13 || e.which == 32){
			if(self.active){
				self.fold();
			}
			else{
				self.show();
				self.optionsContainer.$element.find('.select-option.focused').focus();
				self.flag = 3;
			}
			return false;
		}
		else if(e.which == 38){
			//self.optionUp();
		}
		else if(e.which == 40){
			self.show();
			self.optionsContainer.$element.find('.select-option.focused').focus();
			self.flag = 3;
			//self.optionDown();
		}
	});

	this.selectedSpan.$element.mousedown(function(){
		return false;
	});

	this.selectedSpan.$element.click(function(){
		if(self.active){
			self.fold();
			self.button.focus();
		}
		else{
			self.show();
			self.optionsContainer.$element.find('.select-option.focused').focus();
			self.flag = 3;
		}
		return false;
	})

	this.onChange = function(args2){
		if(args.onChange){
			args.onChange(args2);
		}
	}

	this.selectContainer.element.appendChild(this.selectedSpan.element);
	this.selectContainer.element.appendChild(this.optionsContainer.element);
	this.element.appendChild(this.label.element);
	this.element.appendChild(this.selectContainer.element);
	this.element.appendChild(this.button.element);
}

Select.prototype = Object.create(Control.prototype);

Select.prototype.show = function(){
	var self=this;
	self.active = true;
	this.button.label.setIcon('caret-up');
	this.optionsContainer.$element.stop()
		//.width($(self.container).outerWidth())
		//.slideDown('fast');
		.css({
			visibility:'visible'
		})
		.animate({
			opacity:1,
		},'fast');
	self.button.addClass('active');
};

Select.prototype.fold = function(){
	var self=this;
	self.active = false;
	this.button.label.setIcon('caret-down');
	this.optionsContainer.$element.stop()
		//.slideUp('fast');
		.animate({
			opacity:0,
		},'fast',function(){
			$(this).css({
				visibility:'hidden',
			});
		});
	self.button.removeClass('active');
};

Select.prototype.setSelectedValue = function(value){
	this.selectedSpan.container.innerHTML = value;
}

Select.prototype.addOption = function(value, select){
	var self = this;
	var optionContainer = document.createElement('div');
	optionContainer.className = "select-option";
	optionContainer.setAttribute('tabindex','-1');
	optionContainer.innerHTML = value;
	$(optionContainer).mousedown(function(){
		return false;
	});
	$(optionContainer).click(function(){
		if(self.selectedOptionElement)
			self.selectedOptionElement.classList.remove('focused');
		this.classList.add('focused');
		self.selectedOptionElement = this;
		self.fold();
		self.button.focus();
		self.setSelectedValue(this.innerHTML);
		self.onChange({
			value: this.innerHTML,
		});
	});

	$(optionContainer).blur(function(){
		if(self.flag==4){
			return false;
		}
		else{
			self.fold();
		}
	});
	$(optionContainer).keydown(function(e){
		if(e.which == 40){
			var next = self.optionsContainer.$element.find('.select-option.focused').next();
			if(next.length > 0){
				self.flag = 4;
				optionContainer.classList.remove('focused');
				next[0].classList.add('focused');
				next.focus();
				self.flag = 3;
			}
		}
		else if(e.which == 38){
			var prev = self.optionsContainer.$element.find('.select-option.focused').prev();
			if(prev.length > 0){
				self.flag = 4;
				optionContainer.classList.remove('focused');
				prev[0].classList.add('focused');
				prev.focus();
				self.flag = 3;
			}
			else{
				self.fold();
				self.button.focus();
			}
		}
		else if(e.which == 27 || e.which == 8){
			self.fold();
			self.button.focus();
		}
		else if(e.which == 13){
			if(self.selectedOptionElement)
				self.selectedOptionElement.classList.remove('focused');
			this.classList.add('focused');
			self.selectedOptionElement = this;
			self.fold();
			self.button.focus();
			//self.fold();
			self.setSelectedValue(this.innerHTML);
			self.onChange({
				value: this.innerHTML,
			});
		}
		return false;
	});
	if(select){
		if(self.selectedOptionElement)
			self.selectedOptionElement.classList.remove('focused');
		optionContainer.classList.add('focused');
		self.selectedOptionElement = optionContainer;
		self.setSelectedValue(value);
	}
	//optionContainer.setAttribute('value',value);
	this.optionsContainer.element.appendChild(optionContainer);
	return this;

};

function Icon(arg1){
	var self = this;
	var args;
	if (typeof arg1 === "string"){
		args = {};
		args.icon = arg1;
	}
	else if (typeof arg1 === "object"){
		args = arg1;
	}
	else{
		args = {};
	}

	args.tagName = 'i';
	args.className = 'fa icon';
	Element.call(this, args);
	this.set(args.icon);
}

Icon.prototype = Object.create(Element.prototype);

Icon.prototype.set = function(arg1){
	if (typeof arg1 === "string"){
		this.removeClass('fa-' + this.icon);
		this.icon = arg1;
		this.addClass('fa-' + arg1);
	}
}

function SegmentedControl(args){
	args=args?args:{};
	Element.call(this,args);
	this.addClass("segmented-control group");
	var self = this;
}

SegmentedControl.prototype = Object.create(Element.prototype);

function Menu(args){
	var self = this;
	args = args?args:{};
	Element.call(this,{
		className:'menu'
	});


}

Menu.prototype = Object.create(Element.prototype);

Menu.prototype.append = function(obj){
	this.element.appendChild(obj.element);
}

function Frames(args){
	Base.call(this,{
		className:"frames",
	});
	args = args?args:{};
	var self = this;



}

function text(text){
	return new Text(text || '');
}

function span(text, className, appendTo){
	var out = new Element({
		tagName:'span',
	});
	if(typeof className === 'string'){
		out.addClass(className);
	}
	out.append(text);
	
	return out;
}

function e(tag, className, appendTo){
	if (arguments.length == 0){
		return new Element();
	}
	else if(arguments.length == 1){
		if (typeof tag == "string"){
			return new Element({
				tagName:tag,
			})
		}
	}
	else if(arguments.length == 2){
		if (typeof tag == "string"){
			if (typeof className == "string"){
				return new Element({
					tagName:tag,
					className:className,
				});
			}
			else if(className instanceof Element){
				return new Element({
					tagName:tag,
					appendTo:className,
				});
			}
			
		}
	}
	else{
		if (typeof tag == "string"){
			return new Element({
				tagName:tag,
				className:className,
				appendTo:appendTo,
			})
		}
	}
}

function lines(className, appendTo){
	if (arguments.length == 1){
		if (typeof className === "string"){
			return new Element({
				className:'lines '+className,
			});
		}
		else if (className instanceof Element){
			return new Element({
				appendTo:className,
			});
		}
	}
	else if (arguments.length == 2){
		new Element({
			className:'lines '+className,
			appendTo:appendTo,
		});
	}
	else if (arguments.length == 0){
		return new Element({
			className:'lines',
		});
	}
}

function Rows(args){
	Element.call(this, args);
	this.addClass('rows');
}

Rows.prototype = Object.create(Element.prototype);

function Columns(args){
	Element.call(this, args);
	this.addClass('columns');
}

Columns.prototype = Object.create(Element.prototype);

function Lines(args){
	Element.call(this, args);
	this.addClass('lines');
}

Lines.prototype = Object.create(Element.prototype);

function Bar(args){
  var self = this;
  args = args || {};
  Element.call(this,args);
  this.addClass('bar');
}

Bar.prototype = Object.create(Element.prototype);

function StandardWindow(args, toobarArgs, bodyArgs){
	var self = this;
	args = args || {};
	Container.call(this, args);
	this.addClass('standard-window');
	//this.addClass(args.className);

	this.toolbar = new Toolbar({
		className:'standard-window-toolbar'
	});
	this.body = new Container({
		share:1,
		className:'standard-window-body'
	});
	this.color = args.color || args.toolbarStyle || "gray";
	this.body.addClass(args.bodyStyle);
	this.toolbar.addClass(this.color);
	Container.prototype.append.call(this, this.toolbar);
	Container.prototype.append.call(this, this.body);
}

StandardWindow.prototype = Object.create(Container.prototype);

StandardWindow.prototype.append = function(arg1){
	this.body.append(arg1);
}
;
function Containers(args){
	var self = this;
	args = args?args:{};
	Container.call(this,args);
	this.addClass('containers');
	this.activeUnmaximizedContainers = [];
	this.containers = [];
	this.topZIndex = 200;
	this.activeContainer;
	this.activeMaximizedContainer = this.activeContainer;
}

Containers.prototype = Object.create(Container.prototype);

Containers.prototype.append = function(container){
	var self = this;
	var displayType;
	if (!(container instanceof Container)){
		return;
	}
	if (1 || container.displayType === undefined){
		container.setDisplayType('maximized');
	}
	/*if(['maximized', 'unmaximized', 'unmaximized-pinned'].indexOf(container.displayType.get()) == -1){
		container.displayType.setValue('maximized');
		displayType = 'maximized';
	}
	else{
		displayType = container.displayType.get();
	}

	if(displayType === 'unmaximized' || displayType === 'unmaximized-pinned'){
		if(typeof this.activeUnmaximizedContainers === 'undefined'){
			this.activeUnmaximizedContainers = [];
			this.topZIndex = 200;
		}
		this.activeUnmaximizedContainers.push(container);

	}

	if(this.activeContainer == undefined){
		this.switchTo(container);
	}
	else{
		container.hide();
	}

	container.parent = this;
	if(typeof container.windowMode === 'undefined'){
		container.windowMode = 'extended';
	}
	if(container.windowMode === 'unmaximized'){

	}
	else{
		this.containers.push(container);
		if(this.containers.length == 1){
			this.switchTo(container);
		}
		else{
			container.hide();
		}
	}*/
	this.containers.push(container);
	container.e.style.visibility = "none";

	Container.prototype.append.call(this, container);
	if(this.activeContainer == undefined){
		//container.e.style.visibility = "";
		this.switchTo(container);
	}
	else{
		container.hide();
	}
	container.e.style.visibility = "";
	/*container.on('closed',function(){
		var i = self.containers.indexOf(container);
		self.containers.splice(i,1);
		if(self.activeContainer == container){
			if(i == 0){
				if(self.containers.length > 0){
					self.switchTo(self.containers[0]);
				}
			}
			else{
				self.switchTo(self.containers[i-1]);
			}
		}
		container.removeEventListener
	});*/
	this.dispatchEvent('container-added', {
		container:container,
	});
};

Containers.prototype.remove = function(container){
	var i = this.containers.indexOf(container);
	if(i != -1){
		if(this.activeContainer == container){
			if(i == 0){
				if(this.containers.length > 0){
					this.switchTo(this.containers[0]);
				}
			}
			else{
				this.switchTo(this.containers[i-1]);
			}
		}
		//this.element.removeChild(container.element);
		container.close();
		this.containers.splice(i, 1);
	}
};

Containers.prototype.getHandleFor = function(container, handleArgs){
	var self = this;
	var handle = new Element(handleArgs);
	handle.addClass('container-handle white');
	if(container.title === undefined){
		container.title = "Tab";
	}

	handle.append(new Label({
		text:container.title,
	}));
	if(container.hidden.get()){
		handle.addClass('inactive');
	}
	else{
		handle.addClass('active');
	}
	/*container.hidden.onTrue(function(){
		handle.addClass('inactive');
		handle.removeClass('active');
	});
	container.hidden.onFalse(function(){
		handle.addClass('active');
		handle.removeClass('inactive');
	});*/
	container.on('activated', function(){
		handle.addClass('active');
		handle.removeClass('inactive');
	});
	container.on('deactivated', function(){
		handle.addClass('inactive');
		handle.removeClass('active');
	});
	container.on('closed',function(){
		handle.close();
	});
	container.displayType.onChange(function(d){
		if(d.value === 'maximized'){
			handle.addClass('tab');
		}
		else if(d.value === 'unmaximized-pinned'){
			handle.addClass('pinned');
		}
		if(d.oldValue === 'maximized'){
			handle.removeClass('tab');
		}
		else if(d.oldValue === 'unmaximized-pinned'){
			handle.removeClass('pinned');
		}
	});
	handle.on('contextmenu', function(e){
		//e.stopPropagation();
		e.preventDefault();
	});
	handle.on('mousedown', function(e){
		//e.stopPropagation();
		handle.savedPos = e.pageY;
		handle.pressed = true;
		handle.moved = false;
		e.preventDefault();
		handle.wasActive = container.parent.activeContainer == container;
		var onMouseMove = function(e){
			if(handle.pressed){
				handle.moved = true;
				var shift = e.pageY - handle.savedPos;
				var displayType = container.displayType.value;
				if(displayType === 'unmaximized'){
					if(shift >=5){
						container.displayType.setValue('maximized');
						console.log('Maximized');
						handle.savedPos = handle.savedPos + 5;
					}else if(shift <= -5){
						container.displayType.setValue('unmaximized-pinned');
						console.log('Pinned');
						handle.savedPos = handle.savedPos - 5;
					}
				}
				else if(displayType === 'unmaximized-pinned'){
					if(shift >= 5){
						container.displayType.setValue('unmaximized');
						console.log('Unpinned');
						handle.savedPos = handle.savedPos + 5;
					}
				}
				else if(displayType === 'maximized'){
					if(shift <= -5){
						container.displayType.setValue('unmaximized');
						console.log('Unmaximized');
						handle.savedPos = handle.savedPos - 5;
					}
				}
				e.preventDefault();
			}
		};
		var onMouseUp = function(e){
			handle.pressed = false;
			document.removeEventListener(onMouseMove);
			document.removeEventListener(onMouseUp);
			if(!handle.moved && handle.wasActive){
				if(container.parent.activeContainer == container){
					if(container.displayType.value !== 'maximized'){
						//container
						container.parent.switchTo();
						container.hide();
					}
				}
				else{
					//self.switchTo(container);
					container.hide();
				}
			}
		};
		document.addEventListener('mousemove',onMouseMove);
		document.addEventListener('mouseup',onMouseUp);
	});
	
	handle.$.on('mousedown', function(e){
		handle.moved = false;
		if(e.which === 1){
			if(container.parent.activeContainer == container){
				//if(container.displayType.value !== 'maximized'){
				//	//container
				//	container.parent.switchTo();
				//	container.hide();
				//}
			}
			else{
				self.switchTo(container);
			}
		}
		else if(e.which === 2){
			if(container.parent.activeContainer == container){
				if(container.displayType.value !== 'maximized'){
					//container
					container.parent.switchTo();
					container.hide();
				}
			}
			else{
				//self.switchTo(container);
				container.hide();
			}
		}
		
		
		//container.show();
	});
	container.on('topped', function(){
		handle.addClass('topped');
	});
	container.on('untopped', function(){
		handle.removeClass('topped');
	});
	if(container.closeable){
		handle.append(new Button({
			icon:'times',
			className:'tab-close red quiet',
			onClick:function(){
				self.remove(container);
			},
		}));
	}
	if(container.displayType.get() === 'maximized'){
		handle.addClass('tab');
	}
	else if(container.displayType.get() === 'unmaximized-pinned'){
		handle.addClass('pinned');
	}
	
	container.handle = handle;
	return handle;
};

Containers.onContainerClosed = function(){};

Containers.prototype.appendAndShow = function(container){
	this.append(container);
	this.switchTo(container);
};

Containers.prototype.switchTo = function(container, transition){
	transition = transition || 'fade';
	if(container === this.activeContainer){
		return;
	}
	else if(typeof container === 'undefined'){
		if(typeof this.activeContainer !== 'undefined'){
			this.activeContainer.hide();
			this.activeContainer.dispatchEvent('deactivated');
			this.activeContainer = undefined;
		}
		return;
		
	}
	/*
	else if(container instanceof Container){
		var displayType = container.displayType.get();
		this.previousContainer = this.activeContainer;
		if(displayType === 'maximized'){
			//this.previousMaximized
			if(typeof this.activeContainer !== 'undefined'){
				this.activeContainer.dispatchEvent('deactivated');
				for (var i in this.activeUnmaximizedContainers){
					if(this.activeUnmaximizedContainers[i].displayType.value !== 'unmaximized-pinned'){
						this.activeUnmaximizedContainers[i].hide();
					}
					
				}
				if(this.activeContainer.displayType.value !== 'unmaximized-pinned'){
					this.activeContainer.hide();
				}
				
			}
			if(this.displayedMaximized != container && this.displayedMaximized != undefined){
				this.previousMaximized = this.displayedMaximized;
				this.displayedMaximized.hide();
			}
			this.activeContainer = container;
			this.displayedMaximized = container;
			container.dispatchEvent('activated');
			container.show();
		}
		else if(displayType === 'unmaximized' || displayType === 'unmaximized-pinned'){
			if(typeof this.activeContainer !== 'undefined'){
				this.activeContainer.dispatchEvent('deactivated');
			}
			
			//this.activeContainer.hide();
			this.activeContainer = container;
			container.dispatchEvent('activated');
			container.e.style.zIndex = this.topZIndex + 1;
			this.topZIndex += 1;
			container.show();

		}else if(displayType ==='unmaximized-pinned'){

		}
	}
	*/

	if(this.e.contains(container.e)){
		var previousActive = this.activeContainer;
		
		this.activeContainer = container;
		container.e.style.zIndex = this.topZIndex + 1;
		this.topZIndex += 1;
		container.e.style.opacity = 0;
		container.show();
		container.$.animate({
			opacity:1,
		}, 40, function(){
			container.dispatchEvent('activated');
			if(previousActive instanceof Container){
				previousActive.dispatchEvent('deactivated');
				previousActive.hide();
			}
		});
		/*container.show();
		container.dispatchEvent('activated');
		if(previousActive instanceof Container){
			previousActive.dispatchEvent('deactivated');
			previousActive.hide();
		}*/
		
		
	}

	/*var i = this.containers.indexOf(container);
	if(i != -1){
		if(this.activeContainer != undefined){
			//this.activeContainer.e.style.position = 'absolute';
			this.activeContainer.$.css({
				position:'absolute',
				top:0,
				bottom:0,
				right:0,
				left:0,
			});
			//this.activeContainer.hide();
		}
		container.show();
		if(this.activeContainer != undefined){
			this.activeContainer.hide();
			this.activeContainer.e.style.position = '';
		}
		this.activeContainer = container;
	}
	else{
		container.show();
	}*/
}

Containers.prototype.fadeTo = function(args){
	if(args instanceof Element){
		args = {
			container:args,
		}
	}
	var container = args.container;
	var replacedContainer;
	var direction;
	if(this.containers.indexOf(container) == -1){
		return;
	}
	if(args.replacedContainer == undefined){
		replacedContainer = this.activeContainer;
	}
	else{
		replacedContainer = args.replacedContainer;
	}
	this.activeContainer = container;
	if(this.fading){
		return;
	}
	else{
		this.fading = true;
	}
	var self = this;

	replacedContainer.$.css({
		height:replacedContainer.$.height(),
		width:replacedContainer.$.width(),
		position:'absolute',
		opacity:1,
		'z-index':100,
		top:0,
		left:0,
	});
	container.$.css({
		//opacity:0,
	});
	container.show();

	var done1 = function(){
		replacedContainer.hide();
		replacedContainer.$.css({
			height:'',
			right:'',
			left:'',
			opacity:'',
			'z-index':'',
			width:'',
			position:'',
		});
		self.fading = false;

		if(self.activeContainer != container){
			self.fadeTo(self.activeContainer);
		}
	};

	var done2 = function(){
		replacedContainer.hide();
		/*container.$.css({
			opacity:'',
		});*/

		self.fading = false;
		//container.show();
		if(self.activeContainer != container){
			self.fadeTo(self.activeContainer);
		}
	};
	replacedContainer.$.animate({
		opacity:'0',
	}, 40,done1);
	/*container.$.animate({
		opacity:'1',
	}, 'fast',done2);*/
}


Containers.prototype.slideTo = function(args, direction){
	if(args instanceof Element){
		args = {
			container:args,
			direction:direction,
		}
	}
	this.switchTo(args.container);
	return;
	var container = args.container;
	var replacedContainer;
	var direction;
	if(this.containers.indexOf(container) == -1){
		return;
	}
	if(args.replacedContainer == undefined){
		replacedContainer = this.activeContainer;
	}
	else{
		replacedContainer = args.replacedContainer;
	}
	if(args.direction == undefined){
		direction = 'left';
	}
	else{
		direction = args.direction;
	}
	this.activeContainer = container;
	if(this.sliding){
		return;
	}
	else{
		this.sliding = true;
	}
	var self = this;

	replacedContainer.$.css({
		height:replacedContainer.$.height(),
		width:replacedContainer.$.width(),
		position:'absolute',
		top:0,
		left:0,
	});
	this.$.css({
		overflow:'hidden',
	});
	if(direction == 'left'){
		container.$.css({
			left:'100%',
		});
	}
	else if(direction == 'right'){
		container.$.css({
			right:'100%',
		});
	}
	container.show();

	var done1 = function(){
		replacedContainer.$.css({
			height:'',
			right:'',
			left:'',
			//overflow:'',
			width:'',
			position:'',
		});
	};

	var done2 = function(){
		replacedContainer.hide();
		container.$.css({
			left:'',
			right:'',
		});

		self.sliding = false;
		container.show();
		if(self.activeContainer != container){
			self.slideTo(self.activeContainer, container);
		}
		self.$.css({
			overflow:'',
		});
	};

	if(direction == 'left'){
		replacedContainer.$.animate({
			right:'100%',
		}, 'fast',done1);
		container.$.animate({
			left:0,
		}, 'fast',done2);
	}
	else if(direction == 'right'){
		replacedContainer.$.animate({
			left:'100%',
		}, 'fast', done1);
		container.$.animate({
			right:0,
		}, 'fast', done2);
	}

	


}

Containers.prototype.getNext = function(){
	if(this.containers.length > 1){
		var i = this.containers.indexOf(this.activeContainer);
		if(i+1 == this.containers.length){
			return this.containers[0];
		}
		else{
			return this.containers[i+1];
		}
	}
	else{
		return undefined;
	}
}

Containers.prototype.next = function(){
	if(this.containers.length > 1){
		var i = this.containers.indexOf(this.activeContainer);
		if(i+1 == this.containers.length){
			this.switchTo(this.containers[0]);
		}
		else{
			this.switchTo(this.containers[i+1]);
		}
	}
	
}

Containers.prototype.prev = function(){
	if(this.containers.length > 1){
		var i = this.containers.indexOf(this.activeContainer);
		if(i == 0){
			this.switchTo(this.containers[this.containers.length - 1]);
		}
		else{
			this.switchTo(this.containers[i-1]);
		}
	}
	
}

Containers.prototype.withLoader = function(){
	this.loader = new Loader();
	this.append(this.loader);
};

Containers.prototype.startLoader = function(){
	//this.switchTo(this.loader);
	//this.locked = true;
	if(this.loader == undefined){
		this.withLoader();
	}
	this.switchTo(this.loader);
};

Containers.prototype.stopLoader = function(){
	this.switchTo(this.main);
};

;
function TabView(args, tabsArgs, bodyArgs){
	var self = this;
	args=args?args:{};
	tabsArgs = tabsArgs || {};
	bodyArgs = bodyArgs || {};
	Container.call(this,{
		contentDirection:args.direction,
		contentType:'blocks',
	});
	this.addClass('tab-view');

	this.tabs = new Toolbar(tabsArgs);

	bodyArgs.share = 1;
	//bodyArgs.contentType

	this.bodies = new Windows(bodyArgs);
	//this.tabs = [];
	this.activeTab;

	this.tabs.addClass('tab-view-tabs');
	this.bodies.addClass('tab-view-bodies');


	Container.prototype.append.call(this, this.tabs);
	Container.prototype.append.call(this, this.bodies);

}

TabView.prototype = Object.create(Container.prototype);

TabView.prototype.append = function(container, handleArgs){
	this.bodies.append(container);
	if(handleArgs === undefined){
		handleArgs = {};
	}
	else if (typeof handleArgs === "string"){
		handleArgs = {
			text:handleArgs,
		};
	}
	container.tabViewHandle = container.getHandle({
		color: container.color || handleArgs.color,
		closeable: container.closeable || handleArgs.closeable,
		text: container.title || handleArgs.title || handleArgs.text,
	});
	this.tabs.append(container.tabViewHandle);
}


function AccordionView(args){
	var self = this;
	args=args?args:{};
	Container.call(this,{
		contentDirection:args.direction,
		contentType:'blocks',
		share:args.share,
	});
	this.addClass('accordion-view');

	this.items = [];
	this.activeItem;

	this.addItem = function(newTabArgs){
		newTabArgs = newTabArgs || {};
		var item = {};
		this.items.push(item);
		item.tabElement = new Container();
		item.documentElement = new Container({
			share:1,
		});
		item.label = new Value();

		item.tabElement.addClass('accordion-view-tab');
		item.documentElement.addClass('accordion-view-document');

		item.tabElement.addEventListener('click',function(){
			item.toggle();
		});

		item.label.addEventListener('change',function(data){
			item.tabElement.element.innerHTML = data.value;
		});

		item.label.set({
			value:newTabArgs.label || '',
		})

		self.append(item.tabElement);
		self.append(item.documentElement);

		item.toggle = function(){
			if(self.activeItem == item){
				item.hide();
			}
			else{
				item.show();
			}
		}

		item.hide = function(){
			self.activeItem = undefined;
			item.tabElement.element.classList.remove('active');
			item.documentElement.$.hide();
		}

		item.show = function(){
			if(self.activeItem !== undefined){
				self.activeItem.hide();
			}
			self.activeItem = item;
			item.tabElement.element.classList.add('active');
			item.documentElement.$.show();
		}

		if(newTabArgs.activate == true){
			item.show();
		}

		if(typeof newTabArgs.ready == "function"){
			newTabArgs.ready(item);
		}

		return item;
	};
}

AccordionView.prototype = Object.create(Container.prototype);

/*AccordionView.prototype.append = function(newWindow){
	this.windows.push(newWindow);
}*/


function Windows(args){
	var self = this;
	args = args?args:{};
	Container.call(this,args);
	this.addClass('windows');
	this.windows = [];
	this.topZIndex = 200;
	this.active;
	this.activeWindows = [];
	this.activeFloatingWindows = [];
	this.history = [];
}

Windows.prototype = Object.create(Container.prototype);

Windows.prototype.append = function(container){
	var self = this;
	var displayType;
	container.hide();
	container.prepareForViewData({
		width: this.e.offsetWidth,
		height: this.e.offsetHeight,
	});
	if (container.maximized === undefined){
		container.maximize();
	}
	if(container.windowMode === undefined){
		container.setWindowMode('maximized');
	}
	if(container.windowMode === "floating"){

	}
	container.e.style.visibility = "hidden";
	container.focusable();
	Container.prototype.append.call(this, container);
	if(this.activeContainer == undefined){
		//container.e.style.visibility = "";
		this.switchTo(container);
	}
	else{
		container.hide();
	}
	container.on('focusin', function(){
		self.switchTo(container);
	});
	container.e.style.visibility = "";
	this.dispatchEvent('container-added', {
		container:container,
	});
};

Windows.prototype.remove = function(arg1){
	if(this.isParentOf(arg1)){
		if(arg1.maximized && arg1 === this.activeContainer){
			var prev = this.history.pop();
			while(prev === arg1 || !this.isParentOf(prev)){
				prev = this.history.pop();
				if (prev === undefined){
					break;
				}
			}
			this.switchTo(prev,function(){
				arg1.close();
			});
		}
		else{
			arg1.close();
		}
	}
}

Windows.prototype.appendAndShow = function(container){
	this.append(container);
	this.switchTo(container);
};

Windows.prototype.switchTo = function(wind, done){
	var self = this;
	if (wind === this.activeContainer ){
		return;
	}
	else if(wind === undefined){
		var previousActive = this.activeContainer;
		if (typeof done == "function"){
			done();
		}
	}
	else if (this.isParentOf(wind)){
		if (wind.windowMode === "maximized"){
			var previousActive = this.activeContainer;
			var previousMaximized = this.currentMaximized;
			this.activeContainer = wind;
			this.currentMaximized = wind;
			wind.e.style.zIndex = this.topZIndex + 1;
			this.topZIndex += 1;
			//wind.e.style.opacity = 0;
			wind.show();
			wind.focus();
			this.history.push(wind);
			wind.e.style.opacity = 1;
			wind.$.animate({
				opacity:1,
			}, 1, function(){
				wind.removeClass('inactive');
				wind.dispatchEvent('activated');
				self.activeWindows.forEach(function(w){
					if(w !== wind){
						w.dispatchEvent('deactivated');
						w.addClass('inactive');
						w.hide();
					}
					
				});
				self.activeWindows = [];
				self.activeFloatingWindows = [];
				self.activeWindows.push(wind);
				if(previousActive !== undefined){
					previousActive.dispatchEvent('deactivated');
					previousActive.addClass('inactive');
					previousActive.hide();
				}
				if(previousMaximized !== undefined && previousMaximized !== previousActive && previousMaximized !== wind){
					previousMaximized.dispatchEvent('deactivated');
					previousMaximized.addClass('inactive');
					previousMaximized.hide();
				}
				wind.focus();
				wind.e.style.opacity = null;
				if (typeof done == "function"){
					done();
				}
			});
		}
		else if(wind.windowMode === "floating"){
			this.activeFloatingWindows.forEach(function(w){
				w.dispatchEvent('deactivated');
				w.addClass('inactive');
			});
			this.activeFloatingWindows.push(wind);
			this.activeWindows.push(wind);
			var previousActive = this.activeContainer;
			this.activeContainer = wind;
			wind.e.style.zIndex = this.topZIndex + 1;
			this.topZIndex += 1;
			wind.show();
			wind.focus();
			wind.removeClass('inactive');
			wind.dispatchEvent('activated');
			//previousActive.dispatchEvent('deactivated');
			//previousActive.addClass('inactive');
		}
	}
}

;
function SVGElement(args){
	var self = this;
	args=args?args:{};
	args.tagName = typeof args.tagName == "string" ? args.tagName : "svg";
	this.element = document.createElementNS("http://www.w3.org/2000/svg", args.tagName);
	this.e = this.element;
	this.$element = $(this.element);
	this.$ = this.$element;
	this.tagName = args.tagName;

	if(typeof args.className == "string"){
		this.addClass(args.className);
	}
}


SVGElement.prototype.append = function(element){
	this.element.appendChild(element.element);
	return this;
}

SVGElement.prototype.prepend = function(element){
	$(this.element).prepend(element.element);
	return this;
}


SVGElement.prototype.setAttribute = function(attr, val){
	this.element.setAttribute(attr, val);
};

SVGElement.prototype.addClass = function(className){
	if(typeof className == "string"){
		this.setAttribute('class',this.element.getAttribute('class') + ' ' + className);
		/*var classList = className.split(' ');
		for(var i in classList){
			this.element.classList.add(classList[i]);
		}*/
	}
	return this;
}

SVGElement.prototype.removeClass = function(className){
	var classList = className.split(' ');
	for(var i in classList){
		this.element.classList.remove(classList[i]);
	}
	return this;
}

function SVGIcon(args){
	args = {
		icon:args,
	}
	SVGElement.call(this, {
		tagName:'svg',
	});
	this.addClass('icon');
	this.setAttribute("width", 48);
	this.setAttribute("height", 48);
	this.setAttribute("viewBox", "0 0 48 48");

	this.path = new SVGElement({
		tagName:'path',
	});
	if (SVGIcon.paths[args.icon] !== undefined){
		this.path.setAttribute("d", SVGIcon.paths[args.icon]);
	}
	this.append(this.path);
}

SVGIcon.prototype = Object.create(SVGElement.prototype);

SVGIcon.prototype.set = function(icon){
	if (SVGIcon.paths[icon] !== undefined){
		this.path.setAttribute("d", SVGIcon.paths[icon]);
	}
};

// Some of these paths are from Googles Material Design Icon Set (https://github.com/google/material-design-icons).
SVGIcon.paths = {
	'apps': "M8 16h8V8H8v8zm12 24h8v-8h-8v8zM8 40h8v-8H8v8zm0-12h8v-8H8v8zm12 0h8v-8h-8v8zM32 8v8h8V8h-8zm-12 8h8V8h-8v8zm12 12h8v-8h-8v8zm0 12h8v-8h-8v8z",
	'close': "M38 12.83L35.17 10 24 21.17 12.83 10 10 12.83 21.17 24 10 35.17 12.83 38 24 26.83 35.17 38 38 35.17 26.83 24z",
	'more-h': "M12 20c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm24 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-12 0c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z",
	'more-v': "M24 16c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 4c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z",
	'folder': "M20 8H8c-2.21 0-3.98 1.79-3.98 4L4 36c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V16c0-2.21-1.79-4-4-4H24l-4-4z",
	'trash': "M12 38c0 2.21 1.79 4 4 4h16c2.21 0 4-1.79 4-4v-24h-24v24zm26-30h-7l-2-2h-10l-2 2h-7v4h28v-4z",
	'done': "M18 32.34l-8.34-8.34-2.83 2.83 11.17 11.17 24-24-2.83-2.83z",
	'image': "M42 38v-28c0-2.21-1.79-4-4-4h-28c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4zm-25-11l5 6.01 7-9.01 9 12h-28l7-9z",
	'download': "M38 18h-8V6H18v12h-8l14 14 14-14zM10 36v4h28v-4H10z",
	'plus': "M38 26h-12v12h-4v-12h-12v-4h12v-12h4v12h12v4z",
	'play': "M16 10v28l22-14z",
	'stop': "M12 12h24v24H12z",
	'videocam': "M34 21v-7c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v20c0 1.1.9 2 2 2h24c1.1 0 2-.9 2-2v-7l8 8V13l-8 8z",
	'phone': "M13.25 21.59c2.88 5.66 7.51 10.29 13.18 13.17l4.4-4.41c.55-.55 1.34-.71 2.03-.49C35.1 30.6 37.51 31 40 31c1.11 0 2 .89 2 2v7c0 1.11-.89 2-2 2C21.22 42 6 26.78 6 8c0-1.11.9-2 2-2h7c1.11 0 2 .89 2 2 0 2.49.4 4.9 1.14 7.14.22.69.06 1.48-.49 2.03l-4.4 4.42z",
	'mic': "M24 28c3.31 0 5.98-2.69 5.98-6L30 10c0-3.32-2.68-6-6-6-3.31 0-6 2.68-6 6v12c0 3.31 2.69 6 6 6zm10.6-6c0 6-5.07 10.2-10.6 10.2-5.52 0-10.6-4.2-10.6-10.2H10c0 6.83 5.44 12.47 12 13.44V42h4v-6.56c6.56-.97 12-6.61 12-13.44h-3.4z",
	'people': "M32 22c3.31 0 5.98-2.69 5.98-6s-2.67-6-5.98-6c-3.31 0-6 2.69-6 6s2.69 6 6 6zm-16 0c3.31 0 5.98-2.69 5.98-6s-2.67-6-5.98-6c-3.31 0-6 2.69-6 6s2.69 6 6 6zm0 4c-4.67 0-14 2.34-14 7v5h28v-5c0-4.66-9.33-7-14-7zm16 0c-.58 0-1.23.04-1.93.11C32.39 27.78 34 30.03 34 33v5h12v-5c0-4.66-9.33-7-14-7z",
	'fullscreen': "M14 28h-4v10h10v-4h-6v-6zm-4-8h4v-6h6v-4H10v10zm24 14h-6v4h10V28h-4v6zm-6-24v4h6v6h4V10H28z",
	'fullscreen-exit': "M10 32h6v6h4V28H10v4zm6-16h-6v4h10V10h-4v6zm12 22h4v-6h6v-4H28v10zm4-22v-6h-4v10h10v-4h-6z",
	'messenger': "M40 4H8C5.79 4 4 5.79 4 8v36l8-8h28c2.21 0 4-1.79 4-4V8c0-2.21-1.79-4-4-4z",
	'forum': "M42 12h-4v18H12v4c0 1.1.9 2 2 2h22l8 8V14c0-1.1-.9-2-2-2zm-8 12V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v28l8-8h20c1.1 0 2-.9 2-2z",
	'left': "M30.83 14.83L28 12 16 24l12 12 2.83-2.83L21.66 24z",
	'right': "M20 12l-2.83 2.83L26.34 24l-9.17 9.17L20 36l12-12z",
	'up': "M24 16L12 28l2.83 2.83L24 21.66l9.17 9.17L36 28z",
	'down': "M33.17 17.17L24 26.34l-9.17-9.17L12 20l12 12 12-12z",
	'refresh': "M35.3 12.7C32.41 9.8 28.42 8 24 8 15.16 8 8.02 15.16 8.02 24S15.16 40 24 40c7.45 0 13.69-5.1 15.46-12H35.3c-1.65 4.66-6.07 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.31 0 6.28 1.38 8.45 3.55L26 22h14V8l-4.7 4.7z",
	'minus': "M38 26H10v-4h28v4z",
}

;
function ChartCanvas(args){
	console.log("ChartCanvas");
	args=args?args:{};
	args.share = args.share || 1;
	args.contentDirection = 'vertical';
	Container.call(this, args);
	var self = this;
	this.addClass('chart');

	//this.channels = [];
	//this.data;

	/*if(args.data != undefined){
		this.bindTo(args.data);
	}
	else{
		this.bindTo(new DataTableModel());
	}*/

	//this.

	this.svg = new SVGElement();
	this.svg.setAttribute("width","100%");
	this.svg.setAttribute("height","100%");
	this.svg.e.style.flexGrow = 1;
	
	this.append(this.svg);
}

ChartCanvas.prototype = Object.create(Container.prototype);

ChartCanvas.prototype.getWidth = function(){
	return this.$.width();
}

ChartCanvas.prototype.getHeight = function(){
	return this.$.height();
}

function Chart(args){
	var args = args || {};
	this.ranges = {};
	this.dims = {};
	if(typeof args.dims === "object"){
		for (var i in args.dims){
			this.setDim(i, args.dims[i]);
		}
	}
	if(args.data != null){
		this.setData(args.data);
	}
	if(args.canvas != null){
		this.setCanvas(args.canvas);
	}
	if(typeof args.color === "string"){
		this.color = args.color;
	}
	else{
		this.color = Chart.getColor();
	}
}

Chart.colors = ['blue', 'red', 'green', 'black', 'indigo'];

Chart.colorIndex = 0;

Chart.getColor = function(){
	var out = this.colors[this.colorIndex];
	if(this.colorIndex + 1 === this.colors.length){
		this.colorIndex = 0;
	}
	else{
		this.colorIndex = this.colorIndex + 1;
	}
	return out;
}

Chart.prototype.relevantDims = [];

Chart.prototype.setCanvas = function(canvas){
	if(canvas instanceof ChartCanvas){
		// TODO clean-up
		this.canvas = canvas;
		this.container = new SVGElement({
			tagName:'g',
			className:'chart',
		});
		this.canvas.svg.append(this.container);
	}
}

Chart.prototype.setData = function(data){
	if(data instanceof DataTableModel){
		this.data = data;
	}
	else{
		throw "Error";
	}
}

Chart.prototype.hasDim = function(dim){
	return typeof dim === "string" && typeof col === "string";
}

Chart.prototype.setDim = function(dim, col){
	if(this.relevantDims.indexOf(dim) === -1){
		console.log("Dimension "+dim+" is not relevant.");
		return;
	}
	if(typeof dim === "string" && typeof col === "string"){
		this.dims[dim] = col;
		if(this.ranges[dim] == null){
			this.setRange(dim, new ChartRange());
		}
	}
}

Chart.prototype.setRange = function(dim, range){
	if(typeof dim === "string" && range instanceof ChartRange){
		this.ranges[dim] = range;
	}
}

Chart.prototype.calculatePhysicalRanges = function(){
	if(!(this.canvas instanceof ChartCanvas)){
		throw("Error: Canvas is not set.")
	}
	this.calculatedPhysicalRanges = {
		x:[0, this.canvas.getWidth()],
		y:[this.canvas.getHeight(), 0],
	};
	return this.calculatedPhysicalRanges;
}

Chart.prototype.calculateBasis = function(){
	var physRanges = this.calculatePhysicalRanges();
	this.calculatedBasis = {};
	for(var dim in physRanges){
		if(this.ranges[dim] != null){
			var range = this.ranges[dim];
			var min = range.min;
			var max = range.max;
			this.calculatedBasis[dim] = (physRanges[dim].max - physRanges[dim].min) / (max -min);
		}		
	}
	return this.calculatedBasis;
}

Chart.prototype.calculateRanges = function(){
	var vl = this.virtualLimits;
	var data = this.data.get();
	var tempLimits = {};
	var channel;
	this.calculatedRanges = {};
	var calcRanges = this.calculatedRanges;
	var ranges = this.ranges;
	for(var dim in this.dims){
		if(calcRanges[dim] == null){
			calcRanges[dim] = {}
		}	
	}
	
	for (var i in data){
		var row = data[i];
		var isVisible = true;
		for(var dim in ranges){
			var key = this.dims[dim];
			var range = ranges[dim];
			if(row[key] == null){
				isVisible = false;
			}
			else if(range.min != null && row[key] < range.min){
				isVisible = false;
			}
			else if(range.max != null && row[key] > range.max){
				isVisible = false;
			}
		}


		// TODO determine if item is within common limits. row.reduce()
		if(isVisible){
			for (var dim in this.dims){
				var key = this.dims[dim];
				var range = calcRanges[dim];
				if(range.min == null || range.min > row[key] ){
					range.min = row[key];
				}
				if(range.max == null || range.max < row[key] ){
					range.max = row[key]
				}
			}
		}
	}
}

Chart.prototype.applyCalculatedRanges = function(){
	for (var dim in this.calculatedRanges){
		if(this.ranges[dim] == null){
			this.ranges[dim] = {};
		}
		var range = this.ranges[dim];
		var calcRange = this.calculatedRanges[dim];
		if(range.min == null || range.min == Number.NEGATIVE_INFINITY){
			range.min = calcRange.min;
		}
		if(range.max == null || range.max == Number.POSITIVE_INFINITY){
			range.max = calcRange.max;
		}
	}
}


Chart.prototype.draw = function(){
	this.calculateRanges();
	this.applyCalculatedRanges();
	this.calculateBasis();
	this.render();
}


function ChartGroup(args){
	this.charts = [];
}

ChartGroup.prototype.add = function(chart){
	for(var arg in arguments){
		if(arguments[arg] instanceof Chart){
			this.charts.push(arguments[arg]);
		}
	}
	return this;
}

ChartGroup.prototype.draw = function(){
	for(var i in this.charts){
		var chart = this.charts[i];
		chart.calculateRanges();
	}

	for(var i in this.charts){
		var chart = this.charts[i];
		chart.applyCalculatedRanges();
	}

	for(var i in this.charts){
		var chart = this.charts[i];
		chart.calculateBasis();
		chart.render();
	}
}

function ChartRange(args){
	var self = this;
	args = args || {};
	this.filter('set', function(d){
		if(typeof d.value !== "object"){
			d.value = {};
		}
		return d;
	});
	Model.call(this, args);
	this.min = args.min;
	this.max = args.max;
}

ChartRange.prototype = Object.create(Model.prototype);

ChartRange.prototype.setMin = function(val){
	this.value.min = val;
}

ChartRange.prototype.setMax = function(val){
	this.value.max = val;
}

ChartRange.prototype.getMin = function(){
	return this.value.min;
}

ChartRange.prototype.getMax = function(){
	return this.value.max;
}

Object.defineProperty(ChartRange.prototype, 'min', {
	get: function(){
		return Number(this.value.min);
	},
	set: function(val){
		if(isNaN(Number(val))){
			this.value.min = Number.NEGATIVE_INFINITY;
		}
		else{
			this.value.min = Number(val);
		}	
	}
});

Object.defineProperty(ChartRange.prototype, 'max', {
	get: function(){
		return Number(this.value.max);
	},
	set: function(val){
		if(isNaN(Number(val))){
			this.value.max = Number.POSITIVE_INFINITY;
		}
		else{
			this.value.max = Number(val);
		}	
	}
});

function LineChart(args){
	Chart.call(this, args);
}

LineChart.prototype = Object.create(Chart.prototype);

LineChart.prototype.relevantDims = ['x', 'y'];

LineChart.prototype.calculatePhysicalRanges = function(){
	if(!(this.canvas instanceof ChartCanvas)){
		throw("Error: Canvas is not set.")
	}
	this.calculatedPhysicalRanges = {
		x:{
			min: 0, 
			max: this.canvas.getWidth()
		},
		y:{
			min: this.canvas.getHeight(), 
			max: 0
		},
	};
	return this.calculatedPhysicalRanges;
}

LineChart.prototype.render = function(){
	var data = this.data.get();
	var tmp, x, y, path="";
	var pathInitialized = false;
	var ranges = this.ranges;
	var basis = this.calculatedBasis;
	var physRanges = this.calculatedPhysicalRanges;
	if(this.path == null){
		this.path = new SVGElement({
			tagName:'path',
			className:'line',
		});
		this.path.setAttribute('fill-opacity', '0');
		this.path.addClass("content-" + ( this.color || "blue" ) );
		//x = this.physicalLimits.x[0] + this.tmpBasis.x * (data[0])

		// this.bgpath = new SVGElement({
		// 	tagName:'path',
		// 	className:'line-bg',
		// });
		// this.bgpath.setAttribute('fill-opacity', '.5');
		// this.bgpath.addClass("content-" + ( this.color || "blue" ) );
		// //x = this.physicalLimits.x[0] + this.tmpBasis.x * (data[0])
		// this.container.append(this.bgpath);

		this.container.append(this.path);
	}

	//var bgpath = " M " + physRanges.x.min + " " + physRanges.y.min;

	if(true){
		for (var i in data){
			var row = data[i];
			var col;
			var val;
			var start;
			if(this.dims.x == null){
				continue;
			}
			else{
				val = row[this.dims['x']];
				start = this.ranges['x'].min;
				x = physRanges.x.min + basis.x * (val - start);
				//pointElement.setAttribute('cx', this.canvasLimits.x[0] + basis.x * (row[channel.x] - tempLimits.x[0]));
			}
			if(this.dims.y == null){
				continue;
			}
			else{
				val = row[this.dims['y']];
				start = this.ranges['y'].min;
				y = physRanges.y.min + basis.y * (val - start);
				//pointElement.setAttribute('cy', this.canvasLimits.y[0] + basis.y * (row[channel.y] - tempLimits.y[0]));
			}
			if(!pathInitialized){
				path += " M " + x + " " + y;
				pathInitialized = true;
			}
			path += " L " + x + " " + y;
			//bgpath += " L " + x + " " + y;
		}
	}

	//bgpath += " L " + physRanges.x.max + " " + physRanges.y.min;

	this.path.setAttribute("d", path);
	//this.bgpath.setAttribute("d", bgpath);
}

function BubbleChart(args){
	Chart.call(this, args);
}

BubbleChart.prototype = Object.create(Chart.prototype);

BubbleChart.prototype.relevantDims = ['x', 'y', 'a', 'o'];

BubbleChart.prototype.calculatePhysicalRanges = function(){
	var area, cr;
	if(!(this.canvas instanceof ChartCanvas)){
		throw("Error: Canvas is not set.")
	}
	this.calculatedPhysicalRanges = {
		x:{
			min: 0, 
			max: this.canvas.getWidth()
		},
		y:{
			min: this.canvas.getHeight(), 
			max: 0
		},
	};
	cr = this.calculatedPhysicalRanges;
	area = Math.abs((cr.x.max - cr.x.min) * (cr.y.max - cr.y.min));
	cr.a = {
		min:Math.max( ( 0.0001 * area ) / Math.PI, 2),
		max:Math.max( ( 0.002 * area ) / Math.PI, 5)
	}
	cr.a['default'] = cr.a.min;
	cr.o = {
		min: 0.2,
		max: 0.8,
		'default': 0.5,
	};
	return this.calculatedPhysicalRanges;
}

BubbleChart.prototype.render = function(){
	var data = this.data.get();
	var tmp, x, y, a, o, path="";
	var pathInitialized = false;
	var ranges = this.ranges;
	var basis = this.calculatedBasis;
	var physRanges = this.calculatedPhysicalRanges;

	while(this.container.e.firstChild){
		this.container.e.removeChild(this.container.e.firstChild);
	}

	if(true){
		for (var i in data){
			var row = data[i];
			var col;
			var val;
			var start;
			var pointElement = new SVGElement({
				tagName:'circle',
				className: 'bubble'
			});
			var titleElement = new SVGElement({
				tagName:'title',
			});
			pointElement.append(titleElement);
			var title = "";
			pointElement.addClass("content-"+this.color);
			pointElement.setAttribute('title', "TEST");
			//pointElement.setAttribute('stroke-');
			if(this.dims.x == null){
				continue;
			}
			else{
				val = row[this.dims['x']];
				start = this.ranges['x'].min;
				x = physRanges.x.min + basis.x * (val - start);
				pointElement.setAttribute('cx', x);
				title += this.dims['x'] + ": " + val + "\n";
			}
			if(this.dims.y == null){
				continue;
			}
			else{
				val = row[this.dims['y']];
				start = this.ranges['y'].min;
				y = physRanges.y.min + basis.y * (val - start);
				pointElement.setAttribute('cy', y);
				title += this.dims['y'] + ": " + val + "\n";
			}
			// Area
			if(this.dims.a == null){
				a = Math.pow(physRanges.a['default'], 0.5);
				pointElement.setAttribute('r', a);
			}
			else{
				val = row[this.dims['a']];
				start = this.ranges['a'].min;
				a = physRanges.a.min + basis.a * (val - start);
				a = Math.pow(a, 0.5);
				pointElement.setAttribute('r', a);
				title += this.dims['a'] + ": " + val + "\n";
			}
			// Opacity
			if(this.dims.o == null){
				pointElement.setAttribute('fill-opacity', physRanges.o['default'] );
			}
			else{
				val = row[this.dims['o']];
				start = this.ranges['o'].min;
				o = physRanges.o.min + basis.o * (val - start);
				pointElement.setAttribute('fill-opacity', o);
				title += this.dims['o'] + ": " + val + "\n";
			}
			titleElement.e.innerHTML = title;
			this.container.append(pointElement);
		}
	}
}

;
/*
args.data for data to show
args.callback should be a function to call on every row of args.data.



*/
function ListDataView(args){
	var self = this;
	args = args || {};
	Element.call(this,args);
	this.addClass('listview dataview');

	this.data = args.data;
	this.itemsHandled = 0;
	this.limit = 20;
	this.refreshing = false;
	if(typeof args.getter === "function"){
		this.getter = args.getter;
	}
	else{
		this.getter = this.data.fetch;
	}
	if(typeof args.callback === "function"){
		this.onNewItem = args.callback;
	}
	if(typeof this.data === "undefined"){
		return;
	}
	if(typeof this.data.on === "function"){
		this.data.on('newitem', function(e){
			//console.log("newitem", e);
			var elem = new Element({
				className: 'listview-item dataview-item white clickable'
			});
			self.onNewItem(e, elem, function(elementToAppend){
				self.append(elementToAppend);
			});
		});
	}
}

ListDataView.prototype = Object.create(Element.prototype);

ListDataView.prototype.refresh = function(){
	var self = this;
	this.refreshing = true;
	var windowHeight = window.innerHeight;
	var scrollHeight = this.e.scrollHeight;
	var scrollTop = this.e.scrollTop;

	if(this.finished){
		return;
	}

	if( ( scrollHeight - scrollTop ) < windowHeight ){
		// Fetch more
		if(typeof this.getter === "function"){
			this.getter.call(this.data, {
				offset:this.itemsHandled,
				limit:this.limit,
			}, function(rows){
				self.itemsHandled = self.itemsHandled + rows.length;
				if (rows.length < this.limit){
					this.finished = true;
				}
				for (var i in rows){
					var row = rows[i];
					var elem = new Element({
						className: 'listview-item dataview-item'
					});
					self.add(row);
				}
			});
		}
		else{
			for (var i in this.data){
				this.finished = true; // finish for now
				var row = this.data[i];
				var elem = new Element({
					className: 'listview-item dataview-item white'
				});
				self.add(row, i);
			}
		}
		
	}
	else{
		// Do nothing
	}
}

ListDataView.prototype.generateElement = function(){
	var elem = new Element({
		className: 'listview-item dataview-item white clickable'
	});
	return elem;
}

ListDataView.prototype.add = function(row, i){
	var self = this;
	var elem = new Element({
		className: 'listview-item dataview-item'
	});
	try{
		this.onNewItem(row, elem, function(elementToAppend){
			if (elementToAppend === undefined){
				self.append(elem);
			}
			else{
				self.append(elementToAppend);
			}
			
		}, i);
	}
	catch(e){
		console.log("Error calling onNewItem");
	}
	
}

ListDataView.prototype.onNewItem = function(row, element, callback){
	element.append(JSON.stringify(row));
	if(typeof callback === "function"){
		callback(element);
	}
}