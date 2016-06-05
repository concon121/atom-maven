'use babel';
'use strict';

const log4js = require('log4js');
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('pom-registry.log'), 'pom-registry');

const logger = log4js.getLogger('pom-registry');
logger.setLevel('TRACE');


class PomRegistry {

	constructor() {
		this.registry = new Map();
	}

}

PomRegistry.prototype.has = function (key) {
	return this.registry.has(key);
};

PomRegistry.prototype.put = function (key, value) {
	if (!this.has(key) && (key.indexOf('undefined') < 0)) {
		this.registry.set(key, value);
	} else {
		console.warn('Attempt to overwrite pom file was blocked', key, value);
	}
};

PomRegistry.prototype.get = function (key) {
	return this.registry.get(key);
};

PomRegistry.prototype.contains = function (key, value) {
	console.log(this.registry);
	if (value) {
		for (var v of this.registry.values()) {
			if (v.equals(value)) {
				return v;
			}
		}
	} else {
		return this.registry.get(key);
	}
	return null;
};

module.exports = new PomRegistry();
