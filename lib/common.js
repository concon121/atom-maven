'use babel';
'use strict';

const process = require('process');
const log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('common.log'), 'common');

const logger = log4js.getLogger('common');
logger.setLevel('ERROR');


var Common = function () {
	const isWin = (/^win/.test(process.platform));
	const pathSeparator = (isWin) ? ';' : ':';
	const fileSeparator = (isWin) ? '\\' : '/';
	const homeDir = (isWin) ? process.env.HOMEPATH : process.env.HOME;

	return {
		isWin: isWin,
		pathSeparator: pathSeparator,
		fileSeparator: fileSeparator,
		homeDir: homeDir,

		resolveEnvironmentVariable: function (env) {
			return process.env[env];
		}
	};
};

module.exports = Common();
