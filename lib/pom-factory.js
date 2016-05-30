const Pom = require('./pom');
const file = require('./file-utils');

class PomFactory {

	constructor() {
		this.workspace = require('./workspace');
		this.registry = require('./pom-registry');
	}

}

PomFactory.prototype.getInstance = function (path, opts, callback) {
	const self = this;
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
		var found = self.registry.contains(path, opts);
		if (found) {
			if (callback && typeof callback === 'function') {
				callback();
			}
			resolve(found);
		} else {
			if (file.fileExists(path)) {
				newpom = new Pom(opts, path);
				resolve(newpom);
			} else {
				// if we are loading a dependency of a workspace pom which doesnt exist.
				if (sourcepom && sourcepom.pomPath) {
					for (projectPath of atom.project.getPaths()) {
						if (sourcepom.pomPath.indexOf(projectPath) >= 0) {
							newpom = new Pom(opts, path);
							resolve(newpom);
						}
					}
				}
			}
		}
	});
	return promise;
};

module.exports = new PomFactory();
