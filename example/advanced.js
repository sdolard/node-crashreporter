require('../lib/crashreporter').configure({
	mailEnabled: true,
	mailTransportName: 'SMTP',
	mailTransportConfig: {
		service: 'Gmail',
		auth: {
			user: "yourmail@gmail.com",
		    pass: "yourpass"
		}
	},
	mailSubject: 'advanced.js crashreporter test',
	mailFrom: 'crashreporter <yourmail@gmail.com>',
	mailTo: 'yourmail@gmail.com'
});
throw new Error('foo');
