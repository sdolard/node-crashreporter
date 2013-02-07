
var 
path = require('path'),
util = require('util'),
fs = require('fs'),
crashReporterSingleton  = (function() {
	function CrashReporter(config) {
		this.configure(config);
		process.on('uncaughtException', this.onUncaughtException.bind(this));
	}

	CrashReporter.prototype.configure = function(config) {
		config = config ||  {};
		this.outDir = config.outDir || process.cwd();
		this.exitOnCrash = config.exitOnCrash === undefined ? true : config.exitOnCrash;
	};

	CrashReporter.prototype.onUncaughtException = function(err) {
		var 
		now = new Date(),
		error = err.stack || err,
		fileName = path.resolve(util.format('%s/crash_%s-%s-%s_%s-%s-%s_%s_UTC.txt', 
			this.outDir,
			now.getUTCFullYear(),
			("0" + (now.getUTCMonth() + 1)).slice(-2),
			("0" + (now.getUTCDate())).slice(-2),
			("0" + now.getUTCHours()).slice(-2),
			("0" + now.getUTCMinutes()).slice(-2),
			("0" + now.getUTCSeconds()).slice(-2),
			("00" + now.getUTCMilliseconds()).slice(-3))),
		sep = '\n-----------------------\n',
		execPath = 'execPath: ' + process.execPath,
		argv = 'argv: ' + process.argv.join(', '),
		cwd = 'current directory: ' + process.cwd(),
		env = 'env:\n' + util.inspect(process.env),
		gid = 'gid: ' + process.getgid(),
		uid = 'uid: ' + process.getuid(),
		pid = 'pid: ' + process.pid,
		ptitle = 'process title: ' + process.title,
		uptime = 'uptime (sec): ' + process.uptime(),
		processVersions = 'versions:\n' + util.inspect(process.versions),
		processArch = 'arch: ' + process.arch,
		processMemoryUsage = 'memory usage:\n' + util.inspect(process.memoryUsage()),
		processActiveHandle = 'active handle:\n' + util.inspect(process._getActiveHandles()),
		processActiveRequest = 'active request:\n' + util.inspect(process._getActiveRequests()),
		
		requireCache = 'require.cache:\n' + Object.keys(require.cache).join('\n');

		if (fs.writeFileSync(fileName, 
			execPath + sep +
			argv + sep +
			cwd + sep +
			env + sep +
			gid + sep +
			uid + sep +
			pid + sep + 
			ptitle + sep +
			uptime + sep +
			processArch + sep + 
			processVersions + sep + 
			processMemoryUsage + sep + 
			requireCache + sep +
			processActiveHandle + sep + 
			processActiveRequest + sep +
			error) === undefined) {
			console.error('Crash written in: %s', fileName);
		} else {
			console.error('Failed to write crash in: %s', fileName);
		}

		console.error(error);

		if (this.exitOnCrash) {
			process.nextTick(function() { 
				process.exit(1); // should exit after all 'uncaughtException' event calls
			});
		}
	};

	if (!crashReporterSingleton) {
		exports._singleton = crashReporterSingleton = new CrashReporter();
	}
	return crashReporterSingleton;
}());

exports.configure = function (config) {
	crashReporterSingleton.configure(config);
};
