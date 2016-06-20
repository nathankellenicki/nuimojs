let EventEmitter = require("events").EventEmitter;


const UUID = {
    Service: {
        USER_INPUT_EVENTS: "f29b1525cb1940f3be5c7241ecb82fd2"
    },
    Characteristic: {
        SWIPE: "f29b1527cb1940f3be5c7241ecb82fd2",
        BUTTON_CLICK: "f29b1529cb1940f3be5c7241ecb82fd2",
        ROTATION: "f29b1528cb1940f3be5c7241ecb82fd2",
        FLY: "f29b1526cb1940f3be5c7241ecb82fd2"
    }
};


class Device extends EventEmitter {

    constructor (peripheral) {
        super();
        this._peripheral = peripheral;
    }

    get uuid () {
        return this._peripheral.uuid;
    }

    connect () {

        this._peripheral.connect((err) => {

            if (err) {
                this.emit("err", err);
                return;
            }

            this.emit("connect");

            this._peripheral.discoverServices([], (err, services) => {
                services.forEach((service) => {

                    if (service.uuid === UUID.Service.USER_INPUT_EVENTS) { // User Input service

                        service.discoverCharacteristics([], (err, characteristics) => {
                            characteristics.forEach((characteristic) => {

                                if (characteristic.uuid === UUID.Characteristic.SWIPE) { // Swiping
                                    this._subscribeToCharacteristic(characteristic, this._handleSwipe.bind(this));
                                } else if (characteristic.uuid === UUID.Characteristic.BUTTON_CLICK) { // Button click
                                    this._subscribeToCharacteristic(characteristic, this._handleClick.bind(this));
                                } else if (characteristic.uuid === UUID.Characteristic.ROTATION) { // Rotation
                                    this._subscribeToCharacteristic(characteristic, this._handleRotation.bind(this));
                                } else if (characteristic.uuid === UUID.Characteristic.FLY) { // Flying
                                    this._subscribeToCharacteristic((characteristic), this._handleFlying.bind(this));
                                }

                            });
                        });

                    }

                });
            });

        });

    }


    _subscribeToCharacteristic (characteristic, callback) {
        characteristic.on("read", (data, isNotification) => {
            callback(data);
        });
        characteristic.subscribe((err) => {
            if (err) {
                this.emit("error", err);
            }
        });
    }


    _handleSwipe (data) {
        this.emit("swipe", data[0]);
    }


    _handleClick (data) {
        if (data[0] === 0) {
            this.emit("release");
        } else {
            this.emit("press");
        }
    }


    _handleRotation (data) {
        let amount = data.readInt16LE();
        this.emit("rotate", amount);
    }


    _handleFlying (data) {

        let gesture = data[0],
            amount = data[1];

        switch (gesture) {
            case 0:
                this.emit("fly", 0, amount);
                break;
            case 1:
                this.emit("fly", 1, amount);
                break;
            case 4:
                this.emit("detect", amount);
                break;
        }

    }


}

module.exports = Device;