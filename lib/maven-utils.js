'use babel';

const _ = require('underscore');

class MavenUtils {

	constructor() {

		this.fs = require('fs');
		this.common = require('./common');
		this.ui = require('./ui-utils');
		this.file = require('./file-utils');
		this.factory = require('./pom-factory');

		this.workspace = require('./workspace');
		this.pomFileName = 'pom.xml';
		this.targetFileName = 'target';
		this.settings = this.common.fileSeparator + 'conf' + this.common.fileSeparator + 'settings.xml';
		this.repo = this.common.homeDir + this.common.fileSeparator + '.m2' + this.common.fileSeparator + 'repository' + this.common.fileSeparator;

	}
}

/* Scans the users PATH for the presence of Maven to determine where the
 * global settings.xml file is located.
 */
MavenUtils.prototype.getMavenGlobalSettings = function (path) {
	const self = this;
	const fs = self.common.fileSeparator;
	const ps = self.common.pathSeparator;
	var mavenElems = path.split(ps).filter(function (elem) {
		return elem.match(/^.*(maven)|(M2)|(M3).*$/g);
	});
	var settingsFileLocation = '';
	if (mavenElems.length > 0) {
		var e = mavenElems[0];
		if (e && (e.indexOf('M2') >= 0 || e.indexOf('M3') >= 0)) {
			e = self.common.resolveEnvironmentVariable(e.replace(fs + 'bin'));
		}
		settingsFileLocation = (e.endsWith(fs + 'bin')) ? e.replace(fs + 'bin', self.settings) : e.concat(self.settings);
		self.mavenIsInstalled = true;
	} else {
		self.ui.warning('Maven has not been found on the PATH, please ensure that Maven has been installed.');
		self.mavenIsInstalled = false;
	}
	return settingsFileLocation;
};

/* Given the location of the maven settings.xml, the file is read with node
 * fs, jquery then parses the xml and extracts the localRepository.
 */
MavenUtils.prototype.findMavenRepoInSettings = function (settingsFileLocation, callback) {
	const self = this;
	const fs = self.common.fileSeparator;
	self.fs.readFile(settingsFileLocation, 'utf8', (err, content) => {
		if (err) {
			console.error(err);
		} else {
			var repo = self.findInXml(content, 'localRepository', false);
			if (repo) {
				self.repo = (repo.text().endsWith(fs)) ? repo.text() : repo.text().concat(fs);
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
	const self = this;
	const home = self.common.homeDir;
	const fs = self.common.fileSeparator;
	var hasUserSettings = true;
	var hasGlobalSettings = true;
	var path = (self.common.isWin) ? process.env.Path : process.env.PATH;
	var globalSettingsLocation = this.getMavenGlobalSettings(path);
	var settingsFileLocation = home + fs + '.m2' + fs + 'settings.xml';

	// Check if user settings are present
	hasUserSettings = self.file.fileExists(settingsFileLocation, false);
	// if not, check if global settings are present
	if (!hasUserSettings) {
		settingsFileLocation = globalSettingsLocation;
		hasGlobalSettings = self.file.fileExists(settingsFileLocation, false);
	}

	// If either user or global settings have been found, check if a maven repo has been configured.
	if (hasUserSettings || hasGlobalSettings) {
		this.findMavenRepoInSettings(settingsFileLocation, () => {
			// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
			if (!this.repo.endsWith(fs)) {
				this.repo = this.repo.concat(fs);
			}
			callback();
		});
	} else {
		callback();
	}
};

MavenUtils.prototype.isPom = function (file, self) {
	if (self) {
		self = this;
	}
	return (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName));
};

MavenUtils.prototype.getPoms = function (callback) {
	const self = this;

	self.setMavenRepo(() => {
		atom.workspace.scan(/<project.*/g, (match) => {
			if (match.filePath.endsWith('pom.xml') || match.filePath.endsWith('.pom')) {
				if (self.mavenIsInstalled) {
					var promise = self.factory.getInstance(match.filePath, callback);
					promise.then((pom) => {
						self.workspace.add(pom);
						callback(pom);
					});
				}
			}
		});
	});

};

MavenUtils.prototype.getDependencyNotFoundMessage = function (dependency) {
	return dependency.groupId + ':' + dependency.artifactId + ':' +
		dependency.version + ':' + dependency.type +
		' could not be found in the local repository.';
};

MavenUtils.prototype.findInXml = function (xml, selector, children, pom) {
	const self = this;
	var result;
	try {
		result = $($.parseXML(xml)).find(selector);
	} catch (err) {
		console.error(err);
		self.ui.error('Invalid XML Document', null, null, (pom) ? pom.pomPath : null);
	}
	return (result && children) ? result.children() : result;
};

MavenUtils.prototype.isInWorkspace = function (gavt) {
	return this.workspace.contains(gavt);
};

MavenUtils.prototype.getDependencyRepoLocation = function (dependency, type) {
	const self = this;
	const fs = self.common.fileSeparator;
	var t = type || dependency.type;
	var exists = this.isInWorkspace(dependency);
	if (!_.isEmpty(exists)) {
		return exists.pomPath;
	} else {
		return this.repo + dependency.groupId.replace(/\./g, fs) + fs +
			dependency.artifactId + fs + dependency.version + fs +
			dependency.artifactId + '-' + dependency.version + '.' + t;
	}
};

MavenUtils.prototype.getGAVT = function (pom, elem, type) {
	var version,
		scope;

	if (pom.hasContent(elem.version)) {
		version = elem.version[0];
	}
	if (pom.hasContent(elem.scope)) {
		scope = elem.scope[0];
	}
	return {
		groupId: (pom.hasContent(elem.groupId)) ? elem.groupId[0] : null,
		artifactId: (pom.hasContent(elem.artifactId)) ? elem.artifactId[0] : null,
		version: pom.resolveProperty(pom.resolveVersion(elem.groupId[0], elem.artifactId[0], version, pom), pom),
		type: (pom.hasContent(elem.type)) ? elem.type[0] : (type) ? type : 'jar',
		scope: pom.resolveScope(elem.groupId[0], elem.artifactId[0], scope, pom)
	};
};

module.exports = new MavenUtils();
