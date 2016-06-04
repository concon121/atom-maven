'use babel';

const ui = require('./ui-utils');

class Pom {

	constructor(opts, path) {

		var self = this;

		self.classpathScopes = ['compile', 'provided', 'test'];
		self.changeEvents = [];
		self.loadCompleteEvents = [];
		self.hasChanged = true;
		self.changing = false;
		if (!self.existsInRepo) {
			self.existsInRepo = self.file.fileExists(path, false);
		}

		if (path) {
			self.pomPath = path;
		}

		if (opts) {
			self.init(opts);
		}

		self.reload(() => {
			if (opts) {
				self.init(opts);
			} else {
				self.init(require('./maven-utils').getGAVT(self, self.project, 'pom'));
			}
		});
	}

}

var events = require('events');

Pom.prototype.common = require('./common');
Pom.prototype.$ = require('jquery');
Pom.prototype._ = require('underscore');
Pom.prototype.fs = require('fs');
Pom.prototype.xml2js = require('xml2js').Parser();
Pom.prototype.file = require('./file-utils');
Pom.prototype.registry = require('./pom-registry');
Pom.prototype.workspace = require('./workspace');
Pom.prototype.events = new events.EventEmitter();

Pom.prototype.init = function (opts) {
	var self = this;

	if (opts) {
		self.groupId = opts.groupId;
		self.artifactId = opts.artifactId;
		self.version = opts.version;
		if (opts.type) {
			self.type = opts.type;
		}
		if (opts.scope) {
			self.scope = opts.scope;
		}
		self.repoLocation = require('./maven-utils').getDependencyRepoLocation(self, 'pom');
		if (!self.pomPath) {
			self.pomPath = (opts.pomPath) ? opts.pomPath : self.repoLocation;
		}
		self.eventPrefix = self.groupId + ':' + self.artifactId + ':' + self.version + ':';

		if (events.EventEmitter.listenerCount(self.events, self.eventPrefix + 'loaded') === 0) {
			self.events.addListener(self.eventPrefix + 'loaded', () => {
				self.loadParent(self);
			});
		}

		if (events.EventEmitter.listenerCount(self.events, self.eventPrefix + 'parentUpdated') === 0) {
			self.events.addListener(self.eventPrefix + 'parentUpdated', () => {
				self.loadProperties(self);
			});
		}

		if (events.EventEmitter.listenerCount(self.events, self.eventPrefix + 'propertiesUpdated') === 0) {
			self.events.addListener(self.eventPrefix + 'propertiesUpdated', () => {
				self.loadDependencyManagement(self);
			});
		}

		if (events.EventEmitter.listenerCount(self.events, self.eventPrefix + 'dependencyManagementUpdated') === 0) {
			self.events.addListener(self.eventPrefix + 'dependencyManagementUpdated', () => {
				self.loadDependencies(self);
			});
		}

		if (events.EventEmitter.listenerCount(self.events, self.eventPrefix + 'dependenciesUpdated') === 0) {
			self.events.addListener(self.eventPrefix + 'dependenciesUpdated', () => {
				self.loadClasspath(self);
				self.rebuildChildren(self);
			});
		}

		if (events.EventEmitter.listenerCount(self.events, self.eventPrefix + 'classpathUpdated') === 0) {
			self.events.addListener(self.eventPrefix + 'classpathUpdated', () => {
				self.changing = false;
				self.reloadDependantsClasspath(self);
			});
		}
	}

};

Pom.prototype.registerChangeEvent = function (callback) {
	var self = this;
	if (self.pomPath) {
		self.changeEvents.push(callback);
		self.fs.watch(self.pomPath, () => {
			self.hasChanged = true;
			callback();
		});
	}
};

Pom.prototype.registerLoadCompleteEvent = function (callback) {
	var self = this;
	self.loadCompleteEvents.push(callback);
};

