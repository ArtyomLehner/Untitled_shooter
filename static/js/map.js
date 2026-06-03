const truckImage = new Image();
truckImage.src = '/static/images/truck.png';

window.Map = class Map {
    constructor() {
        this.width = 4800;
        this.height = 4800;
        this.roadWidth = 160;
        this.mountainWidth = 400;
        this.innerOffset = this.mountainWidth + this.roadWidth;

        this.tunnelY = this.height / 2;
        this.tunnelX = this.width - this.mountainWidth + 250;
        this.tunnelRadius = this.roadWidth / 2;

        this.tunnelClearance = {
            x1: this.width - this.mountainWidth - this.roadWidth,
            x2: this.tunnelX + this.tunnelRadius + 10,
            y1: this.tunnelY - this.roadWidth / 2 - 10,
            y2: this.tunnelY + this.roadWidth / 2 + 10
        };

        this.obstacles = [];
        this.trees = [];
        this.lampPosts = [];
        this.crosswalks = [];
        this.mountains = [];
        this.decorations = [];
        this.cloudGroups = [];
        this.cloudSpawnTimer = 0;
        this.cloudSpawnInterval = 2 + Math.random() * 3;
        this.droppedItems = [];

        const roadRightX = this.width - this.mountainWidth - this.roadWidth / 2;
        const roadLeftX = this.mountainWidth + this.roadWidth / 2;
        const roadTopY = this.mountainWidth + this.roadWidth / 2;
        const roadBottomY = this.height - this.mountainWidth - this.roadWidth / 2;

        this.truck = {
            x: roadRightX,
            y: this.tunnelY + this.tunnelRadius + 150,
            length: 180,
            width: 100,
            speed: 80,
            direction: 'down',
            corners: {
                bottomRight: { x: roadRightX, y: roadBottomY },
                bottomLeft:  { x: roadLeftX,  y: roadBottomY },
                topLeft:    { x: roadLeftX,  y: roadTopY },
                topRight:   { x: roadRightX, y: roadTopY }
            }
        };

        this.generateTrees();
        this.generateLampPosts();
        this.generateCrosswalks();
        this.generateMountains();
        this.generateDecorations();
        this.generateInitialClouds();
    }

    isInTunnelClearance(x, y) {
        return (x >= this.tunnelClearance.x1 && x <= this.tunnelClearance.x2 &&
                y >= this.tunnelClearance.y1 && y <= this.tunnelClearance.y2);
    }

    generateTrees() {
        const minGap = 20;
        const minX = this.innerOffset + 40;
        const maxX = this.width - this.innerOffset - 40;
        const minY = this.innerOffset + 40;
        const maxY = this.height - this.innerOffset - 40;
        const treeCount = 160;
        for (let i = 0; i < treeCount; i++) {
            const radius = 20 + Math.random() * 30;
            let x, y;
            let attempts = 0;
            let valid = false;
            while (!valid && attempts < 1000) {
                x = minX + Math.random() * (maxX - minX);
                y = minY + Math.random() * (maxY - minY);
                if (Math.hypot(x - this.width / 2, y - this.height / 2) < 350 ||
                    this.isInTunnelClearance(x, y)) {
                    attempts++;
                    continue;
                }
                let collision = false;
                for (let t of this.trees) {
                    if (Math.hypot(x - t.x, y - t.y) < radius + t.radius + minGap) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) valid = true;
                attempts++;
            }
            if (!valid) {
                x = minX + 50;
                y = minY + 50 + i * 10;
            }
            const vertices = 5 + Math.floor(Math.random() * 4);
            const startAngle = Math.random() * Math.PI * 2;
            this.trees.push({ x, y, radius, vertices, startAngle });
            this.obstacles.push({ x, y, radius });
        }
    }

    generateLampPosts() {
        const spacing = 150;
        const roadInner = this.innerOffset;
        for (let y = roadInner; y <= this.height - roadInner; y += spacing) {
            this.lampPosts.push({ x: roadInner, y, direction: Math.PI });
            this.obstacles.push({ x: roadInner, y, radius: 8 });
        }
        for (let y = roadInner; y <= this.height - roadInner; y += spacing) {
            this.lampPosts.push({ x: this.width - roadInner, y, direction: 0 });
            this.obstacles.push({ x: this.width - roadInner, y, radius: 8 });
        }
        for (let x = roadInner + spacing; x <= this.width - roadInner; x += spacing) {
            this.lampPosts.push({ x, y: roadInner, direction: -Math.PI / 2 });
            this.obstacles.push({ x, y: roadInner, radius: 8 });
        }
        for (let x = roadInner + spacing; x <= this.width - roadInner; x += spacing) {
            this.lampPosts.push({ x, y: this.height - roadInner, direction: Math.PI / 2 });
            this.obstacles.push({ x, y: this.height - roadInner, radius: 8 });
        }
    }

    generateCrosswalks() {
        const numCrosswalks = 1 + Math.floor(Math.random() * 2);
        const roadInner = this.innerOffset;
        const margin = 150;
        for (let i = 0; i < numCrosswalks; i++) {
            const side = Math.floor(Math.random() * 4);
            let position;
            if (side === 0 || side === 1) {
                position = roadInner + margin + Math.random() * (this.height - 2 * (roadInner + margin));
            } else {
                position = roadInner + margin + Math.random() * (this.width - 2 * (roadInner + margin));
            }
            this.crosswalks.push({ side, position });
        }
    }

    generateMountains() {
        const spacing = 28;
        for (let layer = 0; ; layer++) {
            const offset = 20 + layer * 30;
            if (offset >= this.mountainWidth - 10) break;
            for (let y = offset; y <= this.height - offset; y += spacing) {
                this.addIrregularMountain(offset, y);
                this.addIrregularMountain(this.width - offset, y);
            }
            for (let x = offset + spacing; x <= this.width - offset - spacing; x += spacing) {
                this.addIrregularMountain(x, offset);
                this.addIrregularMountain(x, this.height - offset);
            }
        }
    }

    addIrregularMountain(x, y) {
        if (this.isInTunnelClearance(x, y)) return;

        const vertCount = 5 + Math.floor(Math.random() * 4);
        const angles = [];
        const radii = [];
        for (let i = 0; i < vertCount; i++) {
            angles.push(Math.random() * Math.PI * 2);
            radii.push(15 + Math.random() * 20);
        }
        const combined = angles.map((a, i) => ({ angle: a, radius: radii[i] }));
        combined.sort((a, b) => a.angle - b.angle);
        const vertices = combined.map(c => ({ angle: c.angle, radius: c.radius }));
        const maxR = Math.max(...radii);
        this.mountains.push({ x, y, vertices, maxRadius: maxR });
        this.obstacles.push({ x, y, radius: maxR });
    }

    generateDecorations() {
        const count = 1200;
        const minX = this.innerOffset + 10;
        const maxX = this.width - this.innerOffset - 10;
        const minY = this.innerOffset + 10;
        const maxY = this.height - this.innerOffset - 10;
        for (let i = 0; i < count; i++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            if (Math.hypot(x - this.width / 2, y - this.height / 2) < 200) continue;
            const type = Math.random() < 0.6 ? 'grass' : 'stone';
            if (type === 'grass') {
                const numCircles = 3 + Math.floor(Math.random() * 2);
                const circlesData = [];
                for (let j = 0; j < numCircles; j++) {
                    const angle = (j / numCircles) * Math.PI * 2;
                    const dist = 1 + Math.random() * 2;
                    const radius = 1.2 + Math.random() * 1.5;
                    circlesData.push({ dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, radius });
                }
                this.decorations.push({ x, y, type, circlesData });
            } else {
                const radius = 2 + Math.random() * 3;
                this.decorations.push({ x, y, type, radius });
            }
        }
    }

    generateInitialClouds() {
        for (let i = 0; i < 8; i++) {
            let x = Math.random() * this.width;
            let y = Math.random() * this.height;
            this.cloudGroups.push(this.createCloudGroup(x, y));
        }
    }

    createCloudGroup(x, y) {
        const numCircles = 4 + Math.floor(Math.random() * 2);
        const offsets = [];
        for (let i = 0; i < numCircles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 40;
            const radius = 18 + Math.random() * 25;
            offsets.push({ dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, radius });
        }
        return { x, y, speed: 25 + Math.random() * 35, offsets, alpha: 0.12 + Math.random() * 0.1 };
    }

    updateClouds(dt) {
        this.cloudSpawnTimer += dt;
        if (this.cloudSpawnTimer >= this.cloudSpawnInterval) {
            this.cloudSpawnTimer = 0;
            this.cloudSpawnInterval = 2 + Math.random() * 4;
            const startY = this.innerOffset + Math.random() * (this.height - 2 * this.innerOffset);
            this.cloudGroups.push(this.createCloudGroup(-50, startY));
        }
        for (let i = this.cloudGroups.length - 1; i >= 0; i--) {
            const cloud = this.cloudGroups[i];
            cloud.x += cloud.speed * dt;
            if (cloud.x > this.width + 100) this.cloudGroups.splice(i, 1);
        }

        this.updateTruck(dt);
    }

    updateTruck(dt) {
        const t = this.truck;
        const move = t.speed * dt;
        const corners = t.corners;

        switch (t.direction) {
            case 'down':
                t.y += move;
                if (t.y >= corners.bottomRight.y) {
                    t.y = corners.bottomRight.y;
                    t.direction = 'left';
                }
                break;
            case 'left':
                t.x -= move;
                if (t.x <= corners.bottomLeft.x) {
                    t.x = corners.bottomLeft.x;
                    t.direction = 'up';
                }
                break;
            case 'up':
                t.y -= move;
                if (t.y <= corners.topLeft.y) {
                    t.y = corners.topLeft.y;
                    t.direction = 'right';
                }
                break;
            case 'right':
                t.x += move;
                if (t.x >= corners.topRight.x) {
                    t.x = corners.topRight.x;
                    t.direction = 'down';
                }
                break;
        }
    }

    // Проверка столкновения с грузовиком (для игрока и врагов)
    checkTruckCollision(x, y, radius = 0) {
        const t = this.truck;
        const halfLen = t.length / 2;
        const halfWid = t.width / 2;
        // Угол грузовика в зависимости от направления
        let angle = 0;
        switch (t.direction) {
            case 'down':  angle = -Math.PI / 2; break;   // нос вниз -> угол -90°
            case 'left':  angle = Math.PI; break;        // нос влево -> 180°
            case 'up':    angle = Math.PI / 2; break;     // нос вверх -> 90°
            case 'right': angle = 0; break;               // нос вправо -> 0°
        }
        // Переносим точку в локальную систему координат грузовика
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = x - t.x;
        const dy = y - t.y;
        const localX = cos * dx - sin * dy;
        const localY = sin * dx + cos * dy;
        // Проверяем пересечение с прямоугольником
        return Math.abs(localX) < halfLen + radius && Math.abs(localY) < halfWid + radius;
    }

    drawBase(ctx, camera, dayNight) {
        ctx.fillStyle = dayNight === 'night' ? '#1a1a2e' : '#3a6b35';
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawDecorations(ctx);

        ctx.fillStyle = '#444';
        const roadStart = this.mountainWidth;
        const roadW = this.roadWidth;
        ctx.fillRect(roadStart, roadStart, roadW, this.height - 2 * roadStart);
        ctx.fillRect(this.width - roadStart - roadW, roadStart, roadW, this.height - 2 * roadStart);
        ctx.fillRect(roadStart, roadStart, this.width - 2 * roadStart, roadW);
        ctx.fillRect(roadStart, this.height - roadStart - roadW, this.width - 2 * roadStart, roadW);

        const branchStartX = this.width - roadStart - roadW;
        const branchEndX = this.tunnelX + this.tunnelRadius;
        ctx.fillRect(branchStartX, this.tunnelY - roadW/2, branchEndX - branchStartX, roadW);

        ctx.fillStyle = '#fff';
        const stripeLen = 40, gapLen = 40, stripeW = 6;
        const halfRoad = roadStart + roadW / 2;
        const roadInner = this.innerOffset;
        for (let x = roadInner + gapLen; x < this.width - roadInner; x += stripeLen + gapLen) {
            ctx.fillRect(x, halfRoad - stripeW/2, stripeLen, stripeW);
            ctx.fillRect(x, this.height - halfRoad - stripeW/2, stripeLen, stripeW);
        }
        for (let y = roadInner + gapLen; y < this.height - roadInner; y += stripeLen + gapLen) {
            ctx.fillRect(halfRoad - stripeW/2, y, stripeW, stripeLen);
            ctx.fillRect(this.width - halfRoad - stripeW/2, y, stripeW, stripeLen);
        }
        const branchY = this.tunnelY;
        for (let x = branchStartX + gapLen; x < branchEndX - gapLen; x += stripeLen + gapLen) {
            ctx.fillRect(x, branchY - stripeW/2, stripeLen, stripeW);
        }

        ctx.fillStyle = '#fff';
        const cStripeW = 8, cStripeL = roadW * 0.8;
        for (let cw of this.crosswalks) {
            if (cw.side === 0) {
                const cx = halfRoad;
                for (let i = -2; i <= 2; i++) ctx.fillRect(cx - cStripeW/2, cw.position + i*20 - cStripeL/2, cStripeW, cStripeL);
            } else if (cw.side === 1) {
                const cx = this.width - halfRoad;
                for (let i = -2; i <= 2; i++) ctx.fillRect(cx - cStripeW/2, cw.position + i*20 - cStripeL/2, cStripeW, cStripeL);
            } else if (cw.side === 2) {
                const cy = halfRoad;
                for (let i = -2; i <= 2; i++) ctx.fillRect(cw.position + i*20 - cStripeL/2, cy - cStripeW/2, cStripeL, cStripeW);
            } else {
                const cy = this.height - halfRoad;
                for (let i = -2; i <= 2; i++) ctx.fillRect(cw.position + i*20 - cStripeL/2, cy - cStripeW/2, cStripeL, cStripeW);
            }
        }

        this.drawTruck(ctx);
        this.drawDroppedItems(ctx);

        for (let tree of this.trees) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            this.drawPolygon(ctx, tree.x+3, tree.y+3, tree.radius, tree.vertices, tree.startAngle);
            ctx.fill();
            let grad = ctx.createRadialGradient(tree.x-3, tree.y-3, tree.radius*0.1, tree.x, tree.y, tree.radius);
            grad.addColorStop(0, '#6b8c42');
            grad.addColorStop(0.6, '#3e5c1f');
            grad.addColorStop(1, '#1f330a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            this.drawPolygon(ctx, tree.x, tree.y, tree.radius, tree.vertices, tree.startAngle);
            ctx.fill();
            ctx.strokeStyle = '#2d4010';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        this.drawLampPostsBase(ctx);

        for (let m of this.mountains) {
            ctx.fillStyle = '#666';
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const v = m.vertices;
            const first = v[0];
            ctx.moveTo(m.x + Math.cos(first.angle) * first.radius, m.y + Math.sin(first.angle) * first.radius);
            for (let i = 1; i < v.length; i++) {
                ctx.lineTo(m.x + Math.cos(v[i].angle) * v[i].radius, m.y + Math.sin(v[i].angle) * v[i].radius);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        this.drawTunnel(ctx);
    }

    drawLampPostsBase(ctx) {
        for (let post of this.lampPosts) {
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(post.x, post.y, 8, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(post.x, post.y);
            const armLen = 35;
            const endX = post.x + Math.cos(post.direction) * armLen;
            const endY = post.y + Math.sin(post.direction) * armLen;
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawLampPostsTop(ctx) {
        for (let post of this.lampPosts) {
            const endX = post.x + Math.cos(post.direction) * 35;
            const endY = post.y + Math.sin(post.direction) * 35;
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(endX, endY, 4, 0, Math.PI*2);
            ctx.fill();
        }
    }

    drawTunnel(ctx) {
        const x = this.tunnelX;
        const y = this.tunnelY;
        const r = this.tunnelRadius;
        const blockCount = 8;
        const depth = this.width - x + 120;

        let darkGrad = ctx.createLinearGradient(x, 0, x + depth, 0);
        darkGrad.addColorStop(0, '#1a1a1a');
        darkGrad.addColorStop(0.5, '#0d0d0d');
        darkGrad.addColorStop(1, '#000000');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(x, y - r, depth, r * 2);

        let innerGrad = ctx.createLinearGradient(x, 0, x + depth, 0);
        innerGrad.addColorStop(0, 'rgba(0,0,0,0)');
        innerGrad.addColorStop(0.3, 'rgba(0,0,0,0.5)');
        innerGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = innerGrad;
        ctx.fillRect(x, y - r, depth, r * 2);

        const startAngle = -Math.PI / 2;
        const endAngle = Math.PI / 2;
        const angleStep = (endAngle - startAngle) / blockCount;

        for (let i = 0; i < blockCount; i++) {
            const a1 = startAngle + i * angleStep;
            const a2 = a1 + angleStep;
            const x1 = x + Math.cos(a1) * r;
            const y1 = y + Math.sin(a1) * r;
            const x2 = x + Math.cos(a2) * r;
            const y2 = y + Math.sin(a2) * r;

            ctx.save();
            ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
            ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
            const blockWidth = Math.hypot(x2 - x1, y2 - y1);
            const blockHeight = 12;
            ctx.fillStyle = '#d0d0d0';
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(-blockWidth/2, -blockHeight/2, blockWidth, blockHeight);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(x, y, r - 3, -Math.PI/2, Math.PI/2, false);
        ctx.fill();
    }

    drawTruck(ctx) {
        if (!truckImage.complete || truckImage.naturalWidth === 0) return;

        const t = this.truck;
        ctx.save();
        ctx.translate(t.x, t.y);

        let angle = 0;
        switch (t.direction) {
            case 'down':  angle = Math.PI / 2; break;
            case 'left':  angle = Math.PI; break;
            case 'up':    angle = -Math.PI / 2; break;
            case 'right': angle = 0; break;
        }
        ctx.rotate(angle);

        ctx.drawImage(
            truckImage,
            -t.length / 2,
            -t.width / 2,
            t.length,
            t.width
        );
        ctx.restore();
    }

    drawDroppedItems(ctx) {
        for (let d of this.droppedItems) {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fill();
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ddd';
            ctx.fillRect(-8, -3, 16, 6);
            ctx.fillStyle = '#666';
            ctx.fillRect(-5, 3, 10, 3);

            ctx.restore();
        }
    }

    isPlayerNearTruck(playerX, playerY, threshold = 80) {
        const t = this.truck;
        const dx = playerX - t.x;
        const dy = playerY - t.y;
        return Math.hypot(dx, dy) < threshold;
    }

    isPlayerNearDroppedItem(playerX, playerY, threshold = 40) {
        for (let d of this.droppedItems) {
            const dx = playerX - d.x;
            const dy = playerY - d.y;
            if (Math.hypot(dx, dy) < threshold) return true;
        }
        return false;
    }

    drawDecorations(ctx) {
        for (let d of this.decorations) {
            if (d.type === 'grass') {
                ctx.fillStyle = '#4a7a2e';
                for (let c of d.circlesData) {
                    ctx.beginPath();
                    ctx.arc(d.x + c.dx, d.y + c.dy, c.radius, 0, Math.PI*2);
                    ctx.fill();
                }
            } else if (d.type === 'stone') {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath();
                ctx.ellipse(d.x + 0.5, d.y + 0.5, d.radius, d.radius*0.8, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#8a8a8a';
                ctx.beginPath();
                ctx.ellipse(d.x, d.y, d.radius, d.radius*0.8, 0, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    drawClouds(ctx) {
        for (let cloud of this.cloudGroups) {
            for (let off of cloud.offsets) {
                ctx.fillStyle = `rgba(255, 255, 255, ${cloud.alpha})`;
                ctx.beginPath();
                ctx.arc(cloud.x + off.dx, cloud.y + off.dy, off.radius, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    drawPolygon(ctx, x, y, radius, vertices, startAngle) {
        const angleStep = (Math.PI * 2) / vertices;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(startAngle) * radius, y + Math.sin(startAngle) * radius);
        for (let i = 1; i <= vertices; i++) {
            const angle = startAngle + angleStep * i;
            ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        }
        ctx.closePath();
    }

    checkCollisionWithObstacles(x, y, radius) {
        // Проверяем столкновение с грузовиком
        if (this.checkTruckCollision(x, y, radius)) return true;
        // Проверяем столкновение с остальными препятствиями
        for (let obs of this.obstacles) {
            if (Math.hypot(x - obs.x, y - obs.y) < radius + obs.radius) return true;
        }
        return false;
    }

    checkCollisionPoint(x, y) {
        // Проверяем попадание в грузовик
        if (this.checkTruckCollision(x, y, 0)) return true;
        // Проверяем попадание в остальные препятствия
        for (let obs of this.obstacles) {
            if (Math.hypot(x - obs.x, y - obs.y) < obs.radius) return true;
        }
        return false;
    }
};