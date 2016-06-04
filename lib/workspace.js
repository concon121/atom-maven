'use babel';

class Workspace {

	constructor() {
		this.poms = [];
	}

}

Workspace.prototype.$ = require('jquery');

Workspace.prototype.add = function (pom) {
	this.poms.push(pom);
};

Workspace.prototype.contains = function (value) {
	if (value) {
		for (var v of this.poms) {
			if (v.equals(value)) {
				return v;
			}
		}
	}
	return null;
};

module.exports = new Workspace();
