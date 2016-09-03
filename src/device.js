let EventEmitter = require("events").EventEmitter;

const Direction = {
    LEFT: 0,
    RIGHT: 1,
    UP: 2,
    DOWN: 3
};

const UUID = {
    Service: {
        BATTERY_STATUS: "180f",
        DEVICE_INFORMATION: "180a",
        LED_MATRIX: "f29b1523cb1940f3be5c7241ecb82fd1",
        USER_INPUT_EVENTS: "f29b1525cb1940f3be5c7241ecb82fd2"
    },
    Characteristic: {
        BATTERY_LEVEL: "2a19",
        DEVICE_INFORMATION: "2a29",
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
        this._LEDCharacteristic = null;
        this._batteryReady = false;
        this._LEDReady = false;
        this._connectCallback = null;
        this._batteryLevel = 100;
    }

    static get Direction () {
        return Direction;
    }

    get uuid () {
        return this._peripheral.uuid;
    }

    get batteryLevel () {
        return this._batteryLevel;
    }

    connect (callback) {

        if (callback) {
            this._connectCallback = callback;
        }

        this._peripheral.connect((err) => {

            if (err) {
                this.emit("err", err);
                return;
            }

            this._peripheral.discoverServices([], (err, services) => {
                services.forEach((service) => {

                    if (service.uuid === UUID.Service.BATTERY_STATUS) {

                        service.discoverCharacteristics([], (err, characteristics) => {
                            characteristics.forEach((characteristic) => {

                                if (characteristic.uuid === UUID.Characteristic.BATTERY_LEVEL) { // Battery level
                                    this._subscribeToCharacteristic(characteristic, this._handleBatteryChange.bind(this));
                                    characteristic.read();
                                }

                            });
                        });

                    } else if (service.uuid === UUID.Service.LED_MATRIX) {

                        service.discoverCharacteristics([], (err, characteristics) => {
                            characteristics.forEach((characteristic) => {
                                this._LEDCharacteristic = characteristic;
                                this._LEDReady = true;
                                this._completeConnect();
                            });
                        });

                    } else if (service.uuid === UUID.Service.USER_INPUT_EVENTS) { // User Input service

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


    setLEDMatrix (matrixData, brightness, timeout) {
        if (this._LEDCharacteristic) {

            let buf = Buffer.alloc(13);

            if (matrixData instanceof Buffer) {
                matrixData.copy(buf);
            } else {
                this._LEDArrayToBuffer(matrixData).copy(buf);
            }

            buf[11] = brightness;
            buf[12] = Math.floor(timeout / 100);

            this._LEDCharacteristic.write(buf, true);

        } else {
            this.emit("error", new Error("Not fully connected"));
        }
    }


    _LEDArrayToBuffer (arr) {
        let buf = Buffer.alloc(11);

        for (let i = 0; i < 11; i++) {
            buf[i] = parseInt(arr.slice(i*8, i*8+8).reverse().join(""), 2);
        }

        return buf;
    }


    _completeConnect () {
        if (this._batteryReady && this._LEDReady) {
            if (this._connectCallback) {
                this._connectCallback();
                this.emit("connect");
                this._connectCallback = null;
            }
        }
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


    _handleBatteryChange (data) {
        this._batteryLevel = data[0];
        this._batteryReady = true;
        if (!this._connectCallback) {
            this.emit("batteryLevelChange", data[0]);
        }
        this._completeConnect();
    }


    _handleSwipe (data) {
        let direction = data[0];
        this.emit("swipe", direction);
        switch (direction) {
            case (Direction.LEFT):
                this.emit("swipeLeft"); break;
            case (Direction.RIGHT):
                this.emit("swipeRight"); break;
            case (Direction.UP):
                this.emit("swipeUp"); break;
            case (Direction.DOWN):
                this.emit("swipeDown"); break;
        }
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

        switch (true) {
            case (gesture >= 0 && gesture <= 3):
                let direction = gesture,
                    speed = amount;
                this.emit("fly", direction, speed); break;
                switch (direction) {
                    case (Direction.LEFT):
                        this.emit("flyLeft", speed); break;
                    case (Direction.RIGHT):
                        this.emit("flyRight", speed); break;
                }
                break;
            case (gesture === 4):
                this.emit("detect", amount);
                this.emit("distance", amount);
                break;
        }

    }

}

module.exports = Device;
