var PomFactory = function () {

	var common = require('./common'),
		$ = require('jquery'),
		fs = require('fs'),
		file = require('./file-utils'),
		mvn = require('./maven-utils');

	var Pom = function () {

		return {

			changeEvents: [],

			registerChangeEvent: function (callback) {
				if (this.pomPath) {
					this.changeEvents.push(callback);
					fs.watch(this.pomPath, (event) => {
						callback();
					});
				}
			},

			load: function (callback) {
				var self = this;
				fs.readFile(self.pomPath, "utf8", (err, xml) => {
					if (err) console.error(err);
					else {
						self.loadParent(xml, self, () => {
							self.loadProperties(xml, self, () => {
								self.loadDependencyManagement(xml, self, () => {
									self.loadGav(xml, self, () => {
										self.loadDependencies(xml, self, () => {
											if (callback && typeof callback === 'function') callback(self);
										});
									});
								});
							});
						});
					}
				});
			},

			loadParent: function (xml, pom, callback) {
				var self = this,
					parent = mvn.findInXml(xml, "project > parent", false, self);
				if (parent && parent.length === 1) {
					var parentGav = self.parseDependency(parent, pom, "pom"),
						parentObj = Pom();
					parentObj.artifactId = parentGav.artifactId;
					parentObj.groupId = parentGav.groupId;
					parentObj.version = parentGav.version;
					parentObj.type = parentGav.type;
					parentObj.xml = parentGav.xml;
					parentObj.repoLocation = parentGav.repoLocation;
					parentObj.pomPath = parentGav.pomPath;
					parentObj.existsInRepo = parentGav.existsInRepo;
					if (parentObj.existsInRepo) {
						pom.parent = parentObj;
						pom.parent.load(callback);
					}
				} else {
					callback();
				}
			},

			loadProperties: function (xml, pom, callback) {
				var self = this,
					props = mvn.findInXml(xml, "project > properties", true, self);
				pom.properties = [];
				if (props) props.each((index, prop) => {
					var property = self.parseProperty(prop);
					pom.properties.push(property);
				});
				callback();
			},

			loadDependencyManagement: function (xml, pom, callback) {
				var self = this,
					depManagement = mvn.findInXml(xml, "project > dependencyManagement > dependencies", true, self);
				pom.dependencyManagement = [];
				if (depManagement) depManagement.each((index, dep) => {
					var managed = self.parseDependency(dep, pom);
					pom.dependencyManagement.push(managed);
				});
				callback();
			},

			loadDependencies: function (xml, pom, callback) {
				var self = this,
					dependencies = mvn.findInXml(xml, "project > dependencies", true, self);
				pom.dependencies = [];
				if (dependencies) dependencies.each((index, xmlDependency) => {
					var dependency = self.parseDependency(xmlDependency, pom);
					pom.dependencies.push(dependency);
				});
				if (callback && typeof callback === 'function') callback();
			},



			resolveProperty: function (property, pom) {
				var result = property;
				if (property.startsWith("${") && property.endsWith("}")) {
					if (pom.properties) {
						$.each(pom.properties, (index, prop) => {
							if (property.indexOf(prop.key) > -1) {
								result = prop.value;
								return false;
							}
						});
					}
					if (result === property && pom.parent) {
						result = this.resolveProperty(property, pom.parent);
					}
				}
				return result;
			},

			resolveVersion: function (groupId, artifactId, version, pom) {
				var result = version;
				if (!version) {
					if (pom.dependencyManagement) {
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

			loadGav: function (xml, pom, callback) {
				xml = xml.replace(/\<project .*\>/g, '<project>');
				var dependency = $(xml),
					g = $(dependency.find("project > groupId")[0]).text(),
					a = $(dependency.find("project > artifactId")[0]).text(),
					v = this.resolveVersion(g, a, $(dependency.find("project > version")[0]).text(), pom),
					t = "pom",
					x = xml,
					result = {
						groupId: g,
						artifactId: a,
						version: v,
						type: t,
						xml: x
					};
				console.log(result, dependency);
				if (callback && typeof callback === 'function') callback();
			},



			parseDependency: function (xmlDependency, pom, type) {
				type = (type) ? type : "jar";
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
				return mvn.repo + dependency.groupId.replace(/\./g, common.fileSeparator) +
					common.fileSeparator + dependency.artifactId + common.fileSeparator +
					dependency.version + common.fileSeparator + dependency.artifactId +
					"-" + dependency.version + "." + t;
			},
		}

	};

	return {
		newInstance: function () {
			return Pom();
		}
	}

};

module.exports = PomFactory();
