let canvas;

let brightColor;

let playerPos;
let targetPos;
let playerVelocity = -VELOCITY;

let tail = new Array(50);
let playerParticles = new Array(200);

let obstacles = [];
let obstaclesAmount = 5;
let newObstaclePos = 0;

let bgOffset = 0;
let groundOffset = 0;

let isRaining = false;
let stoppingRain = false;
let rainType;
let rainDrops;
let mask;

let PAUSE = false;
let NO_CLEAR = false;
let START_CANVAS = false;
let SCORE = 0;

function setup() {
    let minDim = Math.min(windowWidth, windowHeight);
    let w = minDim;
    let h = minDim / CANVAS_RATIO;

    canvas = createCanvas(w, h);
    canvas.parent('canvas');
    canvas.style('display', 'block');

    brightColor = color(210, 210, 210);

    resetGame();
}
function windowResized() {
    let minDim = Math.min(windowWidth, windowHeight);
    let w = minDim;
    let h = minDim / CANVAS_RATIO;
    resizeCanvas(w, h);
    canvas.position((windowWidth - width)/2, (windowHeight - height)/2.3);
}

function startCanvas() {
    START_CANVAS = true;
    loop();
    resetGame();
    playAnimation(ANIMATION.INTRO);
}
function startGame() {
    PAUSE = false;
    stopAnimation();
}
function pauseGame() {
    PAUSE = true;
}
function resumeGame() {
    PAUSE = false;
}
function resetGame(crtTime=0) {
    playerPos = new Vector(width/4, height/2);
    targetPos = new Vector(playerPos.x, playerPos.y);

    let tailStep = (playerPos.x + COLLISION_RADIUS) / tail.length;
    for (let i = 0; i < tail.length; i++)
        tail[i] = new Vector(playerPos.x - tailStep*i, playerPos.y);

    obstacles = [];
    newObstaclePos = 0;
    createObstacles(obstaclesAmount);

    START_TIME = new Date().getHours();
    END_TIME = START_TIME + 7*24;
    CURRENT_TIME = Math.max(START_TIME, crtTime);

    SCORE = 0;
    setScore(0);

    pixelDensity(1);
    windowResized();
    frameRate(60);

    pauseGame();
    if (!START_CANVAS) {
        noLoop();
        return;
    }
    playAnimation(ANIMATION.INTRO);
}

function draw() {
    if (!NO_CLEAR)
        clear();

    if (PLAYING_ANIMATION) {
        playAnimation(CRT_ANIMATION);
        return;
    }

    drawBackground();
    if (isRaining) drawRain();
    drawObstacles();
    drawMask();
    drawPlayer();

    if (PAUSE) return;

    updateWeather();
    updateBackground();
    targetPos.y += playerVelocity;
    updatePlayer();
    if (updateObstacles()) {
        for (let i = 0; i < playerParticles.length; i++) {
            let a = 2 * Math.PI * Math.random();
            playerParticles[i] = {
                pos: new Vector(playerPos.x, playerPos.y),
                v: new Vector(cos(a), sin(a)).mlp(5 + 20 * Math.random()),
                r: COLLISION_RADIUS * (0.5 + 0.5*Math.random())
            }
        }
        bgOffsetVelocity = 0;
        // timeOffsetVelocity = (CURRENT_TIME%24) / 24;
        playAnimation(ANIMATION.LOST);
    }
}

//=== Update+Draw ===//
// Player
let maxAngle = Math.PI / 4;
let angle = maxAngle;
function updatePlayer() {
    (!PAUSE && (mouseIsPressed || keyIsDown(32))) ? playerVelocity = -1.5*VELOCITY : playerVelocity = VELOCITY;

    playerPos.y = lerp(playerPos.y, targetPos.y, 0.1);
    // Check bouds
    if (playerPos.y - COLLISION_RADIUS < 0) {
        targetPos.y = COLLISION_RADIUS + 1;
        playerPos.y = targetPos.y;
    } else if (playerPos.y + COLLISION_RADIUS + BACKGROUND_GROUND_HEIHGT/2 > height) {
        targetPos.y = height - COLLISION_RADIUS - BACKGROUND_GROUND_HEIHGT/2 - 1;
        playerPos.y = targetPos.y;
    }

    // Tail
    tail[0].y = playerPos.y;
    for (let i = 1; i < tail.length; i++) {
        tail[i].y = lerp(tail[i].y, tail[i-1].y, 0.7);
    }
}
function drawPlayer() {
    // Player
    noFill();
    stroke(toColor(TAIL_GRADIENT[TAIL_GRADIENT.length-1]));
    strokeWeight(COLLISION_RADIUS/8);
    ellipse(playerPos.x, playerPos.y, 2*COLLISION_RADIUS);

    // Tail
    strokeJoin(ROUND);
    for (let i = 0; i < tail.length-1; i++) {
        let p = i / tail.length;
        stroke(getGradient(TAIL_GRADIENT, 1-p));
        strokeWeight(COLLISION_RADIUS * (p/2 + 0.8));
        line(tail[i].x, tail[i].y, tail[i+1].x, tail[i+1].y);
    }

    // Inner shadow
    noStroke();
    fill(toColor(TAIL_GRADIENT[0], 100));
    ellipse(playerPos.x, playerPos.y, 2*COLLISION_RADIUS);
}

