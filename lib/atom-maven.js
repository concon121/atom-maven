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
		mvn.setMavenRepo();
		this.setup();
	},

	setup: function () {
		console.info('atom-maven is configuring your classpath');
		var self = this;
		mvn.getPoms((pom) => {
			var cp = self.getClasspath(pom.pomPath);
			self.pomChange(cp, pom, self);
			mvn.registerPomChangeEvent(pom, () => {
				self.pomChange(cp, pom, self);
			});
		});
	},

	pomChange: function (cp, pom, self) {
		ui.clearFileMessages(pom.pomPath);
		fs.readFile(pom.pomPath, "utf8", (err, xml) => {
			if (err) console.error(err);
			else {
				pom.xml = xml;
				mvn.loadDependencies(xml, pom, () => {
					var locations = self.initLocations() + self.getClasspathFromDependencies(pom, self);
					fs.writeFile(cp, locations, (err) => {
						if (err) console.error(err);
					});
					console.info("atom-maven has finished configuring the classpath: " + cp);
				});
			}
		});
	},

	getClasspath: function (pomPath) {
		return pomPath.replace("pom.xml", ".classpath");
	},

	initLocations: function () {
		return "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
	},

	getClasspathFromDependencies: function (pom, self) {
		locations = "";
		$.each(pom.dependencies, (index, dependency) => {
			if (dependency.existsInRepo) {
				locations = locations + dependency.repoLocation + ";";
			} else if (pom.xml) {
				self.displayDependencyError(pom.xml, dependency, pom.pomPath, self);
			}
		});
		if (pom.parent) {
			locations = locations + self.getClasspathFromDependencies(pom.parent, self);
		}
		return locations;
	},

	displayDependencyError: function (xml, dependency, file, self) {

		var tomatch = dependency.xml.replace(/\s/g, "[\\s]*"),
			result = new RegExp(tomatch, "g").exec(xml),
			substr = xml.substr(0, result.index),
			lineNo = substr.match(/\n/g).length + 1,
			message = mvn.getDependencyNotFoundMessage(dependency);

		ui.addLineMessage(message, lineNo, 0, file, "error");

	}

};
