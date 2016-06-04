'use babel';
'use strict';

class UiUtils {

	constructor() {
		this.messages = null;
	}

}

UiUtils.prototype.initMessagePanel = function () {
	if (this.messages === null) {
		var MessagePanelView = require('atom-message-panel').MessagePanelView;
		this.messages = new MessagePanelView({
			title: 'atom-maven report'
		});
		this.messages.attach();
	}
};

UiUtils.prototype.addPlainMessage = function (text, level) {
	this.initMessagePanel();
	if (!this.containsMessage(text)) {
		var PlainMessageView = require('atom-message-panel').PlainMessageView;
		this.messages.add(new PlainMessageView({
			message: text,
			className: 'text-' + level
		}));
	}
};

UiUtils.prototype.addLineMessage = function (text, fileLine, lineChar, path, level, pre) {
	this.initMessagePanel();
	var LineMessageView = require('atom-message-panel').LineMessageView;
	if (!this.containsLine(path, text)) {
		var line = new LineMessageView({
			message: text,
			line: fileLine,
			character: lineChar,
			className: 'text-' + level,
			file: path,
			preview: pre
		});
		this.messages.add(line);
	}
};

UiUtils.prototype.clear = function (condition) {
	if (this.messages && typeof condition === 'function') {
		const self = this;
		var decrement = 0;
		$.each(self.messages.messages, (index, elem) => {
			if (condition(index, elem)) {
				var viewArry = self.messages.messages.splice(index - decrement, 1);
				var view = (viewArry.length > 0) ? viewArry[0] : null;
				var html = (view !== null && view.length > 0) ? view[0] : null;
				decrement++;
				$(html).remove();
			}
		});
		if (self.messages.messages.length === 0) {
			self.messages.toggle();
		}
	}
};

UiUtils.prototype.clearFileMessages = function (path) {
	this.clear((index, elem) => {
		return (elem && elem.file === path && elem.attr('class') === 'line-message');
	});
};

UiUtils.prototype.clearText = function (types) {
	for (var type of types) {
		this.clear((index, elem) => {
			return (elem && elem.attr('class').indexOf('text-' + type) >= 0);
		});
	}
};

UiUtils.prototype.containsLine = function (file, text) {
	const self = this;
	if (self.messages && file && text) {
		for (var message of self.messages.messages) {
			if (message && message.file === file && message.message === text) {
				return true;
			}
		}
	}
	return false;
};

UiUtils.prototype.containsMessage = function (text) {
	const self = this;
	if (self.messages && text) {
		for (var message of self.messages.messages) {
			if (message && message.html() === text) {
				return true;
			}
		}
	}
	return false;
};

UiUtils.prototype.log = function (message, fileLine, lineChar, path, pre, level) {
	if (path) {
		this.addLineMessage(message, fileLine, lineChar, path, level, pre);
	} else {
		this.addPlainMessage(message, level);
	}
};

UiUtils.prototype.success = function (message, fileLine, lineChar, path, pre) {
	this.log(message, fileLine, lineChar, path, pre, 'success');
};

UiUtils.prototype.info = function (message, fileLine, lineChar, path, pre) {
	this.log(message, fileLine, lineChar, path, pre, 'info');
};

UiUtils.prototype.warning = function (message, fileLine, lineChar, path, pre) {
	this.log(message, fileLine, lineChar, path, pre, 'warning');
};

UiUtils.prototype.error = function (message, fileLine, lineChar, path, pre) {
	this.log(message, fileLine, lineChar, path, pre, 'error');
};

module.exports = new UiUtils();
