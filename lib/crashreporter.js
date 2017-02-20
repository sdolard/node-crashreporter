
var
path = require('path'),
util = require('util'),
fs = require('fs'),
mkdirp = require('mkdirp'),
    
crashReporterSingleton  = (function() {
	function CrashReporter(config) {
		this.configure(config);
		process.on('uncaughtException', this.onUncaughtException.bind(this));
	}
	
	/**
	 *
	 * @param config
	 * @example : {
		mailEnabled: true,
		mailTransportName: 'SMTP',
		mailTransportConfig: {
			service: 'Gmail',
			auth: {
				user: 'youremail', // Your email id
				pass: 'yourpass' // Your password
			}
		},
		mailSubject: 'advanced.js crashreporter test',
		mailFrom: 'crashreporter <your@gmail.com>',
		mailTo: 'to@email.com'
	}
	 */
	CrashReporter.prototype.configure = function(config) {
		config = config ||  {};
		this.outDir = path.normalize(config.outDir || process.cwd());
		this.exitOnCrash = config.exitOnCrash === undefined ? true : config.exitOnCrash;
		this.maxCrashFile = config.maxCrashFile > 0 ? config.maxCrashFile : 5;

		this.mailEnabled = config.mailEnabled;
		this.mailTransportName = config.mailTransportName;
		this.mailTransportConfig = config.mailTransportConfig;
		this.mailSubject = config.mailSubject || 'crashreporter';
		this.mailFrom = config.mailFrom;
		this.mailTo = config.mailTo;

		this.hiddenAttributes = config.hiddenAttributes || [];
		
		this.testOutdir();
    };
        
    CrashReporter.prototype.checkHiddenAttribute = function (name) {
        return this.hiddenAttributes.indexOf(name) !== -1;
    }

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
		if (!this.checkHiddenAttribute('dateTime')) content.push('Date time: ' + now);
		if (!this.checkHiddenAttribute('execPath')) content.push('execPath: ' + process.execPath);
		if (!this.checkHiddenAttribute('argv')) content.push('argv: ' + process.argv.join(', '));
		if (!this.checkHiddenAttribute('currentDirectory')) content.push('current directory: ' + process.cwd());
		if (!this.checkHiddenAttribute('env')) content.push('env:\n' + util.inspect(process.env));
		if (process.platform !== 'win32') {
			if (!this.checkHiddenAttribute('gid')) content.push('gid: ' + process.getgid());
			if (!this.checkHiddenAttribute('uid')) content.push('uid: ' + process.getuid());
		}
		if (!this.checkHiddenAttribute('pid')) content.push('pid: ' + process.pid);
		if (!this.checkHiddenAttribute('processTitle')) content.push('process title: ' + process.title);
		if (!this.checkHiddenAttribute('uptime')) content.push('uptime (sec): ' + process.uptime());
		if (!this.checkHiddenAttribute('arch')) content.push('arch: ' + process.arch);
		if (!this.checkHiddenAttribute('versions')) content.push('versions:\n' + util.inspect(process.versions));
		if (!this.checkHiddenAttribute('memoryUsage')) content.push('memory usage:\n' + util.inspect(process.memoryUsage()));
		if (!this.checkHiddenAttribute('requireCache')) content.push('require.cache:\n' + Object.keys(require.cache).join('\n'));
		if (!this.checkHiddenAttribute('activeHandle')) content.push('active handle:\n' + util.inspect(process._getActiveHandles()));
		if (!this.checkHiddenAttribute('activeRequest')) content.push('active request:\n' + util.inspect(process._getActiveRequests()));
		if (!this.checkHiddenAttribute('stack')) content.push(this.error);
		data = content.join(sep);
		if (fs.writeFileSync(fileName, data) === undefined) {
			console.error('Crash written in: %s', fileName);
		} else {
			console.error('Failed to write crash in: %s', fileName);
		}

		console.error(this.error);

		this.deleteOlderCrashFile();

		if (!this.sendMail(data)) { // should always be the last call
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
		mailTransport = nodemailer.createTransport(this.mailTransportConfig),

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

	CrashReporter.prototype.crashExit = function(error, exit) {
		exit = exit !== false;
		console.log(exit);
		console.error('\n-------------------\ncrashreporter Error\n-------------------');
		console.error(error.stack || error);
		if (exit) {
			process.exit(1);
		}
	};

	CrashReporter.prototype.testOutdir = function() {
		var
		err,
		statSync;

		try {
			statSync = fs.statSync(this.outDir);
		} catch(e) {
			if(e.code === 'ENOENT') {
				try {
					mkdirp.sync(this.outDir);
					return;
				} catch(er) {
					this.crashExit(er);
				}
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

	CrashReporter.prototype.deleteOlderCrashFile = function() {
		var
		files,
		crashfiles = [],
		crashfilesRe = /^crash_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_(\d{3})_UTC.txt$/,
		match;

		try {
			files = fs.readdirSync(this.outDir);
			files.forEach(function(file) {
				match = file.match(crashfilesRe);
				if (match !== null) {
					crashfiles.push({
						file: path.resolve(this.outDir,file),
						date : new Date(
							match[1],//year
							parseInt(match[2], 10) - 1,//month
							match[3],//day
							match[4],//hour
							match[5],//minute
							match[6],//second
							match[7] //millisecond
						)
					});
				}
			}, this);

			if (crashfiles.length <= this.maxCrashFile) {
				return;
			}

			crashfiles = crashfiles.sort(function(a,b){
				if (a.date > b.date) {
					return 1;
				}
				if (a.date < b.date) {
					return -1;
				}
				return 0;
			});
			crashfiles = crashfiles.slice(0, crashfiles.length - this.maxCrashFile);
			crashfiles.forEach(function(file){
				try {
					fs.unlinkSync(file.file);
				} catch(e) {
					this.crashExit(e, false);
					// we continue, cleanup is not essential
				}
			});
		} catch (err) {
			this.crashExit(err, false);
			// we continue, cleanup is not essential
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
