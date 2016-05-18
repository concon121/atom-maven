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
		self.MavenUtils.getPoms();
		self.waitfor(self, function () {
			return (self.MavenUtils.noOfPoms > 0 && self.MavenUtils.pomModels.length === self.MavenUtils.noOfPoms);
		}, true, 1e4, 0, "Waiting for poms", function () {
			$.each(self.MavenUtils.pomModels, function (index, pom) {
				var cp = self.getClasspath(pom.pomPath),
					change = self.pomChange(cp, pom, self);
				change();
				pom.registerPomChangeEvent(function () {
					change();
				});
			});
		});
	},

	waitfor: function (self, test, expectedValue, msec, count, source, callback) {
		while (test() !== expectedValue) {
			count++;
			setTimeout(function () {
				self.waitfor(self, test, expectedValue, msec, count, source, callback);
			}, msec);
			return;
		}
		callback();
	},


	pomChange: function (cp, pom, self) {
		return function () {
			var ui = require('./uiUtils');
			var last = pom.lastDigest,
				current = pom.getCurrentDigest();
			current.then(function (digest) {
				if (last !== digest) {
					ui.clearFileMessages(pom.pomPath);
					fs.readFile(pom.pomPath, "utf8", (err, data) => {
						if (err) {
							console.error(err);
						} else {
							self.onReadComplete(cp, pom, self, data);
						}
					});
				}
			});
		}
	},

	getClasspath: function (pomPath) {
		return pomPath.replace("pom.xml", ".classpath");
	},

	initLocations: function () {
		return "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
	},

	onReadComplete: function (cp, pom, self, xml) {

		var locations = self.initLocations();
		self.MavenUtils.loadDependencies(xml, pom);
		locations = locations + self.convertDependencies(pom, self);
		fs.writeFile(cp, locations, (err) => {
			if (err) console.error(err);
		});
		console.info("atom-maven has finished configuring the classpath: " + cp);

	},

	convertDependencies: function (pom, self) {
		locations = "";
		$.each(pom.dependencies, function (index, dependency) {
			if (dependency.existsInRepo) {
				locations = locations + dependency.repoLocation + ";";
			} else {
				self.displayDependencyError(xml, dependency, pom.pomPath, self);
			}
		});
		if (!_.isEmpty(pom.parent)) {
			locations = locations + self.convertDependencies(pom.parent, self);
		}
		return locations;
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
