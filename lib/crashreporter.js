
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

		this.mailEnabled = config.mailEnabled;
		this.mailTransportName = config.mailTransportName;
		this.mailTransportConfig = config.mailTransportConfig;
		this.mailSubject = config.mailSubject || 'crashreporter';
		this.mailFrom = config.mailFrom;
		this.mailTo = config.mailTo; 

		this.testOutdir();
	};

	CrashReporter.prototype.onUncaughtException = function(err) {
		this.error = err.stack || err;
		var 
		now = new Date(),
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
		content = [],
		data;

		content.push('execPath: ' + process.execPath);
		content.push('argv: ' + process.argv.join(', '));
		content.push('current directory: ' + process.cwd());
		content.push('env:\n' + util.inspect(process.env));
		content.push('gid: ' + process.getgid());
		content.push('uid: ' + process.getuid());
		content.push('pid: ' + process.pid);
		content.push('process title: ' + process.title);
		content.push('uptime (sec): ' + process.uptime());
		content.push('arch: ' + process.arch);
		content.push('versions:\n' + util.inspect(process.versions));
		content.push('memory usage:\n' + util.inspect(process.memoryUsage()));
		content.push('require.cache:\n' + Object.keys(require.cache).join('\n'));
		content.push('active handle:\n' + util.inspect(process._getActiveHandles()));
		content.push('active request:\n' + util.inspect(process._getActiveRequests()));
		content.push(this.error);
		data = content.join(sep);
		if (fs.writeFileSync(fileName, data) === undefined) {
			console.error('Crash written in: %s', fileName);
		} else {
			console.error('Failed to write crash in: %s', fileName);
		}

		console.error(this.error);

		if (!this.sendMail(data)) {
			this.exit();
		}
	};

	CrashReporter.prototype.sendMail = function(plaintextBody) {
		if (!this.mailEnabled) {
			return false;
		}
		var 
		nodemailer  = require('nodemailer'),
		// create reusable transport method (opens pool of SMTP connections)
		mailTransport = nodemailer.createTransport(this.mailTransportName, this.mailTransportConfig),

		// setup e-mail data with unicode symbols
		mailOptions = {
		    from:  this.mailFrom, // sender address
		    to: this.mailTo, // list of receivers
		    subject: this.mailSubject, // Subject line
		    text: plaintextBody // plaintext body
		};

		// send mail with defined transport object
		mailTransport.sendMail(mailOptions, function(error, response){
		    if(error){
		    	this.crashExit(error);
		    }else{
		        console.error("Message sent: " + response.message);
		    }

		    // if you don't want to use this transport object anymore, uncomment following line
		    mailTransport.close(); // shut down the connection pool, no more messages

		    this.exit();
		}.bind(this));
		return true;
	};

	CrashReporter.prototype.exit = function() {
		if (this.exitOnCrash) {
			process.nextTick(function() { 
				process.exit(1); // should exit after all 'uncaughtException' event calls
			});
		}
	};

	CrashReporter.prototype.crashExit = function(error) {
		console.error('\n-------------------\ncrashreporter Error\n-------------------');
		console.error(error.stack || error);
		process.exit(1);
	};

	CrashReporter.prototype.testOutdir = function() {
		var 
		err,
		statSync;

		try {
			statSync = fs.statSync(this.outDir);
		} catch(e) {
			if(e.code === 'ENOENT') {
				err = new Error('outDir not found: ' + this.outDir);
				err.code = 'EOUTDIRNOTFOUND';
				this.crashExit(err);
			} else {
				this.crashExit(e);
			}
		}
		
		if (statSync.isDirectory()) {
			return;
		}

		err = new Error('Invalid outDir: ' + this.outDir);
		err.code = 'EINVALIDOUTDIR';
		this.crashExit(err);
	};

	if (!crashReporterSingleton) {
		exports._singleton = crashReporterSingleton = new CrashReporter();
	}
	return crashReporterSingleton;
}());

exports.configure = function (config) {
	crashReporterSingleton.configure(config);
};
