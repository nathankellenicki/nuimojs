# Nuimo.js - A Node.js library for interacting with Nuimo devices

### Installation

Node.js v6.0+ required.

```javascript
npm install nuimojs --save
```

Nuimo.js uses the Noble BLE library by Sandeep Mistry. On macOS everything should function out of the box. On Linux and Windows there are ([certain dependencies](https://github.com/sandeepmistry/noble#prerequisites)) which may need installed first.

Note: Nuimo.js has been tested on macOS 10.11 and Debian/Raspbian on the Raspberry Pi 3 Model B.

### Usage

```javascript
let Nuimo = require("nuimo"),
    nuimo = new Nuimo();
```

### Class: Nuimo

Note: Subclass of EventEmitter.

#### Methods

##### scan()

Begins scanning for Nuimo devices.

##### stop()

Stops scanning for Nuimo devices.

#### Events

##### on("discover", callback(device))