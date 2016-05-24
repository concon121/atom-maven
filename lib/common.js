var Common = function () {

	const isWin = (/^win/.test(require('process').platform));
	const pathSeparator = (isWin) ? ';' : ':';
	const fileSeparator = (isWin) ? '\\' : '/';
	const homeDir = (isWin) ? require('process').env.HOMEPATH : require('process').env.HOME;

	return {
		isWin: isWin,
		pathSeparator: pathSeparator,
		fileSeparator: fileSeparator,
		homeDir: homeDir
	};

};

module.exports = Common();
