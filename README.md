# node-crashreporter

node-crashreporter [![Build Status](https://travis-ci.org/sdolard/node-crashreporter.png?branch=master)](https://travis-ci.org/sdolard/node-crashreporter)[![Build Dependency](https://david-dm.org/sdolard/node-crashreporter.png)](https://david-dm.org/sdolard/node-crashreporter)

Dump node context into a file on process crash, send it by mail

## Installing crashreporter

```bash
[sudo] npm install crashreporter
```

## Usage

### Basic

```javascript
require('crashreporter');
```

### More

```javascript
require('crashreporter').configure({
    outDir: [your out directory], // default to cwd
    exitOnCrash: [true|false] // if you want that crash reporter exit(1) for you, default to true,
    maxCrashFile: [number] // older files will be removed up, default 5 files are kept
});
```

### Advanced: send mail

See <http://www.nodemailer.com/> for support

```javascript
require('crashreporter').configure({
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
```

### Hidden Attributes

Hidden Attribute hide items in the email.

```
require('crashreporter').configure({
    ...
    hiddenAttributes: ['versions', 'error'],
    ...
});
```

####  Options

* dateTime
* execPath
* argv
* currentDirectory
* env
* currentDirectory
* env
* pid
* gid
* uid
* processTitle
* uptime
* arch
* versions
* memoryUsage
* requireCache
* activeHandle
* activeRequest
* stack

## File

### Name

crash_YYYY-MM-DD_HH-mm-ss_zzz_UTC.txt

### Dump

```bash
Date time:
-----------------------
execPath:
-----------------------
argv:
-----------------------
current directory:
-----------------------
env:
-----------------------
gid:
-----------------------
uid:
-----------------------
pid:
-----------------------
process title:
-----------------------
uptime (sec):
-----------------------
arch: x
-----------------------
versions:
-----------------------
memory usage:
-----------------------
require.cache:
-----------------------
active handle:
-----------------------
active request:
-----------------------
stack
```
