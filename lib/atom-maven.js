'use babel';
'use strict';

const common = require('./common');
const fs = require('fs');
const ui = require('./ui-utils');
const mvn = require('./maven-utils');
const pomUtils = require('./pom-utils');

const CONFIGURING_CLASSPATH_MSG = 'atom-maven is configuring your classpath';

module.exports = {

	cpConfigFileName: '.classpath',

	activate: function () {
		this.setup();
	},

	config: {
		mavenHome: {
			type: 'string',
			default: '',
			description: 'The location of your Maven binaries.  If not specified, atom-maven will attempt to resolve your Maven intallation automatically. \n Example: ' + mvn.defaultMavenHome
		}
	},

	setup: function () {
		ui.info(CONFIGURING_CLASSPATH_MSG);
		var self = this;

		mvn.setMavenRepo();

		atom.workspace.scan(/<project.*/g, (match) => {
			if (match.filePath.endsWith('pom.xml')) {
				var updateClasspath = function () {
					var mvn = require('node-maven-api').create(match.filePath);
					var promise = mvn.effectivePom(self.getEffectivePom(match.filePath));
					promise.then((pom) => {
						var cp = self.getClasspath(match.filePath);
						self.writeClasspath(cp, pom, self);
						ui.clearFileMessages(match.filePath);
					});
				};
				updateClasspath();
				fs.watchFile(match.filePath, (curr, prev) => {
					ui.info('File changed: ' + match.filePath);
					ui.info(CONFIGURING_CLASSPATH_MSG);
					console.log(curr, curr.mtime);
					console.log(prev, prev.mtime);
					if (curr.mtime !== prev.mtime) {
						updateClasspath();
					}
				});
			}
		});

		setInterval(() => {
			ui.clearText(['info', 'success']);
		}, 2e4);

	},

	writeClasspath: function (cp, pom, self) {
		var locations = self.initLocations() + self.getClasspathFromDependencies(pom, self);
		fs.writeFile(cp, locations, (err) => {
			if (err) {
				ui.error(err);
			}
		});
		ui.success('atom-maven has finished configuring the classpath: ' + cp);
	},

	getClasspath: function (pomPath) {
		return pomPath.replace('pom.xml', '.classpath');
	},

	getEffectivePom: function (pomPath) {
		return pomPath.replace('pom.xml', 'effective.pom');
	},

	initLocations: function () {
		return '.' + common.fileSeparator + 'target' + common.fileSeparator + 'classes;';
	},

	getClasspathFromDependencies: function (pom) {
		var locations = '';
		if (pom && pom.project &&
			pom.project.dependencies &&
			pom.project.dependencies.dependency &&
			pom.project.dependencies.dependency instanceof Array) {
			for (var dependency of pom.project.dependencies.dependency) {
				var dependencyRepoLocation = pomUtils.getDependencyRepoLocation(dependency);
				locations = locations + dependencyRepoLocation + ';';
			}
		}
		return locations;
	},

	displayDependencyError: function (classpathElement) {

		var xml = classpathElement.xml;
		var dependency = classpathElement.dependency;
		var file = classpathElement.file;

		var tomatch = '(' + dependency.groupId + '[\\s\\S]*' + dependency.artifactId + ')|(' + dependency.artifactId + '[\\s\\S]*' + dependency.groupId + ')';
		var result = new RegExp(tomatch, 'g').exec(xml);
		var substr = (result) ? xml.substr(0, result.index) : null;
		var lineNo = (substr) ? substr.match(/\n/g).length + 1 : 0;
		var message = mvn.getDependencyNotFoundMessage(dependency);
		var preview = '<dependency>\n\t<groupId>' + dependency.groupId + '</groupId>\n\t<artifactId>' + dependency.artifactId + '</artifactId>\n\t<version>' + dependency.version + '</version>\n</dependency>';

		ui.error(message, lineNo, 0, file, preview);
	}

};
