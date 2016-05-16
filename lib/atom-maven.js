'use babel';

var common = require('./common');

export default {

	cpConfigFileName: '.classpath',
	fs: require('fs'),
	$: require('jquery'),
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
		var rootDirectories = atom.workspace.project.getDirectories(),
			self = this;
		self.$.each(rootDirectories, function(index, elem) {
			self.MavenUtils.isPom(elem, self);
		});

		self.$.each(self.MavenUtils.poms, function(index, elem) {
			var cp = self.createClasspath(elem);
			var result = elem.read(false);
			result.then(self.onReadComplete(cp, elem, self), self.onReadFail);
			elem.previousDigest = elem.getDigestSync();
			elem.onDidChange(function() {
				if (elem.previousDigest !== elem.getDigestSync()) {
					self.UiUtils.clearFileMessages(elem.getPath());
					var result = elem.read(false);
					result.then(self.onReadComplete(cp, elem, self), self.onReadFail);
					elem.previousDigest = elem.digest;
				}
			});
		});
	},

	createClasspath: function(pom) {
		var path = pom.path.replace("pom.xml", ".classpath");
		this.fs.writeFileSync(path, "");
		return path;
	},

	onReadComplete: function(cp, pom, self) {

		return function(xml) {
			var parsed = self.$.parseXML(xml),
				xmlDoc = self.$(parsed),
				dependenciesElem = xmlDoc.find("dependencies"),
				dependencies = dependenciesElem.children(),
				locations = "." + common.fileSeparator + "target" + common.fileSeparator + "classes;";
			dependencies.each(function(index, elem) {
				var dependency = self.$(elem),
					groupId = self.$(dependency.find("groupId")[0]).text(),
					artifactId = self.$(dependency.find("artifactId")[0]).text(),
					version = self.$(dependency.find("version")[0]).text(),
					location = self.MavenUtils.repo + groupId.replace(/\./g, "\\") + common.fileSeparator + artifactId + common.fileSeparator + version + common.fileSeparator + artifactId + "-" + version + ".jar",
					exists = self.FileUtils.fileExists(location, false);
				if (!exists) {
					self.displayDependencyError(xml, groupId, artifactId, version, pom.getPath(), self);
				} else {
					locations = locations + location + ";";
				}
			});
			self.fs.writeFileSync(cp, locations);
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
		self.$.each(lines, function(index, line) {
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
