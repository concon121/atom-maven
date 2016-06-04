'use babel';

const common = require('./common');
const fs = require('fs');
const ui = require('./ui-utils');
const mvn = require('./maven-utils');

export default {

	cpConfigFileName: '.classpath',

	activate: function () {
		this.setup();
	},

	setup: function () {
		ui.info('atom-maven is configuring your classpath');
		var self = this;
		mvn.getPoms((pom) => {
			var cp = self.getClasspath(pom.pomPath);
			pom.registerLoadCompleteEvent(() => {
				self.writeClasspath(cp, pom, self);
			});
			pom.registerChangeEvent(() => {
				ui.clearFileMessages(pom.pomPath);
				ui.clearSuccess();
				ui.clearInfo();
				pom.reload();
			});
		});
	},

	writeClasspath: function (cp, pom, self) {

		var locations = self.initLocations() + self.getClasspathFromDependencies(pom, self);
		fs.writeFile(cp, locations, (err) => {
			if (err) {
				ui.error(err);
			}
			pom.changing = false;
		});
		ui.success('atom-maven has finished configuring the classpath: ' + cp);

	},

	getClasspath: function (pomPath) {
		return pomPath.replace('pom.xml', '.classpath');
	},

	initLocations: function () {
		return '.' + common.fileSeparator + 'target' + common.fileSeparator + 'classes;';
	},

	getClasspathFromDependencies: function (pom, self) {
		var locations = '';

		for (var dependency of pom.classpath) {
			if (dependency.existsInRepo) {
				locations = locations + dependency.repoLocation + ';';
			} else if (pom.xml) {
				self.displayDependencyError(pom.xml, dependency, pom.pomPath);
			}
		}
		return locations;
	},

	displayDependencyError: function (xml, dependency, file) {

		var tomatch = '(' + dependency.groupId + '[\\s\\S]*' + dependency.artifactId + ')|(' + dependency.artifactId + '[\\s\\S]*' + dependency.groupId + ')';
		var result = new RegExp(tomatch, 'g').exec(xml);
		var substr = xml.substr(0, result.index);
		var lineNo = substr.match(/\n/g).length + 1;
		var message = mvn.getDependencyNotFoundMessage(dependency);
		var preview = '<dependency>\n\t<groupId>' + dependency.groupId + '</groupId>\n\t<artifactId>' + dependency.artifactId + '</artifactId>\n\t<version>' + dependency.version + '</version>\n</dependency>';

		ui.error(message, lineNo, 0, file, preview);

	}

};
