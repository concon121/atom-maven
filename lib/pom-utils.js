'use babel';
'use strict';

const common = require('./common');
const workspace = require('./workspace');
const _ = require('underscore');
const fsep = common.fileSeparator;
const registry = require('./pom-registry');

class PomUtils {
	constructor() {}
}

PomUtils.prototype.getGAVT = function (pom, elem, type) {
	const self = this;
	return {
		groupId: self.resolveGroupId(pom, elem),
		artifactId: self.resolveArtifactId(pom, elem),
		version: self.resolveVersion(pom, elem),
		type: self.resolveType(pom, elem, type),
		scope: self.resolveScope(pom, elem),
		optional: self.resolveOptionality(pom, elem)
	};
};

PomUtils.prototype.resolveGroupId = function (pom, elem) {
	return (pom.hasContent(elem.groupId)) ? elem.groupId[0] : null;
};

PomUtils.prototype.resolveArtifactId = function (pom, elem) {
	return (pom.hasContent(elem.artifactId)) ? elem.artifactId[0] : null;
};

PomUtils.prototype.resolveVersion = function (pom, elem) {
	var version;
	if (pom.hasContent(elem.version)) {
		version = elem.version[0];
	}
	return pom.resolveProperty(pom.resolveAttributeValue(elem.groupId[0], elem.artifactId[0], version, pom, 'version'), pom);
};

PomUtils.prototype.resolveType = function (pom, elem, type) {
	return (pom.hasContent(elem.type)) ? elem.type[0] : type || 'jar';
};

PomUtils.prototype.resolveScope = function (pom, elem) {
	var scope;
	if (pom.hasContent(elem.scope)) {
		scope = elem.scope[0];
	}
	return pom.resolveAttributeValue(elem.groupId[0], elem.artifactId[0], scope, pom, 'scope');
};

PomUtils.prototype.resolveOptionality = function (pom, elem) {
	return (pom.hasContent(elem.optional)) ? common.toBoolean(elem.optional[0]) : false;
};

PomUtils.prototype.isInWorkspace = function (gavt) {
	return workspace.contains(gavt);
};

PomUtils.prototype.getDependencyRepoLocation = function (dependency, type) {
	var t = type || dependency.type;
	var exists = this.isInWorkspace(dependency);
	if (!_.isEmpty(exists)) {
		return exists.pomPath;
	} else {
		return registry.repo + dependency.groupId.replace(/\./g, fsep) + fsep +
			dependency.artifactId + fsep + dependency.version + fsep +
			dependency.artifactId + '-' + dependency.version + '.' + t;
	}
};

module.exports = new PomUtils();
