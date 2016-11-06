'use babel';
'use strict';

const fs = require('fs');
const common = require('./common');
const ui = require('./ui-utils');
const file = require('./file-utils');
const fsep = common.fileSeparator;
const ps = common.pathSeparator;

class MavenUtils {

	constructor() {
		this.pomFileName = 'pom.xml';
		this.targetFileName = 'target';
		this.settings = common.fileSeparator + 'conf' + common.fileSeparator + 'settings.xml';
		this.repo = common.homeDir + common.fileSeparator + '.m2' + common.fileSeparator + 'repository' + common.fileSeparator;
	}
}

MavenUtils.prototype.$ = require('jquery');

MavenUtils.prototype.getSettingsFromMavenHome = function (mavenHome) {
	return (mavenHome.endsWith(fsep + 'bin')) ? mavenHome.replace(fsep + 'bin', this.settings) : mavenHome.concat(this.settings);
};

MavenUtils.prototype.getSettingsFromPath = function () {
	var self = this;
	var path = (common.isWin) ? common.resolveEnvironmentVariable('Path') : common.resolveEnvironmentVariable('PATH');
	var settingsFileLocation = '';
	var mavenElems = path.split(ps).filter(function (elem) {
		return elem.match(/^.*(maven)|(M2)|(M3).*$/g);
	});
	if (mavenElems.length > 0) {
		settingsFileLocation = mavenElems[0];
		if (settingsFileLocation && (settingsFileLocation.indexOf('M2') >= 0 || settingsFileLocation.indexOf('M3') >= 0)) {
			settingsFileLocation = common.resolveEnvironmentVariable(settingsFileLocation.replace(fsep + 'bin'));
		}
		settingsFileLocation = self.getSettingsFromMavenHome(settingsFileLocation);
		self.mavenIsInstalled = true;
	}
	return settingsFileLocation;
};

MavenUtils.prototype.getM2Value = function () {
	return process.env.M2 || process.env.M2_HOME || 'NA';
};

MavenUtils.prototype.getSettingsFromM2 = function () {
	var path = this.getM2Value();
	var settingsFileLocation = '';
	if (path !== 'NA') {
		settingsFileLocation = this.getSettingsFromMavenHome(path);
		this.mavenIsInstalled = true;
	}
	return settingsFileLocation;
};

MavenUtils.prototype.getAtomMavenConfig = function (value) {
	return atom.config.get('atom-maven')[value];
};

/* Scans the users PATH for the presence of Maven to determine where the
 * global settings.xml file is located.
 */
MavenUtils.prototype.getMavenGlobalSettings = function () {
	const self = this;

	var configuredMavenHome = self.getAtomMavenConfig('mavenHome');
	var settingsFileLocation = '';

	if (configuredMavenHome) {
		settingsFileLocation = self.getSettingsFromMavenHome(configuredMavenHome);
	} else {
		settingsFileLocation = self.getSettingsFromPath() || self.getSettingsFromM2();
	}
	if (!settingsFileLocation) {
		var errorMsg = 'Maven has not been found on the PATH, please ensure that Maven has been installed.';
		ui.warning(errorMsg);
		self.mavenIsInstalled = false;
	}
	return settingsFileLocation;
};

/* Given the location of the maven settings.xml, the file is read with node
 * fs, jquery then parses the xml and extracts the localRepository.
 */
MavenUtils.prototype.findMavenRepoInSettings = function (settingsFileLocation, callback) {
	const self = this;
	fs.readFile(settingsFileLocation, 'utf8', (err, content) => {
		if (err) {
			console.error(err);
		} else {
			var repo = self.findInXml(content, 'localRepository', false);
			if (repo) {
				self.repo = (repo.text().endsWith(fsep)) ? repo.text() : repo.text().concat(fsep);
			}
			callback();
		}
	});
};

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
MavenUtils.prototype.setMavenRepo = function (callback) {
	const home = common.homeDir;
	const self = this;
	var hasUserSettings = true;
	var hasGlobalSettings = true;
	var globalSettingsLocation = self.getMavenGlobalSettings();
	var settingsFileLocation = home + fsep + '.m2' + fsep + 'settings.xml';

	// Check if user settings are present
	hasUserSettings = file.fileExists(settingsFileLocation, false);
	// if not, check if global settings are present

	if (!hasUserSettings) {
		settingsFileLocation = globalSettingsLocation;
		hasGlobalSettings = file.fileExists(settingsFileLocation, false);
	}

	// If either user or global settings have been found, check if a maven repo has been configured.
	if (hasUserSettings || hasGlobalSettings) {
		self.findMavenRepoInSettings(settingsFileLocation, () => {
			// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
			if (!self.repo.endsWith(fsep)) {
				self.repo = self.repo.concat(fsep);
			}
			if (callback) {
				callback();
			}
		});
	} else {
		if (callback) {
			callback();
		}
	}
};

MavenUtils.prototype.getDependencyNotFoundMessage = function (dependency) {
	return dependency.groupId + ':' + dependency.artifactId + ':' +
		dependency.version + ':' + dependency.type +
		' could not be found in the local repository.';
};

MavenUtils.prototype.findInXml = function (xml, selector, children, pom) {
	var result;
	try {
		result = this.$(this.$.parseXML(xml)).find(selector);
	} catch (err) {
		console.error(err);
		ui.error('Invalid XML Document', null, null, (pom) ? pom.pomPath : null);
	}
	return (result && children) ? result.children() : result;
};

module.exports = new MavenUtils();
