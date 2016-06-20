let Nuimo = require("../nuimo.js"),
    nuimo = new Nuimo();

nuimo.on("discover", (device) => {

    console.log(`Discovered Nuimo (${device.uuid})`);

    device.on("connect", () => {
        console.log("Nuimo connected");
    });

    device.on("press", () => {
        console.log("Button pressed");
    });

    device.on("release", () => {
        console.log("Button released");
    });

    device.on("swipe", (direction) => {
        if (direction === Nuimo.Direction.LEFT) {
            console.log("Swiped left");
        } else if (direction === Nuimo.Direction.RIGHT) {
            console.log("Swiped right");
        }
    });

    device.on("rotate", (amount) => {
        console.log(`Rotated by ${amount}`);
    });

    device.on("fly", (direction, speed) => {
        if (direction === Nuimo.Direction.LEFT) {
            console.log(`Flew left by speed ${speed}`);
        } else if (direction === Nuimo.Direction.RIGHT) {
            console.log(`Flew right by speed ${speed}`);
        }
    });

    device.on("detect", (amount) => {
        console.log(`Detected hand at distance ${amount}`);
    });

    device.connect();

});

nuimo.scan();