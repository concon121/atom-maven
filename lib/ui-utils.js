var UiUtils = function () {

	const $ = require('jquery');

	return {

		messages: null,

		initMessagePanel: function () {
			if (this.messages === null) {
				var MessagePanelView = require('atom-message-panel').MessagePanelView;
				this.messages = new MessagePanelView({
					title: 'atom-maven report'
				});
				this.messages.attach();
			}
		},

		addPlainMessage: function (text, level) {
			this.initMessagePanel();
			var PlainMessageView = require('atom-message-panel').PlainMessageView;
			this.messages.add(new PlainMessageView({
				message: text,
				className: 'text-' + level
			}));
		},

		addLineMessage: function (text, fileLine, lineChar, path, level) {
			this.initMessagePanel();
			var LineMessageView = require('atom-message-panel').LineMessageView;
			var line = new LineMessageView({
				message: text,
				line: fileLine,
				character: lineChar,
				className: 'text-' + level,
				file: path
			});
			if (!this.contains(line)) this.messages.add(line);
		},

		clearFileMessages: function (path) {
			if (this.messages) {
				const self = this;
				var decrement = 0;
				$.each(self.messages.messages, (index, elem) => {
					if (elem && elem.file === path) {
						var viewArry = self.messages.messages.splice(elem - decrement, 1);
						var view = (viewArry.length > 0) ? viewArry[0] : null;
						var html = (view !== null && view.length > 0) ? view[0] : null;
						decrement++;
						$(html).remove();
					}
				});
			}
		},

		contains: function (line, type) {
			const self = this;
			var contains = false;
			if (this.messages) {
				$.each(self.messages.messages, (index, message) => {
					contains = (message.file === line.file && message.message === line.message);
					return !(contains);
				});
			}
			return contains;
		}

	};

};

module.exports = UiUtils();
