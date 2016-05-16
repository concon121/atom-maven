'use babel';

var common = require('./common'),
	$ = require('jquery'),
	fs = require('fs');

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

		var self = this,
			poms = self.MavenUtils.getPoms();

		$.each(poms, function (index, pom) {
			var cp = self.initClasspath(pom);
			self.MavenUtils.parsePom(pom, self.onReadComplete(cp, pom, self), self.onReadFail);
		});
	},

	initClasspath: function (pom) {
		var path = pom.path.replace("pom.xml", ".classpath");
		fs.writeFileSync(path, "");
		return path;
	},

	initLocations: function () {
		return "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
	},

	onReadComplete: function (cp, pom, self) {

		return function (xml) {
			var dependencies = self.MavenUtils.getDependencies(xml),
				locations = self.initLocations();
			dependencies.each(function (index, xmlDependency) {
				var dependency = self.MavenUtils.parseDependency(xmlDependency),
					repoLocation = self.MavenUtils.getDependencyRepoLocation(dependency),
					exists = self.FileUtils.fileExists(repoLocation, false);
				if (!exists) {
					self.displayDependencyError(xml, dependency, pom.getPath(), self);
				} else {
					locations = locations + repoLocation + ";";
				}
			});
			fs.writeFileSync(cp, locations);
			console.info("atom-maven has finished configuring the classpath: " + cp);
		}

	},

	onReadFail: function (error) {
		console.error(error);
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
