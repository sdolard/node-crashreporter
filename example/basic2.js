require('../lib/crashreporter').configure({
	outDir: (__dirname + '/../bin/crash'),
	exitOnCrash: true,
	maxCrashFile: 3
});
throw new Error('foo');
