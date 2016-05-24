'use babel';

var common = require('./common'),
	$ = require('jquery'),
	fs = require('fs'),
	_ = require('underscore'),
	ui = require('./ui-utils'),
	mvn = require('./maven-utils');

export default {

	cpConfigFileName: '.classpath',

	activate: function (state) {
		this.setup();
	},

	setup: function () {
		console.info('atom-maven is configuring your classpath');
		var self = this;
		mvn.getPoms((pom) => {
			console.log(pom);
			console.log(require('./pom-registry').registry);
			var cp = self.getClasspath(pom.pomPath),
				writeCp = self.writeClasspath(cp, pom, self);
			pom.registerChangeEvent(() => {
				self.handleChange(pom, writeCp);
			});
			self.handleChange(pom, writeCp);
		});
	},

	handleChange: function (pom, writeCp) {
		if (!pom.changing) {
			ui.clearFileMessages(pom.pomPath);
			try {
				pom.reload(writeCp);
			} catch (err) {
				console.error(err);
				pom.changing = false;
			}
		}
	},

	writeClasspath: function (cp, pom, self) {
		return function () {
			//	ui.clearFileMessages(pom.pomPath);
			setTimeout(() => {

				var locations = self.initLocations() + self.getClasspathFromDependencies(pom, self);
				fs.writeFile(cp, locations, (err) => {
					if (err) console.error(err);
					pom.changing = false;
				});
				console.info('atom-maven has finished configuring the classpath: ' + cp);
			}, 1e4);
		}
	},

	getClasspath: function (pomPath) {
		return pomPath.replace('pom.xml', '.classpath');
	},

	initLocations: function () {
		return '.' + common.fileSeparator + 'target' + common.fileSeparator + 'classes;';
	},

	getClasspathFromDependencies: function (pom, self) {
		var locations = '';
		for (var dependency of pom.getDependenciesInClasspath()) {
			if (dependency.existsInRepo) {
				locations = locations + dependency.repoLocation + ';';
			} else if (pom.xml) {
				self.displayDependencyError(pom.xml, dependency, pom.pomPath, self);
			}
		}
		return locations;
	},

	displayDependencyError: function (xml, dependency, file, self) {

		var tomatch = '(' + dependency.groupId + '[\\s\\S]*' + dependency.artifactId + ')|(' + dependency.artifactId + '[\\s\\S]*' + dependency.groupId + ')',
			result = new RegExp(tomatch, 'g').exec(xml),
			substr = xml.substr(0, result.index),
			lineNo = substr.match(/\n/g).length + 1,
			message = mvn.getDependencyNotFoundMessage(dependency);

		ui.addLineMessage(message, lineNo, 0, file, 'error');

	}

};
