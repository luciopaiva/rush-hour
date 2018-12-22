
import Vector from "./vector.js";

const TAU = Math.PI * 2;
const CAR_LENGTH = 12;
const CAR_WIDTH = CAR_LENGTH * 1.1;
const CAR_COLOR = "#833aff";
const CHECKPOINT_DISTANCE = 100;
const N_CARS = 300;

function random(a, b) {
    return a + Math.random() * (b - a);
}

class Car {
    constructor (x, y) {
        this.pos = new Vector(x, y);
        this.vel = Vector.fromAngle(Math.random() * TAU);
        this.acc = new Vector();
        /** @type {Anchor} */
        this.anchor = null;
        this.nextCheckpoint = new Vector();
        this.hasNextCheckpoint = false;
    }
}

class Anchor {
    /**
     * @param {Number} index
     * @param {Number} x
     * @param {Number} y
     * @param {Vector[]} exitVectors
     */
    constructor (index, x, y, exitVectors) {
        this.index = index;
        this.pos = new Vector(x, y);
        this.exitVectors = exitVectors;
    }
}

class Rush {

    constructor (map) {
        const lines = map.split("\n");
        this.mapHeight = lines.length;
        const largestLine = lines.reduce((l, line) => Math.max(l, line.length), 0);
        this.map = lines.map(line => line + " ".repeat(largestLine - line.length)).join("");
        console.info(this.map);
        console.info(largestLine, this.mapHeight, largestLine * this.mapHeight, this.map.length);
        this.mapWidth = largestLine;

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.context = this.canvas.getContext("2d");

        window.addEventListener("resize", this.resize.bind(this));
        this.resize();

        this.cars = Array.from(Array(N_CARS), () =>
            new Car(
                random(CHECKPOINT_DISTANCE, this.canvas.width - CHECKPOINT_DISTANCE),
                random(CHECKPOINT_DISTANCE, this.canvas.height - CHECKPOINT_DISTANCE)
            ));

        this.updateFn = this.update.bind(this);
        requestAnimationFrame(this.updateFn);
    }