Pom.prototype.loadParent = function (pom) {
	var parentGAVT = pom.getParent();
	var parentPomPath = '';
	var promise = null;
	if (parentGAVT) {
		parentPomPath = require('./maven-utils').getDependencyRepoLocation(parentGAVT, 'pom');
		promise = require('./pom-factory').getInstance(parentPomPath, parentGAVT);
		promise.then((parent) => {
			if (!parent.children) {
				parent.children = [];
			}
			if (!parent.contains(parent.children, pom)) {
				parent.children.push(pom);
				pom.parent = parent;
			}
			pom.events.emit(pom.eventPrefix + 'parentUpdated');
		});
	} else {
		pom.events.emit(pom.eventPrefix + 'parentUpdated');
	}
};

Pom.prototype.loadProperties = function (pom) {
	if (pom.hasProperties()) {
		pom.properties = pom.getProperties();
	}
	pom.events.emit(pom.eventPrefix + 'propertiesUpdated');
};

Pom.prototype.loadDependencyManagement = function (pom) {
	var dependencyManagement = [];
	for (var dependency of pom.getDependencyManagement()) {
		var dependencyGAVT = pom.loadDependency(pom, dependency, true);
		if (!pom.contains(dependencyManagement, dependencyGAVT)) {
			dependencyManagement.push(dependencyGAVT);
		}
	}
	pom.dependencyManagement = dependencyManagement;
	pom.events.emit(pom.eventPrefix + 'dependencyManagementUpdated');
};

Pom.prototype.loadDependencies = function (pom) {
	var deps = [];
	var dependencies = pom.getDependencies();
	var callback = function (loaded) {
		deps.push(loaded);
		pom.events.emit(pom.eventPrefix + 'dependenciesUpdated');
	};
	for (var dependency of dependencies) {
		pom.loadDependency(pom, dependency, false, callback);
	}
	pom.dependencies = deps;
};

Pom.prototype.loadDependency = function (pom, dependency, managed, callback) {
	const mvn = require('./maven-utils');
	const factory = require('./pom-factory');
	var dependencyGAVT = mvn.getGAVT(pom, dependency);
	var path = mvn.getDependencyRepoLocation(dependencyGAVT, 'pom');
	var promise = null;
	if (managed) {
		return dependencyGAVT;
	} else {
		promise = factory.getInstance(path, dependencyGAVT, pom);
		promise.then((real) => {
			if (!real.dependants) {
				real.dependants = [];
			}
			if (!real.contains(real.dependants, pom)) {
				real.dependants.push(pom);
			}
			if (callback && typeof callback === 'function') {
				callback(real);
			}
		});
	}
};

Pom.prototype.loadClasspath = function (pom) {
	const self = (pom) ? pom : this;

	var classpath = [];

	setTimeout(() => {

		function classpathContains(dependency) {
			if (self._.isEmpty(self._.findWhere(classpath, {
					groupId: dependency.groupId,
					artifactId: dependency.artifactId
				}))) {
				return false;
			} else {
				return true;
			}
		}

		// Add the project dependencies to the classpath
		if (self.dependencies && self.dependencies.length > 0) {
			for (var projectDependency of self.dependencies) {
				classpath.push(projectDependency);
			}
		}

		// Add the parental dependencies to the classpath
		if (self.parent && self.parent.classpath) {
			for (var parentClasspathElement of self.parent.classpath) {
				if (!classpathContains(parentClasspathElement)) {
					classpath.push(parentClasspathElement);
				}
			}
		}

		// Add transitive dependencies to the classpath
		if (self.dependencies && self.dependencies.length > 0) {
			for (var dependency of self.dependencies) {
				if (dependency.classpath) {
					for (var transitiveClasspathElement of dependency.classpath) {
						if (!classpathContains(transitiveClasspathElement)) {
							classpath.push(transitiveClasspathElement);
						}
					}
				}
			}
		}
		self.classpath = classpath;
		self.events.emit(self.eventPrefix + 'classpathUpdated');
		if (self.loadCompleteEvents && self.loadCompleteEvents.length > 0) {
			for (var loadCompleteEvent of self.loadCompleteEvents) {
				loadCompleteEvent();
			}
		}
	}, 1e4);

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
		this.hasContent(pom.project.parent)) {
		return true;
	} else {
		return false;
	}
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
		this.hasContent(pom.project.dependencyManagement[0].dependencies[0].dependency)) {
		return true;
	} else {
		return false;
	}
};

