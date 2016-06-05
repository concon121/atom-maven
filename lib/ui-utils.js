'use babel';
'use strict';

const MessagePanelView = require('atom-message-panel').MessagePanelView;
const PlainMessageView = require('atom-message-panel').PlainMessageView;
const LineMessageView = require('atom-message-panel').LineMessageView;
const log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('ui-utils.log'), 'ui-utils');

const logger = log4js.getLogger('ui-utils');
logger.setLevel('TRACE');


class UiUtils {

	constructor() {
		this.messages = null;
	}

}

UiUtils.prototype.initMessagePanel = function () {
	if (this.messages === null) {
		this.messages = new MessagePanelView({
			title: 'atom-maven report'
		});
		this.messages.attach();
	}
};

UiUtils.prototype.addPlainMessage = function (text, level) {
	this.initMessagePanel();
	if (!this.containsMessage(text)) {
		this.messages.add(new PlainMessageView({
			message: text,
			className: 'text-' + level
		}));
	}
};

UiUtils.prototype.addLineMessage = function (text, fileLine, lineChar, path, level, pre) {
	this.initMessagePanel();
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
			if (condition(elem)) {
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
	var getCondition = function (type) {
		return function (elem) {
			return (elem && elem.attr('class').indexOf('text-' + type) >= 0);
		};
	};
	for (var type of types) {
		this.clear(getCondition(type));
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

UiUtils.prototype.success = function (message) {
	this.addPlainMessage(message, 'success');
};

UiUtils.prototype.info = function (message) {
	this.addPlainMessage(message, 'info');
};

UiUtils.prototype.warning = function (message) {
	this.addPlainMessage(message, 'warning');
};

UiUtils.prototype.error = function (message, fileLine, lineChar, path, pre) {
	this.log(message, fileLine, lineChar, path, pre, 'error');
};

module.exports = new UiUtils();
