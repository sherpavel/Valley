let CRT_ANIMATION;
let PLAYING_ANIMATION = false;
let ANIMATION_TIME = -1;

function playAnimation(animation) {
    CRT_ANIMATION = animation;
    PLAYING_ANIMATION = true;
    if (ANIMATION_TIME < 0) ANIMATION_TIME = millis();
    switch (animation) {
        case ANIMATION.INTRO:
            playIntro();
            break;
        case ANIMATION.LOST:
            playLost();
            break;
    }
}
function stopAnimation() {
    CRT_ANIMATION = -1;
    PLAYING_ANIMATION = false;
    ANIMATION_TIME = -1;
}
function getAnimationTime() {
    return millis() - ANIMATION_TIME;
}

function f(x) {
    // return sin(x)**2 * cos(x) * tan(x);
    return 2.3 * sin(x)**2 * cos(x);
}
function playIntro() {
    drawBackground();
    drawObstacles();
    if (isRaining) drawRain();
    drawMask();
    drawPlayer();

    updateWeather();
    updateBackground();
    targetPos.y = (1+f(millis()/800))*(height-2*COLLISION_RADIUS)/2 + COLLISION_RADIUS;
    updatePlayer();
}

let bgOffsetVelocity = 0;
let timeOffsetVelocity = 0;
function playLost() {
    if (!NO_CLEAR) {
        drawBackground();
        drawObstacles();
        if (isRaining) drawRain();
        drawMask();
    }

    // Tail - first stage
    for (let i = 0; i < tail.length; i++) {
        tail[i] = tail[i].lerp(playerPos, 0.4);
    }

    // Explode - second stage
    if (tail[tail.length-1].sub(playerPos).lgt < COLLISION_RADIUS/2 
        && getAnimationTime() < 1200) {
        NO_CLEAR = true;
        noStroke();
        for (let i = 0; i < playerParticles.length; i++) {
            playerParticles[i].pos = playerParticles[i].pos.add(playerParticles[i].v);
            playerParticles[i].v = playerParticles[i].v.div(1.1);
            playerParticles[i].r /= 1.05;
            fill(getGradient(
                EXPLODE_GRADIENT,
                clamp(playerParticles[i].r/(COLLISION_RADIUS*0.8), 0, 1),
                255*(0.5 + 0.5*Math.sqrt(playerParticles[i].r / COLLISION_RADIUS))
                ));
            ellipse(playerParticles[i].pos.x, playerParticles[i].pos.y, 2*playerParticles[i].r);
        }
    } else if (getAnimationTime() < 1200){
        drawPlayer();
    }

    // Backtrack - third stage
    if (getAnimationTime() > 1200) {
        NO_CLEAR = false;
        bgOffsetVelocity = lerp(bgOffsetVelocity, 20, 0.05);
        bgOffset -= bgOffsetVelocity;
        groundOffset -= bgOffsetVelocity;

        // CURRENT_TIME -= timeOffsetVelocity;
        // CURRENT_TIME = Math.max(CURRENT_TIME, START_TIME);

        obstacles.forEach(obstacle => {
            obstacle.x += OBSTACLE_VELOCITY*10;
        });
    }

    // Finish animation
    if (getAnimationTime() > 1800) {
        NO_CLEAR = false;
        stopAnimation();
        resetGame(CURRENT_TIME);
        showMenu(MENU_MODE.START);
    }
}
