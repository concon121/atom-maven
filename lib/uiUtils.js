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

			} else {
				if (!this.messages.panel.isVisible()) {
					this.messages.clear();
					this.messages.panel.show();
				}
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

	};

};

module.exports = {
	UiUtils: UiUtils()
};
