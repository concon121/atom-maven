'use babel';

import {
	_
} from 'lodash';
import {
	CompositeDisposable
} from 'atom';

export default {

	dependenciesInstalled: null,
	subscriptions: null,
	cpConfigFileName: '.classpath',
	pomFileName: 'pom.xml',
	targetFileName: 'target',
	path: require('path'),
	repo: null,
	isWin: null,
	pathSeparator: null,
	fileSeparator: null,
	homeDir: null,
	fs: require('fs'),
	unzip: require('unzip'),
	$: require('jquery'),

	activate(state) {

		// Set up concenience variables to be used later on
		this.isWin = (/^win/.test(process.platform));
		this.pathSeparator = (this.isWin) ? ";" : ":";
		this.fileSeparator = (this.isWin) ? "\\" : "/";
		this.homeDir = (this.isWin) ? process.env.HOMEPATH : process.env.HOME;

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Can be done on activation as this shouldn't change
		this.setMavenRepo();
		this.toggle();
	},

	deactivate() {
		this.dependenciesInstalled = null;
		this.subscriptions.dispose();
	},

	/* Scans the users PATH for the presence of Maven to determine where the
	 * global settings.xml file is located.
	 */
	getMavenGlobalSettings() {
		var path = (this.isWin) ? process.env.Path : process.env.PATH,
			pathElems = path.split(this.pathSeparator),
			self = this,
			settings = "conf" + self.fileSeparator + "settings.xml",
			settingsFileLocation = "";
		pathElems.every(function (elem) {
			if (elem.indexOf("maven") > -1) {
				settingsFileLocation = (elem.endsWith("bin")) ? elem.replace("bin", settings) : elem.concat(settings);
				return false;
			}
			return true;
		});
		if (settingsFileLocation === "") {
			console.error("Maven has not been found on the PATH, please ensure that Maven has been installed.");
			self.addPlainMessage("Maven has not been found on the PATH, please ensure that Maven has been installed.", "error");
		}
		return settingsFileLocation;
	},

	fileExists(file, doReport) {
		var exists = true,
			self = this;
		try {
			self.fs.accessSync(file, self.fs.F_OK);
		} catch (err) {
			if (doReport) {
				console.warn("File does not exist: " + file);
				self.addPlainMessage("File does not exist: " + file, "warning");
			}
			exists = false;
		}
		return exists;
	},

	/* Given the location of the maven settings.xml, the file is read with node
	 * fs, jquery then parses the xml and extracts the localRepository.
	 */
	findMavenRepoInSettings(settingsFileLocation) {
		var self = this,
			content = self.fs.readFileSync(settingsFileLocation, "utf8"),
			parsed = self.$.parseXML(content),
			xmlDoc = self.$(parsed),
			repo = xmlDoc.find("localRepository");
		self.repo = (repo.text().endsWith(self.fileSeparator)) ? repo.text() : repo.text().concat(self.fileSeparator);
	},

	/* Checks maven settings for a localRepository which deviates from the maven
	 * default.
	 * User settings take priority:
	 * 			${user.home}/.m2/settings.xml
	 * Global settings are used if no user settings are found:
	 * 			${maven.home}/conf/settings.xml
	 * If a localRepository is not present in either the user or global settings,
	 * use the default repository:
	 * 			${user.home}/.m2/repository
	 */
	setMavenRepo() {

		var hasUserSettings = true,
			hasGlobalSettings = true,
			hasCustomRepo = false,
			globalSettingsLocation = this.getMavenGlobalSettings(),
			settingsFileLocation = this.homeDir + this.fileSeparator + ".m2" + this.fileSeparator + "settings.xml";

		// Check if user settings are present
		hasUserSettings = this.fileExists(settingsFileLocation, false);

		// if not, check if global settings are present
		if (!hasUserSettings) {
			settingsFileLocation = globalSettingsLocation;
			hasGlobalSettings = this.fileExists(settingsFileLocation, false);
		}

		// If either user or global settings have been found, check if a maven repo has been configured.
		if (hasUserSettings || hasGlobalSettings) {
			this.findMavenRepoInSettings(settingsFileLocation);
		}

		// If the local repo has not been determined so far, assume the default repository is present.
		//		if (this.repo === undefined || this.repo === null || this.repo.trim() === "") {
		if (_.isEmpty(this.repo)) {
			this.repo = this.homeDir + this.fileSeparator + ".m2" + this.fileSeparator + "repository";
		}

		// For lazyness, ensure the repo ends with a file separator so I dont have to bother adding one later on.
		if (!this.repo.endsWith(this.fileSeparator)) {
			this.repo = this.repo.concat(this.fileSeparator);
		}

	},

	poms: [],

	isPom(file, self) {
		if (file.isDirectory()) {
			self.$.each(file.getEntriesSync(), function (index, elem) {
				self.isPom(elem, self);
			});
		} else {
			if (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName)) {
				self.poms.push(file);
			}
		}

	},

	toggle() {
		console.info('atom-maven is configuring your classpath');
		var rootDirectories = atom.workspace.project.getDirectories(),
			self = this;

		self.$.each(rootDirectories, function (index, elem) {
			self.isPom(elem, self);
		});

		self.$.each(self.poms, function (index, elem) {
			var cp = self.createClasspath(elem);
			var result = elem.read(false);
			result.then(self.onReadComplete(cp, elem, self), self.onReadFail);
			elem.previousDigest = elem.getDigestSync();
			elem.onDidChange(function () {
				if (elem.previousDigest !== elem.getDigestSync()) {
					var result = elem.read(false);
					result.then(self.onReadComplete(cp, elem, self), self.onReadFail);
					elem.previousDigest = elem.digest;
				}
			});
		});
	},

	clone(obj) {
		if (obj == null || typeof (obj) != 'object') {
			return obj;
		}

		var temp = new obj.constructor();

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				temp[key] = this.clone(obj[key]);
			}
		}

		return temp;
	},

	createClasspath(pom) {
		var path = pom.path.replace("pom.xml", ".classpath");
		this.fs.writeFileSync(path, "");
		return path;
	},

	onReadComplete(cp, pom, self) {

		return function (xml) {
			var parsed = self.$.parseXML(xml),
				xmlDoc = $(parsed),
				dependenciesElem = xmlDoc.find("dependencies"),
				dependencies = dependenciesElem.children(),
				locations = ".;";
			dependencies.each(function (index, elem) {
				var dependency = self.$(elem),
					groupId = dependency.find("groupId").text().replace(/\./g, "\\"),
					artifactId = dependency.find("artifactId").text(),
					version = dependency.find("version").text(),
					location = self.repo + groupId + self.fileSeparator + artifactId + self.fileSeparator + version + self.fileSeparator + artifactId + "-" + version + ".jar",
					exists = self.fileExists(location, false);
				if (!exists) {
					self.displayDependencyError(xml, groupId, artifactId, version, pom.getPath(), self);
				} else {
					locations = locations + location + ";";
				}
			});
			self.fs.writeFileSync(cp, locations);
			console.info("atom-maven has finished configuring the classpath: " + cp);
		}

	},

	displayDependencyError(xml, groupId, artifactId, version, file, self) {
		var lines = xml.split("\n"),
			gid = false,
			aid = false,
			ver = false,
			lineNo = 0,
			message = "Dependency " + groupId + ":" + artifactId + ":" + version + " could not be found in the local repository.";
		$.each(lines, function (index, line) {
			line = line.trim();
			if (line.indexOf("dependency") > -1) {
				gid = false;
				aid = false;
				ver = false;
				lineNo = index + 1;
			}
			if (line.indexOf(groupId) > -1) {
				gid = true;
			}
			if (line.indexOf(artifactId) > -1) {
				aid = true;
			}
			if (line.indexOf(version) > -1) {
				ver = true;
			}
			if (gid && aid && ver) {
				self.addLineMessage(message, lineNo, 0, file, "error");
			}
		});
	},

	onReadFail(error) {
		console.error(error);
	},

	messages: null,

	initMessagePanel() {

		if (this.messages === null) {
			var MessagePanelView = require('atom-message-panel').MessagePanelView;

			this.messages = new MessagePanelView({
				title: 'atom-maven report'
			});

			this.messages.attach();

		} else {
			if (!this.messages.panel.isVisible()) {
				this.messages.clear();
				this.messages.panel.show();
			}
		}
	},

	addPlainMessage(text, level) {

		this.initMessagePanel();

		var PlainMessageView = require('atom-message-panel').PlainMessageView;

		this.messages.add(new PlainMessageView({
			message: text,
			className: 'text-' + level
		}));
	},

	addLineMessage(text, fileLine, lineChar, path, level) {

		this.initMessagePanel();

		var LineMessageView = require('atom-message-panel').LineMessageView;

		this.messages.add(new LineMessageView({
			message: text,
			line: fileLine,
			character: lineChar,
			className: 'text-' + level,
			file: path
		}));

	}

};
