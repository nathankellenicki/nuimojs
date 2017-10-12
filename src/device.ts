import async = require("async");
import debug = require("debug");
import noble = require("noble");
import {EventEmitter} from "events";

const log = debug("nuimojs");


enum Swipe {
    LEFT,
    RIGHT,
    UP,
    DOWN
};

enum Fly {
    LEFT,
    RIGHT
};

enum Area {
    LEFT = 4,
    RIGHT,
    TOP,
    BOTTOM,
    LONGLEFT,
    LONGRIGHT,
    LONGTOP,
    LONGBOTTOM
};

// Direction is now deprecated, use Swipe, Fly, or Area instead
const Direction = Swipe;

// Configuration bits, see https://github.com/nathankunicki/nuimojs/pull/12
enum Options {
    ONION_SKINNING = 16,
    BUILTIN_MATRIX = 32
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
        FLY: "f29b1526cb1940f3be5c7241ecb82fd2",
        SWIPE: "f29b1527cb1940f3be5c7241ecb82fd2",
        ROTATION: "f29b1528cb1940f3be5c7241ecb82fd2",
        BUTTON_CLICK: "f29b1529cb1940f3be5c7241ecb82fd2"
    }
};


class Device extends EventEmitter {

    public deviceType: string;

    private _peripheral: noble.Peripheral;
    private _LEDCharacteristic: noble.Characteristic;
    private _batteryLevel: number;
    private _rssi: number;


    constructor (peripheral: noble.Peripheral) {
        super();

        this.deviceType = "nuimo";

        this._peripheral = peripheral;
        this._batteryLevel = 100;
        this._rssi = -100; // Initialize as -100 - no signal
    }


    public get peripheral (): noble.Peripheral {
        return this._peripheral;
    }


    public static get Direction (): any {
        return Direction;
    }


    public static get Swipe (): any {
        return Swipe;
    }


    public static get Fly (): any {
        return Fly;
    }


    public static get Area (): any {
        return Area;
    }


    public static get Options (): any {
        return Options;
    }


    public get uuid (): string {
        return this._peripheral.uuid;
    }


    public get UUID (): string {
        return this.uuid;
    }


    public get batteryLevel (): number {
        return this._batteryLevel;
    }


    public get rssi (): number {
        return this._rssi;
    }


    public get RSSI (): number {
        return this.rssi;
    }


    connect (callback: () => void) {

        let self = this;

        let batteryReady = false;
        let LEDReady = false;
        let userInputs = 0;

        this._peripheral.connect((err?: string) => {

            this._rssi = this._peripheral.rssi;

            let rssiUpdateInterval = setInterval(() => {
                this._peripheral.updateRssi((err: string, rssi: number) => {
                    if (!err) {
                        if (this._rssi != rssi) {
                            this._rssi = rssi;
                            self.emit("rssiChange", rssi);
                        }
                    }
                });
            }, 2000);

            self._peripheral.on("disconnect", () => {
               clearInterval(rssiUpdateInterval);
            });

            self._peripheral.discoverServices([], (err: string, services: noble.Service[]) => {

                log("Service discovery started");

                let serviceIndex = 0;

                async.whilst(
                    function () {
                        return (serviceIndex < services.length);
                    },
                    function (callback: () => void) {

                        let service = services[serviceIndex];

                        service.discoverCharacteristics([], (err: string, characteristics: noble.Characteristic[]) => {

                            let characteristicIndex = 0;

                            async.whilst(
                                function () {
                                    return (characteristicIndex < characteristics.length);
                                },
                                function (callback: () => void) {

                                    let characteristic = characteristics[characteristicIndex];

                                    switch (service.uuid) {
                                        case UUID.Service.BATTERY_STATUS:
                                            batteryReady = true;
                                            log("Found Battery characteristic");
                                            self._subscribeToCharacteristic(characteristic, self._handleBatteryChange.bind(self));
                                            characteristic.read();
                                            break;
                                        case UUID.Service.LED_MATRIX:
                                            self._LEDCharacteristic = characteristic;
                                            LEDReady = true;
                                            log("Found LED characteristic");
                                            break;
                                        case UUID.Service.USER_INPUT_EVENTS:
                                            switch (characteristic.uuid) {
                                                case UUID.Characteristic.BUTTON_CLICK:
                                                    log("Found Button Click characteristic");
                                                    self._subscribeToCharacteristic(characteristic, self._handleClick.bind(self));
                                                    break;
                                                case UUID.Characteristic.FLY:
                                                    log("Found Fly characteristic");
                                                    self._subscribeToCharacteristic((characteristic), self._handleFlying.bind(self));
                                                    break;
                                                case UUID.Characteristic.ROTATION:
                                                    log("Found Rotation characteristic");
                                                    self._subscribeToCharacteristic(characteristic, self._handleRotation.bind(self));
                                                    break;
                                                case UUID.Characteristic.SWIPE:
                                                    log("Found Swipe characteristic");
                                                    self._subscribeToCharacteristic(characteristic, self._handleTouchSwipe.bind(self));
                                                    break;
                                            }
                                            userInputs++;
                                            break;
                                    }

                                    characteristicIndex++;
                                    return callback();

                                },
                                function (err?: Error) {
                                    serviceIndex++;
                                    return callback();
                                }
                            );
                        });
                    },
                    function (err?: Error) {

                        log("Service discovery finished");

                        if (err !== null || batteryReady === false || LEDReady === false || userInputs < 5) {
                            self._peripheral.disconnect();
                            log("Force disconnect");
                        } else {
                            log("Emit connect");
                            self.emit("connect");
                        }

                        if (callback) {
                            return callback();
                        }
                    }
                );
            });
        });
    }


