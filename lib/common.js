var Common = function () {

	var isWin = (/^win/.test(require('process').platform)),
		pathSeparator = (isWin) ? ';' : ':',
		fileSeparator = (isWin) ? '\\' : '/',
		homeDir = (isWin) ? require('process').env.HOMEPATH : require('process').env.HOME;

	return {

		isWin: isWin,
		pathSeparator: pathSeparator,
		fileSeparator: fileSeparator,
		homeDir: homeDir

	};

};

module.exports = Common();
