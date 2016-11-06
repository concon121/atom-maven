'use babel';
'use strict';

const common = require('./common');
const fsep = common.fileSeparator;
const mvn = require('./maven-utils');

class PomUtils {
	constructor() {}
}

PomUtils.prototype.getGAVT = function (dependency) {
	const self = this;
	return {
		groupId: self.resolveGroupId(dependency),
		artifactId: self.resolveArtifactId(dependency),
		version: self.resolveVersion(dependency),
		type: self.resolveType(dependency),
		scope: self.resolveScope(dependency),
		optional: self.resolveOptionality(dependency)
	};
};

PomUtils.prototype.resolveGroupId = function (dependency) {
	return (dependency && dependency.groupId) ? dependency.groupId : null;
};

PomUtils.prototype.resolveArtifactId = function (dependency) {
	return (dependency && dependency.artifactId) ? dependency.artifactId : null;
};

PomUtils.prototype.resolveVersion = function (dependency) {
	return (dependency && dependency.version) ? dependency.version : null;
};

/**
 * Type defaults to jar if not specified by the dependency.
 */
PomUtils.prototype.resolveType = function (dependency) {
	return (dependency && dependency.type) ? dependency.type : 'jar';
};

/**
 * Scope defaults to compile if not specified by the dependency.
 */
PomUtils.prototype.resolveScope = function (dependency) {
	return (dependency && dependency.scope) ? dependency.scope : 'compile';
};

PomUtils.prototype.resolveOptionality = function (dependency) {
	return (dependency && dependency.optional) ? common.toBoolean(dependency.optional) : false;
};

PomUtils.prototype.getDependencyRepoLocation = function (rawDependency, type) {
	var dependency = this.getGAVT(rawDependency);
	var t = type || dependency.type;
	return mvn.repo + dependency.groupId.replace(/["."]/g, fsep) + fsep +
		dependency.artifactId + fsep + dependency.version + fsep +
		dependency.artifactId + '-' + dependency.version + '.' + t;
};

module.exports = new PomUtils();
