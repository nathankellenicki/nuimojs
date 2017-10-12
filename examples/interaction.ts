import { Nuimo, Device } from "../nuimo";
const nuimo = new Nuimo();

nuimo.on("discover", (device) => {

    console.log(`Discovered Nuimo (${device.uuid})`);

    device.on("connect", () => {
        console.log("Nuimo connected");
    });

    device.on("disconnect", () => {
        console.log("Nuimo disconnected");
    });

    device.on("press", () => {
        console.log("Button pressed");
    });

    device.on("release", () => {
        console.log("Button released");
    });

    device.on("swipe", (direction: number) => {
        switch (direction) {
            case (Nuimo.Swipe.LEFT):
                console.log("Swiped left"); break;
            case (Nuimo.Swipe.RIGHT):
                console.log("Swiped right"); break;
            case (Nuimo.Swipe.UP):
                console.log("Swiped up"); break;
            case (Nuimo.Swipe.DOWN):
                console.log("Swiped down"); break;
        }
    });

    device.on("touch", (direction: number) => {
        switch (direction) {
            case (Nuimo.Area.LEFT):
                console.log("Touched left"); break;
            case (Nuimo.Area.RIGHT):
                console.log("Touched right"); break;
            case (Nuimo.Area.TOP):
                console.log("Touched top"); break;
            case (Nuimo.Area.BOTTOM):
                console.log("Touched bottom"); break;
            case (Nuimo.Area.LONGLEFT):
                console.log("Long touched left"); break;
            case (Nuimo.Area.LONGRIGHT):
                console.log("Long touched right"); break;
            case (Nuimo.Area.LONGTOP):
                console.log("Long touched top"); break;
            case (Nuimo.Area.LONGBOTTOM):
                console.log("Long touched bottom"); break;
        }
    });

    device.on("rotate", (amount: number) => {
        console.log(`Rotated by ${amount}`);
    });

    device.on("fly", (direction: number, speed: number) => {
        switch (direction) {
            case (Nuimo.Fly.LEFT):
                console.log(`Flew left by speed ${speed}`); break;
            case (Nuimo.Fly.RIGHT):
                console.log(`Flew right by speed ${speed}`); break;
        }
    });

    device.on("detect", (distance: number) => {
        console.log(`Detected hand at distance ${distance}`);
    });

    device.connect();

});

nuimo.scan();
