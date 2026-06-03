const Admin = false;

window.Game = class Game {
    constructor(canvas, menuCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.menuCallback = menuCallback;
        this.player = null;
        this.map = new Map();
        this.camera = new Camera(canvas);
        this.projectiles = [];
        this.muzzleFlashes = [];
        this.impactEffects = [];
        this.casings = [];
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        this.isRunning = false;
        this.lastTime = 0;
        this.dayNight = 'day';
        this.controlsOverlay = document.getElementById('controls-overlay');
        this.overlayTimeout = null;
        this.isShopOpen = false;
        this.isInventoryOpen = false;
        this.selectedItemIndex = -1;
        this.contextMenu = null;
        this.enemies = [];
        this.coins = [];
        this.spawnTimer = 0;
        this.spawnInterval = 30;
        this.heavySpawnTimer = 0;
        this.heavySpawnInterval = 60;
        this.enemyLimit = 50;
        this.isPlayerDead = false;
        this.deathScreenTimer = 0;
        this.floatingTexts = [];
        this.footprints = [];
        this.walkTimer = 0;
        this.stepSide = 0;
        this.shopScrollWeapons = 0;
        this.shopScrollEquip = 0;
        this.shopSelectedWeapon = null;
        this.shopSelectedEquip = null;
        this.shopMsg = '';
        this.minimapRadius = 112;
        this.minimapX = 0;
        this.minimapY = 0;
        this.sightButtons = [];

        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundMouseDown = this.onMouseDown.bind(this);
        this.boundMouseUp = this.onMouseUp.bind(this);
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        this.boundWheel = this.onWheel.bind(this);
        this.boundContextMenu = (e) => e.preventDefault();
        this.boundResize = () => this.resize();
    }

    start(settings) {
        this.dayNight = 'day';
        this.resize();
        window.addEventListener('resize', this.boundResize);

        this.enemyLimit = parseInt(settings.enemyLimit) || 50;
        this.player = new Player(this.map.width / 2, this.map.height / 2);
        this.camera = new Camera(this.canvas);
        this.camera.follow(this.player);
        this.projectiles = [];
        this.muzzleFlashes = [];
        this.impactEffects = [];
        this.casings = [];
        this.keys = {};
        this.enemies = [];
        this.coins = [];
        this.spawnTimer = 0;
        this.heavySpawnTimer = 0;
        this.isPlayerDead = false;
        this.deathScreenTimer = 0;
        this.floatingTexts = [];
        this.footprints = [];
        this.walkTimer = 0;
        this.stepSide = 0;

        // Колбэки для выброса гильз
        this.map.onReloadEject = (player) => {
            const weapon = player.currentWeapon;
            if (!weapon || weapon.type !== 'weapon') return;
            const data = Weapons[weapon.id];
            const forwardX = Math.cos(player.angle);
            const forwardY = Math.sin(player.angle);
            const rightX = Math.cos(player.angle + Math.PI/2);
            const rightY = Math.sin(player.angle + Math.PI/2);
            const gunLength = weapon.id === 'revolver' ? 13 : 10;
            const ejectX = player.x + forwardX * 6 + rightX * 6 + forwardX * (-2);
            const ejectY = player.y + forwardY * 6 + rightY * 6 + forwardY * (-2);
            const count = data.reloadEjectCount || (weapon.id === 'revolver' ? 8 : 0);
            const isSawedOff = weapon.id === 'sawedOff';
            for (let i = 0; i < count; i++) {
                this.casings.push({
                    x: ejectX + (Math.random() - 0.5) * 5,
                    y: ejectY + (Math.random() - 0.5) * 5,
                    vx: (Math.random() - 0.5) * 30,
                    vy: (Math.random() - 0.5) * 30,
                    angle: player.angle + (Math.random() - 0.5) * 0.5,
                    life: isSawedOff ? 0.7 : 0.5,
                    maxLife: isSawedOff ? 0.7 : 0.5,
                    isSawedOff: isSawedOff
                });
            }
        };

        this.map.onPumpEject = (player) => {
            const forwardX = Math.cos(player.angle);
            const forwardY = Math.sin(player.angle);
            const rightX = Math.cos(player.angle + Math.PI/2);
            const rightY = Math.sin(player.angle + Math.PI/2);
            const ejectX = player.x + forwardX * 6 + rightX * 6 + forwardX * 7 + rightX * 8;
            const ejectY = player.y + forwardY * 6 + rightY * 6 + forwardY * 7 + rightY * 8;
            this.casings.push({
                x: ejectX + (Math.random() - 0.5) * 4,
                y: ejectY + (Math.random() - 0.5) * 4,
                vx: Math.cos(player.angle + Math.PI/2) * (40 + Math.random() * 30),
                vy: Math.sin(player.angle + Math.PI/2) * (40 + Math.random() * 30),
                angle: player.angle,
                life: 0.5,
                maxLife: 0.5,
                isSawedOff: true
            });
        };

        this.map.onBoltEject = (player) => {
            const weapon = player.currentWeapon;
            if (!weapon || (weapon.id !== 'vector' && weapon.id !== 'mp5')) return;
            const forwardX = Math.cos(player.angle);
            const forwardY = Math.sin(player.angle);
            const rightX = Math.cos(player.angle + Math.PI / 2);
            const rightY = Math.sin(player.angle + Math.PI / 2);

            const gunLength = weapon.id === 'vector' ? 20 : 16;
            const thickLength = gunLength * 0.7;
            const mainWidth = weapon.id === 'mp5' ? 4 : 4;
            const boltOffsetRight = mainWidth / 2 + 1;

            const boltBaseX = player.x + forwardX * 6 + rightX * 6 + forwardX * (thickLength * 0.5 - 3);
            const boltBaseY = player.y + forwardY * 6 + rightY * 6 + forwardY * (thickLength * 0.5 - 3);

            const ejectX = boltBaseX + rightX * boltOffsetRight;
            const ejectY = boltBaseY + rightY * boltOffsetRight;

            this.casings.push({
                x: ejectX + (Math.random() - 0.5) * 4,
                y: ejectY + (Math.random() - 0.5) * 4,
                vx: Math.cos(player.angle + Math.PI / 2) * (60 + Math.random() * 40),
                vy: Math.sin(player.angle + Math.PI / 2) * (60 + Math.random() * 40),
                angle: player.angle + (Math.random() - 0.5) * 0.3,
                life: 0.35,
                maxLife: 0.35,
                isSawedOff: false
            });
        };

        this.map.onUziBoltEject = (player) => {
            const forwardX = Math.cos(player.angle);
            const forwardY = Math.sin(player.angle);
            const rightX = Math.cos(player.angle + Math.PI / 2);
            const rightY = Math.sin(player.angle + Math.PI / 2);

            const gunLength = 16;
            const bodyLength = 12;
            const mainWidth = 4;
            const boltOffsetRight = mainWidth / 2 + 1;

            const boltBaseX = player.x + forwardX * 0 + rightX * 6 + forwardX * (bodyLength * 0.5 - 3);
            const boltBaseY = player.y + forwardY * 0 + rightY * 6 + forwardY * (bodyLength * 0.5 - 3);

            const ejectX = boltBaseX + rightX * boltOffsetRight;
            const ejectY = boltBaseY + rightY * boltOffsetRight;

            this.casings.push({
                x: ejectX + (Math.random() - 0.5) * 4,
                y: ejectY + (Math.random() - 0.5) * 4,
                vx: Math.cos(player.angle + Math.PI / 2) * (60 + Math.random() * 40),
                vy: Math.sin(player.angle + Math.PI / 2) * (60 + Math.random() * 40),
                angle: player.angle + (Math.random() - 0.5) * 0.3,
                life: 0.35,
                maxLife: 0.35,
                isSawedOff: false
            });
        };

        this.map.onSaigaBoltEject = (player) => {
            const forwardX = Math.cos(player.angle);
            const forwardY = Math.sin(player.angle);
            const rightX = Math.cos(player.angle + Math.PI / 2);
            const rightY = Math.sin(player.angle + Math.PI / 2);

            const gunLength = 20;
            const thickLength = gunLength * 1;
            const mainWidth = 3.5;
            const boltOffsetRight = mainWidth / 2 + 1;

            const boltBaseX = player.x + forwardX * 6 + rightX * 6 + forwardX * (thickLength * 0.5 - 3);
            const boltBaseY = player.y + forwardY * 6 + rightY * 6 + forwardY * (thickLength * 0.5 - 3);

            const ejectX = boltBaseX + rightX * boltOffsetRight;
            const ejectY = boltBaseY + rightY * boltOffsetRight;

            this.casings.push({
                x: ejectX + (Math.random() - 0.5) * 4,
                y: ejectY + (Math.random() - 0.5) * 4,
                vx: Math.cos(player.angle + Math.PI / 2) * (40 + Math.random() * 30),
                vy: Math.sin(player.angle + Math.PI / 2) * (40 + Math.random() * 30),
                angle: player.angle + (Math.random() - 0.5) * 0.3,
                life: 0.35,
                maxLife: 0.35,
                isSawedOff: true
            });
        };

        if (Admin) this.camera.zoom = 0.75;

        document.getElementById('menu-screen').classList.remove('active');
        document.getElementById('settings-screen').classList.remove('active');
        document.getElementById('game-screen').style.display = 'block';

        this.controlsOverlay.classList.remove('hidden');
        if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
        this.overlayTimeout = setTimeout(() => {
            this.controlsOverlay.classList.add('hidden');
        }, 5000);

        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
        this.canvas.addEventListener('mousemove', this.boundMouseMove);
        this.canvas.addEventListener('mousedown', this.boundMouseDown);
        this.canvas.addEventListener('mouseup', this.boundMouseUp);
        this.canvas.addEventListener('wheel', this.boundWheel);
        this.canvas.addEventListener('contextmenu', this.boundContextMenu);

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    stop() {
        this.isRunning = false;
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
        this.canvas.removeEventListener('mousedown', this.boundMouseDown);
        this.canvas.removeEventListener('mouseup', this.boundMouseUp);
        this.canvas.removeEventListener('wheel', this.boundWheel);
        this.canvas.removeEventListener('contextmenu', this.boundContextMenu);
        window.removeEventListener('resize', this.boundResize);
        document.getElementById('game-screen').style.display = 'none';
        if (this.overlayTimeout) clearTimeout(this.overlayTimeout);
        this.controlsOverlay.classList.add('hidden');
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.minimapX = this.canvas.width - this.minimapRadius - 20;
        this.minimapY = this.minimapRadius + 20;
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        let dt = (currentTime - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        this.lastTime = currentTime;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseCanvasX = (this.mouseX - rect.left) * scaleX;
        const mouseCanvasY = (this.mouseY - rect.top) * scaleY;
        this.worldMouseX = (mouseCanvasX - this.canvas.width / 2) / this.camera.zoom + this.camera.x;
        this.worldMouseY = (mouseCanvasY - this.canvas.height / 2) / this.camera.zoom + this.camera.y;

        this.update(dt);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(dt) {
        if (this.player.isDead && !this.isPlayerDead) {
            this.isPlayerDead = true;
            this.deathScreenTimer = 0;
        }

        if (this.isPlayerDead) {
            this.deathScreenTimer += dt;
            return;
        }

        if (!this.isShopOpen && !this.isInventoryOpen) {
            this.player.update(dt, this.keys, this.worldMouseX, this.worldMouseY, this.map);
            this.map.updateClouds(dt);

            // Проверка столкновения игрока с грузовиком
            if (this.map.checkTruckCollision(this.player.x, this.player.y, this.player.radius)) {
                this.player.takeDamage(9999); // мгновенная смерть
            }

            // Следы
            if (this.player.speed > 0 && !this.player.isDead) {
                this.walkTimer += dt;
                if (this.walkTimer >= 0.3) {
                    this.walkTimer -= 0.3;
                    const forwardX = Math.cos(this.player.angle);
                    const forwardY = Math.sin(this.player.angle);
                    const rightX = Math.cos(this.player.angle + Math.PI / 2);
                    const rightY = Math.sin(this.player.angle + Math.PI / 2);

                    const offset = this.stepSide === 0 ? 4 : -4;
                    const fpX = this.player.x + rightX * offset;
                    const fpY = this.player.y + rightY * offset;

                    this.footprints.push({
                        x: fpX,
                        y: fpY,
                        life: 4,
                        maxLife: 4
                    });

                    this.stepSide = 1 - this.stepSide;
                }
            } else {
                this.walkTimer = 0;
                this.stepSide = 0;
            }

            // Автоматическая стрельба
            if (this.player.mouseDown) {
                const wData = this.player.weaponData;
                if (wData && wData.automatic) {
                    const result = this.player.shoot();
                    if (result) {
                        for (const proj of result.projectiles) this.projectiles.push(proj);
                        this.muzzleFlashes.push({
                            x: result.muzzleX, y: result.muzzleY,
                            radius: 3, alpha: 0.8, life: 0.08
                        });
                        if (!result.isRevolver) {
                            this.casings.push({
                                x: result.casingX,
                                y: result.casingY,
                                vx: Math.cos(result.casingAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.3) * (70 + Math.random() * 40),
                                vy: Math.sin(result.casingAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.3) * (70 + Math.random() * 40),
                                angle: result.casingAngle,
                                life: 0.35,
                                maxLife: 0.35,
                                isSawedOff: false
                            });
                        }
                    }
                }
            }

            // Спавн обычных зомби
            if (this.enemies.length < this.enemyLimit) {
                this.spawnTimer += dt;
                if (this.spawnTimer >= this.spawnInterval) {
                    this.spawnTimer = 0;
                    const count = 3 + Math.floor(Math.random() * 6);
                    for (let i = 0; i < count && this.enemies.length < this.enemyLimit; i++) {
                        this.spawnEnemy();
                    }
                }
            }

            // Спавн тяжёлых зомби
            this.heavySpawnTimer += dt;
            if (this.heavySpawnTimer >= this.heavySpawnInterval) {
                this.heavySpawnTimer = 0;
                const count = 2 + Math.floor(Math.random() * 3); // 2–4
                for (let i = 0; i < count && this.enemies.length < this.enemyLimit; i++) {
                    this.spawnEnemy(true); // true = тяжёлый
                }
            }

            // Обновление врагов
            for (const enemy of this.enemies) {
                enemy.update(dt, this.player, this.map, this.enemies);
            }

            // Проверка столкновения врагов с грузовиком
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.map.checkTruckCollision(this.enemies[i].x, this.enemies[i].y, this.enemies[i].radius)) {
                    this.enemies[i].takeDamage(9999);
                }
            }

            // Коллизии пуль с врагами
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                if (!p.active) { this.projectiles.splice(i, 1); continue; }
                let hit = false;
                for (const enemy of this.enemies) {
                    if (!enemy.alive) continue;
                    if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < enemy.radius) {
                        const killed = enemy.takeDamage(p.damage);
                        p.active = false;
                        for (let j = 0; j < 5; j++) {
                            const ang = Math.random() * Math.PI * 2;
                            this.impactEffects.push({
                                x: p.x, y: p.y,
                                vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 60,
                                life: 0.2, maxLife: 0.2, color: '#ff0000'
                            });
                        }
                        if (killed) {
                            const coinCount = 1 + Math.floor(Math.random() * 3);
                            for (let c = 0; c < coinCount; c++) {
                                this.coins.push({
                                    x: enemy.x + (Math.random() - 0.5) * 30,
                                    y: enemy.y + (Math.random() - 0.5) * 30,
                                    life: 15
                                });
                            }
                        }
                        hit = true;
                        break;
                    }
                }
                if (!hit) {
                    p.update(dt, this.map, this.impactEffects);
                    if (!p.active) this.projectiles.splice(i, 1);
                } else {
                    this.projectiles.splice(i, 1);
                }
            }

            // Подбор монет
            for (let i = this.coins.length - 1; i >= 0; i--) {
                const coin = this.coins[i];
                if (Math.hypot(this.player.x - coin.x, this.player.y - coin.y) < this.player.radius + 6) {
                    this.player.money += 20;
                    this.floatingTexts.push({ x: coin.x, y: coin.y, text: '+20$', life: 1.0 });
                    this.coins.splice(i, 1);
                }
            }

            // Очистка мёртвых врагов
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.enemies[i].isDead()) this.enemies.splice(i, 1);
            }
        }

        // Обновление эффектов
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            let f = this.muzzleFlashes[i];
            f.life -= dt;
            if (f.life <= 0) this.muzzleFlashes.splice(i, 1);
            else { f.radius += 20 * dt; f.alpha = f.life * 2; }
        }
        for (let i = this.impactEffects.length - 1; i >= 0; i--) {
            let e = this.impactEffects[i];
            e.x += e.vx * dt; e.y += e.vy * dt; e.life -= dt;
            if (e.life <= 0) this.impactEffects.splice(i, 1);
        }
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            let t = this.floatingTexts[i];
            t.life -= dt;
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }
        for (let i = this.casings.length - 1; i >= 0; i--) {
            const c = this.casings[i];
            const speed = Math.hypot(c.vx, c.vy);
            if (speed > 10) {
                const friction = 300;
                const frictionForce = friction * dt;
                c.vx -= (c.vx / speed) * frictionForce;
                c.vy -= (c.vy / speed) * frictionForce;
            } else {
                c.vx = 0;
                c.vy = 0;
            }
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.life -= dt;
            if (c.life <= 0) this.casings.splice(i, 1);
        }
        for (let i = this.footprints.length - 1; i >= 0; i--) {
            this.footprints[i].life -= dt;
            if (this.footprints[i].life <= 0) this.footprints.splice(i, 1);
        }

        this.camera.follow(this.player);

        if (this.player.activeSight && Equipment[this.player.activeSight]) {
            this.camera.zoom = 3 / Equipment[this.player.activeSight].zoom;
        } else {
            this.camera.zoom = 3;
        }
    }

    spawnEnemy(heavy = false) {
        const minDist = 600, maxDist = 900;
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;

        if (x > this.map.innerOffset && x < this.map.width - this.map.innerOffset &&
            y > this.map.innerOffset && y < this.map.height - this.map.innerOffset &&
            !this.map.checkCollisionWithObstacles(x, y, heavy ? 16 : 14)) {
            this.enemies.push(new Enemy(x, y, heavy));
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.camera.apply();
        this.map.drawBase(this.ctx, this.camera, this.dayNight);

        // Следы
        for (const fp of this.footprints) {
            const alpha = fp.life / fp.maxLife * 0.25;
            this.ctx.fillStyle = `rgba(60, 60, 60, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(fp.x, fp.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (let p of this.projectiles) p.draw(this.ctx);
        for (const enemy of this.enemies) enemy.draw(this.ctx);
        for (const coin of this.coins) {
            this.ctx.beginPath();
            this.ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffd700'; this.ctx.fill();
            this.ctx.strokeStyle = '#b8860b'; this.ctx.lineWidth = 1; this.ctx.stroke();
        }
        this.player.draw(this.ctx);
        this.drawReloadBar(this.ctx);
        for (let f of this.muzzleFlashes) {
            this.ctx.save(); this.ctx.globalAlpha = f.alpha; this.ctx.fillStyle = '#ffdd88';
            this.ctx.beginPath(); this.ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); this.ctx.fill();
            this.ctx.restore();
        }
        for (let e of this.impactEffects) {
            this.ctx.save(); this.ctx.globalAlpha = e.life / e.maxLife;
            this.ctx.fillStyle = e.color || '#ffcc00';
            this.ctx.beginPath(); this.ctx.arc(e.x, e.y, 2.5, 0, Math.PI*2); this.ctx.fill();
            this.ctx.restore();
        }
        for (let t of this.floatingTexts) {
            this.ctx.fillStyle = `rgba(255,255,255,${t.life})`;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(t.text, t.x, t.y - 10 * (1 - t.life));
        }
        for (const c of this.casings) {
            const alpha = c.life / c.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(c.x, c.y);
            this.ctx.rotate(c.angle);
            if (c.isSawedOff) {
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(-2.5, -0.835, 2.5, 1.67);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(0, -0.835, 2.5, 1.67);
            } else {
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fillRect(-1.5, -0.5, 3, 1);
            }
            this.ctx.restore();
        }

        // Фонари (верхняя часть) — над игроком
        this.map.drawLampPostsTop(this.ctx);

        this.map.drawClouds(this.ctx);
        this.camera.restore();

        if (this.isPlayerDead) {
            this.drawDeathScreen();
        } else if (this.isShopOpen) {
            this.drawShop();
        } else if (this.isInventoryOpen) {
            this.drawInventory();
            this.drawContextMenu();
        } else {
            this.drawUI();
            this.drawSightPanel();
            this.drawMinimap();
            this.drawTime();
            this.drawMoneyUnderMinimap();
        }
    }

    drawReloadBar(ctx) {
        if (!this.player.reloading) return;
        const p = this.player;
        const barWidth = 40, barHeight = 8;
        const x = p.x - barWidth / 2, y = p.y - p.radius - 14;
        const progress = 1 - (p.reloadTimer / p.reloadTime);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        let color;
        if (progress < 0.5) {
            const t = progress / 0.5;
            color = `rgb(255,${Math.floor(255 * t)},0)`;
        } else {
            const t = (progress - 0.5) / 0.5;
            color = `rgb(${Math.floor(255 * (1 - t))},255,0)`;
        }
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth * progress, barHeight);
        ctx.fillStyle = 'white'; ctx.font = '8px Arial'; ctx.textAlign = 'center';
        ctx.fillText('перезарядка...', p.x, y - 3); ctx.textAlign = 'start';
    }

    drawUI() {
        const ctx = this.ctx;
        const scale = 1.3;
        const pad = 20 * scale, barWidth = 200 * scale, barHeight = 20 * scale;
        const barX = pad, barY = this.canvas.height - pad - barHeight;
        const healthPercent = Math.max(0, this.player.health / this.player.maxHealth);
        ctx.fillStyle = '#222'; ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#cc0000'; ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = 'white'; ctx.font = `bold ${Math.round(12 * scale)}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(Math.round(healthPercent * 100) + '%', barX + barWidth / 2, barY + barHeight - 5 * scale);
        ctx.textAlign = 'start';

        const cellRadius = 25 * scale, cellY = barY - cellRadius - 15 * scale, cellSpacing = 70 * scale;
        const cells = [
            { label: 'первичное', x: barX + cellRadius },
            { label: 'вторичное', x: barX + cellRadius + cellSpacing },
            { label: 'экипировка', x: barX + cellRadius + cellSpacing * 2 }
        ];
        cells.forEach(cell => {
            ctx.fillStyle = '#aaa'; ctx.font = `${Math.round(10 * scale)}px Arial`; ctx.textAlign = 'center';
            ctx.fillText(cell.label, cell.x, cellY - cellRadius - 5 * scale);
            ctx.beginPath(); ctx.arc(cell.x, cellY, cellRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
            ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.stroke();
        });
        ctx.fillStyle = '#ddd';
        ctx.fillRect(cells[0].x - 10 * scale, cells[0].y - 2 * scale, 20 * scale, 6 * scale);
        ctx.fillStyle = '#555';
        ctx.fillRect(cells[0].x + 5 * scale, cells[0].y - 1 * scale, 10 * scale, 5 * scale);

        const weapon = this.player.currentWeapon;
        if (weapon && weapon.type === 'weapon') {
            const ammoText = weapon.ammo + ' / ' + Weapons[weapon.id].magazine;
            ctx.fillStyle = 'white'; ctx.font = `bold ${Math.round(14 * scale)}px Arial`; ctx.textAlign = 'left';
            ctx.fillText(ammoText, cells[2].x + cellRadius + 10 * scale, cellY + 5 * scale); ctx.textAlign = 'start';
        }
        if (this.map.isPlayerNearDroppedItem(this.player.x, this.player.y)) {
            this.drawPopup('Нажмите Пробел для подбора');
        } else if (!this.isShopOpen && this.map.isPlayerNearTruck(this.player.x, this.player.y)) {
            this.drawPopup('Нажмите Пробел для магазина');
        }
    }

    drawPopup(text) {
        const ctx = this.ctx;
        const popupWidth = 200, popupHeight = 30;
        const popupX = this.canvas.width / 2 - popupWidth / 2, popupY = this.canvas.height / 2 - 60;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(text, popupX + popupWidth / 2, popupY + 20); ctx.textAlign = 'start';
    }

    drawSightPanel() {
        const ctx = this.ctx;
        const sights = this.player.inventory.filter(item => item.type === 'equipment' && Equipment[item.id] && Equipment[item.id].zoom);
        if (sights.length === 0) return;
        const selectedId = this.player.activeSight;
        const totalWidth = sights.length * 80; // увеличено в 1.5 раза
        const xStart = this.canvas.width / 2 - totalWidth / 2, y = 70;
        this.sightButtons = [];
        sights.forEach((item, i) => {
            const eq = Equipment[item.id], isSelected = (item.id === selectedId);
            const radius = isSelected ? 33 : 27; // увеличены в 1.5 раза
            const cx = xStart + i * 80 + 40;
            ctx.beginPath(); ctx.arc(cx, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isSelected ? 'rgba(80, 80, 80, 0.6)' : 'rgba(40, 40, 40, 0.4)';
            ctx.fill(); ctx.strokeStyle = '#666'; ctx.lineWidth = isSelected ? 2 : 1; ctx.stroke();
            ctx.fillStyle = '#ddd'; ctx.font = `${isSelected ? 'bold ' : ''}${Math.round(13 * 1.5)}px Arial`; // шрифт увеличен
            ctx.textAlign = 'center';
            ctx.fillText(eq.zoom + 'x', cx, y + 6);
            ctx.textAlign = 'start';
            this.sightButtons.push({ id: item.id, x: cx - radius, y: y - radius, w: radius * 2, h: radius * 2 });
        });
    }

    drawShop() {
        const ctx = this.ctx;
        const w = this.canvas.width, h = this.canvas.height;
        const shopW = 700, shopH = 500, shopX = w / 2 - shopW / 2, shopY = h / 2 - shopH / 2;
        ctx.fillStyle = 'rgba(20, 20, 30, 0.9)'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(shopX, shopY, shopW, shopH, 20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('МАГАЗИН', w / 2, shopY + 35); ctx.textAlign = 'start';
        if (this.shopMsg) {
            ctx.fillStyle = '#ffcc00'; ctx.font = '14px Arial';
            ctx.fillText(this.shopMsg, shopX + 20, shopY + 55);
            if (!this.shopMsgTimeout) { this.shopMsgTimeout = setTimeout(() => { this.shopMsg = ''; this.shopMsgTimeout = null; }, 2000); }
        }
        const leftX = shopX + 20, leftY = shopY + 70, leftW = 300, leftH = shopH - 140;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(leftX, leftY, leftW, leftH);
        ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.strokeRect(leftX, leftY, leftW, leftH);
        ctx.fillStyle = '#ccc'; ctx.font = 'bold 16px Arial'; ctx.fillText('Оружие', leftX + 10, leftY - 10);
        ctx.save(); ctx.beginPath(); ctx.rect(leftX, leftY, leftW, leftH); ctx.clip();
        const weapons = Object.entries(Weapons).filter(([id]) => id !== 'pistol');
        const itemH = 25, visibleCount = Math.floor(leftH / itemH), maxScrollWeapons = Math.max(0, weapons.length - visibleCount);
        this.shopScrollWeapons = Math.max(0, Math.min(this.shopScrollWeapons, maxScrollWeapons));
        for (let i = 0; i < weapons.length; i++) {
            const [id, wp] = weapons[i];
            const yPos = leftY + 5 + i * itemH - this.shopScrollWeapons * itemH;
            if (yPos + itemH < leftY || yPos > leftY + leftH) continue;
            if (this.shopSelectedWeapon === id) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'; ctx.fillRect(leftX, yPos - 2, leftW, itemH);
            }
            ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(leftX + 10, yPos + itemH / 2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#eee'; ctx.font = '13px Arial';
            ctx.fillText(`${wp.name}  - $${wp.price}`, leftX + 25, yPos + itemH / 2 + 5);
        }
        ctx.restore();
        const rightX = shopX + 340, rightY = shopY + 70, rightW = 340, rightTopH = 200;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(rightX, rightY, rightW, rightTopH);
        ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.strokeRect(rightX, rightY, rightW, rightTopH);
        ctx.fillStyle = '#ccc'; ctx.font = 'bold 16px Arial'; ctx.fillText('Экипировка', rightX + 10, rightY - 10);
        ctx.save(); ctx.beginPath(); ctx.rect(rightX, rightY, rightW, rightTopH); ctx.clip();
        // Включаем все предметы экипировки, включая прицелы
        const equips = Object.entries(Equipment);
        const equipItemH = 25, visibleEquip = Math.floor(rightTopH / equipItemH), maxScrollEquip = Math.max(0, equips.length - visibleEquip);
        this.shopScrollEquip = Math.max(0, Math.min(this.shopScrollEquip, maxScrollEquip));
        for (let i = 0; i < equips.length; i++) {
            const [id, eq] = equips[i];
            const yPos = rightY + 5 + i * equipItemH - this.shopScrollEquip * equipItemH;
            if (yPos + equipItemH < rightY || yPos > rightY + rightTopH) continue;
            if (this.shopSelectedEquip === id) {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.3)'; ctx.fillRect(rightX, yPos - 2, rightW, equipItemH);
            }
            ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(rightX + 10, yPos + equipItemH / 2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#eee'; ctx.font = '13px Arial';
            ctx.fillText(`${eq.name}  - $${eq.price}`, rightX + 25, yPos + equipItemH / 2 + 5);
        }
        ctx.restore();
        const invY = rightY + rightTopH + 20, invH = shopY + shopH - invY - 60;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(rightX, invY, rightW, invH);
        ctx.strokeStyle = '#aa8c00'; ctx.lineWidth = 2; ctx.strokeRect(rightX, invY, rightW, invH);
        ctx.fillStyle = '#ddd'; ctx.font = 'bold 16px Arial';
        ctx.fillText('Инвентарь', rightX + 10, invY - 5);
        ctx.fillText('$' + this.player.money, rightX + rightW - 60, invY - 5);
        ctx.save(); ctx.beginPath(); ctx.rect(rightX, invY, rightW, invH); ctx.clip();
        let invYPos = invY + 5;
        for (let i = 0; i < this.player.inventory.length; i++) {
            const item = this.player.inventory[i];
            let name = '';
            if (item.type === 'weapon') name = Weapons[item.id].name + ' (' + item.ammo + ')';
            else name = Equipment[item.id].name;
            ctx.fillStyle = '#eee'; ctx.font = '12px Arial';
            ctx.fillText(`${i}: ${name}`, rightX + 15, invYPos + 15);
            invYPos += 22;
        }
        ctx.restore();
        const btnY = shopY + shopH - 50;
        ctx.fillStyle = '#2a7fff';
        ctx.fillRect(shopX + 200, btnY, 120, 35); ctx.fillRect(shopX + 380, btnY, 120, 35);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Купить', shopX + 260, btnY + 23);
        ctx.fillText('Назад', shopX + 440, btnY + 23); ctx.textAlign = 'start';
        this.shopButtons = [
            { x: shopX + 200, y: btnY, w: 120, h: 35, action: 'buy' },
            { x: shopX + 380, y: btnY, w: 120, h: 35, action: 'back' }
        ];
        this.shopRegions = {
            weapons: { x: leftX, y: leftY, w: leftW, h: leftH, itemH, firstIndex: this.shopScrollWeapons, total: weapons.length },
            equip: { x: rightX, y: rightY, w: rightW, h: rightTopH, itemH: equipItemH, firstIndex: this.shopScrollEquip, total: equips.length }
        };
    }

    drawInventory() {
        const ctx = this.ctx;
        const w = this.canvas.width, h = this.canvas.height;
        const boxW = 500, boxH = 400, x = w / 2 - boxW / 2, y = h / 2 - boxH / 2;
        ctx.fillStyle = 'rgba(20,20,30,0.9)'; ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 15); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Инвентарь', w / 2, y + 30); ctx.textAlign = 'start';
        const slotSize = 60, startX = x + 40, startY = y + 60, gap = 15;
        const slotPositions = [
            { idx: 0, row: 0, col: 0, label: 'Оружие 1' },
            { idx: 1, row: 0, col: 1, label: 'Оружие 2' },
            { idx: 2, row: 0, col: 2, label: 'Броня' },
            { idx: 3, row: 1, col: 0, label: 'Шлем' },
            { idx: 4, row: 1, col: 1, label: 'Доп.' },
        ];
        for (const sp of slotPositions) {
            const sx = startX + sp.col * (slotSize + gap), sy = startY + sp.row * (slotSize + gap);
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
            ctx.fillRect(sx, sy, slotSize, slotSize); ctx.strokeRect(sx, sy, slotSize, slotSize);
            ctx.fillStyle = '#aaa'; ctx.font = '10px Arial'; ctx.fillText(sp.label, sx + 5, sy + 12);
            const item = this.player.slots[sp.idx];
            if (item) {
                ctx.fillStyle = '#fff'; ctx.font = '11px Arial';
                let name = item.type === 'weapon' ? Weapons[item.id].name : Equipment[item.id].name;
                ctx.fillText(name.substring(0, 9), sx + 5, sy + 30);
            }
        }
        const invX = x + 40 + 3 * (slotSize + gap) + 20, invY = y + 60;
        const invW = boxW - (invX - x) - 20, invH = boxH - 120;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(invX, invY, invW, invH);
        ctx.strokeStyle = '#777'; ctx.strokeRect(invX, invY, invW, invH);
        ctx.fillStyle = '#ccc'; ctx.font = 'bold 14px Arial'; ctx.fillText('Сумка', invX + 10, invY - 5);
        ctx.save(); ctx.beginPath(); ctx.rect(invX, invY, invW, invH); ctx.clip();
        let itemY = invY + 5;
        for (let i = 0; i < this.player.inventory.length; i++) {
            const item = this.player.inventory[i];
            let name = '';
            if (item.type === 'weapon') name = Weapons[item.id].name + ' (' + item.ammo + ')';
            else name = Equipment[item.id].name;
            if (i === this.selectedItemIndex) {
                ctx.fillStyle = 'rgba(100,150,255,0.4)'; ctx.fillRect(invX, itemY - 2, invW, 20);
            }
            ctx.fillStyle = '#eee'; ctx.font = '12px Arial';
            ctx.fillText(name, invX + 15, itemY + 14);
            itemY += 22;
        }
        ctx.restore();
        ctx.fillStyle = '#aaa'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Клик по предмету для меню', w / 2, y + boxH - 15); ctx.textAlign = 'start';
        this.invRegions = { slots: [], items: [], slotStartX: startX, slotStartY: startY, slotSize, gap, invX, invY, itemH: 22, invW };
        for (const sp of slotPositions) {
            const sx = startX + sp.col * (slotSize + gap), sy = startY + sp.row * (slotSize + gap);
            this.invRegions.slots.push({ x: sx, y: sy, w: slotSize, h: slotSize, idx: sp.idx });
        }
        for (let i = 0; i < this.player.inventory.length; i++) {
            this.invRegions.items.push({ x: invX, y: invY + 5 + i * 22, w: invW, h: 20, idx: i });
        }
    }

    drawContextMenu() {
        if (!this.contextMenu) return;
        const ctx = this.ctx, menu = this.contextMenu;
        const items = [
            { label: 'Экипировать', action: 'equip', enabled: true },
            { label: 'Выбросить', action: 'drop', enabled: true },
            { label: 'Продать', action: 'sell', enabled: this.isShopOpen }
        ];
        const menuW = 120, menuH = items.length * 25 + 10, x = menu.x, y = menu.y;
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
        ctx.fillRect(x, y, menuW, menuH); ctx.strokeRect(x, y, menuW, menuH);
        items.forEach((it, i) => {
            const iy = y + 5 + i * 25;
            ctx.fillStyle = it.enabled ? '#fff' : '#555'; ctx.font = '14px Arial';
            ctx.fillText(it.label, x + 10, iy + 18);
        });
        this.contextMenuItems = items.map((it, i) => ({ ...it, x, y: y + 5 + i * 25, w: menuW, h: 25 }));
    }

    drawMinimap() {
        const ctx = this.ctx, radius = this.minimapRadius, cx = this.minimapX, cy = this.minimapY;
        let viewSize, scale;
        if (Admin) { viewSize = Math.max(this.map.width, this.map.height); scale = radius / (viewSize / 2); }
        else { viewSize = 1200; scale = radius / (viewSize / 2); }
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fill();
        ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.stroke();
        const numStuds = 24;
        for (let i = 0; i < numStuds; i++) {
            const angle = (i / numStuds) * Math.PI * 2;
            const sx = cx + Math.cos(angle) * (radius - 4), sy = cy + Math.sin(angle) * (radius - 4);
            ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#bbb'; ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
        const centerWorldX = Admin ? this.map.width / 2 : this.player.x;
        const centerWorldY = Admin ? this.map.height / 2 : this.player.y;
        const toMapX = (worldX) => cx + (worldX - centerWorldX) * scale;
        const toMapY = (worldY) => cy + (worldY - centerWorldY) * scale;
        ctx.fillStyle = '#3a6b35'; ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.fillStyle = '#444';
        const roadStart = this.map.mountainWidth, roadEnd = this.map.width - this.map.mountainWidth;
        const roadInner = this.map.innerOffset, roadW = this.map.roadWidth;
        ctx.fillRect(toMapX(roadStart), toMapY(roadInner), roadW * scale, (this.map.height - 2 * roadInner) * scale);
        ctx.fillRect(toMapX(roadEnd - roadW), toMapY(roadInner), roadW * scale, (this.map.height - 2 * roadInner) * scale);
        ctx.fillRect(toMapX(roadInner), toMapY(roadStart), (roadEnd - roadInner) * scale, roadW * scale);
        ctx.fillRect(toMapX(roadInner), toMapY(this.map.height - roadStart - roadW), (roadEnd - roadInner) * scale, roadW * scale);
        ctx.fillStyle = '#666'; const mw = this.map.mountainWidth;
        ctx.fillRect(toMapX(0), toMapY(0), this.map.width * scale, mw * scale);
        ctx.fillRect(toMapX(0), toMapY(this.map.height - mw), this.map.width * scale, mw * scale);
        ctx.fillRect(toMapX(0), toMapY(0), mw * scale, this.map.height * scale);
        ctx.fillRect(toMapX(this.map.width - mw), toMapY(0), mw * scale, this.map.height * scale);
        ctx.fillStyle = '#2d5a1e';
        for (let tree of this.map.trees) {
            const tx = toMapX(tree.x), ty = toMapY(tree.y), tr = tree.radius * scale * 0.7;
            if (tr > 0.8) { ctx.beginPath(); ctx.arc(tx, ty, Math.max(tr, 1.2), 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.fillStyle = '#ffdd88';
        for (let post of this.map.lampPosts) {
            const px = toMapX(post.x), py = toMapY(post.y);
            ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            const ex = toMapX(enemy.x), ey = toMapY(enemy.y);
            ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2); ctx.fill();
        }
        const playerX = toMapX(this.player.x), playerY = toMapY(this.player.y);
        ctx.beginPath(); ctx.moveTo(playerX, playerY);
        ctx.lineTo(playerX + Math.cos(this.player.angle) * 8, playerY + Math.sin(this.player.angle) * 8);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(playerX, playerY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#0f0'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#aaa'; ctx.lineWidth = 3; ctx.stroke();
    }

    drawTime() {
        const ctx = this.ctx, text = '14:00 | День';
        ctx.font = 'bold 18px "Segoe UI", Arial';
        ctx.fillStyle = 'white'; ctx.strokeStyle = 'black'; ctx.lineWidth = 3;
        const x = 20, y = 40;
        ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
    }

    drawMoneyUnderMinimap() {
        const ctx = this.ctx;
        ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText('$' + this.player.money, this.minimapX, this.minimapY + this.minimapRadius + 25);
        ctx.textAlign = 'start';
    }

    drawDeathScreen() {
        const alpha = Math.min(this.deathScreenTimer / 2, 1);
        this.ctx.fillStyle = `rgba(139,0,0,${alpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const textAlpha = Math.min(this.deathScreenTimer / 1.5, 1);
        this.ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
        this.ctx.font = 'bold 48px Arial'; this.ctx.textAlign = 'center';
        this.ctx.fillText('Вы погибли!', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('Счёт: ' + this.player.money, this.canvas.width / 2, this.canvas.height / 2 + 30);

        if (this.deathScreenTimer > 2) {
            const btnY = this.canvas.height / 2 + 70, btnW = 200, btnH = 40;
            const menuBtnX = this.canvas.width / 2 - btnW - 20;
            this.ctx.fillStyle = '#2a7fff'; this.ctx.fillRect(menuBtnX, btnY, btnW, btnH);
            this.ctx.fillStyle = '#fff'; this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText('В главное меню', menuBtnX + btnW / 2, btnY + btnH / 2 + 5);
            const retryBtnX = this.canvas.width / 2 + 20;
            this.ctx.fillStyle = '#2a7fff'; this.ctx.fillRect(retryBtnX, btnY, btnW, btnH);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Попробовать снова', retryBtnX + btnW / 2, btnY + btnH / 2 + 5);
            this.deathButtons = [
                { x: menuBtnX, y: btnY, w: btnW, h: btnH, action: 'menu' },
                { x: retryBtnX, y: btnY, w: btnW, h: btnH, action: 'retry' }
            ];
        } else {
            this.deathButtons = [];
        }
        this.ctx.textAlign = 'start';
    }

    onMouseMove(e) { this.mouseX = e.clientX; this.mouseY = e.clientY; }

    onMouseDown(e) {
        if (this.isPlayerDead && this.deathButtons) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            for (const btn of this.deathButtons) {
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    if (btn.action === 'menu') { this.stop(); if (this.menuCallback) this.menuCallback(); }
                    else if (btn.action === 'retry') { this.start({ enemyLimit: this.enemyLimit.toString() }); }
                    return;
                }
            }
            return;
        }

        if (!this.isShopOpen && !this.isInventoryOpen && !this.isPlayerDead && this.sightButtons) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            for (const btn of this.sightButtons) {
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    const equip = Equipment[btn.id];
                    if (equip && equip.zoom) { this.player.activeSight = btn.id; return; }
                }
            }
        }

        if (this.isInventoryOpen) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            if (this.contextMenu && this.contextMenuItems) {
                for (const item of this.contextMenuItems) {
                    if (mx >= item.x && mx <= item.x + item.w && my >= item.y && my <= item.y + item.h) {
                        if (!item.enabled) return;
                        const invIndex = this.contextMenu.invIndex;
                        if (item.action === 'equip') {
                            const invItem = this.player.inventory[invIndex];
                            let targetSlot = -1;
                            if (invItem.type === 'weapon') targetSlot = this.player.slots[0] ? (this.player.slots[1] ? -1 : 1) : 0;
                            else if (invItem.type === 'equipment') {
                                const eq = Equipment[invItem.id];
                                if (eq.slot === 'body') targetSlot = 2;
                                else if (eq.slot === 'head') targetSlot = 3;
                                else if (eq.slot === 'special') targetSlot = 4;
                            }
                            if (targetSlot !== -1) this.player.equipItem(invIndex, targetSlot);
                        } else if (item.action === 'drop') this.player.dropFromInventory(invIndex, this.map);
                        else if (item.action === 'sell') this.player.sellItem(invIndex);
                        this.contextMenu = null; this.selectedItemIndex = -1; return;
                    }
                }
                this.contextMenu = null; return;
            }
            if (this.invRegions) {
                for (const slot of this.invRegions.slots) {
                    if (mx >= slot.x && mx <= slot.x + slot.w && my >= slot.y && my <= slot.y + slot.h) {
                        if (this.selectedItemIndex !== -1) { this.player.equipItem(this.selectedItemIndex, slot.idx); this.selectedItemIndex = -1; }
                        else if (this.player.slots[slot.idx]) this.player.unequipSlot(slot.idx);
                        return;
                    }
                }
                for (const it of this.invRegions.items) {
                    if (mx >= it.x && mx <= it.x + it.w && my >= it.y && my <= it.y + it.h) {
                        this.contextMenu = { invIndex: it.idx, x: mx, y: my }; return;
                    }
                }
            }
            return;
        }

        if (this.isShopOpen) {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            if (this.shopButtons) {
                for (const btn of this.shopButtons) {
                    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                        if (btn.action === 'back') { this.isShopOpen = false; this.shopSelectedWeapon = null; this.shopSelectedEquip = null; this.shopMsg = ''; return; }
                        else if (btn.action === 'buy') {
                            if (this.shopSelectedWeapon) {
                                if (this.player.buyWeapon(this.shopSelectedWeapon)) { this.shopMsg = 'Куплено: ' + Weapons[this.shopSelectedWeapon].name; this.shopSelectedWeapon = null; }
                                else this.shopMsg = 'Недостаточно денег';
                            } else if (this.shopSelectedEquip) {
                                if (this.player.buyEquipment(this.shopSelectedEquip)) { this.shopMsg = 'Куплено: ' + Equipment[this.shopSelectedEquip].name; this.shopSelectedEquip = null; }
                                else this.shopMsg = 'Недостаточно денег';
                            } else this.shopMsg = 'Сначала выберите предмет';
                            return;
                        }
                    }
                }
            }
            if (this.shopRegions && this.shopRegions.weapons) {
                const reg = this.shopRegions.weapons;
                if (mx >= reg.x && mx <= reg.x + reg.w && my >= reg.y && my <= reg.y + reg.h) {
                    const relY = my - reg.y, index = Math.floor((relY + this.shopScrollWeapons * reg.itemH) / reg.itemH);
                    const weapons = Object.entries(Weapons).filter(([id]) => id !== 'pistol');
                    if (index >= 0 && index < weapons.length) { this.shopSelectedWeapon = weapons[index][0]; this.shopSelectedEquip = null; }
                    return;
                }
            }
            if (this.shopRegions && this.shopRegions.equip) {
                const reg = this.shopRegions.equip;
                if (mx >= reg.x && mx <= reg.x + reg.w && my >= reg.y && my <= reg.y + reg.h) {
                    const relY = my - reg.y, index = Math.floor((relY + this.shopScrollEquip * reg.itemH) / reg.itemH);
                    const equips = Object.entries(Equipment);
                    if (index >= 0 && index < equips.length) { this.shopSelectedEquip = equips[index][0]; this.shopSelectedWeapon = null; }
                    return;
                }
            }
            return;
        }

        if (e.button === 0 && !this.isPlayerDead) {
            e.preventDefault();
            this.player.mouseDown = true;
            const wData = this.player.weaponData;
            if (!wData || !wData.automatic) {
                const result = this.player.shoot();
                if (result) {
                    for (const proj of result.projectiles) this.projectiles.push(proj);
                    this.muzzleFlashes.push({ x: result.muzzleX, y: result.muzzleY, radius: 3, alpha: 0.8, life: 0.08 });
                    if (!result.isRevolver) {
                        this.casings.push({
                            x: result.casingX,
                            y: result.casingY,
                            vx: Math.cos(result.casingAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.3) * (70 + Math.random() * 40),
                            vy: Math.sin(result.casingAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.3) * (70 + Math.random() * 40),
                            angle: result.casingAngle,
                            life: 0.35,
                            maxLife: 0.35,
                            isSawedOff: false
                        });
                    }
                }
            }
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.player.mouseDown = false;
        }
    }

    onWheel(e) {
        if (!this.isShopOpen) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 1 : -1;
        if (this.shopRegions) {
            if (mx >= this.shopRegions.weapons.x && mx <= this.shopRegions.weapons.x + this.shopRegions.weapons.w &&
                my >= this.shopRegions.weapons.y && my <= this.shopRegions.weapons.y + this.shopRegions.weapons.h) {
                this.shopScrollWeapons = Math.max(0, Math.min(this.shopScrollWeapons + delta, Math.max(0, this.shopRegions.weapons.total - Math.floor(this.shopRegions.weapons.h / this.shopRegions.weapons.itemH))));
                e.preventDefault();
            } else if (mx >= this.shopRegions.equip.x && mx <= this.shopRegions.equip.x + this.shopRegions.equip.w &&
                       my >= this.shopRegions.equip.y && my <= this.shopRegions.equip.y + this.shopRegions.equip.h) {
                this.shopScrollEquip = Math.max(0, Math.min(this.shopScrollEquip + delta, Math.max(0, this.shopRegions.equip.total - Math.floor(this.shopRegions.equip.h / this.shopRegions.equip.itemH))));
                e.preventDefault();
            }
        }
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        if (e.code === 'Escape') {
            if (this.isShopOpen) { this.isShopOpen = false; this.shopSelectedWeapon = null; this.shopSelectedEquip = null; this.shopMsg = ''; }
            else if (this.isInventoryOpen) { this.isInventoryOpen = false; this.selectedItemIndex = -1; this.contextMenu = null; }
            else { this.stop(); if (this.menuCallback) this.menuCallback(); }
        }
        if (e.code === 'Digit1') { e.preventDefault(); this.player.switchWeaponSlot(0); }
        if (e.code === 'Digit2') { e.preventDefault(); this.player.switchWeaponSlot(1); }
        if (e.code === 'KeyI') {
            e.preventDefault();
            if (!this.isShopOpen && !this.isPlayerDead) { this.isInventoryOpen = !this.isInventoryOpen; this.selectedItemIndex = -1; this.contextMenu = null; }
        }
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.isShopOpen || this.isInventoryOpen || this.isPlayerDead) return;
            const pickupRange = 40;
            for (let i = this.map.droppedItems.length - 1; i >= 0; i--) {
                const dropped = this.map.droppedItems[i];
                const dist = Math.hypot(this.player.x - dropped.x, this.player.y - dropped.y);
                if (dist < pickupRange) { this.player.pickupItem(dropped.item); this.map.droppedItems.splice(i, 1); return; }
            }
            if (this.map.isPlayerNearTruck(this.player.x, this.player.y)) this.isShopOpen = true;
        }
    }

    onKeyUp(e) { this.keys[e.code] = false; }
};