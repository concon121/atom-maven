var UiUtils = function () {

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

			this.messages.add(new LineMessageView({
				message: text,
				line: fileLine,
				character: lineChar,
				className: 'text-' + level,
				file: path
			}));

		},

		clearFileMessages: function (path) {

			var indexToRemove = [],
				self = this,
				decrement = 0;

			$.each(self.messages.messages, function (index, elem) {
				console.log(elem.file, path);
				if (elem.file === path) {
					console.log("match!", index);
					indexToRemove.push(index);
				}
			});

			console.log(self.messages.messages);

			$.each(indexToRemove, function (index, elem) {
				var viewArry = self.messages.messages.splice(elem - decrement, 1),
					view = (viewArry.length > 0) ? viewArry[0] : null,
					html = (view !== null && view.length > 0) ? view[0] : null;
				decrement++;
				console.log(viewArry, view, html, elem);
				$(html).remove();
			})

		},

	};

};

module.exports = UiUtils();
