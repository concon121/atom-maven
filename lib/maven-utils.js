var MavenUtils = function () {

	var _ = require('underscore'),
		$ = require('jquery'),
		fs = require('fs'),
		common = require('./common'),
		ui = require('./ui-utils'),
		file = require('./file-utils');

	return {

		poms: [],
		pomModels: [],
		pomFileName: 'pom.xml',
		targetFileName: 'target',
		settings: common.fileSeparator + "conf" + common.fileSeparator + "settings.xml",
		repo: common.homeDir + common.fileSeparator + ".m2" + common.fileSeparator + "repository",

		/* Scans the users PATH for the presence of Maven to determine where the
		 * global settings.xml file is located.
		 */
		getMavenGlobalSettings: function () {
			var self = this,
				path = (common.isWin) ? process.env.Path : process.env.PATH,
				mavenElems = $(path.split(common.pathSeparator)).filter(function () {
					return this.match(/^.*maven.*$/g);
				}),
				settingsFileLocation = "";
			if (mavenElems.length > 0) {
				var e = mavenElems[0];
				settingsFileLocation = (e.endsWith("bin")) ? e.replace("bin", self.settings) : e.concat(self.settings);
			} else {
				ui.addPlainMessage("Maven has not been found on the PATH, please ensure that Maven has been installed.", "warning");
			}
			return settingsFileLocation;
		},


		/* Given the location of the maven settings.xml, the file is read with node
		 * fs, jquery then parses the xml and extracts the localRepository.
		 */
		findMavenRepoInSettings: function (settingsFileLocation) {
			var self = this;
			fs.readFile(settingsFileLocation, "utf8", (err, content) => {
				var repo = self.findInXml(content, "localRepository", false);
				self.repo = (repo.text().endsWith(common.fileSeparator)) ? repo.text() : repo.text().concat(common.fileSeparator);
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
		setMavenRepo: function () {

			var hasUserSettings = true,
				hasGlobalSettings = true,
				hasCustomRepo = false,
				globalSettingsLocation = this.getMavenGlobalSettings(),
				settingsFileLocation = common.homeDir + common.fileSeparator + ".m2" + common.fileSeparator + "settings.xml";

			// Check if user settings are present
			hasUserSettings = file.fileExists(settingsFileLocation, false);
			// if not, check if global settings are present
			if (!hasUserSettings) {
				settingsFileLocation = globalSettingsLocation;
				hasGlobalSettings = file.fileExists(settingsFileLocation, false);
			}

			// If either user or global settings have been found, check if a maven repo has been configured.
			if (hasUserSettings || hasGlobalSettings) {
				this.findMavenRepoInSettings(settingsFileLocation);
			}

			// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
			if (!this.repo.endsWith(common.fileSeparator)) {
				this.repo = this.repo.concat(common.fileSeparator);
			}

		},

		isPom: function (file, self) {
			if (self) self = this;
			return (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName));
		},

		addPoms: function (file, self, callback) {
			if (file.isDirectory()) file.getEntries((error, entries) => {
				if (error) console.error(error);
				else $.each(entries, (index, entry) => {
					self.addPoms(entry, self, callback);
				});
			});
			else {
				if (self.isPom(file, self)) {
					self.poms.push(file);
					callback(file);
				}
			}
		},

		getPoms: function (callback) {
			var rootDirectories = atom.workspace.project.getDirectories(),
				self = this;

			function readPomFile(pom) {
				var pomResult = {
					pomFile: pom,
					pomPath: pom.getPath()
				};

				fs.readFile(pom.getPath(), "utf8", (err, xml) => {
					if (err) console.error(err);
					else {
						pomResult.lastHash = xml.replace(/\s/g, "");
						self.loadPom(xml, pomResult, callback);
					}
				});

				self.pomModels.push(pomResult);
			};

			$.each(rootDirectories, (index, elem) => {
				self.addPoms(elem, self, readPomFile);
			});

		},

		registerPomChangeEvent: function (pom, callback) {
			pom.pomFile.onDidChange(callback);
		},

		loadPom: function (xml, pom, callback) {
			var self = this;
			self.loadParent(xml, pom, () => {
				self.loadProperties(xml, pom, () => {
					self.loadDependencyManagement(xml, pom, () => {
						self.loadDependencies(xml, pom, () => {
							if (callback && typeof callback === 'function') callback(pom);
						});
					});
				});
			});
		},

		loadParent: function (xml, pom, callback) {
			var self = this,
				parent = self.findInXml(xml, "project > parent", false);
			if (parent.length === 1) {
				var parentObj = self.parseDependency(parent, pom, "pom");
				if (parentObj.existsInRepo) {
					pom.parent = parentObj;
					fs.readFile(pom.parent.repoLocation, "utf8", (err, parentXml) => {
						self.loadPom(parentXml, pom.parent);
						callback();
					});
				}
			} else {
				callback();
			}
		},

		loadProperties: function (xml, pom, callback) {
			var self = this,
				props = self.findInXml(xml, "project > properties", true);
			pom.properties = [];
			props.each((index, prop) => {
				var property = self.parseProperty(prop);
				pom.properties.push(property);
			});
			callback();
		},

		loadDependencyManagement: function (xml, pom, callback) {
			var self = this,
				depManagement = self.findInXml(xml, "project > dependencyManagement > dependencies", true);
			pom.dependencyManagement = [];
			depManagement.each((index, dep) => {
				var managed = self.parseDependency(dep, pom);
				pom.dependencyManagement.push(managed);
			});
			callback();
		},

		loadDependencies: function (xml, pom, callback) {
			var self = this,
				dependencies = self.findInXml(xml, "project > dependencies", true);
			pom.dependencies = [];
			dependencies.each((index, xmlDependency) => {
				var dependency = self.parseDependency(xmlDependency, pom);
				pom.dependencies.push(dependency);
			});
			if (callback && typeof callback === 'function') callback();
		},

		findInXml: function (xml, selector, children) {
			var result = $($.parseXML(xml)).find(selector);
			return (children) ? result.children() : result;
		},

		resolveProperty: function (property, pom) {
			var result = property;
			if (property.startsWith("${") && property.endsWith("}")) {
				if (!_.isEmpty(pom.properties)) {
					$.each(pom.properties, (index, prop) => {
						if (property.indexOf(prop.key) > -1) {
							result = prop.value;
							return false;
						}
					});
				}
				if (result === property && !_.isEmpty(pom.parent)) {
					result = this.resolveProperty(property, pom.parent);
				}
			}
			return result;
		},

		resolveVersion: function (groupId, artifactId, version, pom) {
			var result = version;
			if (_.isEmpty(version)) {
				if (!_.isEmpty(pom.dependencyManagement)) {
					$.each(pom.dependencyManagement, (index, managed) => {
						if (managed.groupId === groupId && managed.artifactId === artifactId) {
							result = managed.version;
							return false;
						}
					});
				}
				if (result === version && pom.parent) {
					result = this.resolveVersion(groupId, artifactId, version, pom.parent);
				}
			}
			return result;
		},

		parseDependency: function (xmlDependency, pom, type) {
			type = (_.isEmpty(type)) ? "jar" : type;
			var dependency = $(xmlDependency),
				g = this.resolveProperty($(dependency.find("groupId")[0]).text(), pom),
				a = this.resolveProperty($(dependency.find("artifactId")[0]).text(), pom),
				v = this.resolveProperty(this.resolveVersion(g, a, $(dependency.find("version")[0]).text(), pom), pom),
				t = (dependency.find("type").length > 0) ? this.resolveProperty($(dependency.find("type")[0]).text(), pom) : type,
				x = dependency[0].outerHTML.replace(/<dependency xmlns.*"/g, '<dependency'),
				result = {
					groupId: g,
					artifactId: a,
					version: v,
					type: t,
					xml: x
				};

			result.repoLocation = this.getDependencyRepoLocation(result);
			result.pomPath = this.getDependencyRepoLocation(result, "pom");
			result.existsInRepo = file.fileExists(result.repoLocation, false);

			return result;
		},

		parseProperty: function (property) {
			return {
				key: property.nodeName,
				value: $(property).text()
			};
		},

		getDependencyRepoLocation: function (dependency, type) {
			var t = dependency.type || type;
			return this.repo + dependency.groupId.replace(/\./g, common.fileSeparator) +
				common.fileSeparator + dependency.artifactId + common.fileSeparator +
				dependency.version + common.fileSeparator + dependency.artifactId +
				"-" + dependency.version + "." + t;
		},

		getDependencyNotFoundMessage: function (dependency) {
			return dependency.groupId + ":" + dependency.artifactId + ":" +
				dependency.version + ":" + dependency.type +
				" could not be found in the local repository.";
		},

	};

};

module.exports = MavenUtils();
