var common = require('./common');

var PomRegistry = function () {
	return {

		registry: new Map(),

		has: function (key) {
			return this.registry.has(key);
		},

		put: function (key, value) {
			if (!this.has(key)) this.registry.set(key, value);
			else console.warn("Attempt to overwrite pom file was blocked");
		},

		get: function (key) {
			return this.registry.get(key);
		}

	};

};

module.exports = PomRegistry();
