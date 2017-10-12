import * as fs from "fs";
import debug = require("debug");
import noble = require("noble");
import { EventEmitter } from "events";

const log = debug("nuimojs");

import { Device } from "./src/device";

let ready: boolean = false,
    wantScan: boolean = false;


noble.on("stateChange", (state: string) => {
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

    private _connectedDevices: {[key: string]: Device} = {};
    private _useWhitelist: boolean = false;
    private _whitelist: string[] = [];

    constructor (whitelist: string | string[]) {
        super();

        if (whitelist) {
            if (Array.isArray(whitelist)) {
                this._whitelist = whitelist;
                this._useWhitelist = true;
            } else if (typeof whitelist === "string") {
                this._whitelist = [whitelist];
                this._useWhitelist = true;
            }
        }
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


    static get Options () {
        return Device.Options;
    }


    static get wirething () {
        return JSON.parse(fs.readFileSync(`${__dirname}/Wirefile`).toString());
    }


    scan () {
        wantScan = true;

        noble.on("discover", (peripheral: noble.Peripheral) => {

            let advertisement = peripheral.advertisement;

            if (advertisement.localName === "Nuimo") {

                if (this._useWhitelist && this._whitelist.indexOf(peripheral.uuid) < 0) {
                    log("Discovered device not in UUID whitelist");
                    return;
                }

                peripheral.removeAllListeners();
                noble.stopScanning();
                noble.startScanning();

                let device = new Device(peripheral);

                device.peripheral.on("connect", () => {
                    log("Peripheral connected");
                    this._connectedDevices[device.uuid] = device;
                });

                device.peripheral.on("disconnect", () => {
                    log("Peripheral disconnected");
                    delete this._connectedDevices[device.uuid];

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


    getConnectedDeviceByUUID (uuid: string) {
        return this._connectedDevices[uuid];
    }


    getConnectedDevices () {
        return Object.keys(this._connectedDevices).map((uuid) => {
            return this._connectedDevices[uuid];
        })
    }


}

export { Nuimo };
