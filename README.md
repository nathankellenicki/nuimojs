# Nuimo.js - A Node.js library for interacting with Nuimo devices

UPDATE 0.3.0 - Added options for "setLEDMatrix".

UPDATE 0.2.0 - Adds new features, including:

* RSSI value
* Pad touch events (New Nuimo Firmware required)
* Disconnect event

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

##### rssi

Received Signal Strength Indicator (RSSI) value of the device.

#### Methods

##### connect(callback())

Connects to a previously discovered Nuimo device. The callback is triggered when the device is ready for interacting with.

##### setLEDMatrix(matrix, brightness, timeout, options)

Outputs a pattern to the 9x9 LED matrix on the front of the device.

Matrix is either:
- An array of 81 items, each representing one of the 81 LED's, starting at the top left. Each item in the array should be either 0 or 1.
- A buffer of 11 bytes, each bit representing one of the 81 LED's, with the last 7 of the 11th byte being unused.

Brightness is a value between 0-255. Timeout is how long the pattern should appear for (In milliseconds).

Options are optional values/configurations to be used when setting LED matrices.
- 5th bit (decimal 16, binair 0b00010000) is "onion skinning" which allows smoother transitions between matrices.
- 6th bit (decimal 32, binair 0b00100000) is "builtin matrices" which gives the possibility to display the builtin led matrices (first byte of the matrix is to indicate which builtin matrix should be displayed). Currently these are not documented and may be subject to changes (can only be changed by Nuimo firmware).

usage:
- setLEDMatrix(yourmatrix, yourbrightness, yourtimeout); //Default behaviour (no options enabled).
- setLEDMatrix(yourmatrix, yourbrightness, yourtimeout, {onion_skinning: true, builtin_matrix: true}); //Enable onion skinning and builtin matrix.
- setLEDMatrix(yourmatrix, yourbrightness, yourtimeout, Nuimo.Options.ONION_SKINNING + Nuimo.Options.BUILTIN_MATRIX); //Enable onion skinning and builtin matrix.

or you can define options yourself using a bit field (or by adding bits/bitfields), also see device.js and official Nuimo documentation:
- setLEDMatrix(yourmatrix, yourbrightness, yourtimeout, 0b00110000); 
- setLEDMatrix(yourmatrix, yourbrightness, yourtimeout, 0b00010000 + 0b00100000);

(You can also choose to use decimal representation of the values, instead of binary)

(This feature is built in, to forward support new bitfield configurations)

#### Events

##### on("connect", callback())

Triggered when the device is ready for interacting with.

##### on("disconnect", callback())

Triggered when the device is disconnected.

##### on("batteryLevelChange", callback(level))

Triggered when the battery level drops. (Note: Level is as a percentage between 0-100)

##### on("rssiChange", callback(rssi))

Triggered when the RSSI changes.

*The following events are triggered when the device is interacted with:*

##### on("press", callback())

Triggered when the user presses down on the central button.

##### on("release", callback())

Triggered when the user releases the central button.

##### on("swipe", callback(direction))

Triggered when the user swipes in a direction on the central pad. Direction can be one of: Nuimo.Swipe.LEFT, Nuimo.Swipe.RIGHT, Nuimo.Swipe.UP, or Nuimo.Swipe.DOWN.

Individual events are also triggered: "swipeLeft", "swipeRight", "swipeUp", "swipeDown". No direction is passed to the callback for these events.

##### on("touch", callback(area))

Triggered when the user touches an area on the central pad. Area can be one of: Nuimo.Area.LEFT, Nuimo.Area.RIGHT, Nuimo.Area.TOP, or Nuimo.Area.BOTTOM.

Individual events are also triggered: "touchLeft", "touchRight", "touchTop", "touchBottom". No area is passed to the callback for these events.

##### on("rotate", callback(amount))

Triggered when the user rotates the outer ring. The amount is the amount of degrees the ring was rotated (Negative for counterclockwise).

##### on("fly", callback(direction, speed))

Triggered when the user waves their hand over the sensor. Direction is either Nuimo.Fly.LEFT or Nuimo.Fly.RIGHT.

Individual events are also triggered: "flyLeft", "flyRight". No direction is passed to the callback for these events.

Note: In earlier Nuimo firmware versions, speed could be 0, 1, or 2. In later versions, speed is always 0.

##### on("distance", callback(distance))

*Note: This was previously named "detect", which is now deprecated.*

Triggered when a hand is detected over the sensor. The distance represents how close the hand is to the sensor (Between 0-255, 255 being farthest away).

Note: This event is continuously triggered as long as a hand is detected.
