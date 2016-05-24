var pom = require('./pom'),
	$ = require('jquery'),
	_ = require('underscore'),
	fs = require('fs'),
	xml2js = require('xml2js').Parser(),
	file = require('./file-utils');

class PomFactory {

	constructor() {
		this.workspace = require('./workspace');
		this.registry = require('./pom-registry');
	}

};

PomFactory.prototype.getInstance = function (path, opts, callback) {
	var self = this,
		newpom = null;

	if (typeof opts === 'function') {
		callback = opts;
		opts = null;
	}

	var promise = new Promise((resolve, reject) => {
		var found = self.registry.find(path, opts);
		if (found) {
			if (found.pomPath && found.pomPath !== path) {
				for (var p of atom.project.getPaths()) {
					if (path.indexOf(p) > 0) {
						found.pomPath = path;
					}
				}
			}
			if (callback && typeof callback === 'function') callback();
			resolve(found);
		} else {
			if (file.fileExists(path)) {
				newpom = new pom(opts);
				if (!self.workspace.contains(newpom)) self.registry.put(path, newpom);
				fs.readFile(path, 'utf8', (err, xml) => {
					if (err) {
						console.error('Failed to read file: ', path);
						//reject(err);
					} else {
						xml2js.parseString(xml, function (err, result) {
							if (err) reject(err);
							newpom.pomPath = path;
							newpom.xml = xml;
							$.extend(newpom, result);
							if (_.isEmpty(newpom.groupId)) {
								newpom.init(require('./maven-utils').getGAVT(newpom, newpom.project, 'pom'));
							}
							newpom.load(callback);
							resolve(newpom);
						});
					}
				});
			} else {
				//console.error('File did not exist', path);
				if (opts) {
					// TODO: Method of displaying errors for dependencies which dont exist.
				}
				//reject('File did not exist');
			}
		}
	});
	return promise;
};

module.exports = new PomFactory();
