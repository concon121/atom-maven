'use babel';
'use strict';

const log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/workspace.log'), 'workspace');

const logger = log4js.getLogger('workspace');
logger.setLevel('TRACE');


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
