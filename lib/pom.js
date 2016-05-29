class Pom {

	constructor(opts) {

		var self = this;

		self.classpathScopes = ['compile', 'provided', 'test'];
		self.changeEvents = [];
		self.hasChanged = true;
		self.changing = false;
		self.init(opts);

		function arrayChangeHandlerFactory(callback) {
			return {
				get: function (target, index) {
					console.log('getting ' + index + ' for ' + target);
					return target[index];
				},
				set: function (target, property, value, receiver) {
					console.log('setting ' + property + ' for ' + target + ' with value ' + value);
					target[property] = value;
					callback(self);
					return true;
				}
			}
		}

		var properties = new Proxy([], arrayChangeHandlerFactory(() => {
			self.loadDependencyManagement(self);
		}));
		var dependencyManagement = new Proxy([], arrayChangeHandlerFactory(() => {
			self.loadDependencies(self);
		}));
		var dependencies = new Proxy([], arrayChangeHandlerFactory(() => {
			self.loadClasspath(self);
		}));

		self.properties = properties;
		self.dependencyManagement = dependencyManagement;
		self.dependencies = dependencies;
		self.classpath = [];

	}

}

Pom.prototype.common = require('./common');
Pom.prototype.$ = require('jquery');
Pom.prototype._ = require('underscore');
Pom.prototype.fs = require('fs');
Pom.prototype.xml2js = require('xml2js').Parser();
Pom.prototype.file = require('./file-utils');

Pom.prototype.init = function (opts) {
	var self = this;
	if (opts) {
		self.groupId = opts.groupId;
		self.artifactId = opts.artifactId;
		self.version = opts.version;
		if (opts.type) self.type = opts.type;
		if (opts.scope) self.scope = opts.scope;
		self.repoLocation = require('./maven-utils').getDependencyRepoLocation(self, 'pom');
		if (!self.pomPath) self.pomPath = self.repoLocation;
		self.existsInRepo = self.file.fileExists(self.repoLocation, false);
	}
};

Pom.prototype.registerChangeEvent = function (callback) {
	var self = this;
	if (self.pomPath) {
		self.changeEvents.push(callback);
		self.fs.watch(self.pomPath, (event) => {
			self.hasChanged = true;
			callback();
		});
	}
};

Pom.prototype.load = function (callback, override) {
	const self = this;

	/*	function afterParentalLoad() {
			self.loadProperties(self, () => {
				self.loadDependencyManagement(self, () => {
					self.loadDependencies(self, () => {
						self.loadClasspath(self, () => {
							self.changing = false;
							if (callback && typeof callback === 'function') callback(self);
						});
					});
				});
			});
		}
	*/
	if ((!self.changing && self.hasChanged) || override) {
		self.hasChanged = false;
		self.changing = true;

		var promise = self.loadParent(self);
		promise.then(() => {
			self.loadProperties(self);
		});
	}
};

Pom.prototype.loadParent = function (pom) {
	var parentalPromise = new Promise((resolve, reject) => {
		var parentGAVT = pom.getParent();
		var parentPomPath = '';
		var promise = null;
		if (parentGAVT) {
			parentPomPath = require('./maven-utils').getDependencyRepoLocation(parentGAVT, 'pom');
			promise = require('./pom-factory').getInstance(parentPomPath, parentGAVT);
			promise.then((parent) => {
				if (!parent.children) parent.children = [];
				if (!parent.contains(parent.children, pom)) {
					parent.children.push(pom);
					pom.parent = parent;
				}
				resolve();
			});
		} else {
			resolve();
		}
	});
	return parentalPromise;
};

Pom.prototype.loadProperties = function (pom, callback) {
	if (pom.hasProperties()) pom.properties = pom.getProperties();
	if (callback && typeof callback === 'function') callback();
};

Pom.prototype.loadDependencyManagement = function (pom, callback) {
	pom.dependencyManagement = [];
	var dependencyManagement = pom.getDependencyManagement();
	for (var index in dependencyManagement) {
		var dependencyGAVT = pom.loadDependency(pom, dependencyManagement[index], true);
		if (!pom.contains(pom.dependencyManagement, dependencyGAVT)) {
			pom.dependencyManagement.push(dependencyGAVT);
		}
	}
	if (callback && typeof callback === 'function') callback();
};

