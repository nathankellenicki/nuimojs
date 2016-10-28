let noble = require("noble"),
    debug = require('debug')('nuimojs'),
    EventEmitter = require("events").EventEmitter;

let Device = require("./src/device.js");

let ready = false,
    wantScan = false;

noble.on("stateChange", (state) => {
    ready = (state === "poweredOn");
    if (ready) {
        if (wantScan) {
            noble.startScanning();
        }
    } else {
        noble.stopScanning();
    }
});

class Nuimo extends EventEmitter {

    constructor () {
        super();
    }

    static get Direction () {
        return Device.Direction;
    }

    static get Swipe () {
        return Device.Swipe;
    }

    static get Fly () {
        return Device.Fly;
    }

    static get Area () {
        return Device.Area;
    }
    
    static get Options(){
        return Device.Options;
    }

    scan () {
        wantScan = true;

        noble.on("discover", (peripheral) => {
            let advertisement = peripheral.advertisement;

            if (advertisement.localName === "Nuimo") {
                peripheral.removeAllListeners();
                noble.stopScanning();

                let device = new Device(peripheral);

                device._peripheral.on("connect", () => {
                    debug("Peripheral connected");
                });

                device._peripheral.on("disconnect", () => {
                    debug("Peripheral disconnected");

                    if (wantScan) {
                        noble.startScanning();
                    }

                    device.emit("disconnect");
                });

                this.emit("discover", device);
            }
        });

        if (ready) {
            noble.startScanning();
        }
    }

    wirethingInit () {
        this.scan();
    }

    stop () {
        wantScan = false;
        noble.stopScanning();
    }
}

module.exports = Nuimo;
