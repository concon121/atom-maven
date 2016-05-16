var MavenUtils = function() {

	var _ = require('underscore'),
		$ = require('jquery'),
		fs = require('fs'),
		common = require('./common');

	return {

		poms: [],
		pomFileName: 'pom.xml',
		targetFileName: 'target',
		FileUtils: require('./fileUtils'),

		/* Scans the users PATH for the presence of Maven to determine where the
		 * global settings.xml file is located.
		 */
		getMavenGlobalSettings: function() {
			var self = this,
				path = (common.isWin) ? process.env.Path : process.env.PATH,
				pathElems = path.split(common.pathSeparator),
				settings = "conf" + common.fileSeparator + "settings.xml",
				settingsFileLocation = "";
			pathElems.every(function(elem) {
				if (elem.indexOf("maven") > -1) {
					settingsFileLocation = (elem.endsWith("bin")) ? elem.replace("bin", settings) : elem.concat(settings);
					return false;
				}
				return true;
			});
			if (settingsFileLocation === "") {
				console.error("Maven has not been found on the PATH, please ensure that Maven has been installed.");
				self.addPlainMessage("Maven has not been found on the PATH, please ensure that Maven has been installed.", "error");
			}
			return settingsFileLocation;
		},


		/* Given the location of the maven settings.xml, the file is read with node
		 * fs, jquery then parses the xml and extracts the localRepository.
		 */
		findMavenRepoInSettings: function(settingsFileLocation) {
			var self = this,
				content = fs.readFileSync(settingsFileLocation, "utf8"),
				parsed = $.parseXML(content),
				xmlDoc = $(parsed),
				repo = xmlDoc.find("localRepository");
			self.repo = (repo.text().endsWith(common.fileSeparator)) ? repo.text() : repo.text().concat(common.fileSeparator);
		},


		/* Checks maven settings for a localRepository which deviates from the maven
		 * default.
		 * User settings take priority:
		 * 			${user.home}/.m2/settings.xml
		 * Global settings are used if no user settings are found:
		 * 			${maven.home}/conf/settings.xml
		 * If a localRepository is not present in either the user or global settings,
		 * use the default repository:
		 * 			${user.home}/.m2/repository
		 */
		setMavenRepo: function() {

			var hasUserSettings = true,
				hasGlobalSettings = true,
				hasCustomRepo = false,
				globalSettingsLocation = this.getMavenGlobalSettings(),
				settingsFileLocation = common.homeDir + common.fileSeparator + ".m2" + common.fileSeparator + "settings.xml";

			// Check if user settings are present
			hasUserSettings = this.FileUtils.fileExists(settingsFileLocation, false);
			// if not, check if global settings are present
			if (!hasUserSettings) {
				settingsFileLocation = globalSettingsLocation;
				hasGlobalSettings = this.FileUtils.fileExists(settingsFileLocation, false);
			}

			// If either user or global settings have been found, check if a maven repo has been configured.
			if (hasUserSettings || hasGlobalSettings) {
				this.findMavenRepoInSettings(settingsFileLocation);
			}

			// If the local repo has not been determined so far, assume the default repository is present.
			//		if (this.repo === undefined || this.repo === null || this.repo.trim() === "") {
			if (_.isEmpty(this.repo)) {
				this.repo = common.homeDir + common.fileSeparator + ".m2" + common.fileSeparator + "repository";
			}

			// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
			if (!this.repo.endsWith(common.fileSeparator)) {
				this.repo = this.repo.concat(common.fileSeparator);
			}

		},

		isPom: function(file, self) {
			if (_.isEmpty(self)) {
				self = this;
			}
			if (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName)) {
				return true;
			} else {
				return false;
			}
		},

		addPoms: function(file) {
			var self = this;
			if (file.isDirectory()) {
				$.each(file.getEntriesSync(), function(index, elem) {
					self.addPoms(elem, self);
				});
			} else {
				if (self.isPom(file, self)) {
					self.poms.push(file);
				}
			}

		},

		getPoms: function() {
			var rootDirectories = atom.workspace.project.getDirectories(),
				self = this;
			$.each(rootDirectories, function(index, elem) {
				self.addPoms(elem, self);
			});
			return self.poms;
		},

		parsePom: function(pom, successCallback, errorCallback) {

			var promise = pom.read(false),
				ui = require('./uiUtils');
			promise.then(successCallback, errorCallback);
			pom.previousDigest = pom.getDigestSync();
			pom.onDidChange(function() {
				if (pom.previousDigest !== pom.getDigestSync()) {
					ui.clearFileMessages(pom.getPath());
					var changedPromise = pom.read(false);
					changedPromise.then(successCallback, errorCallback);
					pom.previousDigest = pom.digest;
				}
			});

		},

		getDependencies: function(xml) {
			var parsed = $.parseXML(xml),
				xmlDoc = $(parsed),
				dependenciesElem = xmlDoc.find("dependencies"),
				dependencies = dependenciesElem.children();
			return dependencies;
		},

		parseDependency: function(xmlDependency) {
			var dependency = $(xmlDependency);
			console.log(dependency[0].outerHTML.replace(/<dependency xmlns.*"/g, '<dependency'), dependency);
			return {
				groupId: $(dependency.find("groupId")[0]).text(),
				artifactId: $(dependency.find("artifactId")[0]).text(),
				version: $(dependency.find("version")[0]).text(),
				xml: dependency[0].outerHTML.replace(/<dependency xmlns.*"/g, '<dependency')
			};
		},

		getDependencyRepoLocation: function(dependency) {
			// TODO: replace properly.
			return this.repo + dependency.groupId.replace(/\./g, "\\") + common.fileSeparator + dependency.artifactId + common.fileSeparator + dependency.version + common.fileSeparator + dependency.artifactId + "-" + dependency.version + ".jar";
		}

	};

};

module.exports = MavenUtils();
