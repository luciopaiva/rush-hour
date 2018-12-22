
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

    constructor () {
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
                const direction = Math.floor(Math.random() * 4);
                let options;
                switch (direction) {
                    case 0: options = [[1, -1], [1, 0], [1, 1]]; break;
                    case 1: options = [[1, 1], [0, 1], [-1, 1]]; break;
                    case 2: options = [[-1, -1], [-1, 0], [-1, 1]]; break;
                    case 3: options = [[-1, -1], [0, -1], [1, -1]]; break;
                }
                // let exits = options.filter(() => Math.random() > 0.5);
                // if (exits.length === 0) {
                    // must have at least one exit
                    const exitIndex = Math.floor(Math.random() * options.length);
                    const exits = options.slice(exitIndex, exitIndex + 1);
                // }
                const col = Math.floor(x / CHECKPOINT_DISTANCE);
                const row = Math.floor(y / CHECKPOINT_DISTANCE);
                const index = row * this.widthInAnchors + col;
                const exitVectors = exits
                    .map(([dx, dy]) => [x + CHECKPOINT_DISTANCE * dx, y + CHECKPOINT_DISTANCE * dy])
                    .map(coords => new Vector(...coords));
                this.anchors[index] = new Anchor(index, x, y, exitVectors);
            }
        }
        console.info(this.anchors);

        const ctx = this.context;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);
    }

    /**
     * @param {Car} car
     */
    updateCar(car) {
        const ctx = this.context;
        const w = this.canvas.width;
        const h = this.canvas.height;

        let checkpointXOffset = (car.pos.x % CHECKPOINT_DISTANCE) > CHECKPOINT_DISTANCE / 2 ? 1 : 0;
        let checkpointYOffset = (car.pos.y % CHECKPOINT_DISTANCE) > CHECKPOINT_DISTANCE / 2 ? 1 : 0;

        // debug anchor checkpoint
        const anchorCheckpointCol = Math.floor(car.pos.x / CHECKPOINT_DISTANCE) + checkpointXOffset;
        const anchorCheckpointRow = Math.floor(car.pos.y / CHECKPOINT_DISTANCE) + checkpointYOffset;
        const anchorIndex = anchorCheckpointRow * this.widthInAnchors + anchorCheckpointCol;
        if (anchorIndex < 0 || anchorIndex >= this.anchors.length) {
            console.error(anchorIndex);
        }
        const anchor = this.anchors[anchorIndex];

        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1;
        // ctx.beginPath();
        // direction.normalize().scale(20).add(anchorCheckpoint);
        // ctx.moveTo(anchorCheckpoint.x, anchorCheckpoint.y);
        // ctx.lineTo(direction.x, direction.y);
        // ctx.stroke();

        if (car.anchor !== anchor) {
            car.anchor = anchor;
            const nextIndex = Math.floor(Math.random() * car.anchor.exitVectors.length);
            car.nextCheckpoint.set(car.anchor.exitVectors[nextIndex]);
        }
        ctx.fillStyle = "yellow";
        ctx.fillRect(car.anchor.pos.x, car.anchor.pos.y, 3, 3);
        ctx.fillStyle = "blue";
        ctx.fillRect(car.nextCheckpoint.x, car.nextCheckpoint.y, 3, 3);

        const desiredAcc = car.acc;
        desiredAcc.set(car.nextCheckpoint).subtract(car.pos).normalize().scale(.2);

        // car.vel.normalize().scale(1);
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
        for (let x = 0; x < w; x += CHECKPOINT_DISTANCE) {
            for (let y = 0; y < h; y += CHECKPOINT_DISTANCE) {
                ctx.fillRect(x, y, 1, 1);
            }
        }

        for (const car of this.cars) {
            this.updateCar(car);
        }

        requestAnimationFrame(this.updateFn);
    }
}

new Rush();
