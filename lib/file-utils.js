'use babel';
'use strict';

const ui = require('./ui-utils');
const fs = require('fs');

var FileUtils = function () {
	return {

		fileExists: function (file, doReport) {
			var exists = true;
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
