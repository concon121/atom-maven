var common = require('./common'),
	$ = require('jquery'),
	_ = require('underscore');

var PomRegistry = function () {
	return {

		registry: new Map(),

		has: function (key) {
			return this.registry.has(key);
		},

		put: function (key, value) {
			if (!this.has(key)) this.registry.set(key, value);
			else console.warn('Attempt to overwrite pom file was blocked', key, value);
		},

		get: function (key) {
			return this.registry.get(key);
		},

		find: function (key, value) {

			if (value) {
				for (var v of this.registry.values()) {
					if (v.equals(value)) {
						return v;
					}
				}
			} else {
				return this.registry.get(key);
			};

			return null;

		}

	};

};

module.exports = PomRegistry();
