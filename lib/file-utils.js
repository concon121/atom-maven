'use babel';
'use strict';

const fs = require('fs');

var FileUtils = function () {
	return {

		fileExists: function (file, callback) {
			fs.access(file, fs.constants.F_OK, (err) => {
				if (callback) {
					callback(err);
				}
			});
		}

	};
};

module.exports = FileUtils();
