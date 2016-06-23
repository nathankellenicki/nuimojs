let Nuimo = require("../nuimo.js"),
    nuimo = new Nuimo();

nuimo.on("discover", (device) => {

    console.log(`Discovered Nuimo (${device.uuid})`);

    device.on("connect", () => {
        console.log("Nuimo connected");
    });

    device.on("batteryLevelChange", (level) => {
        console.log(`Battery level changed to ${level}%`);
    });

    device.connect(() => {
        console.log(`Battery level is ${device.batteryLevel}%`);
    });

});

nuimo.scan();