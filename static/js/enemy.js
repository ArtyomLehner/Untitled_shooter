window.Enemy = class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 14;
        this.health = 150;
        this.maxHealth = 150;
        this.damage = 30;
        this.speed = 55;                  // стандартная скорость
        this.alive = true;
        this.deathTimer = 0;
        this.deathDuration = 1.4;
        this.color = '#3a5a3a';
        this.angle = 0;
        this.stuckTimer = 0;              // таймер обхода препятствия
        this.sideStepDir = 0;             // направление обхода (1 или -1)
    }

    update(dt, player, map, enemies) {
        if (!this.alive) {
            this.deathTimer += dt;
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distToPlayer = Math.hypot(dx, dy);

        // Если упёрлись в препятствие или других зомби
        if (this.stuckTimer > 0) {
            this.stuckTimer -= dt;
            // Двигаемся вбок
            const sideAngle = Math.atan2(dy, dx) + (Math.PI / 2) * this.sideStepDir;
            const moveX = Math.cos(sideAngle) * this.speed * dt;
            const moveY = Math.sin(sideAngle) * this.speed * dt;
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            if (!map.checkCollisionWithObstacles(newX, this.y, this.radius)) this.x = newX;
            if (!map.checkCollisionWithObstacles(this.x, newY, this.radius)) this.y = newY;
            if (this.stuckTimer <= 0) {
                this.sideStepDir = 0;
            }
            return;
        }

        // Обычное движение к игроку с избеганием других зомби
        if (distToPlayer > 0) {
            let moveX = (dx / distToPlayer) * this.speed * dt;
            let moveY = (dy / distToPlayer) * this.speed * dt;

            // Отталкивание от других зомби
            for (const other of enemies) {
                if (other === this || !other.alive) continue;
                const odx = this.x - other.x;
                const ody = this.y - other.y;
                const dist = Math.hypot(odx, ody);
                const minDist = this.radius + other.radius + 2; // желаемый зазор
                if (dist < minDist && dist > 0) {
                    const force = (minDist - dist) / minDist;
                    moveX += (odx / dist) * force * 30 * dt;
                    moveY += (ody / dist) * force * 30 * dt;
                }
            }

            let newX = this.x + moveX;
            let newY = this.y + moveY;

            let moved = false;
            if (!map.checkCollisionWithObstacles(newX, this.y, this.radius)) {
                this.x = newX;
                moved = true;
            }
            if (!map.checkCollisionWithObstacles(this.x, newY, this.radius)) {
                this.y = newY;
                moved = true;
            }

            // Если не смогли сдвинуться
            if (!moved) {
                this.stuckTimer = 0.5;
                this.sideStepDir = Math.random() < 0.5 ? 1 : -1;
            }

            this.angle = Math.atan2(dy, dx);
        }

        // Атака при касании
        if (distToPlayer < this.radius + player.radius) {
            player.takeDamage(this.damage * dt);
        }
    }

    takeDamage(amount) {
        if (!this.alive) return false;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this.deathTimer = 0;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.alive) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1a3a1a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Глаза
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(Math.cos(this.angle) * 5 - 2, Math.sin(this.angle) * 5 - 2, 2, 0, Math.PI * 2);
            ctx.arc(Math.cos(this.angle) * 5 + 2, Math.sin(this.angle) * 5 + 2, 2, 0, Math.PI * 2);
            ctx.fill();

            if (this.health < this.maxHealth) {
                const barWidth = 20;
                const barHeight = 3;
                const healthPercent = this.health / this.maxHealth;
                ctx.fillStyle = '#333';
                ctx.fillRect(-barWidth / 2, -this.radius - 6, barWidth, barHeight);
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(-barWidth / 2, -this.radius - 6, barWidth * healthPercent, barHeight);
            }
        } else {
            const progress = Math.min(this.deathTimer / this.deathDuration, 1);
            const alpha = 1 - progress;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    isDead() {
        return !this.alive && this.deathTimer >= this.deathDuration;
    }
};