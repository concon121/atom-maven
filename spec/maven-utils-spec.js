'use strict';
'use babel';

if (process.env.COVERAGE.indexOf('true') >= 0) {
	require('babel-register');
}

// in spec_runner.js
global.initDOM = function () {

	var jsdom = require('jsdom');
	var jQuery = require('jquery');
	global.jQuery = global.$ = jQuery;

	global.window = jsdom.jsdom().defaultView;
	//global.document = window.document;
	require('html-element');
	global.addEventListener = window.addEventListener
}

// GLOBAL.window = GLOBAL;
// GLOBAL.document = GLOBAL;

initDOM();

var mvn = require('../lib/maven-utils');
var common = require('../lib/common');
var ui = require('../lib/ui-utils');
var fs = common.fileSeparator;
var ps = common.pathSeparator;
var pathPrefix = (common.isWin) ? 'C:' + fs : fs;

describe('When finding the location of the maven settings file.', function () {
	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn(pathPrefix + 'tools' + fs + 'apache-maven');
		spyOn(ui, 'warning');
	});

	it('should correctly resolve the maven settings.xml location when the path contains only the maven home url.', function () {
		var path = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the path contains more than 1 entry.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'apache-maven-correct' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'apache-maven-incorrect' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven-correct' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location when the maven home directory is an environment variable.', function () {
		var path = pathPrefix + 'M2_HOME' + fs + 'bin';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should correctly resolve the maven settings.xml location where there is more than one entry on the PATH and the maven home directory is an environment variable.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2_HOME' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should in the case that there are multiple maven entries on the PATH, prefer to use the first entry defined, when the maven home directories are environment variables.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2_HOME' + fs + 'bin' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			pathPrefix + 'M2_HOME' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries', function () {
		var path = pathPrefix + 'M2';
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there is more than 1 entry on the PATH.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});

	it('should resolve the maven settings location if the first maven entry on the classpath does not contain maven binaries and there are multiple maven entries on the PATH.', function () {
		var path = pathPrefix + 'tools' + fs + 'random' + fs + 'bin' + ps +
			pathPrefix + 'M2' + ps +
			pathPrefix + 'tools' + fs + 'other-random' + fs + 'bin' + ps +
			pathPrefix + 'M2' + ps;
		var actualSettings = mvn.getMavenGlobalSettings(path);
		var expectedSettings = pathPrefix + 'tools' + fs + 'apache-maven' + fs + 'conf' + fs + 'settings.xml';
		expect(actualSettings).toEqual(expectedSettings);
	});
});

describe('When maven-utils detects that maven has not been installed correctly.', function () {
	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn(pathPrefix + 'tools' + fs + 'apache-maven');
		spyOn(ui, 'warning');
	});

	it('should set the flag "mavenIsInstalled" to false, to indicate that it should not try to load pom files.', function () {
		var path = '';
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(false);
	});
});

describe('When maven-utils detects that maven has been found and installed correctly.', function () {
	beforeEach(function () {
		spyOn(common, 'resolveEnvironmentVariable').andReturn(pathPrefix + 'tools' + fs + 'apache-maven');
		spyOn(ui, 'warning');
	});

	it('should set the flag "mavenIsInstalled" to true, to indicate that it should load the pom files in the workspace.', function () {
		var path = pathPrefix + 'M2';
		mvn.getMavenGlobalSettings(path);
		expect(mvn.mavenIsInstalled).toEqual(true);
	});
});
