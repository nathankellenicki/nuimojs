let noble = require("noble"),
    EventEmitter = require("events").EventEmitter;

let Device = require("./src/device.js");

const Direction = {
    LEFT: 0,
    RIGHT: 1
};


let ready = false;


noble.on("stateChange", (state) => {
    ready = (state === "poweredOn");
});


class Nuimo extends EventEmitter {

    constructor () {
        super();
    }


    static get Direction () {
        return Direction;
    }


    scan () {

        noble.on("discover", (peripheral) => {

            let advertisement = peripheral.advertisement;

            if (advertisement.localName === "Nuimo") {

                let device = new Device(peripheral);
                this.emit("discover", device);

            }

        });

        if (ready) {
            noble.startScanning();
        } else {
            setTimeout(() => {
                if (ready) {
                    noble.startScanning();
                } else {
                    this.emit("error");
                }
            }, 2000);
        }

    }


}

module.exports = Nuimo;