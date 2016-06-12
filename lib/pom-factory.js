'use babel';
'use strict';

const Pom = require('./pom');
const file = require('./file-utils');
const workspace = require('./workspace');
const registry = require('./pom-registry');

function findPom(path, opts) {
	var found = registry.contains(path, opts);
	if (!found) {
		found = workspace.contains(opts);
	}
	return found;
}

function newPom(opts, path, callback, resolve) {
	var newpom = new Pom(opts, path, (pom) => {
		resolve(pom);
	}, createPom);
	if (callback && typeof callback === 'function') {
		callback(newpom);
	}
	registry.put(path, newpom);
}

function createWorkspacePom(sourcepom, opts, path, callback, resolve) {
	var newpom;
	for (var projectPath of atom.project.getPaths()) {
		if (sourcepom.pomPath.indexOf(projectPath) >= 0) {
			newpom = new Pom(opts, path, null, createPom);
			registry.put(path, newpom);
			if (callback && typeof callback === 'function') {
				callback(newpom);
			}
			resolve(newpom);
			break;
		}
	}
}

function createPom(path, opts, callback) {
	var sourcepom;
	if (typeof opts === 'function') {
		callback = opts;
		opts = null;
	}
	if (typeof callback === 'object') {
		sourcepom = callback;
	}

	var promise = new Promise((resolve, reject) => {
		var found = findPom(path, opts);
		if (found) {
			if (callback && typeof callback === 'function') {
				callback();
			}
			resolve(found);
		} else {
			if (file.fileExists(path)) {
				newPom(opts, path, callback, resolve);
			} else {
				// if we are loading a dependency of a workspace pom which doesnt exist.
				if (sourcepom && sourcepom.pomPath) {
					createWorkspacePom(sourcepom, opts, path, callback, resolve);
				}
				if (opts) {
					opts.existsInRepo = false;
					resolve(opts);
				} else {
					reject('Not sure how this happened');
				}
			}
		}
	});
	return promise;
}

module.exports = createPom;
