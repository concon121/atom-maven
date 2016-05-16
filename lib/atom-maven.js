'use babel';

var common = require('./common'),
	$ = require('jquery'),
	fs = require('fs');

export default {

	cpConfigFileName: '.classpath',
	MavenUtils: require('./mavenUtils'),
	UiUtils: require('./uiUtils'),
	FileUtils: require('./FileUtils'),

	activate: function(state) {
		this.MavenUtils.setMavenRepo();
		this.setup();
	},

	deactivate: function() {
		this.dependenciesInstalled = null;
		this.subscriptions.dispose();
	},

	setup: function() {
		console.info('atom-maven is configuring your classpath');

		var self = this,
			poms = self.MavenUtils.getPoms();

		$.each(poms, function(index, pom) {
			var cp = self.initClasspath(pom);
			self.MavenUtils.parsePom(pom, self.onReadComplete(cp, pom, self), self.onReadFail);
		});
	},

	initClasspath: function(pom) {
		var path = pom.path.replace("pom.xml", ".classpath");
		this.fs.writeFileSync(path, "");
		return path;
	},

	initLocations: function() {
		return "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
	}

		onReadComplete: function(cp, pom, self) {

		return function(xml) {
			var dependencies = self.MavenUtils.getDependencies(xml),
				locations = self.initLocations();
			dependencies.each(function(index, xmlDependency) {
				var dependency = self.MavenUtils.parseDependency(xmlDependency);
				location = self.MavenUtils.repo + groupId.replace(/\./g, "\\") + common.fileSeparator + artifactId + common.fileSeparator + version + common.fileSeparator + artifactId + "-" + version + ".jar",
					exists = self.FileUtils.fileExists(location, false);
				if (!exists) {
					console.log(location);
					self.displayDependencyError(xml, groupId, artifactId, version, pom.getPath(), self);
				} else {
					locations = locations + location + ";";
				}
			});
			fs.writeFileSync(cp, locations);
			console.info("atom-maven has finished configuring the classpath: " + cp);
		}

	},

	onReadFail: function(error) {
		console.error(error);
	},


	displayDependencyError: function(xml, groupId, artifactId, version, file, self) {
		var lines = xml.split("\n"),
			gid = false,
			aid = false,
			ver = false,
			lineNo = 0,
			message = "Dependency " + groupId + ":" + artifactId + ":" + version + " could not be found in the local repository.",
			ignore = false,
			exclusions = false;
		$.each(lines, function(index, line) {
			line = line.trim();
			ignore = false;
			if (line.indexOf("</dependency>") > -1) {
				gid = false;
				aid = false;
				ver = false;
				lineNo = index + 1;
			}
			if (line.indexOf("scope") > -1 || line.indexOf("type") > -1) {
				ignore = true;
			}
			if (line.indexOf("<exclusions>") > -1) {
				exclusions = true;
			}
			if (line.indexOf("</exclusions>") > -1) {
				exclusions = false;
				ignore = true;
			}
			if (line.indexOf(groupId) > -1) {
				gid = true;
			}
			if (line.indexOf(artifactId) > -1) {
				aid = true;
			}
			if (line.indexOf(version) > -1) {
				ver = true;
			}
			if (gid && aid && ver && !ignore && !exclusions) {
				self.UiUtils.addLineMessage(message, lineNo, 0, file, "error");
			}
		});
	}

};
