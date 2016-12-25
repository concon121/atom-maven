'use babel';
'use strict';

const fs = require('fs');

var FileUtils = function () {
	return {

		fileExists: function (file, callback, callbackArgs) {
			console.log("checking file: ", file);
			fs.access(file, fs.constants.R_OK, (err) => {
				if (err && callback) {
					console.error("error for file: ", file);
					return callback(err, callbackArgs);
				} else {
					return true;
				}
			});
		}

	};
};

module.exports = FileUtils();
