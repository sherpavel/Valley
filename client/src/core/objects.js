class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.passed = false;
    }

    isPassed(playerPos) {
        if (this.passed) return false;
        if (!this.passed && this.x < playerPos.x) this.passed = true;
        return this.passed;
    }

    draw() {}
    isVisible() {
        return (this.x > 0) && (this.x < width);
    }
    intersects(pos, collisionRadius) {}
}
class Circle extends Obstacle {
    constructor(x, y, r) {
        super(x, y);
        this.r = r;
        this.id = OBSTACLE_TYPE.CIRCLE;

        this.a = MAX_SHADOW_ANGLE;
        this.shadowOffset = (height - this.y) * tan(this.a);
        this.rcos = this.r*cos(this.a);
        this.rsin = this.r*sin(this.a);

        this.shadowAlpha = 80;
    }

    draw() {
        // Shadow
        push();
        fill(0, this.shadowAlpha/2);
        beginShape();
        vertex(this.x - this.rcos, this.y + this.rsin);
        vertex(this.x + this.rcos, this.y - this.rsin);
        vertex(this.x + this.r*1.1 + this.shadowOffset, height - BACKGROUND_GROUND_HEIHGT/2);
        vertex(this.x - this.r*1.1 + this.shadowOffset, height - BACKGROUND_GROUND_HEIHGT/2);
        endShape(CLOSE);
        fill(0, this.shadowAlpha);
        arc(this.x + this.shadowOffset, 
            height - BACKGROUND_GROUND_HEIHGT/2, 
            this.r*2.2, 
            // BACKGROUND_GROUND_HEIHGT * map(this.r, CIRCLE_MIN_R, CIRCLE_MAX_R, 0.2, 0.9),
            BACKGROUND_GROUND_HEIHGT * 0.8,
            0, PI);
        fill(0, this.shadowAlpha*0.66);
        arc(this.x + this.shadowOffset, 
            height - BACKGROUND_GROUND_HEIHGT/2, 
            this.r*2.2, 
            // BACKGROUND_GROUND_HEIHGT * map(this.r, CIRCLE_MIN_R, CIRCLE_MAX_R, 0.2, 0.9),
            BACKGROUND_GROUND_HEIHGT * 0.8,
            PI, 2*PI);
        pop();
        // Circle
        ellipse(this.x, this.y, this.r*2);
    }
    isVisible() {
        return (this.x + this.r + this.shadowOffset > 0) && (this.x - this.r < width);
    }
    intersects(pos, collisionRadius) {
        return ((this.x - pos.x)**2 + (this.y - pos.y)**2)
            < (this.r + collisionRadius)**2;
    }
}
class Pillar extends Obstacle {
    constructor(x, width, gapHeight, gapStart) {
        super(x, 0);
        this.width = width;
        this.gapHeight = gapHeight;
        this.gapStart = gapStart;
        this.id = OBSTACLE_TYPE.PILLAR;

        this.a = MAX_SHADOW_ANGLE;
        this.topShadowOffset = (height - gapStart) * tan(this.a);
        this.topShadowWidth = height*tan(this.a) + this.width - this.topShadowOffset;
        this.btmShadowWidth = (height - this.gapHeight - this.gapStart) * tan(this.a);

        this.shadowAlpha = 80;
    }

