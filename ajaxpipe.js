/**
 * AjaxPipe.
 * JQuery-Ajax Tunneler with live-listeners
 * created by David Lorenz (www.activenode.de)
 */

var AjaxPipe = {
	Type: {
		REQUEST_STARTED: 2,
		REQUEST_SUCCESSFULL: 4,
		ERROR: 8
	},
	
	_events: {
		initListener: function(name) {
			if (!this.listeners[name]) {
				this.listeners[name] = [];
			}
		},
		
		addListener: function(name,func) {
			this.initListener(name);
			this.listeners[name].push(func);
		},
		
		call: function(name,type,val) {
			if (this.listeners[name]) {
				for (var i in this.listeners[name]) {
					var res = this.listeners[name][i](type, val);
					if (res===true) {
						delete this.listeners[name];
					}
				}
			}
		},
		
		
		listeners: {}
	},
	
	
	x : function(options) {
		if (options.name) {
			this._events.initListener(options.name);
		}
		
		var errorFunc = function(jqXHR,textStatus,errorThrown) {
			if (options.error) {
				options.error(jqXHR,textStatus,errorThrown);
			}
			
			if (options.name) {
				AjaxPipe._events.call(options.name, AjaxPipe.Type.ERROR);
			}
		};
		
		var successFunc = function(data, textStatus, jqXHR) {
			if (!data || !data.is_logged_in) {
				errorFunc(jqXHR,textStatus,'not logged in');
				return;
			}
			
			if (options.fnSuccessPreCondition) {
				if (!options.fnSuccessPreCondition(data)) {
					if (data.errMsg || data.errorMessage) {
						var serverMessage = data.errMsg || data.errorMessage;
						errorFunc(jqXHR,textStatus,{msg: 'ServerError: '+serverMessage, orig_data: data});
					} else {
						errorFunc(jqXHR,textStatus,{msg: 'Failed fnSuccessPreCondition', orig_data: data});
					}
					
					return false;
				}
			}
			
			if (options.success) {
				options.success(data, textStatus, jqXHR);
			}
			
			if (options.name) {
				AjaxPipe._events.call(options.name, AjaxPipe.Type.REQUEST_SUCCESSFULL, {
					data: data,
					textStatus: textStatus,
					jqXHR: jqXHR
				});
			}
		};
		
		if (options.name) {
			AjaxPipe._events.call(options.name,AjaxPipe.Type.REQUEST_STARTED);
		}
		
		return $.ajax({
			type : (options.type) ? options.type : 'POST',
			url : (options.url) ? options.url : window.location.href,
			data : (options.data) ? options.data : [],
			beforeSend: (options.beforeSend) ? options.beforeSend : null,
			dataType : (options.dataType) ? options.dataType : 'json',
			success : successFunc,
			error : errorFunc,
			cache : (options.cache) ? options.cache : undefined
		});
	},
	
	listen: function(name,proc) {
		if (Array.isArray(name)) {
			for (var i=0; i<name.length; i++) {
				this._events.addListener(name[i],proc);
			}
		} else {
			this._events.addListener(name,proc);
		}
	}
};
