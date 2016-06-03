'use strict';

var FileUtils = function () {

	return {

		fileExists: function (file, doReport) {

			var exists = true;
			const ui = require('./ui-utils');
			const fs = require('fs');

			try {
				fs.accessSync(file, fs.F_OK);
			} catch (err) {
				if (doReport) {
					ui.warning('File does not exist: ' + file);
				}
				exists = false;
			}
			return exists;
		}

	};

};

module.exports = FileUtils();
