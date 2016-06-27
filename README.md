# Nuimo.js - A Node.js library for interacting with Nuimo devices

### Installation

Node.js v6.0+ required.

```javascript
npm install nuimojs --save
```

Nuimo.js uses the Noble BLE library by Sandeep Mistry. On macOS everything should function out of the box. On Linux and Windows there are [certain dependencies which may need installed first](https://github.com/sandeepmistry/noble#prerequisites).

Note: Nuimo.js has been tested on macOS 10.11 and Debian/Raspbian on the Raspberry Pi 3 Model B.

### Usage

```javascript
let Nuimo = require("nuimojs"),
    nuimo = new Nuimo();
```

Examples are available in the "examples" directory.

### Class: Nuimo

Note: Subclass of EventEmitter.

#### Methods

##### scan()

Begins scanning for Nuimo devices.

##### stop()

Stops scanning for Nuimo devices.

#### Events

##### on("discover", callback(device))

Triggered when a new Nuimo device is discovered.

### Class: Device

Note: Subclass of EventEmitter.

#### Properties

##### uuid

Device unique identifier.

##### batteryLevel

The current battery level as a percentage between 0-100.

#### Methods

##### connect(callback())

Connects to a previously discovered Nuimo device. The callback is triggered when the device is ready for interacting with.

##### setLEDMatrix(matrix, brightness, timeout)

Outputs a pattern to the 9x9 LED matrix on the front of the device.

Matrix is either:
- An array of 81 items, each representing one of the 81 LED's, starting at the top left. Each item in the array should be either 0 or 1.
- A buffer of 11 bytes, each bit representing one of the 81 LED's, with the last 7 of the 11th byte being unused.

Brightness is a value between 0-255. Timeout is how long the pattern should appear for (In milliseconds).

#### Events

##### on("connect", callback())

Triggered when the device is ready for interacting with.

##### on("batteryLevelChange", callback(level))

Triggered when the battery level drops. (Note: Level is as a percentage between 0-100)

*The following events are triggered when the device is interacted with:*

##### on("press", callback())

Triggered when the user presses down on the central button.

##### on("release", callback())

Triggered when the user releases the central button.

##### on("swipe", callback(direction))

Triggered when the user swipes in a direction on the central pad. Direction can be one of: Nuimo.Direction.LEFT, Nuimo.Direction.RIGHT, Nuimo.Direction.UP, or Nuimo.Direction.DOWN.

Individual events are also triggered: "swipeLeft", "swipeRight", "swipeUp", "swipeDown". No direction is passed to the callback for these events.

##### on("rotate", callback(amount))

Triggered when the user rotates the outer ring. The amount is the amount of degrees the ring was rotated (Negative for counterclockwise).

##### on("fly", callback(direction, speed))

Triggered when the user waves their hand over the sensor. Direction is either Nuimo.Direction.LEFT or Nuimo.Direction.RIGHT.

Individual events are also triggered: "flyLeft", "flyRight". No direction is passed to the callback for these events.

##### on("distance", callback(distance))

*Note: This was previously named "detect", which is now deprecated.*

Triggered when a hand is detected over the sensor. The distance represents how close the hand is to the sensor (Between 0-255, 255 being farthest away).

Note: This event is continuously triggered as long as a hand is detected.