// Obstacles
function createObstacles(amount) {
    let obst;
    for (let i = 0; i < amount; i++) {
        if (Math.random() < 0.3) {
            let r = CIRCLE_MIN_R + (CIRCLE_MAX_R - CIRCLE_MIN_R)*Math.random();
            obst = new Circle(
                width + r + newObstaclePos,
                r + (height - BACKGROUND_GROUND_HEIHGT - 2*r) * Math.random(),
                r);
            newObstaclePos += r*5;
        } else {
            let gap = PILLAR_MIN_GAP + (PILLAR_MAX_GAP - PILLAR_MIN_GAP)*Math.random();
            obst = new Pillar(
                width + newObstaclePos,
                PILLAR_WIDTH,
                gap,
                80 + (height-BACKGROUND_GROUND_HEIHGT-100-gap) * Math.random());
            newObstaclePos += PILLAR_WIDTH * 5;
        }
        obstacles.push(obst);
    }
}
function updateObstacles() {
    newObstaclePos -= OBSTACLE_VELOCITY;
    newObstaclePos = Math.max(newObstaclePos, 0);
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= OBSTACLE_VELOCITY;
        if (obstacles[i].intersects(playerPos, COLLISION_RADIUS)) {
            if (SCORE > BEST_SCORE) {
                setBestScore(SCORE);
                saveBestScore();
            }
            return true;
        }
        if (obstacles[i].isPassed(playerPos)) {
            SCORE++;
            setScore(SCORE);
        }
        if (obstacles[i].x < 0 && !obstacles[i].isVisible()) {
            obstacles.shift();
            i--;
            createObstacles(1);
        }
    }
    return false;
}
function drawObstacles() {
    noStroke();
    fill(brightColor);
    for (i = obstacles.length-1; i >= 0; i--) {
        if (obstacles[i].isVisible()) obstacles[i].draw();
    }
}

// Background
function updateBackground() {
    bgOffset += 0.5;
    groundOffset -= OBSTACLE_VELOCITY;
}
function drawBackground() {
    // Mountains
    let pScaled = map((CURRENT_TIME%24) / 24, 0, 1, 0.0001, DAY_CYCLE.length-1.001);
    let c1 = Math.floor(pScaled);
    let c2 = Math.ceil(pScaled);
    let p = map(pScaled, c1, c2, 0, 1);

    let sky = getGradient([
        DAY_CYCLE[c1].sky,
        DAY_CYCLE[c2].sky
    ], p)
    let bgGradient = transitionGradients(DAY_CYCLE[c1].background, DAY_CYCLE[c2].background, p);

    background(sky);

    for (let l = 0; l < BACKGROUND_LAYERS; l++) {
        let p = l / (BACKGROUND_LAYERS-1);
        fill(getGradient(bgGradient, p));
        noiseDetail(8, map(p**2, 0, 1, 0.5, 0.2));
        beginShape();
        vertex(-10, height+10);
        for (let x = 0; x < width+BACKGROUND_RENDER_STEP; x+=BACKGROUND_RENDER_STEP) {
            let coord = (p+1)*10*(x + bgOffset*((p+1)**4))/width + 1000*p;
            let y = noise(coord) * 100 * (2-p);
            vertex(x, height - y - 150 - (height * (1-p**3) * 0.5));
        }
        vertex(width+10, height+10);
        endShape(CLOSE);
    }

    // Ground
    fill(getGradient([
        DAY_CYCLE[c1].ground,
        DAY_CYCLE[c2].ground
    ], p));
    noiseDetail(4, 0.4);
    beginShape();
    vertex(-10, height+10);
    for (let x = 0; x < width+BACKGROUND_RENDER_STEP; x+=BACKGROUND_RENDER_STEP) {
        let coord = 20*(x - groundOffset) / width;
        let y = noise(coord, millis()/1000);
        y *= 30;
        vertex(x, height - y - BACKGROUND_GROUND_HEIHGT);
    }
    vertex(width+10, height+10);
    endShape(CLOSE);
}

