'use babel';

export default {

	cpConfigFileName: '.classpath',
	fs: require('fs'),
	$: require('jquery'),
	MavenUtils: require('./mavenUtils').MavenUtils,
	UiUtils: require('./uiUtils').UiUtils,
	FileUtils: require('./FileUtils').FileUtils,

	activate(state) {
		// Set up concenience variables to be used later on
		this.isWin = (/^win/.test(process.platform));
		this.homeDir = (this.isWin) ? process.env.HOMEPATH : process.env.HOME;

		// Can be done on activation as this shouldn't change
		this.MavenUtils.setMavenRepo(this.homeDir);
		this.toggle();
	},

	deactivate() {
		this.dependenciesInstalled = null;
		this.subscriptions.dispose();
	},

	toggle() {
		console.info('atom-maven is configuring your classpath');
		var rootDirectories = atom.workspace.project.getDirectories(),
			self = this;

		self.$.each(rootDirectories, function (index, elem) {
			self.MavenUtils.isPom(elem, self);
		});

		self.$.each(self.MavenUtils.poms, function (index, elem) {
			var cp = self.createClasspath(elem);
			var result = elem.read(false);
			result.then(self.onReadComplete(cp, elem, self), self.onReadFail);
			elem.previousDigest = elem.getDigestSync();
			elem.onDidChange(function () {
				if (elem.previousDigest !== elem.getDigestSync()) {
					var result = elem.read(false);
					result.then(self.onReadComplete(cp, elem, self), self.onReadFail);
					elem.previousDigest = elem.digest;
				}
			});
		});
	},

	createClasspath(pom) {
		var path = pom.path.replace("pom.xml", ".classpath");
		this.fs.writeFileSync(path, "");
		return path;
	},

	onReadComplete(cp, pom, self) {

		return function (xml) {
			var parsed = self.$.parseXML(xml),
				xmlDoc = $(parsed),
				dependenciesElem = xmlDoc.find("dependencies"),
				dependencies = dependenciesElem.children(),
				locations = ".;";
			dependencies.each(function (index, elem) {
				var dependency = self.$(elem),
					groupId = dependency.find("groupId").text().replace(/\./g, "\\"),
					artifactId = dependency.find("artifactId").text(),
					version = dependency.find("version").text(),
					location = self.MavenUtils.repo + groupId + self.FileUtils.fileSeparator + artifactId + self.FileUtils.fileSeparator + version + self.FileUtils.fileSeparator + artifactId + "-" + version + ".jar",
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

	onReadFail(error) {
		console.error(error);
	},


	displayDependencyError(xml, groupId, artifactId, version, file, self) {
		var lines = xml.split("\n"),
			gid = false,
			aid = false,
			ver = false,
			lineNo = 0,
			message = "Dependency " + groupId + ":" + artifactId + ":" + version + " could not be found in the local repository.";
		$.each(lines, function (index, line) {
			line = line.trim();
			if (line.indexOf("dependency") > -1) {
				gid = false;
				aid = false;
				ver = false;
				lineNo = index + 1;
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
			if (gid && aid && ver) {
				self.UiUtils.addLineMessage(message, lineNo, 0, file, "error");
			}
		});
	},

};
