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
		fs.writeFileSync(path, "");
		return path;
	},

	initLocations: function() {
		return "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
	},

	onReadComplete: function(cp, pom, self) {

		return function(xml) {
			var dependencies = self.MavenUtils.getDependencies(xml),
				locations = self.initLocations();
			console.log(dependencies);
			dependencies.each(function(index, xmlDependency) {
				console.log(dependencies[index], xmlDependency);
				var dependency = self.MavenUtils.parseDependency(xmlDependency),
					repoLocation = self.MavenUtils.getDependencyRepoLocation(dependency),
					exists = self.FileUtils.fileExists(repoLocation, false);
				if (!exists) {
					console.log(repoLocation);
					self.displayDependencyError(xml, dependency, pom.getPath(), self);
				} else {
					locations = locations + repoLocation + ";";
				}
			});
			fs.writeFileSync(cp, locations);
			console.info("atom-maven has finished configuring the classpath: " + cp);
		}

	},

	onReadFail: function(error) {
		console.error(error);
	},


	displayDependencyError: function(xml, dependency, file, self) {

		xml = xml.replace(/\s/g, "");

		console.log(dependency, xml.indexOf(dependency.xml.replace(/[\t ]/g, "")), xml);

		var substr = xml.substr(0, xml.indexOf(dependency.xml.replace(/[\t ]/g, "")));
		var lineNo = substr.match(/\n/g).length + 1;
		var message = "Dependency " + dependency.groupId + ":" + dependency.artifactId + ":" + dependency.version + " could not be found in the local repository.";

		self.UiUtils.addLineMessage(message, lineNo, 0, file, "error");

		/*
		var lines = xml.split("\n"),
			gid = false,
			aid = false,
			ver = false,
			lineNo = 0,
			message = "Dependency " + dependency.groupId + ":" + dependency.artifactId + ":" + dependency.version + " could not be found in the local repository.",
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
			if (line.indexOf(dependency.groupId) > -1) {
				gid = true;
			}
			if (line.indexOf(dependency.artifactId) > -1) {
				aid = true;
			}
			if (line.indexOf(dependency.version) > -1) {
				ver = true;
			}
			if (gid && aid && ver && !ignore && !exclusions) {
				self.UiUtils.addLineMessage(message, lineNo, 0, file, "error");
			}
		});
		*/
	}

};
