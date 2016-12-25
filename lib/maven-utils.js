'use babel';
'use strict';

const common = require('./common');
const process = require('child_process');

const GET_MAVEN_REPO = 'mvn help:evaluate -Dexpression=settings.localRepository | grep -v INFO';

class MavenUtils {

	constructor() {
		var self = this;
		self.pomFileName = 'pom.xml';
		self.targetFileName = 'target';
		process.exec(GET_MAVEN_REPO, function (error, stdout, stderr) {
			if (error) {
				console.error(`exec error: ${error}`);
			}
			self.repo = `${stdout}`;
			self.repo = self.repo.replace('\n', common.fileSeparator);
			if (!self.repo.endsWith(common.fileSeparator)) {
				self.repo += common.fileSeparator;
			}
			console.log('The maven repo is: ', self.repo);
			console.debug(`stderr: ${stderr}`);
		});
	}
}

MavenUtils.prototype.$ = require('jquery');

MavenUtils.prototype.getAtomMavenConfig = function (value) {
	return atom.config.get('atom-maven')[value];
};

MavenUtils.prototype.getDependencyNotFoundMessage = function (dependency) {
	return dependency.groupId + ':' + dependency.artifactId + ':' +
		dependency.version + ':' + dependency.type +
		' could not be found in the local repository.';
};

module.exports = new MavenUtils();
