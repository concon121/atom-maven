'use babel';
'use strict';

const process = require('process');

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
		},

		toBoolean: function (value) {
			if (typeof (value) === 'string') {
				value = value.toLowerCase().trim();
			}
			if (value === 'true' || value === true) {
				return true;
			} else {
				return false;
			}

		}
	};
};
module.exports = Common();
