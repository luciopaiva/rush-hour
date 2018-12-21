
import Vector from "./vector.js";

const TAU = Math.PI * 2;
const FIRST_QUADRANT = Math.PI / 2;
const SECOND_QUADRANT = Math.PI;
const THIRD_QUADRANT = 3 * Math.PI / 2;
const CAR_LENGTH = 12;
const CAR_WIDTH = CAR_LENGTH * 1.1;
const CAR_COLOR = "#833aff";
const CHECKPOINT_DISTANCE = 100;

const test = new Vector(1, 0);
console.info(test.angle);
test.set(0, -1);
console.info(test.angle);
test.set(-1, 0);
console.info(test.angle);
test.set(0, 1);
console.info(test.angle);
test.set(1, 1);
console.info(test.angle);

class Car {
    constructor (x, y) {
        this.pos = new Vector(x, y);
        this.vel = new Vector(1, 0);
        this.acc = new Vector();
        this.anchorCheckpoint = new Vector();
        this.nextCheckpoint = new Vector();
    }
}

class Rush {

    constructor () {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);

        window.addEventListener("resize", this.resize.bind(this));
        this.resize();

        this.car = new Car(this.canvas.width / 2, this.canvas.height / 2 + CHECKPOINT_DISTANCE / 2);

        this.context = this.canvas.getContext("2d");
        this.updateFn = this.update.bind(this);
        requestAnimationFrame(this.updateFn);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
        const anchorCheckpoint = new Vector(
            anchorCheckpointCol * CHECKPOINT_DISTANCE, anchorCheckpointRow * CHECKPOINT_DISTANCE
        );
        const direction = (new Vector()).set(car.pos).subtract(car.anchorCheckpoint);
        const angle = direction.angle;

        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1;
        // ctx.beginPath();
        // direction.normalize().scale(20).add(anchorCheckpoint);
        // ctx.moveTo(anchorCheckpoint.x, anchorCheckpoint.y);
        // ctx.lineTo(direction.x, direction.y);
        // ctx.stroke();

        if (car.anchorCheckpoint.x !== anchorCheckpoint.x || car.anchorCheckpoint.y !== anchorCheckpoint.y) {
            car.anchorCheckpoint.set(anchorCheckpoint.x, anchorCheckpoint.y);

            let options = null;
            if (angle < FIRST_QUADRANT) {
                options = [[1, 0], [1, 1], [0, 1]];
            } else if (angle < SECOND_QUADRANT) {
                options = [[-1, 0], [-1, 1], [0, 1]];
            } else if (angle < THIRD_QUADRANT) {
                options = [[-1, 0], [-1, -1], [0, -1]];
            } else {
                options = [[0, -1], [1, -1], [1, 0]];
            }
            const chosenIndex = Math.floor(Math.random() * options.length);
            const nextCol = anchorCheckpointCol + options[chosenIndex][0];
            const nextRow = anchorCheckpointRow + options[chosenIndex][1];
            car.nextCheckpoint.set(nextCol * CHECKPOINT_DISTANCE, nextRow * CHECKPOINT_DISTANCE);
        }
        ctx.fillStyle = "yellow";
        ctx.fillRect(car.anchorCheckpoint.x, car.anchorCheckpoint.y, 3, 3);
        ctx.fillStyle = "blue";
        ctx.fillRect(car.nextCheckpoint.x, car.nextCheckpoint.y, 3, 3);

        const desiredAcc = new Vector();
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

        ctx.fillStyle = "rgba(0, 0, 0, .1)";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#ccc";
        for (let x = 0; x < w; x += CHECKPOINT_DISTANCE) {
            for (let y = 0; y < h; y += CHECKPOINT_DISTANCE) {
                ctx.fillRect(x, y, 1, 1);
            }
        }

        this.updateCar(this.car);

        requestAnimationFrame(this.updateFn);
    }
}

new Rush();
