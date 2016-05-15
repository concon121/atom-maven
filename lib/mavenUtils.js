var MavenUtils = function () {

	var _ = require('underscore'),
		$ = require('jquery'),
		fs = require('fs');

	return {

		poms: [],
		pomFileName: 'pom.xml',
		targetFileName: 'target',
		repo: null,
		FileUtils: require('./fileUtils').FileUtils,
		isWin: (/^win/.test(process.platform)),

		/* Scans the users PATH for the presence of Maven to determine where the
		 * global settings.xml file is located.
		 */
		getMavenGlobalSettings: function () {
			var self = this,
				path = (this.isWin) ? process.env.Path : process.env.PATH,
				pathElems = path.split(self.FileUtils.pathSeparator),
				settings = "conf" + self.FileUtils.fileSeparator + "settings.xml",
				settingsFileLocation = "";
			pathElems.every(function (elem) {
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
		findMavenRepoInSettings: function (settingsFileLocation) {
			var self = this,
				content = fs.readFileSync(settingsFileLocation, "utf8"),
				parsed = $.parseXML(content),
				xmlDoc = $(parsed),
				repo = xmlDoc.find("localRepository");
			self.repo = (repo.text().endsWith(self.FileUtils.fileSeparator)) ? repo.text() : repo.text().concat(self.FileUtils.fileSeparator);
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
		setMavenRepo: function (homeDir) {

			var hasUserSettings = true,
				hasGlobalSettings = true,
				hasCustomRepo = false,
				globalSettingsLocation = this.getMavenGlobalSettings(),
				settingsFileLocation = homeDir + this.FileUtils.fileSeparator + ".m2" + this.FileUtils.fileSeparator + "settings.xml";

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
				this.repo = homeDir + this.FileUtils.fileSeparator + ".m2" + this.FileUtils.fileSeparator + "repository";
			}

			// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
			if (!this.repo.endsWith(this.FileUtils.fileSeparator)) {
				this.repo = this.repo.concat(this.FileUtils.fileSeparator);
			}

		},

		isPom: function (file) {
			var self = this;
			if (file.isDirectory()) {
				$.each(file.getEntriesSync(), function (index, elem) {
					self.isPom(elem, self);
				});
			} else {
				if (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName)) {
					self.poms.push(file);
				}
			}

		},

	};

};

module.exports = {
	MavenUtils: MavenUtils()
};
