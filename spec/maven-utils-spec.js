const mvn = require('../lib/maven-utils');
const common = require('../lib/common');
const fs = common.fileSeparator;
const ps = common.pathSeparator;

describe('When finding the location of the maven settings file.', () => {

	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn('C:' + fs + 'tools' + fs + 'apache-maven');
	});

	it('should correctly resolve the maven settings.xml location when the path contains only the maven home url.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'bin';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the path contains more than 1 entry.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'random' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'random' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'apache-maven-correct' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'apache-maven-incorrect' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven-correct' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the maven home directory is an environment variable.', () => {
		var path = 'M2_HOME' + fs + 'bin';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location where there is more than one entry on the PATH and the maven home directory is an environment variable.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'random' + fs + 'bin' + ps +
			'M2_HOME' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined, when the maven home directories are environment variables.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'random' + fs + 'bin' + ps +
			'M2_HOME' + fs + 'bin' + ps +
			'C:' + fs + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			'M2_HOME' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries', () => {
		var path = 'M2';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there is more than 1 entry on the PATH.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'random' + fs + 'bin' + ps +
			'M2' + ps +
			'C:' + fs + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there are multiple maven entries on the PATH.', () => {
		var path = 'C:' + fs + 'tools' + fs + 'random' + fs + 'bin' + ps +
			'M2' + ps +
			'C:' + fs + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			'M2' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:' + fs + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});
});

describe('When maven-utils detects that maven has not been installed correctly.', () => {

	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn('C:' + fs + 'tools' + fs + 'apache-maven');
	});

	it('should set the flag "mavenIsInstalled" to false, to indicate that it should not try to load pom files.', () => {
		var path = '';
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(false);
	});
});


describe('When maven-utils detects that maven has been found and installed correctly.', () => {

	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn('C:' + fs + 'tools' + fs + 'apache-maven');
	});

	it('should set the flag "mavenIsInstalled" to true, to indicate that it should load the pom files in the workspace.', () => {
		var path = 'M2';
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(true);
	});
});
