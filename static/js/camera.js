window.Camera = class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = 0;
        this.y = 0;
        this.zoom = 3;
    }

    follow(player) {
        this.x = player.x;
        this.y = player.y;
    }

    apply() {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restore() {
        this.ctx.restore();
    }
};