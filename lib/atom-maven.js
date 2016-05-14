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
	repo: "C:\\tools\\REPO\\",

	activate(state) {

		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		// Register command that toggles this view
		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'atom-maven:toggle': () => this.toggle()
		}));
	},

	deactivate() {
		this.dependenciesInstalled = null;
		this.subscriptions.dispose();
	},

	serialize() {
		return {};
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
					location = self.repo + groupId + "\\" + artifactId + "\\" + version + "\\" + artifactId + "-" + version + ".jar;";
				locations = locations + location;
			});
			cp.write(locations);
		}

	},

	onReadFail(error) {
		console.log(error);
	}

};