Pom.prototype.loadDependencies = function (pom, callback) {
	pom.dependencies = [];
	var dependencies = pom.getDependencies();
	for (var index in dependencies) {
		pom.loadDependency(pom, dependencies[index], false, (loaded) => {
			if (!pom.contains(pom.dependencies, loaded)) {
				pom.dependencies.push(loaded);
			} else {
				loaded.reload();
			}
		});
	}
	if (callback && typeof callback === 'function') callback();
};

Pom.prototype.loadDependency = function (pom, dependency, managed, callback) {
	const mvn = require('./maven-utils');
	const factory = require('./pom-factory');
	var dependencyGAVT = mvn.getGAVT(pom, dependency);
	var path = mvn.getDependencyRepoLocation(dependencyGAVT, 'pom');
	var promise = null;
	if (managed) return dependencyGAVT;
	else {
		promise = factory.getInstance(path, dependencyGAVT, pom);
		promise.then((real) => {
			if (!real.dependants) real.dependants = [];
			if (!real.contains(real.dependants, pom)) {
				real.dependants.push(pom);
			}
			if (callback && typeof callback === 'function') callback(real);
		});
	}
};

Pom.prototype.loadClasspath = function (pom, callback) {
	const self = (pom) ? pom : this;

	function classpathContains(dependency) {
		if (self._.isEmpty(self._.findWhere(self.classpath, {
				groupId: dependency.groupId,
				artifactId: dependency.artifactId
			}))) {
			return false;
		} else {
			return true;
		}
	}

	// Add the project dependencies to the classpath
	self.classpath = [];
	for (var index in self.dependencies) {
		self.classpath.push(self.dependencies[index]);
	}

	// Add the parental dependencies to the classpath
	if (self.parent && self.parent.classpath) {
		for (index in self.parent.classpath) {
			if (!classpathContains(self.parent.classpath[index])) {
				self.classpath.push(self.parent.classpath[index]);
			}
		}
	}
	// Add transitive dependencies to the classpath
	if (self.dependencies && self.dependencies.length > 0) {
		for (index in self.dependencies) {
			var dependency = self.dependencies[index];
			if (dependency.classpath) {
				for (var transitiveClasspathIndex in dependency.classpath) {
					var transitiveClasspathElement = dependency.classpath[transitiveClasspathIndex];
					if (!classpathContains(transitiveClasspathElement)) {
						self.classpath.push(transitiveClasspathElement);
					}
				}
			}
		}
	}

	if (callback && typeof callback === 'function') callback();
};

Pom.prototype.hasContent = function (obj) {
	if (obj && obj.length > 0) {
		return true;
	} else {
		return false;
	}
};

Pom.prototype.hasParent = function (target) {
	var pom = (target) ? target : this;
	if (pom.project &&
		this.hasContent(pom.project.parent)) return true;
	else return false;
};

Pom.prototype.getParent = function (target) {
	var pom = (target) ? target : this;
	const mvn = require('./maven-utils');
	return (pom.hasParent(pom)) ? mvn.getGAVT(pom, pom.project.parent[0], 'pom') : null;
};

Pom.prototype.hasDependencyManagement = function (target) {
	var pom = (target) ? target : this;
	if (pom.project &&
		this.hasContent(pom.project.dependencyManagement) &&
		this.hasContent(pom.project.dependencyManagement[0].dependencies) &&
		this.hasContent(pom.project.dependencyManagement[0].dependencies[0].dependency)) return true;
	else return false;
};

Pom.prototype.getDependencyManagement = function (target) {
	var pom = (target) ? target : this;
	return (pom.hasDependencyManagement(pom)) ? pom.project.dependencyManagement[0].dependencies[0].dependency : [];
};

Pom.prototype.hasDependencies = function (target) {
	var pom = (target) ? target : this;
	if (pom.project &&
		pom.hasContent(pom.project.dependencies) &&
		pom.hasContent(pom.project.dependencies[0].dependency)) return true;
	else return false;
};

Pom.prototype.getDependencies = function (target) {
	var pom = (target) ? target : this;
	return (pom.hasDependencies(pom)) ? pom.project.dependencies[0].dependency : [];
};

Pom.prototype.hasProperties = function (target) {
	var pom = (target) ? target : this;
	if (pom.project && pom.hasContent(pom.project.properties)) return true;
	else return false;
};

Pom.prototype.getEnvironmentProperties = function (pom, properties) {
	var envs = process.env;
	for (var key in envs) {
		if (!properties.hasOwnProperty(key)) continue;
		if (properties[key].length === 1) properties.push(pom.newProperty('env.' + key.toUpperCase(), envs[key]));
	}
};

