let async = require('async'),
    debug = require('debug')('nuimojs'),
    EventEmitter = require("events").EventEmitter;

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

        this.deviceType = "nuimo";

        this._peripheral = peripheral;
        this._LEDCharacteristic = null;
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
        let self = this;

        let batteryReady = false;
        let LEDReady = false;
        let userInputs = 0;

        this._peripheral.connect(function(err) {
            self._peripheral.discoverServices([], function(error, services) {
            debug("Service discovery started");
                let serviceIndex = 0;

                async.whilst(
                    function () {
                        return (serviceIndex < services.length);
                    },
                    function(callback) {
                        let service = services[serviceIndex];

                        service.discoverCharacteristics([], function(error, characteristics) {
                            let characteristicIndex = 0;

                            async.whilst(
                                function () {
                                    return (characteristicIndex < characteristics.length);
                                },
                                function(callback) {
                                    let characteristic = characteristics[characteristicIndex];

                                    switch(service.uuid) {
                                        case UUID.Service.BATTERY_STATUS:
                                            batteryReady = true;
                                            debug("Found Battery characteristic");
                                            self._subscribeToCharacteristic(characteristic, self._handleBatteryChange.bind(self));
                                            characteristic.read();
                                            break;
                                        case UUID.Service.LED_MATRIX:
                                            self._LEDCharacteristic = characteristic;
                                            LEDReady = true;
                                            debug("Found LED characteristic");
                                            break;
                                        case UUID.Service.USER_INPUT_EVENTS:
                                            switch(characteristic.uuid) {
                                                case UUID.Characteristic.BUTTON_CLICK:
                                                    debug("Found Button Click characteristic");
                                                    self._subscribeToCharacteristic(characteristic, self._handleClick.bind(self));
                                                    break;
                                                case UUID.Characteristic.FLY:
                                                    debug("Found Fly characteristic");
                                                    self._subscribeToCharacteristic((characteristic), self._handleFlying.bind(self));
                                                    break;
                                                case UUID.Characteristic.ROTATION:
                                                    debug("Found Rotation characteristic");
                                                    self._subscribeToCharacteristic(characteristic, self._handleRotation.bind(self));
                                                    break;
                                                case UUID.Characteristic.SWIPE:
                                                    debug("Found Swipe characteristic");
                                                    self._subscribeToCharacteristic(characteristic, self._handleSwipe.bind(self));
                                                    break;
                                                default:
                                                    //console.log(characteristic);
                                            }
                                            userInputs++;
                                            break;
                                    }

                                    characteristicIndex++;
                                    return callback();
                                },
                                function(error) {
                                    serviceIndex++;
                                    return callback();
                                }
                            );
                        });
                    },
                    function (err) {
                        debug("Service discovery finished");

                        if (err !== null || batteryReady === false || LEDReady === false || userInputs < 5) {
                            self._peripheral.disconnect();
                            debug("Force disconnect");
                        }
                        else {
                            debug("Emit connect");
                            self.emit("connect");
                        }

                        if (callback) {
                            callback();
                        }
                    }
                );
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
        debug("Battery level %s%", data[0]);
        this.emit("batteryLevelChange", data[0]);
    }

    _handleSwipe (data) {
        let direction = data[0];
        this.emit("swipe", direction);
        switch (direction) {
            case (Direction.LEFT):
                debug("Swipe left");
                this.emit("swipeLeft");
                break;
            case (Direction.RIGHT):
                debug("Swipe right");
                this.emit("swipeRight");
                break;
            case (Direction.UP):
                debug("Swipe up");
                this.emit("swipeUp");
                break;
            case (Direction.DOWN):
                debug("Swipe down");
                this.emit("swipeDown");
                break;
        }
    }

    _handleClick (data) {
        if (data[0] === 0) {
            debug("Button released");
            this.emit("release");
        } else {
            debug("Button pressed");
            this.emit("press");
        }
    }

    _handleRotation (data) {
        let amount = data.readInt16LE();
        debug("Rotate %s", amount);
        this.emit("rotate", amount);
    }

    _handleFlying (data) {
        let gesture = data[0],
            amount = data[1];

        switch (gesture) {
            case 0:
            case 1:
            case 2:
                let direction = gesture,
                    speed = amount;
                this.emit("fly", direction, speed); break;
                switch (direction) {
                    case (Direction.LEFT):
                        debug("Fly left %s", speed);
                        this.emit("flyLeft", speed);
                        break;
                    case (Direction.RIGHT):
                        debug("Fly right %s", speed);
                        this.emit("flyRight", speed);
                        break;
                }
                break;
            case 4:
                debug("Detect %s", amount);
                this.emit("detect", amount);
                this.emit("distance", amount);
                break;
        }
    }
}

module.exports = Device;
