'use babel';

var common = require('./common'),
	$ = require('jquery'),
	fs = require('fs'),
	_ = require('underscore');

export default {

	cpConfigFileName: '.classpath',
	MavenUtils: require('./mavenUtils'),
	UiUtils: require('./uiUtils'),
	FileUtils: require('./FileUtils'),

	activate: function (state) {
		this.MavenUtils.setMavenRepo();
		this.setup();
	},

	deactivate: function () {
		this.dependenciesInstalled = null;
		this.subscriptions.dispose();
	},

	setup: function () {
		console.info('atom-maven is configuring your classpath');

		var self = this;
		self.MavenUtils.getPoms(function (pom) {
			var cp = self.getClasspath(pom.pomPath);
			self.pomChange(cp, pom, self);
			self.MavenUtils.registerPomChangeEvent(pom, function () {
				self.pomChange(cp, pom, self);
			});
		});
	},

	pomChange: function (cp, pom, self) {
		var ui = require('./uiUtils');
		console.log(pom);
		ui.clearFileMessages(pom.pomPath);
		fs.readFile(pom.pomPath, "utf8", (err, xml) => {
			if (err) {
				console.error(err);
			} else {
				pom.xml = xml;
				var locations = self.initLocations();
				self.MavenUtils.loadDependencies(xml, pom);
				locations = locations + self.getClasspathFromDependencies(pom, self);
				fs.writeFile(cp, locations, (err) => {
					if (err) console.error(err);
				});
				console.info("atom-maven has finished configuring the classpath: " + cp);
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
		$.each(pom.dependencies, function (index, dependency) {
			if (dependency.existsInRepo) {
				locations = locations + dependency.repoLocation + ";";
			} else if (!_.isEmpty(pom.xml)) {
				self.displayDependencyError(pom.xml, dependency, pom.pomPath, self);
			}
		});
		if (!_.isEmpty(pom.parent)) {
			locations = locations + self.getClasspathFromDependencies(pom.parent, self);
		}
		return locations;
	},

	displayDependencyError: function (xml, dependency, file, self) {

		var tomatch = dependency.xml.replace(/\s/g, "[\\s]*"),
			result = new RegExp(tomatch, "g").exec(xml),
			substr = xml.substr(0, result.index),
			lineNo = substr.match(/\n/g).length + 1,
			message = self.MavenUtils.getDependencyNotFoundMessage(dependency);

		self.UiUtils.addLineMessage(message, lineNo, 0, file, "error");

	}

};
