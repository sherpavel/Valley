class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    mlp(n) {
        return new Vector(this.x * n, this.y * n);
    }
    div(n) {
        return new Vector(this.x / n, this.y / n);
    }

    get lgt() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    norm() {
        let l = this.lgt;
        return this.div(l);
    }

    lerp(v, t) {
        return this.add(v.sub(this).mlp(t));
    }
}