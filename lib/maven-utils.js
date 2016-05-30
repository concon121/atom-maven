var MavenUtils = function () {

	const _ = require('underscore');
	const $ = require('jquery');
	const fs = require('fs');
	const common = require('./common');
	const ui = require('./ui-utils');
	const file = require('./file-utils');
	const factory = require('./pom-factory');

	return {
		workspace: require('./workspace'),
		pomFileName: 'pom.xml',
		targetFileName: 'target',
		settings: common.fileSeparator + 'conf' + common.fileSeparator + 'settings.xml',
		repo: common.homeDir + common.fileSeparator + '.m2' + common.fileSeparator + 'repository' + common.fileSeparator,

		/* Scans the users PATH for the presence of Maven to determine where the
		 * global settings.xml file is located.
		 */
		getMavenGlobalSettings: function () {
			const self = this;
			var path = (common.isWin) ? process.env.Path : process.env.PATH;
			var mavenElems = $(path.split(common.pathSeparator)).filter(function () {
				return this.match(/^.*maven.*$/g);
			});
			var settingsFileLocation = '';
			if (mavenElems.length > 0) {
				var e = mavenElems[0];
				settingsFileLocation = (e.endsWith('bin')) ? e.replace('bin', self.settings) : e.concat(self.settings);
			} else {
				ui.addPlainMessage('Maven has not been found on the PATH, please ensure that Maven has been installed.', 'warning');
			}
			return settingsFileLocation;
		},

		/* Given the location of the maven settings.xml, the file is read with node
		 * fs, jquery then parses the xml and extracts the localRepository.
		 */
		findMavenRepoInSettings: function (settingsFileLocation, callback) {
			var self = this;
			fs.readFile(settingsFileLocation, 'utf8', (err, content) => {
				if (err) console.error(err);
				else {
					var repo = self.findInXml(content, 'localRepository', false);
					if (repo) {
						self.repo = (repo.text().endsWith(common.fileSeparator)) ? repo.text() : repo.text().concat(common.fileSeparator);
					}
					callback();
				}
			});
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
		setMavenRepo: function (callback) {

			var hasUserSettings = true;
			var hasGlobalSettings = true;
			var globalSettingsLocation = this.getMavenGlobalSettings();
			var settingsFileLocation = common.homeDir + common.fileSeparator + '.m2' + common.fileSeparator + 'settings.xml';

			// Check if user settings are present
			hasUserSettings = file.fileExists(settingsFileLocation, false);
			// if not, check if global settings are present
			if (!hasUserSettings) {
				settingsFileLocation = globalSettingsLocation;
				hasGlobalSettings = file.fileExists(settingsFileLocation, false);
			}

			// If either user or global settings have been found, check if a maven repo has been configured.
			if (hasUserSettings || hasGlobalSettings) {
				this.findMavenRepoInSettings(settingsFileLocation, () => {
					// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
					if (!this.repo.endsWith(common.fileSeparator)) {
						this.repo = this.repo.concat(common.fileSeparator);
					}
					callback();
				});
			} else {
				callback();
			}
		},

		isPom: function (file, self) {
			if (self) self = this;
			return (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName));
		},

		getPoms: function (callback) {
			const self = this;

			self.setMavenRepo(() => {
				atom.workspace.scan(/\<project.*/g, (match) => {
					if (match.filePath.endsWith('pom.xml') || match.filePath.endsWith('.pom')) {
						var promise = factory.getInstance(match.filePath, callback);
						promise.then((pom) => {
							console.log(pom, self.workspace);
							self.workspace.add(pom);
						});
					}
				});
			});

		},

		getDependencyNotFoundMessage: function (dependency) {
			return dependency.groupId + ':' + dependency.artifactId + ':' +
				dependency.version + ':' + dependency.type +
				' could not be found in the local repository.';
		},

		findInXml: function (xml, selector, children, pom) {
			var result;
			try {
				result = $($.parseXML(xml)).find(selector);
			} catch (err) {
				console.error(err);
				ui.addLineMessage('Invalid XML Document', null, null, (pom) ? pom.pomPath : null, 'error');
			}
			return (result && children) ? result.children() : result;
		},

		isInWorkspace: function (gavt) {
			return this.workspace.contains(gavt);
		},

		getDependencyRepoLocation: function (dependency, type) {
			var t = type || dependency.type;
			var exists = this.isInWorkspace(dependency);
			if (!_.isEmpty(exists)) {
				return exists.pomPath;
			} else {
				return this.repo + dependency.groupId.replace(/\./g, common.fileSeparator) +
					common.fileSeparator + dependency.artifactId + common.fileSeparator +
					dependency.version + common.fileSeparator + dependency.artifactId +
					'-' + dependency.version + '.' + t;
			}
		},

		getGAVT: function (pom, elem, type) {
			var version,
				scope;

			if (pom.hasContent(elem.version)) version = elem.version[0];
			if (pom.hasContent(elem.scope)) scope = elem.scope[0];
			return {
				groupId: (pom.hasContent(elem.groupId)) ? elem.groupId[0] : null,
				artifactId: (pom.hasContent(elem.artifactId)) ? elem.artifactId[0] : null,
				version: pom.resolveProperty(pom.resolveVersion(elem.groupId[0], elem.artifactId[0], version, pom), pom),
				type: (pom.hasContent(elem.type)) ? elem.type[0] : (type) ? type : 'jar',
				scope: pom.resolveScope(elem.groupId[0], elem.artifactId[0], scope, pom)
			};
		}

	};

};

module.exports = MavenUtils();
