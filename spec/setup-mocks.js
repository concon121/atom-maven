class Mocks {

}

Mocks.prototype.mock = function (constr, name) {
	var keys = [];
	for (var key in constr.prototype) {
		keys.push(key);
	}
	var result = keys.length > 0 ? jasmine.createSpyObj(name || 'mock', keys) : {};
	result.jasmineToString = function () {
		return 'mock' + (name ? ' of ' + name : '');
	};
	return result;
};

module.exports = new Mocks();
