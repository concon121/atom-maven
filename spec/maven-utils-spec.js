'use strict';
'use babel';

if (process.env.COVERAGE.indexOf('true') >= 0) {
	require('babel-register');
}

var mvn = require('../lib/maven-utils');
var common = require('../lib/common');
var ui = require('../lib/ui-utils');
var fs = common.fileSeparator;
var ps = common.pathSeparator;
var pathPrefix = (common.isWin) ? 'C:' + fs : fs;

describe('When finding the location of the maven settings file.', function () {
	beforeEach(function () {
		spyOn(mvn, 'getAtomMavenConfig').andReturn('');
		spyOn(ui, 'warning');
		global.atom = {
			config: {
				get: function () {
					return '';
				}
			}
		};
	});

	it('should correctly resolve the maven settings.xml location when the path contains only the maven home url.', function () {
		var path = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the path contains more than 1 entry.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'apache-maven-correct' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'apache-maven-incorrect' + fs + 'bin' + ps;
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven-correct' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the maven home directory is an environment variable.', function () {
		var path = pathPrefix + 'M2_HOME' + fs + 'bin';
		var mvnHome = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(mvnHome);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location where there is more than one entry on the PATH and the maven home directory is an environment variable.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2_HOME' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var mvnHome = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(mvnHome);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined, when the maven home directories are environment variables.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2_HOME' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			pathPrefix + 'M2_HOME' + fs + 'bin' + ps;
		var mvnHome = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(mvnHome);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries', function () {
		var path = pathPrefix + 'M2';
		var mvnHome = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(mvnHome);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there is more than 1 entry on the PATH.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var mvnHome = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(mvnHome);
		var actualSettings = mvn.getMavenGlobalSettings();
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there are multiple maven entries on the PATH.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			pathPrefix + 'M2' + ps;
		var mvnHome = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(mvnHome);
		var actualSettings = mvn.getMavenGlobalSettings();
		expect(actualSettings).toEqual(expectedSettings);
	});
});

describe('When maven-utils detects that maven has not been installed correctly.', function () {
	beforeEach(function () {
		spyOn(ui, 'warning');
		global.atom = {
			config: {
				get: function () {
					return '';
				}
			}
		};
	});

	it('should set the flag "mavenIsInstalled" to false, to indicate that it should not try to load pom files.', function () {
		var path = '';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path);
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(false);
	});
});

describe('When maven-utils detects that maven has been found and installed correctly.', function () {
	beforeEach(function () {
		spyOn(ui, 'warning');
		global.atom = {
			config: {
				get: function () {
					return '';
				}
			}
		};
	});

	it('should set the flag "mavenIsInstalled" to true, to indicate that it should load the pom files in the workspace.', function () {
		var path = pathPrefix + 'M2';
		spyOn(common, 'resolveEnvironmentVariable').andReturn(path).andReturn(pathPrefix + 'tools' + fs + 'apache-maven');
		mvn.getMavenGlobalSettings();
		expect(mvn.mavenIsInstalled).toEqual(true);
	});
});

describe('When the user configures the Maven Home directory through atom-maven configuration', function () {
	beforeEach(function () {
		spyOn(ui, 'warning');
	});

	it('should return the configuration directory for the user defined maven home directory', function () {
		var base = pathPrefix + 'tools' + fs + 'apache-maven';
		var mvnHome = base + fs + 'bin';
		var expected = base + fs + 'conf' + fs + 'settings.xml';
		global.atom = {
			config: {
				get: function () {
					return {
						mavenHome: mvnHome
					};
				}
			}
		};
		spyOn(common, 'resolveEnvironmentVariable').andReturn('');
		var actual = mvn.getMavenGlobalSettings();
		expect(actual).toEqual(expected);
	});

	it('should return the configuration directory for the user defined maven home directory, even if the bin directory is not included', function () {
		var base = pathPrefix + 'tools' + fs + 'apache-maven';
		var expected = base + fs + 'conf' + fs + 'settings.xml';
		global.atom = {
			config: {
				get: function () {
					return {
						mavenHome: base
					};
				}
			}
		};
		spyOn(common, 'resolveEnvironmentVariable').andReturn('');
		var actual = mvn.getMavenGlobalSettings();
		expect(actual).toEqual(expected);
	});

	it('should return the configuration directory for the user defined maven home directory, using example from issue 43', function () {
		var base = pathPrefix + 'usr' + fs + 'local' + fs + 'Cellar' + fs + 'maven' + fs + 'VERSION' + fs + 'libexec' + fs + 'bin' + fs;
		var expected = base + fs + 'conf' + fs + 'settings.xml';
		global.atom = {
			config: {
				get: function () {
					return {
						mavenHome: base
					};
				}
			}
		};
		spyOn(common, 'resolveEnvironmentVariable').andReturn('');
		var actual = mvn.getMavenGlobalSettings();
		expect(actual).toEqual(expected);
	});
});