Pom.prototype.getProjectProperties = function (pom, properties) {
	if (pom && pom.groupId && pom.artifactId && pom.version) {
		properties.push(pom.newProperty('project.groupId', pom.groupId));
		properties.push(pom.newProperty('project.artifactId', pom.artifactId));
		properties.push(pom.newProperty('project.version', pom.version));
	} else {
		var GAVT = require('./maven-utils').getGAVT(pom, pom.project, 'pom');
		properties.push(pom.newProperty('project.groupId', GAVT.groupId));
		properties.push(pom.newProperty('project.artifactId', GAVT.artifactId));
		properties.push(pom.newProperty('project.version', GAVT.version));
	}

};

Pom.prototype.getSettingsProperties = function (pom, properties) {
	// Not Yet Implemented
};

Pom.prototype.getProperties = function (target) {
	var pom = (target) ? target : this;
	var props = [];
	var properties = [];
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
};

Pom.prototype.newProperty = function (key, value) {
	return {
		key: key,
		value: value
	};
};

Pom.prototype.resolveProperty = function (property, pom) {
	var result = property;
	const self = this;
	if (property && property.startsWith('${') && property.endsWith('}')) {
		if (self.properties) {
			pom.$.each(self.properties, (index, prop) => {
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
};

Pom.prototype.resolveScope = function (groupId, artifactId, scope, pom) {
	var result = scope;
	const self = this;
	if (self._.isEmpty(scope)) {
		if (pom.dependencyManagement) {
			self.$.each(pom.dependencyManagement, (index, managed) => {
				if (managed.groupId === groupId && managed.artifactId === artifactId) {
					result = (managed.scope) ? managed.scope : null;
					return false;
				}
			});
		}
		if (pom.dependencies) {
			self.$.each(pom.dependencies, (index, managed) => {
				if (managed.groupId === groupId && managed.artifactId === artifactId) {
					result = (managed.scope) ? managed.scope : null;
					return false;
				}
			});
		}
		if (self._.isEmpty(result) && pom.parent) {
			var returned = pom.resolveScope(groupId, artifactId, result, pom.parent);
			if (!self._.isEmpty(returned)) {
				result = returned;
			}
		}
		if (self._.isEmpty(result) && !pom.parent) result = 'compile';
	}
	return result;
};

Pom.prototype.resolveVersion = function (groupId, artifactId, version, pom) {
	var result = version;
	const self = this;
	if (self._.isEmpty(version)) {
		if (pom.dependencyManagement) {
			self.$.each(pom.dependencyManagement, (index, managed) => {
				if (managed.groupId === groupId && managed.artifactId === artifactId) {
					result = managed.version;
					return false;
				}
			});
		}
		if (pom.dependencies) {
			self.$.each(pom.dependencies, (index, managed) => {
				if (managed.groupId === groupId && managed.artifactId === artifactId) {
					result = managed.version;
					return false;
				}
			});
		}
		if (self._.isEmpty(result) && pom.dependants) {
			self.$.each(pom.dependants, (index, dependant) => {
				var returned = pom.resolveVersion(groupId, artifactId, result, dependant);
				if (!self._.isEmpty(returned)) {
					result = returned;
					return false;
				}
			});
		}
		if (self._.isEmpty(result) && pom.parent) {
			var returned = pom.resolveVersion(groupId, artifactId, result, pom.parent);
			if (!self._.isEmpty(returned)) {
				result = returned;
			}
		}
	}
	return result;
};

Pom.prototype.equals = function (other) {
	if ((this.groupId === other.groupId) &&
		(this.artifactId === other.artifactId) &&
		(this.version === other.version)) return true;
	else return false;
};

Pom.prototype.reload = function (callback) {
	var self = this;
	if (!self.changing) {
		self.changing = true;
		self.fs.readFile(self.pomPath, 'utf8', (err, xml) => {
			if (err) {
				self.load(callback, true);
			} else {
				self.xml = xml;
				self.xml2js.parseString(xml, function (err, result) {
					if (err) console.error(self.pomPath, err);
					self.$.extend(self, result);
					self.load(callback, true);
				});
			}
		});
	}
};

Pom.prototype.contains = function (collection, item) {
	var contains = false;
	const self = this;
	self.$.each(collection, (index, elem) => {
		if (elem && elem.equals && elem.equals(item)) {
			contains = true;
			return false;
		} else if (item && item.equals && item.equals(elem)) {
			contains = true;
			return false;
		}
	});
	return contains;
};

module.exports = Pom;
