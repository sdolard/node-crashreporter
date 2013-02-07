var 
assert = require('assert'),
crashreporter = require('../lib/crashreporter');

describe('CrashReporter', function(){
	describe('When creating a CrashReporter with no param', function(){
		it('should connect to uncaughtException event', function(){
			assert.deepEqual(process.listeners('uncaughtException').length, 2);
		});
	});
});