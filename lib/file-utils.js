var FileUtils = function () {

	return {

		fileExists: function (file, doReport) {

			var exists = true,
				ui = require('./ui-utils'),
				fs = require('fs');
			try {
				fs.accessSync(file, fs.F_OK);
			} catch (err) {
				if (doReport) {
					console.warn("File does not exist: " + file);
					ui.addPlainMessage("File does not exist: " + file, "warning");
				}
				exists = false;
			}
			return exists;
		}

	};

};

module.exports = FileUtils();
