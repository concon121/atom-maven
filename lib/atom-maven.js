'use babel';


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

	activate(state) {

		// Set up concenience variables to be used later on
		this.isWin = (/^win/.test(process.platform));
		this.pathSeparator = (this.isWin) ? ";" : ":";
		this.fileSeparator = (this.isWin) ? "\\" : "/";
		this.homeDir = (this.isWin) ? process.env.HOMEPATH : process.env.HOME;

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-maven:toggle': () => this.toggle()
		}));

		// Can be done on activation as this shouldn't change
		this.setMavenRepo();
	},

	deactivate() {
		this.dependenciesInstalled = null;
		this.subscriptions.dispose();
	},

	serialize() {
		return {};
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
		return settingsFileLocation;
	},

	fileExists(file) {
		var exists = true,
			self = this;
		try {
			self.fs.accessSync(file, self.fs.F_OK, (err) => {
				console.log(err);
				exists = false;
			});
		} catch (err) {
			console.log(err);
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
			parsed = $.parseXML(content),
			xmlDoc = $(parsed),
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
			settingsFileLocation = this.homeDir + this.fileSeparator + ".m2" + this.fileSeparator + "settings.xml";

		// Check if user settings are present
		hasUserSettings = this.fileExists(settingsFileLocation);

		// if not, check if global settings are present
		if (!hasUserSettings) {
			settingsFileLocation = this.getMavenGlobalSettings();
			hasGlobalSettings = this.fileExists(settingsFileLocation);
		}

		// If either user or global settings have been found, check if a maven repo has been configured.
		if (hasUserSettings || hasGlobalSettings) {
			this.findMavenRepoInSettings(settingsFileLocation);
		}

		// If the local repo has not been determined so far, assume the default repository is present.
		if (this.repo === undefined || this.repo === null || this.repo.trim() === "") {
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
			$.each(file.getEntriesSync(), function (index, elem) {
				self.isPom(elem, self);
			});
		} else {
			if (file.path.indexOf(self.targetFileName) < 0 && file.path.endsWith(self.pomFileName)) {
				self.poms.push(file);
			}
		}

	},

	toggle() {
		console.log('AtomMaven was toggled!');
		var rootDirectories = atom.workspace.project.getDirectories(),
			self = this;

		$.each(rootDirectories, function (index, elem) {
			self.isPom(elem, self);
		});

		$.each(self.poms, function (index, elem) {
			var cp = self.createClasspath(elem),
				result = elem.read(false);
			result.then(self.onReadComplete(cp, self), self.onReadFail);
		})
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
		var cloned = this.clone(pom);
		cloned.setPath(pom.path.replace("pom.xml", ".classpath"));
		cloned.create();
		cloned.write("");
		return cloned;
	},

	onReadComplete(cp, self) {

		return function (xml) {
			var parsed = $.parseXML(xml),
				xmlDoc = $(parsed),
				dependenciesElem = xmlDoc.find("dependencies"),
				dependencies = dependenciesElem.children(),
				locations = ".;";
			dependencies.each(function (index, elem) {
				var dependency = $(elem),
					groupId = dependency.find("groupId").text().replace(/\./g, "\\"),
					artifactId = dependency.find("artifactId").text(),
					version = dependency.find("version").text(),
					location = self.repo + groupId + self.fileSeparator + artifactId + self.fileSeparator + version + self.fileSeparator + artifactId + "-" + version + ".jar;";
				locations = locations + location;
			});
			cp.write(locations);
		}

	},

	onReadFail(error) {
		console.log(error);
	}

};
