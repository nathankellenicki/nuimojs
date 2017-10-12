import { Nuimo, Device } from "../nuimo";
const nuimo = new Nuimo();

nuimo.on("discover", (device: Device) => {

    console.log(`Discovered Nuimo (${device.uuid})`);

    device.on("connect", () => {
        console.log("Nuimo connected");
    });

    device.on("disconnect", () => {
        console.log("Nuimo disconnected");
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