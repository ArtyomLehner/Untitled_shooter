const bulletImage = new Image();
bulletImage.src = '/static/images/bullet.png';

window.Projectile = class Projectile {
    constructor(x, y, angle, speed, range, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.lifeTime = range;
        this.damage = damage;
        this.elapsed = 0;
        this.width = 24;
        this.height = 9;
        this.active = true;
        this.trail = [];
    }

    update(dt, map, impactEffects) {
        this.elapsed += dt;
        if (this.elapsed >= this.lifeTime) {
            this.active = false;
            return;
        }
        const dist = this.speed * dt;
        const newX = this.x + Math.cos(this.angle) * dist;
        const newY = this.y + Math.sin(this.angle) * dist;
        if (map.checkCollisionPoint(newX, newY)) {
            this.active = false;
            if (impactEffects) {
                const count = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    const sparkAngle = this.angle + Math.PI + (Math.random() - 0.5) * 1.5;
                    const speed = 40 + Math.random() * 80;
                    impactEffects.push({
                        x: newX,
                        y: newY,
                        vx: Math.cos(sparkAngle) * speed,
                        vy: Math.sin(sparkAngle) * speed,
                        life: 0.15 + Math.random() * 0.1,
                        maxLife: 0.2
                    });
                }
            }
            return;
        }
        this.trail.push({ x: this.x, y: this.y, life: 0.15 });
        this.x = newX;
        this.y = newY;
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= dt;
            if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        for (let t of this.trail) {
            const alpha = t.life / 0.15 * 0.7;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffdd88';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        if (bulletImage.complete) {
            ctx.drawImage(bulletImage, -this.width/2, -this.height/2, this.width, this.height);
        } else {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        }
        ctx.restore();
    }
};