    resize() {
        const w = this.canvas.width = window.innerWidth;
        const h = this.canvas.height = window.innerHeight;
        this.widthInAnchors = Math.floor(w / CHECKPOINT_DISTANCE);
        this.heightInAnchors = Math.floor(h / CHECKPOINT_DISTANCE);

        this.anchors = Array(this.widthInAnchors * this.heightInAnchors);
        for (let y = 0; y < h; y += CHECKPOINT_DISTANCE) {
            for (let x = 0; x < w; x += CHECKPOINT_DISTANCE) {
                const col = Math.floor(x / CHECKPOINT_DISTANCE);
                const row = Math.floor(y / CHECKPOINT_DISTANCE);
                const index = row * this.widthInAnchors + col;

                let exitVectors = [];
                if (col < this.mapWidth && row < this.mapHeight) {
                    const mapIndex = row * this.mapWidth + col;
                    switch (this.map[mapIndex]) {
                        case ">": exitVectors.push(new Vector(x + CHECKPOINT_DISTANCE, y)); break;
                        case "v": exitVectors.push(new Vector(x, y + CHECKPOINT_DISTANCE)); break;
                        case "<": exitVectors.push(new Vector(x - CHECKPOINT_DISTANCE, y)); break;
                        case "^": exitVectors.push(new Vector(x, y - CHECKPOINT_DISTANCE)); break;
                        case "x":
                            if (this.map[mapIndex + 1] !== "<" && this.map[mapIndex + 1] !== " ") {
                                exitVectors.push(new Vector(x + CHECKPOINT_DISTANCE, y));
                            }
                            if (this.map[mapIndex + this.mapWidth] !== "^" && this.map[mapIndex + this.mapWidth] !== " ") {
                                exitVectors.push(new Vector(x, y + CHECKPOINT_DISTANCE));
                            }
                            if (this.map[mapIndex - 1] !== ">" && this.map[mapIndex - 1] !== " ") {
                                exitVectors.push(new Vector(x - CHECKPOINT_DISTANCE, y));
                            }
                            if (this.map[mapIndex - this.mapWidth] !== "v" && this.map[mapIndex - this.mapWidth] !== " ") {
                                exitVectors.push(new Vector(x, y - CHECKPOINT_DISTANCE));
                            }
                            break;
                    }
                }

                this.anchors[index] = new Anchor(index, x, y, exitVectors);
            }
        }

        const ctx = this.context;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);
    }

    findNearestAnchor(car) {
        let checkpointXOffset = (car.pos.x % CHECKPOINT_DISTANCE) > CHECKPOINT_DISTANCE / 2 ? 1 : 0;
        let checkpointYOffset = (car.pos.y % CHECKPOINT_DISTANCE) > CHECKPOINT_DISTANCE / 2 ? 1 : 0;

        const anchorCheckpointCol = Math.floor(car.pos.x / CHECKPOINT_DISTANCE) + checkpointXOffset;
        const anchorCheckpointRow = Math.floor(car.pos.y / CHECKPOINT_DISTANCE) + checkpointYOffset;
        const anchorIndex = anchorCheckpointRow * this.widthInAnchors + anchorCheckpointCol;
        const anchor = this.anchors[anchorIndex];

        return anchor;
    }

    /**
     * @param {Car} car
     */
    updateCar(car) {
        const ctx = this.context;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const anchor = this.findNearestAnchor(car);

        if (car.anchor !== anchor && anchor !== undefined) {
            car.anchor = anchor;
            car.hasNextCheckpoint = car.anchor.exitVectors.length > 0;
            if (car.hasNextCheckpoint) {
                const nextIndex = Math.floor(Math.random() * car.anchor.exitVectors.length);
                car.nextCheckpoint.set(car.anchor.exitVectors[nextIndex]);
            }
        }

        const desiredAcc = car.acc.clear();
        if (car.hasNextCheckpoint) {
            desiredAcc.set(car.nextCheckpoint).subtract(car.pos).normalize().scale(.2);
        }

        car.vel.add(desiredAcc).limit(3);

        car.pos.add(car.vel);
        if (car.pos.x > w) car.pos.x -= w;
        if (car.pos.x < 0) car.pos.x += w;
        if (car.pos.y > h) car.pos.y -= h;
        if (car.pos.y < 0) car.pos.y += h;

        ctx.strokeStyle = CAR_COLOR;
        ctx.lineWidth = CAR_WIDTH;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(car.pos.x - 1, car.pos.y);
        ctx.lineTo(car.pos.x, car.pos.y);
        ctx.stroke();
    }

    update(t) {
        const ctx = this.context;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#ccc";
        ctx.font = "14px sans-serif";
        for (let x = 0; x < w; x += CHECKPOINT_DISTANCE) {
            for (let y = 0; y < h; y += CHECKPOINT_DISTANCE) {
                // ctx.fillRect(x, y, 1, 1);

                const col = Math.floor(x / CHECKPOINT_DISTANCE);
                const row = Math.floor(y / CHECKPOINT_DISTANCE);

                if (col < this.mapWidth && row < this.mapHeight) {
                    const mapIndex = row * this.mapWidth + col;
                    ctx.fillText(this.map[mapIndex], x, y);
                }

                // const index = row * this.widthInAnchors + col;
                // if (index < this.anchors.length && this.anchors[index].exitVectors.length > 0) {
                //     ctx.fillRect(x, y, 3, 3);
                // }
            }
        }

        for (const car of this.cars) {
            this.updateCar(car);
        }

        requestAnimationFrame(this.updateFn);
    }
}

(async function run() {
    const response = await fetch("map.txt");
    const map = await response.text();
    new Rush(map);
})();
