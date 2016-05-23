var Pom = function (opts) {

	var common = require('./common'),
		$ = require('jquery'),
		_ = require('underscore'),
		fs = require('fs'),
		xml2js = require('xml2js').Parser(),
		file = require('./file-utils'),
		mvn = require('./maven-utils'),
		factory = require('./pom-factory');

	var newpom = {

		changeEvents: [],

		registerChangeEvent: function (callback) {
			if (this.pomPath) {
				this.changeEvents.push(callback);
				fs.watch(this.pomPath, (event) => {
					callback();
				});
			}
		},

		load: function (callback, override) {
			console.log(override);
			var self = this;
			if (!self.changing || override) {
				console.log("loading", self, self.parent);

				self.changing = true;
				setTimeout(() => {
					self.loadParent(self, () => {
						self.loadProperties(self, () => {
							self.loadDependencyManagement(self, () => {
								self.loadDependencies(self, () => {
									self.changing = false;
									if (callback && typeof callback === 'function') callback(self);
								});
							});
						});
					});
				}, 3e3);

			}
		},

		loadParent: function (pom, callback) {
			console.log("loading parent", pom);
			var parentGAVT = pom.getParent(),
				parentPomPath = '',
				parent = {};
			console.log(parentGAVT);
			if (parentGAVT) {
				parentPomPath = pom.getDependencyRepoLocation(parentGAVT, 'pom');
				parent = factory.getInstance(parentPomPath, {
					init: parentGAVT,
					relation: pom,
					relationship: 'parent'
				}, callback);
				if (!parent.children) parent.children = [];
				parent.children.push(pom);
				pom.parent = parent;
			} else {
				console.log("No Parental GAVT")
				console.log(parentGAVT);
				setTimeout(() => {
					if (callback && typeof callback === 'function') callback();
				}, 3e3);

			}

		},

		loadProperties: function (pom, callback) {
			console.log("loading props", pom);
			if (pom.hasProperties()) pom.properties = pom.getProperties();
			setTimeout(() => {
				if (callback && typeof callback === 'function') callback();
			}, 3e3);
		},

		loadDependencyManagement: function (pom, callback) {
			console.log("loading dep man", pom);
			if (pom.hasDependencyManagement()) pom.dependencyManagement = [];
			$.each(pom.getDependencyManagement(), (index, dependency) => {
				pom.dependencyManagement.push(pom.loadDependency(pom, dependency, true));
			});
			setTimeout(() => {
				if (callback && typeof callback === 'function') callback();
			}, 3e3);
		},

		loadDependencies: function (pom, callback) {
			console.log("loading dependencies", pom);
			if (pom.hasDependencies()) pom.dependencies = [];
			$.each(pom.getDependencies(), (index, dependency) => {
				pom.dependencies.push(pom.loadDependency(pom, dependency));
			});
			setTimeout(() => {
				if (callback && typeof callback === 'function') callback();
			}, 3e3);
		},

		loadDependency: function (pom, dependency, managed) {
			console.log("loading dependency", pom, dependency);
			var dependencyGAVT = pom.getGAVT(pom, dependency),
				path = pom.getDependencyRepoLocation(dependencyGAVT, 'pom'),
				real = null;
			if (managed) return dependencyGAVT;
			else {
				real = factory.getInstance(path, {
					init: dependencyGAVT
				});
				if (!real.dependants) real.dependants = [];
				real.dependants.push(pom);
				return real;
			}
		},

		hasContent: function (obj) {
			if (obj && obj.length > 0) {
				return true;
			} else {
				return false;
			}
		},

		hasParent: function (target) {
			var pom = (target) ? target : this;
			console.log(pom.project, pom.project.parent);
			if (pom.project &&
				this.hasContent(pom.project.parent)) return true;
			else return false;
		},

		getParent: function (target) {
			var pom = (target) ? target : this;
			return (pom.hasParent(pom)) ? pom.getGAVT(pom, pom.project.parent[0], 'pom') : null;
		},

		getGAVT: function (pom, elem, type) {
			var version;
			console.log(pom);
			if (pom.hasContent(elem.version)) version = elem.version[0];
			return {
				groupId: (pom.hasContent(elem.groupId)) ? elem.groupId[0] : null,
				artifactId: (pom.hasContent(elem.artifactId)) ? elem.artifactId[0] : null,
				version: pom.resolveProperty(pom.resolveVersion(elem.groupId[0], elem.artifactId[0], version, pom), pom),
				type: (pom.hasContent(elem.type)) ? elem.type[0] : (type) ? type : 'jar'
			};
		},

		hasDependencyManagement: function (target) {
			var pom = (target) ? target : this;
			if (pom.project &&
				this.hasContent(pom.project.dependencyManagement) &&
				this.hasContent(pom.project.dependencyManagement[0].dependencies) &&
				this.hasContent(pom.project.dependencyManagement[0].dependencies[0].dependency)) return true;
			else return false;
		},

		getDependencyManagement: function (target) {
			var pom = (target) ? target : this;
			return (pom.hasDependencyManagement(pom)) ? pom.project.dependencyManagement[0].dependencies[0].dependency : [];
		},

		hasDependencies: function (target) {
			var pom = (target) ? target : this;
			if (pom.project &&
				pom.hasContent(pom.project.dependencies) &&
				pom.hasContent(pom.project.dependencies[0].dependency)) return true;
			else return false;
		},

		getDependencies: function (target) {
			var pom = (target) ? target : this;
			return (pom.hasDependencies(pom)) ? pom.project.dependencies[0].dependency : [];
		},

		hasProperties: function (target) {
			var pom = (target) ? target : this;
			if (pom.project && pom.hasContent(pom.project.properties)) return true;
			else return false;
		},

		getEnvironmentProperties: function (pom, properties) {
			var envs = process.env;
			for (var key in envs) {
				if (!properties.hasOwnProperty(key)) continue;
				if (properties[key].length === 1) properties.push(pom.newProperty('env.' + key.toUpperCase(), envs[key]));
			}
		},

		getProjectProperties: function (pom, properties) {
			if (pom && pom.groupId && pom.artifactId && pom.version) {
				properties.push(pom.newProperty('project.groupId', pom.groupId));
				properties.push(pom.newProperty('project.artifactId', pom.artifactId));
				properties.push(pom.newProperty('project.version', pom.version));
			} else {
				var GAVT = pom.getGAVT(pom, pom.project, 'pom');
				properties.push(pom.newProperty('project.groupId', GAVT.groupId));
				properties.push(pom.newProperty('project.artifactId', GAVT.artifactId));
				properties.push(pom.newProperty('project.version', GAVT.version));
			}

		},

		getSettingsProperties: function (pom, properties) {
			// Not Yet Implemented
		},

		getProperties: function (target) {
			var pom = (target) ? target : this,
				props = [],
				properties = [];
			pom.getEnvironmentProperties(pom, props);
			pom.getProjectProperties(pom, props);
			pom.getSettingsProperties(pom, props);
			if (pom.hasProperties(pom)) {
				properties = pom.project.properties[0];
				for (var key in properties) {
					if (!properties.hasOwnProperty(key)) continue;
					if (properties[key].length === 1) props.push(pom.newProperty(key, properties[key][0]));
				}
			}
			return props;
		},

		newProperty: function (key, value) {
			return {
				key: key,
				value: value
			};
		},

		resolveProperty: function (property, pom) {
			var result = property,
				self = this;
			if (property && property.startsWith('${') && property.endsWith('}')) {
				if (self.properties) {
					$.each(self.properties, (index, prop) => {
						if (property.indexOf(prop.key) > -1) {
							result = prop.value;
							return false;
						}
					});
				}
				if (result === property && pom) {
					result = pom.resolveProperty(property, pom.parent);
				}
			}
			return result;
		},

		resolveVersion: function (groupId, artifactId, version, pom) {
			var result = version,
				self = this;
			if (_.isEmpty(version)) {
				console.log("Looking for version: ", groupId, artifactId, pom);
				if (pom.dependencyManagement) {
					$.each(pom.dependencyManagement, (index, managed) => {
						if (managed.groupId === groupId && managed.artifactId === artifactId) {
							result = managed.version;
							console.log("Matched: ", result);
							return false;
						}
					});
				}
				if (pom.dependencies) {
					$.each(pom.dependencies, (index, managed) => {
						if (managed.groupId === groupId && managed.artifactId === artifactId) {
							result = managed.version;
							console.log("Matched: ", result);
							return false;
						}
					});
				}
				if (_.isEmpty(result) && pom.dependants) {
					$.each(pom.dependants, (index, dependant) => {
						var returned = pom.resolveVersion(groupId, artifactId, version, dependant);
						if (!_.isEmpty(returned)) {
							result = returned;
							console.log("Matched: ", result);
							return false;
						}
					});
				}
				console.log(_.isEmpty(result), result, pom.parent);
				if (_.isEmpty(result) && pom.parent) {
					console.log("Searching Parent");
					var returned = pom.resolveVersion(groupId, artifactId, version, pom.parent);
					if (!_.isEmpty(returned)) {
						result = returned;
						console.log("Matched: ", result);
						return false;
					}
				}
			}
			console.log("Returning: ", result, pom);
			return result;
			//return (self.hasContent(result) && typeof result === 'object') ? result[0] : result;
		},

		getDependencyRepoLocation: function (dependency, type) {
			var t = type || dependency.type,
				exists = mvn.isInWorkspace(dependency);
			if (!_.isEmpty(exists)) {
				return exists.pomPath;
			} else return mvn.repo + dependency.groupId.replace(/\./g, common.fileSeparator) +
				common.fileSeparator + dependency.artifactId + common.fileSeparator +
				dependency.version + common.fileSeparator + dependency.artifactId +
				'-' + dependency.version + '.' + t;
		},

		equals: function (other) {
			if ((this.groupId === other.groupId) &&
				(this.artifactId === other.artifactId) &&
				(this.version === other.version)) return true;
			else return false;
		},

		init: function (opts) {
			var self = this;
			if (opts && opts.init) {
				self.groupId = opts.init.groupId;
				self.artifactId = opts.init.artifactId;
				self.version = opts.init.version;
				if (opts.init.type) self.type = opts.init.type;
				self.repoLocation = self.getDependencyRepoLocation(self, 'pom');
				if (!self.pomPath) self.pomPath = self.repoLocation;
				self.existsInRepo = file.fileExists(self.repoLocation, false);
			}
		},

		reload: function (callback) {
			var self = this;
			if (!self.changing) {
				self.changing = true;
				fs.readFile(self.pomPath, "utf8", (err, xml) => {
					if (err) console.error(err);
					else {
						self.xml = xml;
						xml2js.parseString(xml, function (err, result) {
							if (err) console.error(self.pomPath, err);
							$.extend(self, result);
							setTimeout(() => {
								console.log(self.project.parent);
								self.load(callback, true);
							}, 5e3)

						});
					}
				});
			}
		}
	};

	if (opts) {
		newpom.init(opts);
	}

	return newpom;

};

module.exports = Pom;
