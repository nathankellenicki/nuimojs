let noble = require("noble"),
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


    scan () {

        wantScan = true;

        noble.on("discover", (peripheral) => {

            let advertisement = peripheral.advertisement;

            if (advertisement.localName === "Nuimo") {
                let device = new Device(peripheral);
                this.emit("discover", device);
            }

        });

        if (ready) {
            noble.startScanning();
        }

    }


    stop () {
        noble.stopScanning();
    }


}

module.exports = Nuimo;