    draw() {
        // Top
        push();
        fill(0, this.shadowAlpha/2);
        beginShape();
        vertex(this.x + this.width, 0);
        vertex(this.x, this.gapStart);
        vertex(this.x + this.topShadowOffset, height - BACKGROUND_GROUND_HEIHGT/2);
        vertex(this.x + this.topShadowOffset + this.topShadowWidth, height - BACKGROUND_GROUND_HEIHGT/2);
        endShape(CLOSE);
        fill(0, this.shadowAlpha*0.66);
        rect(this.x + this.topShadowOffset,
            height - BACKGROUND_GROUND_HEIHGT*3/4,
            this.topShadowWidth,
            BACKGROUND_GROUND_HEIHGT/4);
        fill(0, this.shadowAlpha);
        rect(this.x + this.topShadowOffset,
            height - BACKGROUND_GROUND_HEIHGT/2,
            this.topShadowWidth,
            BACKGROUND_GROUND_HEIHGT/4);
        pop();
        rect(this.x, 0, this.width, this.gapStart, 0, 0, 10, 10);

        // Botton
        push();
        fill(0, this.shadowAlpha/2);
        beginShape();
        vertex(this.x + this.width/2, this.gapStart + this.gapHeight);
        vertex(this.x + this.width, this.gapStart + this.gapHeight);
        vertex(this.x + this.width + this.btmShadowWidth, height - BACKGROUND_GROUND_HEIHGT/2);
        vertex(this.x + this.width/2, height - BACKGROUND_GROUND_HEIHGT/2);
        endShape(CLOSE);
        fill(0, this.shadowAlpha*0.66);
        rect(this.x + this.width,
            height - BACKGROUND_GROUND_HEIHGT*3/4,
            Math.min(this.btmShadowWidth, this.topShadowOffset - this.width),
            BACKGROUND_GROUND_HEIHGT/4);
        fill(0, this.shadowAlpha);
        rect(this.x + this.width/2,
            height - BACKGROUND_GROUND_HEIHGT/2,
            this.width/2 + Math.min(this.btmShadowWidth, this.topShadowOffset - this.width),
            BACKGROUND_GROUND_HEIHGT/4);
        pop();

        rect(this.x, 
            this.gapStart + this.gapHeight, 
            this.width, 
            height - this.gapHeight - this.gapStart - BACKGROUND_GROUND_HEIHGT/2,
            10, 10, 0, 0);
        
        // Column illusion
        ellipse(
            this.x + this.width/2,
            height- BACKGROUND_GROUND_HEIHGT/2,
            this.width,
            BACKGROUND_GROUND_HEIHGT*0.5);
    }
    isVisible() {
        return (this.x + this.topShadowOffset + this.topShadowWidth > 0) && (this.x < width + this.width);
    }
    intersects(pos, collisionRadius) {
        let closestX = clamp(pos.x, this.x, this.x + this.width);
        let closestYTop = clamp(pos.y, 0, this.gapStart);
        let closestYBottom = clamp(pos.y, this.gapStart + this.gapHeight, height);
        let dx = pos.x - closestX;
        let dyTop = pos.y - closestYTop;
        let dyBottom = pos.y - closestYBottom;
        return ((dx**2 + dyTop**2) < collisionRadius**2)
            || ((dx**2 + dyBottom**2) < collisionRadius**2)
    }
}

class Raindrop {
    constructor(rainType) {
        this.MAX_LEN = 25;
        this.len = this.MAX_LEN;
        this.ground = BACKGROUND_GROUND_HEIHGT * (0.25 + (0.5)*Math.random());
        this.r = 0;
        this.alpha = 255;

        this.rainType = rainType;
        this.x = 2 * width * Math.random();
        this.y = (-height-this.MAX_LEN*5) * (Math.sqrt(Math.random()));
    }

    resetPos(rainType) {
        this.len = this.MAX_LEN;
        this.r = 0;
        this.alpha = 255;
        this.rainType = rainType;
        this.x = 2 * width * Math.random();
        this.y = -this.MAX_LEN;
    }

    updateAndDraw(alpha=1) {
        this.y += rainType.v;
        fill(140, 223, 232, 200 * alpha);
        ellipse(this.x, this.y, 3, this.len);

        noFill();
        stroke(255, this.alpha * alpha);
        strokeWeight(3);
        if (this.y > height-BACKGROUND_GROUND_HEIHGT) {
            this.y -= rainType.v / 2;
            this.len = map(this.y+this.len, height-BACKGROUND_GROUND_HEIHGT, height-this.ground, this.MAX_LEN, 0);
            this.len = Math.max(this.len, 0);
            ellipse(this.x, height-this.ground, this.r*2, this.r/2);
            this.r += 5;
            this.alpha -= 40;
        }
        noStroke();
    }
}
class Cloud {
    constructor(layer) {
        this.layer = layer
    }

    draw() {

    }
}

function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
