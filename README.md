node-crashreporter
==================

Dump node info on process uncaughtException exception


## Installing crashreporter

```
[sudo] npm install [-g] crashreporter
```

## Usage
### Basic
```javascript
require('rashreporter');                               
		
```

### More
```javascript
require('rashreporter').configure({
	outDir: <your out directory>, // default to cwd
	exitOnCrash: <true|false> // if you want that crash reporter exit(1)
});
		
```


## File
### Name
crash_YYYY-MM-DD_HH-mm-ss_zzz_UTC.txt

### Dump
```
-----------------------
environnement var:
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
arch: 
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