var registry = require('./pom-registry'),
	pom = require('./pom'),
	$ = require('jquery'),
	_ = require('underscore'),
	fs = require('fs'),
	xml2js = require('xml2js').Parser();

var PomFactory = function () {

	return {
		getInstance: function (path, opts, callback) {
			if (registry.has(path)) {
				if (callback && typeof callback === 'function') callback();
				return registry.get(path);
			} else {
				if (typeof opts === 'function') {
					callback = opts;
					opts = {};
				}
				var newpom = pom(opts);
				newpom.pomPath = path;
				fs.readFile(newpom.pomPath, "utf8", (err, xml) => {
					if (err) console.error(err);
					else {
						newpom.xml = xml;
						xml2js.parseString(xml, function (err, result) {
							if (err) console.error(newpom.pomPath, err);
							$.extend(newpom, result);
							if (_.isEmpty(newpom.groupId)) {
								newpom.init({
									init: newpom.getGAVT(newpom, newpom.project, 'pom')
								});
								var mvn = require('./maven-utils'),
									existsInWorkspace = false;
								$.each(mvn.workspacePoms, function (index, workspacePom) {
									if (newpom.equals(workspacePom) && (newpom.pomPath !== workspacePom.pomPath)) {
										existsInWorkspace = true;
										return false;
									}
								})
								if (!existsInWorkspace) registry.put(newpom.pomPath, newpom);
							}
							newpom.load(callback);
						});
					}
				});
				return newpom;
			}
		}
	}

};

module.exports = PomFactory();
