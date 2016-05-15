var FileUtils = function () {

	var isWin = (/^win/.test(require('process').platform)),
		pathSeparator = (isWin) ? ';' : ':',
		fileSeparator = (isWin) ? '\\' : '/';

	return {

		isWin: isWin,
		pathSeparator: pathSeparator,
		fileSeparator: fileSeparator,

		fileExists: function (file, doReport) {

			var exists = true,
				UiUtils = require('./uiUtils').UiUtils,
				fs = require('fs');
			try {
				fs.accessSync(file, fs.F_OK);
			} catch (err) {
				if (doReport) {
					console.warn("File does not exist: " + file);
					UiUtils.addPlainMessage("File does not exist: " + file, "warning");
				}
				exists = false;
			}
			return exists;
		}

	};

};

module.exports = {
	FileUtils: FileUtils()
};
