const mvn = require('../lib/maven-utils');
const common = require('../lib/common');
const mocks = require('./setup-mocks');

describe('When finding the location of the maven settings file.', () => {

	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn('C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven');
	});

	it('should correctly resolve the maven settings.xml location when the path contains only the maven home url.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven' + common.fileSeparator + 'bin';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the path contains more than 1 entry.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'other-random' + common.fileSeparator + 'bin' + common.pathSeparator;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven-correct' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'other-random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven-incorrect' + common.fileSeparator + 'bin' + common.pathSeparator;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven-correct\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the maven home directory is an environment variable.', () => {
		var path = 'M2_HOME' + common.fileSeparator + 'bin';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location where there is more than one entry on the PATH and the maven home directory is an environment variable.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'M2_HOME' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'other-random' + common.fileSeparator + 'bin' + common.pathSeparator;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined, when the maven home directories are environment variables.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'M2_HOME' + common.fileSeparator + 'bin' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'other-random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'M2_HOME' + common.fileSeparator + 'bin' + common.pathSeparator;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries', () => {
		var path = 'M2';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there is more than 1 entry on the PATH.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'M2' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'other-random' + common.fileSeparator + 'bin' + common.pathSeparator;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there are multiple maven entries on the PATH.', () => {
		var path = 'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'M2' + common.pathSeparator +
			'C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'other-random' + common.fileSeparator + 'bin' + common.pathSeparator +
			'M2' + common.pathSeparator;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = 'C:\\tools\\apache-maven\\conf\\settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});
});

describe('When maven-utils detects that maven has not been installed correctly.', () => {

	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn('C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven');
	});

	it('should set the flag "mavenIsInstalled" to false, to indicate that it should not try to load pom files.', () => {
		var path = '';
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(false);
	});
});


describe('When maven-utils detects that maven has been found and installed correctly.', () => {

	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn('C:' + common.fileSeparator + 'tools' + common.fileSeparator + 'apache-maven');
	});

	it('should set the flag "mavenIsInstalled" to true, to indicate that it should load the pom files in the workspace.', () => {
		var path = 'M2';
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(true);
	});
});
