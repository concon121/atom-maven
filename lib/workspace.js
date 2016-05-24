class Workspace {

	constructor() {
		this.poms = [];
	}

}

Workspace.prototype.$ = require('jquery');

Workspace.prototype.add = function (pom) {
	this.poms.push(pom);
};

Workspace.prototype.contains = function (pom) {
	var contains = null;
	this.$.each(this.poms, (index, elem) => {
		if (elem && elem.equals(pom)) {
			contains = elem;
			return false;
		}
	});
	return contains;
};

module.exports = new Workspace();
