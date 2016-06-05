'use babel';
'use strict';

const ui = require('./ui-utils');
const fs = require('fs');
const log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('file-utils.log'), 'file-utils');

const logger = log4js.getLogger('file-utils');
logger.setLevel('TRACE');


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
