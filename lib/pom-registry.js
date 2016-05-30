class PomRegistry {

	constructor() {
		this.registry = new Map();
	}

}

PomRegistry.prototype.has = function (key) {
	return this.registry.has(key);
};

PomRegistry.prototype.put = function (key, value) {
	console.log(key, value);
	if (!this.has(key) && (key.indexOf('undefined') < 0)) this.registry.set(key, value);
	else console.warn('Attempt to overwrite pom file was blocked', key, value);
};

PomRegistry.prototype.get = function (key) {
	return this.registry.get(key);
};

PomRegistry.prototype.contains = function (key, value) {
	console.log('REGISTRY: ', this.registry);
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
