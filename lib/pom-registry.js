var common = require('./common'),
	$ = require('jquery');

var PomRegistry = function () {
	return {

		registry: new Map(),

		has: function (key) {
			return this.registry.has(key);
		},

		put: function (key, value) {
			if (!this.has(key)) this.registry.set(key, value);
			else {
				console.warn('Attempt to overwrite pom file was blocked', key, value);
				console.log(this.get(key));
			}
		},

		get: function (key) {
			return this.registry.get(key);
		},

		find: function (key, value) {
			if (this.registry.has(key)) return this.registry.get(key);
			else {
				var found = null;
				$.each(this.registry.values(), (index, val) => {
					if (value.equals(val)) found = val;
					return false;
				});
				return found;
			}
		}

	};

};

module.exports = PomRegistry();
