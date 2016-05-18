var MavenUtils = function () {

	var _ = require('underscore'),
		$ = require('jquery'),
		fs = require('fs'),
		common = require('./common');

	return {

		poms: [],
		pomModels: [],
		pomFileName: 'pom.xml',
		targetFileName: 'target',
		FileUtils: require('./fileUtils'),
		noOfPoms: 0,

		/* Scans the users PATH for the presence of Maven to determine where the
		 * global settings.xml file is located.
		 */
		getMavenGlobalSettings: function () {
			var self = this,
				path = (common.isWin) ? process.env.Path : process.env.PATH,
				pathElems = path.split(common.pathSeparator),
				settings = "conf" + common.fileSeparator + "settings.xml",
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
			var self = this;
			fs.readFile(settingsFileLocation, "utf8", (err, content) => {
				var parsed = $.parseXML(content),
					xmlDoc = $(parsed),
					repo = xmlDoc.find("localRepository");
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

		isPom: function (file, self) {
			if (_.isEmpty(self)) {
				self = this;
			}
			if (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName)) {
				return true;
			} else {
				return false;
			}
		},

		addPoms: function (file, self, callback) {
			if (file.isDirectory()) {
				file.getEntries(function (error, entries) {
					if (error) {
						console.error(error);
					} else {
						$.each(entries, function (index, entry) {
							self.addPoms(entry, self, callback);
						});
					}
				});
			} else {
				if (self.isPom(file, self)) {
					self.poms.push(file);
					callback(file);
				}
			}
			return self.poms;
		},

		getPoms: function () {
			var rootDirectories = atom.workspace.project.getDirectories(),
				self = this;
			self.getNoOfPomsInWorkspace();

			function readPomFile(pom) {
				var pomResult = {
					pomFile: pom,
					pomPath: pom.getPath(),
					registerPomChangeEvent: function (callback) {
						this.pomFile.onDidChange(callback);
					},
					getCurrentDigest: function () {
						var promise = new Promise(function (resolve, reject) {
							fs.readFile(pom.getPath(), "utf8", (err, data) => {
								if (err) {
									console.error(err);
									reject(Error(err));
								} else {
									resolve(data.replace(/\s/g, ""));
								}
							});
						});
						return promise;
					}
				};

				fs.readFile(pom.getPath(), "utf8", (err, xml) => {
					if (err) {
						console.error(err);
					} else {
						pomResult.lastHash = xml.replace(/\s/g, "");
						self.loadPom(xml, pomResult);
					}
				});

				self.pomModels.push(pomResult);
			};

			$.each(rootDirectories, function (index, elem) {
				self.addPoms(elem, self, readPomFile);
			});

		},

		loadPom: function (xml, pom) {

			this.loadParent(xml, pom);
			this.loadProperties(xml, pom);
			this.loadDependencyManagement(xml, pom);
			this.loadDependencies(xml, pom);

		},

		loadParent: function (xml, pom) {
			var self = this,
				parent = self.getParent(xml);
			if (parent.length === 1) {
				var parentObj = self.parseDependency(parent, pom, "pom");
				if (parentObj.existsInRepo) {
					pom.parent = parentObj;
					fs.readFile(pom.parent.repoLocation, "utf8", (err, parentXml) => {
						self.loadPom(parentXml, pom.parent);
					});
				}
			}
		},

		loadProperties: function (xml, pom) {
			var self = this,
				props = self.getProperties(xml);
			pom.properties = [];
			props.each(function (index, prop) {
				var property = self.parseProperty(prop);
				pom.properties.push(property);
			});
		},

		loadDependencyManagement: function (xml, pom) {
			var self = this,
				depManagement = self.getDependencyManagement(xml);
			pom.dependencyManagement = [];
			depManagement.each(function (index, dep) {
				var managed = self.parseDependency(dep, pom);
				pom.dependencyManagement.push(managed);
			});
		},

		loadDependencies: function (xml, pom) {
			var self = this,
				dependencies = self.getDependencies(xml);
			pom.dependencies = [];
			dependencies.each(function (index, xmlDependency) {
				var dependency = self.parseDependency(xmlDependency, pom);
				pom.dependencies.push(dependency);
			});
		},

		getDependencies: function (xml) {
			var parsed = $.parseXML(xml),
				xmlDoc = $(parsed),
				dependenciesElem = xmlDoc.find("project > dependencies"),
				dependencies = dependenciesElem.children();
			return dependencies;
		},

		getParent: function (xml) {
			var parsed = $.parseXML(xml),
				xmlDoc = $(parsed),
				parent = xmlDoc.find("project > parent");
			return parent;
		},

		getProperties: function (xml) {
			var parsed = $.parseXML(xml),
				xmlDoc = $(parsed),
				props = xmlDoc.find("project > properties");
			return props.children();
		},

		getDependencyManagement: function (xml) {
			var parsed = $.parseXML(xml),
				xmlDoc = $(parsed),
				props = xmlDoc.find("project > dependencyManagement > dependencies");
			return props.children();
		},

		resolveProperty: function (property, pom) {
			var result = property;
			if (property.startsWith("${") && property.endsWith("}")) {
				if (!_.isEmpty(pom.properties)) {
					$.each(pom.properties, function (index, prop) {
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
					$.each(pom.dependencyManagement, function (index, managed) {
						if (managed.groupId === groupId && managed.artifactId === artifactId) {
							result = managed.version;
							return false;
						}
					});
				}
				if (result === version && !_.isEmpty(pom.parent)) {
					result = this.resolveVersion(groupId, artifactId, version, pom.parent);
				}
			}
			return result;
		},

		parseDependency: function (xmlDependency, pom, type) {
			type = (_.isEmpty(type)) ? "jar" : type;
			var dependency = $(xmlDependency),
				gId = this.resolveProperty($(dependency.find("groupId")[0]).text(), pom),
				aId = this.resolveProperty($(dependency.find("artifactId")[0]).text(), pom),
				v = this.resolveProperty(this.resolveVersion(gId, aId, $(dependency.find("version")[0]).text(), pom), pom),
				t = (dependency.find("type").length > 0) ? this.resolveProperty($(dependency.find("type")[0]).text(), pom) : type,
				x = dependency[0].outerHTML.replace(/<dependency xmlns.*"/g, '<dependency'),
				result = {
					groupId: gId,
					artifactId: aId,
					version: v,
					type: t,
					xml: x
				};

			result.repoLocation = this.getDependencyRepoLocation(result);
			result.existsInRepo = this.FileUtils.fileExists(result.repoLocation, false);

			return result;
		},

		parseProperty: function (property) {
			var prop = $(property);
			return {
				key: property.nodeName,
				value: prop.text()
			};
		},

		getDependencyRepoLocation: function (dependency) {
			return this.repo + dependency.groupId.replace(/\./g, common.fileSeparator) +
				common.fileSeparator + dependency.artifactId + common.fileSeparator +
				dependency.version + common.fileSeparator + dependency.artifactId +
				"-" + dependency.version + "." + dependency.type;
		},

		getDependencyNotFoundMessage: function (dependency) {
			return dependency.groupId + ":" + dependency.artifactId + ":" +
				dependency.version + ":" + dependency.type +
				" could not be found in the local repository.";
		},

		getNoOfPomsInWorkspace: function () {
			var self = this;
			atom.workspace.scan(/xmlns="http:\/\/maven\.apache\.org\/POM\/4\.0\.0"/, function (file) {
				self.noOfPoms++;
			});
		}

	};

};

module.exports = MavenUtils();