    disconnect () {
        this._peripheral.disconnect();
    }


    setLEDMatrix (matrixData: any, brightness: number, timeout: number, options: any) {

        if (this._LEDCharacteristic) {
            let buf = Buffer.alloc(13);

            if (matrixData instanceof Buffer) {
                matrixData.copy(buf);
            } else {
                this._LEDArrayToBuffer(matrixData).copy(buf);
            }

            if (typeof options === "number") {
                buf[10] += options;
            } else if (typeof options === "object") {
                if (options.onion_skinning || options.onionSkinning) {
                    buf[10] += Options.ONION_SKINNING;
                }
                if (options.builtin_matrix || options.builtinMatrix){
                    buf[10] += Options.BUILTIN_MATRIX;
                }
            }

            buf[11] = brightness;
            buf[12] = Math.floor(timeout / 100);

            this._LEDCharacteristic.write(buf, true);
        } else {
            this.emit("error", new Error("Not fully connected"));
        }
    }

    _LEDArrayToBuffer (arr: Array<number>) {
        let buf = Buffer.alloc(11);

        for (let i = 0; i < 11; i++) {
            buf[i] = parseInt(arr.slice(i*8, i*8+8).reverse().join(""), 2);
        }

        return buf;
    }

    _subscribeToCharacteristic (characteristic: noble.Characteristic, callback: (data: Buffer) => void) {
        characteristic.on("data", (data: Buffer, isNotification: boolean) => {
            return callback(data);
        });
        characteristic.subscribe((err: string) => {
            if (err) {
                this.emit("error", err);
            }
        });
    }

    _handleBatteryChange (data: Buffer) {
        this._batteryLevel = data[0];
        log("Battery level %s%", data[0]);
        this.emit("batteryLevelChange", data[0]);
    }

    _handleTouchSwipe (data: Buffer) {
        let direction = data[0];
        if (direction <= 3) {
            this.emit("swipe", direction);
        } else {
            this.emit("touch", direction);
        }
        switch (direction) {
            case (Swipe.LEFT):
                log("Swipe left");
                this.emit("swipeLeft");
                break;
            case (Swipe.RIGHT):
                log("Swipe right");
                this.emit("swipeRight");
                break;
            case (Swipe.UP):
                log("Swipe up");
                this.emit("swipeUp");
                break;
            case (Swipe.DOWN):
                log("Swipe down");
                this.emit("swipeDown");
                break;
            case (Area.LEFT):
                log("Touch left");
                this.emit("touchLeft");
                break;
            case (Area.RIGHT):
                log("Touch right");
                this.emit("touchRight");
                break;
            case (Area.TOP):
                log("Touch top");
                this.emit("touchTop");
                break;
            case (Area.BOTTOM):
                log("Touch bottom");
                this.emit("touchBottom");
                break;
            case (Area.LONGLEFT):
                log("Long Touch left");
                this.emit("longTouchLeft");
                break;
            case (Area.LONGRIGHT):
                log("Long Touch right");
                this.emit("longTouchRight");
                break;
            case (Area.LONGTOP):
                log("Long Touch top");
                this.emit("longTouchTop");
                break;
            case (Area.LONGBOTTOM):
                log("Long Touch bottom");
                this.emit("longTouchBottom");
                break;
        }
    }

    _handleClick (data: Buffer) {
        if (data[0] === 0) {
            log("Button released");
            this.emit("release");
        } else {
            log("Button pressed");
            this.emit("press");
        }
    }

    _handleRotation (data: Buffer) {
        let amount = data.readInt16LE(0);
        log("Rotate %s", amount);
        this.emit("rotate", amount);
    }

    _handleFlying (data: Buffer) {

        let gesture = data[0],
            amount = data[1];

        switch (gesture) {
            case 0:
            case 1:
            case 2:
                let direction = gesture,
                    speed = amount;
                this.emit("fly", direction, speed);
                switch (direction) {
                    case (Fly.LEFT):
                        log("Fly left %s", speed);
                        this.emit("flyLeft", speed);
                        break;
                    case (Fly.RIGHT):
                        log("Fly right %s", speed);
                        this.emit("flyRight", speed);
                        break;
                }
                break;
            case 4:
                log("Detect %s", amount);
                this.emit("detect", amount);
                this.emit("distance", amount);
                break;
        }
    }
}

export { Device };