// Weather
function updateWeather() {
    CURRENT_TIME += 0.02;
    if (CURRENT_TIME > END_TIME) CURRENT_TIME = START_TIME;
    // setScore(Math.floor(CURRENT_TIME % 24));
    // setBestScore(Math.floor(CURRENT_TIME / 24));
    let weather = WEATHER_CYCLE[
        Math.floor(map(CURRENT_TIME, 
            START_TIME, END_TIME, 
            0, WEATHER_CYCLE.length))
    ];
    if (weather.prec_type === "rain") {
        if (weather.prec_amount < 7.62) startRain(WEATHER_TYPE.rain.light);
        else startRain(WEATHER_TYPE.rain.heavy);
    } else stopRain();
}

// Rain
function startRain(type) {
    if (isRaining && rainType !== type) switchRain(type);
    if (isRaining) return;
    isRaining = true;
    rainType = type;
    rainDrops = new Array(rainType.amount);
    for (let i = 0; i < rainDrops.length; i++) {
        rainDrops[i] = new Raindrop(rainType);
    }
    mask = 0;
}
function stopRain() {
    stoppingRain = true;
}
function switchRain(newType) {
    switch (newType) {
        case WEATHER_TYPE.rain.heavy:
            for (let i = 0; i < WEATHER_TYPE.rain.heavy.amount - WEATHER_TYPE.rain.light.amount; i++) {
                rainDrops.push(new Raindrop(newType));
            }
            break;
        default:
            rainDrops.splice(0, WEATHER_TYPE.rain.heavy.amount - WEATHER_TYPE.rain.light.amount);
            break;
    }
    rainType = newType;
}
function drawRain() {
    let alpha = map(mask, 0, rainType.mask, 0, 1);
    for (let i = 0; i < rainDrops.length; i++) {
        rainDrops[i].x -= OBSTACLE_VELOCITY;
        rainDrops[i].updateAndDraw((stoppingRain) ? (alpha) : alpha);
        if (rainDrops[i].y > height+25 || rainDrops[i].x < -25) {
            rainDrops[i].resetPos(rainType);
        }
    };

    mask = (stoppingRain) ? lerp(mask, 0, 0.05) : lerp(mask, rainType.mask, 0.05);

    if (stoppingRain && mask < 5) {
        isRaining = false;
        stoppingRain = false;
        rainDrops = undefined;
        rainType = undefined;
    }
}
function drawMask() {
    if (!isRaining) return;
    fill(0, mask);
    rect(0, 0, width, height);
}

// Clouds
function drawCloud(layer) {

}


//=== Misc ===//
function getNoise(coord, offset=0) {
    return sin(coord) + noise(coord + offset) * 2;
}

function getGradient(gradient, p, alpha=255) {
    let pScaled = map(p, 0, 1, 0.0001, gradient.length-1.001);
    let c1 = Math.floor(pScaled);
    let c2 = Math.ceil(pScaled);
    p = map(pScaled, c1, c2, 0, 1);
    let r = gradient[c1][0] * (1-p) + gradient[c2][0] * p;
    let g = gradient[c1][1] * (1-p) + gradient[c2][1] * p;
    let b = gradient[c1][2] * (1-p) + gradient[c2][2] * p;
    return color(r, g, b, alpha);
}
function transitionGradients(g1, g2, p) {
    return [
        [
            g1[0][0] * (1-p) + g2[0][0] * p,
            g1[0][1] * (1-p) + g2[0][1] * p,
            g1[0][2] * (1-p) + g2[0][2] * p,
        ],
        [
            g1[1][0] * (1-p) + g2[1][0] * p,
            g1[1][1] * (1-p) + g2[1][1] * p,
            g1[1][2] * (1-p) + g2[1][2] * p,
        ],
        [
            g1[2][0] * (1-p) + g2[2][0] * p,
            g1[2][1] * (1-p) + g2[2][1] * p,
            g1[2][2] * (1-p) + g2[2][2] * p,
        ]
    ];
}
function lerpColors(c1, c2, amt) {
    return [
        lerp(c1[0], c2[0], amt),
        lerp(c1[1], c2[1], amt),
        lerp(c1[2], c2[2], amt),
    ];
}
function toVector(c) {
    return [
        red(c),
        green(c),
        blue(c),
        alpha(c)
    ];
}
function toColor(c, alpha=255) {
    return color(c[0], c[1], c[2], alpha);
}

//=== User input ===//
function keyPressed() {
    if (PLAYING_ANIMATION) return;

    // ESC
    if (keyCode == 27) {
        if (PAUSE) {
            resumeGame();
            hideMenu();
        }
        else {
            pauseGame();
            showMenu(MENU_MODE.PAUSE);
        }
        return;
    }
}
