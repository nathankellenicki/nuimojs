let Nuimo = require("../nuimo.js"),
    nuimo = new Nuimo();

nuimo.on("discover", (device) => {

    console.log(`Discovered Nuimo (${device.uuid})`);

    device.on("connect", () => {
        console.log("Nuimo connected");
    });

    device.on("press", () => {
        device.setLEDMatrix([
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 1, 0, 0, 1, 1, 0,
            0, 0, 0, 1, 0, 1, 0, 0, 0,
            0, 0, 0, 1, 0, 0, 1, 0, 0,
            0, 1, 0, 1, 0, 0, 0, 1, 0,
            0, 0, 1, 0, 0, 1, 1, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0
        ], 255, 2000);
    });

    device.connect();

});

nuimo.scan();