Pom.prototype.getDependencyManagement = function (target) {
	var pom = (target) ? target : this;
	return (pom.hasDependencyManagement(pom)) ? pom.project.dependencyManagement[0].dependencies[0].dependency : [];
};

Pom.prototype.hasDependencies = function (target) {
	var pom = (target) ? target : this;
	if (pom.project &&
		pom.hasContent(pom.project.dependencies) &&
		pom.hasContent(pom.project.dependencies[0].dependency)) {
		return true;
	} else {
		return false;
	}
};

Pom.prototype.getDependencies = function (target) {
	var pom = (target) ? target : this;
	return (pom.hasDependencies(pom)) ? pom.project.dependencies[0].dependency : [];
};

Pom.prototype.hasProperties = function (target) {
	var pom = (target) ? target : this;
	if (pom.project && pom.hasContent(pom.project.properties)) {
		return true;
	} else {
		return false;
	}
};

Pom.prototype.getEnvironmentProperties = function (pom, properties) {
	var envs = process.env;
	for (var key in envs) {
		if (!properties.hasOwnProperty(key)) {
			continue;
		}
		if (properties[key].length === 1) {
			properties.push(pom.newProperty('env.' + key.toUpperCase(), envs[key]));
		}
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

// Pom.prototype.getSettingsProperties = function (pom, properties) {
// Not Yet Implemented
// };

Pom.prototype.getProperties = function (target) {
	var pom = (target) ? target : this;
	var props = [];
	var properties = [];
	pom.getEnvironmentProperties(pom, props);
	pom.getProjectProperties(pom, props);
	if (pom.hasProperties(pom)) {
		properties = pom.project.properties[0];
		for (var key in properties) {
			if (!properties.hasOwnProperty(key)) {
				continue;
			}
			if (properties[key].length === 1) {
				props.push(pom.newProperty(key, properties[key][0]));
			}
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
			self.$.each(self.properties, (index, prop) => {
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
		if (self._.isEmpty(result) && !pom.parent) {
			result = 'compile';
		}
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
		(this.version === other.version)) {
		return true;
	} else {
		return false;
	}
};

Pom.prototype.reload = function (callback) {
	var self = this;
	if (!self.changing && self.existsInRepo) {
		self.changing = true;
		self.fs.readFile(self.pomPath, 'utf8', (err, xml) => {
			if (err) {
				console.error(self.pomPath, err);
			}
			self.xml = xml;
			self.xml2js.parseString(xml, function (err, result) {
				if (err) {
					ui.error(err);
				}
				self.$.extend(self, result);
				if (callback && typeof callback === 'function') {
					callback();
				}
				self.events.emit(self.eventPrefix + 'loaded');
			});
		});
	}
};

Pom.prototype.contains = function (collection, item) {
	for (var elem of collection) {
		if (elem && elem.equals && elem.equals(item)) {
			return true;
		} else if (item && item.equals && item.equals(elem)) {
			return true;
		}
	}
	return false;
};

Pom.prototype.rebuildChildren = function (pom) {
	if (pom && pom.children) {
		for (var child of pom.children) {
			child.loadDependencyManagement(child);
		}
	}
};

Pom.prototype.reloadDependantsClasspath = function (pom) {
	if (pom && pom.dependants) {
		for (var dependant of pom.dependants) {
			dependant.loadClasspath(dependant);
		}
	}
};

module.exports = Pom;
