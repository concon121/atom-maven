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
			promise = self.MavenUtils.getPoms();

		promise.then(function (poms) {
			$.each(poms, function (index, pom) {
				var cp = self.initClasspath(pom.pomPath);
				pom.registerPomChangeEvent(function () {
					var ui = require('./uiUtils');
					var last = pom.lastDigest;
					if (last !== pom.getCurrentDigest()) {
						ui.clearFileMessages(pom.pomPath);
						var promise = pom.pomFile.read(false);
						promise.then(self.onReadComplete(cp, pom, self), self.onReadFail);
					}
				});
			});
		});
	},

	initClasspath: function (pomPath) {
		var path = pomPath.replace("pom.xml", ".classpath");
		fs.writeFileSync(path, "");
		return path;
	},

	initLocations: function () {
		return "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
	},

	onReadComplete: function (cp, pom, self) {

		return function (xml) {
			var locations = self.initLocations();
			self.MavenUtils.loadDependencies(xml, pom);
			$.each(pom.dependencies, function (index, dependency) {
				if (dependency.existsInRepo) {
					locations = locations + dependency.repoLocation + ";";
				} else {
					self.displayDependencyError(xml, dependency, pom.pomPath, self);
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
