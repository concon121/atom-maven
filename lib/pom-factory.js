const Pom = require('./pom');
const $ = require('jquery');
const _ = require('underscore');
const fs = require('fs');
const xml2js = require('xml2js').Parser();
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
		var found = self.registry.find(path, opts);
		var projectPath;
		if (found) {
			if (found.pomPath && found.pomPath !== path) {
				for (projectPath of atom.project.getPaths()) {
					if (path.indexOf(projectPath) > 0) {
						found.pomPath = path;
					}
				}
			}
			if (callback && typeof callback === 'function') {
				callback();
			}
			resolve(found);
		} else {
			if (file.fileExists(path)) {
				newpom = new Pom(opts);
				if (!self.workspace.contains(newpom)) {
					self.registry.put(path, newpom);
				}
				fs.readFile(path, 'utf8', (err, xml) => {
					if (err) {
						console.error('Failed to read file: ', path);
					} else {
						xml2js.parseString(xml, function (err, result) {
							if (err) reject(err);
							newpom.pomPath = path;
							newpom.xml = xml;
							$.extend(newpom, result);
							if (_.isEmpty(newpom.groupId)) {
								newpom.init(require('./maven-utils').getGAVT(newpom, newpom.project, 'pom'));
							}
							newpom.load((pom) => {
								if (callback && typeof callback === 'function') callback(pom);
								resolve(newpom);
							});

						});
					}
				});
			} else {
				if (sourcepom && sourcepom.pomPath) {
					for (projectPath of atom.project.getPaths()) {
						if (sourcepom.pomPath.indexOf(projectPath) >= 0) {
							newpom = new Pom(opts);
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
