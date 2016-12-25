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
		groupId: self.resolve(dependency, 'groupId'),
		artifactId: self.resolve(dependency, 'artifactId'),
		version: self.resolve(dependency, 'version'),
		type: self.resolve(dependency, 'type', 'jar'),
		scope: self.resolve(dependency, 'scope', 'compile'),
		optional: self.resolve(dependency, 'optional')
	};
};

PomUtils.prototype.resolve = function (dependency, attribute, toReturn) {
	var returns = toReturn || null;
	return (dependency && dependency[attribute]) ? dependency[attribute] : returns;
};

PomUtils.prototype.getDependencyRepoLocation = function (rawDependency, type) {
	var dependency = this.getGAVT(rawDependency);
	var t = type || dependency.type;
	return mvn.repo + dependency.groupId.replace(/['.']/g, fsep) + fsep +
		dependency.artifactId + fsep + dependency.version + fsep +
		dependency.artifactId + '-' + dependency.version + '.' + t;
};

PomUtils.prototype.hasDependencies = function (pom) {
	if (pom &&
		pom.project &&
		pom.project.dependencies &&
		pom.project.dependencies.dependency &&
		pom.project.dependencies.dependency instanceof Array) {
		return true;
	} else {
		return false;
	}
};

module.exports = new PomUtils();
