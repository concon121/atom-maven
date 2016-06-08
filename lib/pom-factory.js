'use babel';
'use strict';

const Pom = require('./pom');
const file = require('./file-utils');
const workspace = require('./workspace');
const registry = require('./pom-registry');

class PomFactory {
	constructor() {}
}

PomFactory.prototype.getInstance = function (path, opts, callback) {
	var newpom = null;
	var sourcepom;

	if (typeof opts === 'function') {
		callback = opts;
		opts = null;
	}

	if (typeof callback === 'object') {
		sourcepom = callback;
	}

	var promise = new Promise((resolve, reject) => {
		//setTimeout(() => {
		var found = registry.contains(path, opts);
		if (!found) {
			found = workspace.contains(opts);
		}
		if (found) {
			if (callback && typeof callback === 'function') {
				callback();
			}
			resolve(found);
		} else {
			if (file.fileExists(path)) {
				newpom = new Pom(opts, path, () => {
					resolve(newpom);
				});
				if (callback && typeof callback === 'function') {
					callback(newpom);
				}
				registry.put(path, newpom);
				//resolve(newpom);
			} else {
				// if we are loading a dependency of a workspace pom which doesnt exist.
				if (sourcepom && sourcepom.pomPath) {
					for (var projectPath of atom.project.getPaths()) {
						if (sourcepom.pomPath.indexOf(projectPath) >= 0) {
							newpom = new Pom(opts, path);
							registry.put(path, newpom);
							if (callback && typeof callback === 'function') {
								callback(newpom);
							}
							resolve(newpom);
						}
					}
				}
				if (opts) {
					opts.existsInRepo = false;
					resolve(opts);
				} else {
					reject('Not sure how this happened');
				}
			}
		}
		//}, 1e3);
	});
	return promise;
};

module.exports = new PomFactory();
