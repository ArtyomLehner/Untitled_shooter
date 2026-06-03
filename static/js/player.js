window.Player = class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.baseSpeed = 175;
        this.angle = 0;
        this.color = '#00aaff';
        this.shootCooldown = 0;
        this.recoilOffset = 0;
        this.recoilRecovery = 0.1;

        this.maxHealth = 200;
        this.health = this.maxHealth;
        this.money = (typeof Admin !== 'undefined' && Admin) ? 100000 : 1000;
        this.isDead = false;

        this.inventory = [];
        this.slots = new Array(5).fill(null);
        const starterPistol = { type: 'weapon', id: 'pistol', ammo: Weapons.pistol.magazine };
        this.slots[0] = starterPistol;
        this.activeWeaponSlot = 0;

        if (typeof Admin !== 'undefined' && Admin) {
            for (const weaponId of Object.keys(Weapons)) {
                if (weaponId === 'pistol') continue;
                this.inventory.push({ type: 'weapon', id: weaponId, ammo: Weapons[weaponId].magazine });
            }
            for (const equipId of Object.keys(Equipment)) {
                this.inventory.push({ type: 'equipment', id: equipId });
            }
        }

        this.reloading = false;
        this.reloadTime = 0;
        this.reloadTimer = 0;
        this.reloadEjectTimer = 0;
        this.reloadEjectDone = false;
        this.nightVisionActive = false;
        this.activeSight = null;
        this.mouseDown = false;
        this.sawedOffShotCount = 0;

        // Помповая анимация для Remington
        this.pumpPhase = 'idle';
        this.pumpTimer = 0;
        this.pumpDuration = 0.25;
        this.pumpOffset = 0;

        // Анимация затвора для Vector/MP5
        this.boltAnim = 0;
        this.boltPhase = 'idle';
        this.boltTimer = 0;
        this.boltDuration = 0.05;

        // Анимация затвора для УЗИ
        this.uziBoltAnim = 0;
        this.uziBoltPhase = 'idle';
        this.uziBoltTimer = 0;
        this.uziBoltDuration = 0.05;

        // Анимация затвора для Saiga
        this.saigaBoltAnim = 0;
        this.saigaBoltPhase = 'idle';
        this.saigaBoltTimer = 0;
        this.saigaBoltDuration = 0.05;
    }

    get currentWeapon() { return this.slots[this.activeWeaponSlot]; }
    get weaponData() {
        const w = this.currentWeapon;
        if (!w || w.type !== 'weapon') return null;
        return Weapons[w.id];
    }

    get speed() {
        if (typeof Admin !== 'undefined' && Admin) return this.baseSpeed;
        let penalty = 0;
        for (const item of this.slots) {
            if (!item) continue;
            if (item.type === 'weapon') penalty += Weapons[item.id].weight;
            else penalty += Equipment[item.id].weight;
        }
        for (const item of this.inventory) {
            if (item.type === 'weapon') penalty += Weapons[item.id].weight;
            else penalty += Equipment[item.id].weight;
        }
        return Math.max(10, this.baseSpeed - penalty);
    }

    get defensePercent() {
        let def = 0;
        for (let i = 2; i <= 3; i++) {
            const item = this.slots[i];
            if (item && item.type === 'equipment') {
                const eq = Equipment[item.id];
                if (eq.defense) def += eq.defense;
            }
        }
        return Math.min(90, def);
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.isDead = true;
            this.reloading = false;
        }
    }

    startReload() {
        if (this.reloading || this.isDead) return;
        const weapon = this.currentWeapon;
        if (!weapon || weapon.type !== 'weapon') return;
        const data = Weapons[weapon.id];
        if (weapon.ammo >= data.magazine) return;
        this.reloading = true;
        this.reloadTime = data.reloadTime;
        this.reloadTimer = this.reloadTime;
        if (weapon.id === 'revolver') {
            this.reloadEjectTimer = 0.5;
            this.reloadEjectDone = false;
        }
        if (weapon.id === 'sawedOff') {
            this.reloadEjectTimer = 0.85;
            this.reloadEjectDone = false;
        }
    }

    update(dt, keys, mouseWorldX, mouseWorldY, map) {
        if (this.isDead) return;

        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + dt * 1);
        }

        // Обновление помповой анимации (Remington)
        if (this.pumpPhase !== 'idle') {
            this.pumpTimer -= dt;
            if (this.pumpTimer <= 0) {
                this.pumpTimer = 0;
                if (this.pumpPhase === 'backward') {
                    const weapon = this.currentWeapon;
                    if (weapon && weapon.id === 'remington' && map.onPumpEject) {
                        map.onPumpEject(this);
                    }
                    this.pumpPhase = 'forward';
                    this.pumpTimer = this.pumpDuration;
                } else if (this.pumpPhase === 'forward') {
                    this.pumpPhase = 'idle';
                    this.pumpOffset = 0;
                }
            }
        }

        if (this.pumpPhase === 'backward') {
            const progress = 1 - (this.pumpTimer / this.pumpDuration);
            this.pumpOffset = 7 * progress;
        } else if (this.pumpPhase === 'forward') {
            const progress = 1 - (this.pumpTimer / this.pumpDuration);
            this.pumpOffset = 7 * (1 - progress);
        }

        // Обновление анимации затвора Vector/MP5
        if (this.boltPhase !== 'idle') {
            this.boltTimer -= dt;
            if (this.boltTimer <= 0) {
                this.boltTimer = 0;
                if (this.boltPhase === 'backward') {
                    const weapon = this.currentWeapon;
                    if (weapon && (weapon.id === 'vector' || weapon.id === 'mp5') && map.onBoltEject) {
                        map.onBoltEject(this);
                    }
                    this.boltPhase = 'forward';
                    this.boltTimer = this.boltDuration;
                } else if (this.boltPhase === 'forward') {
                    this.boltPhase = 'idle';
                    this.boltAnim = 0;
                }
            }
        }

        if (this.boltPhase === 'backward') {
            const progress = 1 - (this.boltTimer / this.boltDuration);
            this.boltAnim = 6 * progress;
        } else if (this.boltPhase === 'forward') {
            const progress = 1 - (this.boltTimer / this.boltDuration);
            this.boltAnim = 6 * (1 - progress);
        }

        // Обновление анимации затвора УЗИ
        if (this.uziBoltPhase !== 'idle') {
            this.uziBoltTimer -= dt;
            if (this.uziBoltTimer <= 0) {
                this.uziBoltTimer = 0;
                if (this.uziBoltPhase === 'backward') {
                    const weapon = this.currentWeapon;
                    if (weapon && weapon.id === 'uzi' && map.onUziBoltEject) {
                        map.onUziBoltEject(this);
                    }
                    this.uziBoltPhase = 'forward';
                    this.uziBoltTimer = this.uziBoltDuration;
                } else if (this.uziBoltPhase === 'forward') {
                    this.uziBoltPhase = 'idle';
                    this.uziBoltAnim = 0;
                }
            }
        }

        if (this.uziBoltPhase === 'backward') {
            const progress = 1 - (this.uziBoltTimer / this.uziBoltDuration);
            this.uziBoltAnim = 6 * progress;
        } else if (this.uziBoltPhase === 'forward') {
            const progress = 1 - (this.uziBoltTimer / this.uziBoltDuration);
            this.uziBoltAnim = 6 * (1 - progress);
        }

        // Обновление анимации затвора Saiga
        if (this.saigaBoltPhase !== 'idle') {
            this.saigaBoltTimer -= dt;
            if (this.saigaBoltTimer <= 0) {
                this.saigaBoltTimer = 0;
                if (this.saigaBoltPhase === 'backward') {
                    const weapon = this.currentWeapon;
                    if (weapon && weapon.id === 'saiga' && map.onSaigaBoltEject) {
                        map.onSaigaBoltEject(this);
                    }
                    this.saigaBoltPhase = 'forward';
                    this.saigaBoltTimer = this.saigaBoltDuration;
                } else if (this.saigaBoltPhase === 'forward') {
                    this.saigaBoltPhase = 'idle';
                    this.saigaBoltAnim = 0;
                }
            }
        }

        if (this.saigaBoltPhase === 'backward') {
            const progress = 1 - (this.saigaBoltTimer / this.saigaBoltDuration);
            this.saigaBoltAnim = 6 * progress;
        } else if (this.saigaBoltPhase === 'forward') {
            const progress = 1 - (this.saigaBoltTimer / this.saigaBoltDuration);
            this.saigaBoltAnim = 6 * (1 - progress);
        }

        if (this.reloading) {
            this.reloadTimer -= dt;
            if (!this.reloadEjectDone && this.reloadEjectTimer > 0) {
                this.reloadEjectTimer -= dt;
                if (this.reloadEjectTimer <= 0) {
                    this.reloadEjectTimer = 0;
                    this.reloadEjectDone = true;
                    if (map.onReloadEject) {
                        map.onReloadEject(this);
                    }
                }
            }
            if (this.reloadTimer <= 0) {
                this.reloadTimer = 0;
                this.reloading = false;
                const weapon = this.currentWeapon;
                if (weapon && weapon.type === 'weapon') {
                    weapon.ammo = Weapons[weapon.id].magazine;
                }
                if (weapon && weapon.id === 'sawedOff') {
                    this.sawedOffShotCount = 0;
                }
            }
        } else {
            const weapon = this.currentWeapon;
            if (weapon && weapon.type === 'weapon' && weapon.ammo === 0) {
                this.startReload();
            }
        }

        let dx = 0, dy = 0;
        if (keys['KeyW']) dy -= 1;
        if (keys['KeyS']) dy += 1;
        if (keys['KeyA']) dx -= 1;
        if (keys['KeyD']) dx += 1;
        if (dx !== 0 || dy !== 0) {
            let len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
        }

        let newX = this.x + dx * this.speed * dt;
        let newY = this.y + dy * this.speed * dt;

        if (!map.checkCollisionWithObstacles(newX, this.y, this.radius)) this.x = newX;
        if (!map.checkCollisionWithObstacles(this.x, newY, this.radius)) this.y = newY;

        this.angle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
        if (this.shootCooldown > 0) this.shootCooldown -= dt;

        if (this.recoilOffset > 0) {
            this.recoilOffset -= this.recoilRecovery * dt * 60;
            if (this.recoilOffset < 0) this.recoilOffset = 0;
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0055aa';
        ctx.lineWidth = 2;
        ctx.stroke();

        const forwardX = Math.cos(this.angle);
        const forwardY = Math.sin(this.angle);
        const rightX = Math.cos(this.angle + Math.PI/2);
        const rightY = Math.sin(this.angle + Math.PI/2);

        let gunForwardOffset = 6;
        let gunRightOffset = 6;
        const weapon = this.currentWeapon;
        if (weapon && weapon.id === 'uzi') {
            gunForwardOffset = 0;
            gunRightOffset = 6;
        } else if (weapon && (weapon.id === 'sawedOff' || weapon.id === 'remington')) {
            gunForwardOffset = 12;
            gunRightOffset = 6;
        }

        let gunLength = 10;
        if (weapon && weapon.type === 'weapon') {
            if (weapon.id === 'pistol') gunLength = 7;
            else if (weapon.id === 'revolver') gunLength = 12;
            else if (weapon.id === 'vector') gunLength = 20;
            else if (weapon.id === 'mp5') gunLength = 16;
            else if (weapon.id === 'uzi') gunLength = 16;
            else if (weapon.id === 'sawedOff') gunLength = 10;
            else if (weapon.id === 'remington') gunLength = 20;
            else if (weapon.id === 'saiga') gunLength = 20;
        }

        const gunBaseX = forwardX * gunForwardOffset + rightX * gunRightOffset;
        const gunBaseY = forwardY * gunForwardOffset + rightY * gunRightOffset;

        const recoilBackX = -forwardX * this.recoilOffset;
        const recoilBackY = -forwardY * this.recoilOffset;

        const gunStartX = gunBaseX + recoilBackX;
        const gunStartY = gunBaseY + recoilBackY;
        const gunEndX = gunStartX + forwardX * gunLength;
        const gunEndY = gunStartY + forwardY * gunLength;

        let rightHandX = gunStartX;
        let rightHandY = gunStartY;
        if (weapon && weapon.id === 'uzi') {
            rightHandX = gunStartX + forwardX * 6;
            rightHandY = gunStartY + forwardY * 6;
        }

        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(rightHandX, rightHandY, 4.5, 0, Math.PI * 2);
        ctx.fill();

        const isOneHanded = weapon && weapon.id === 'uzi';
        if (!isOneHanded) {
            let leftHandOffsetRight = -3;
            let leftHandOffsetForward = 0;
            const isRifle = weapon && !['pistol', 'revolver', 'uzi'].includes(weapon.id);
            if (isRifle) {
                leftHandOffsetRight = -2;
                leftHandOffsetForward = 9;
            }
            if (weapon && weapon.id === 'remington') {
                leftHandOffsetRight = -1;
                leftHandOffsetForward = 12;
            }
            const recoilCompensation = 0;
            let leftHandX = rightHandX + rightX * leftHandOffsetRight + forwardX * leftHandOffsetForward + recoilBackX * recoilCompensation;
            let leftHandY = rightHandY + rightY * leftHandOffsetRight + forwardY * leftHandOffsetForward + recoilBackY * recoilCompensation;

            if (weapon && weapon.id === 'remington' && this.pumpOffset > 0) {
                leftHandX -= forwardX * this.pumpOffset;
                leftHandY -= forwardY * this.pumpOffset;
            }

            ctx.fillStyle = '#f5cba7';
            ctx.beginPath();
            ctx.arc(leftHandX, leftHandY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Remington
        if (weapon && weapon.id === 'remington') {
            const bodyLength = 7;
            const stockLength = 5;

            const partBaseX = bodyLength + 2.5;
            const partX = partBaseX - this.pumpOffset;
            ctx.save();
            ctx.translate(gunStartX, gunStartY);
            ctx.rotate(this.angle);
            const partY = -0.25;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(partX, partY - 1.5, 8, 3.5);
            ctx.restore();

            const stockStartX = gunStartX;
            const stockStartY = gunStartY;
            const stockEndX = gunStartX - forwardX * stockLength;
            const stockEndY = gunStartY - forwardY * stockLength;
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(stockStartX, stockStartY);
            ctx.lineTo(stockEndX, stockEndY);
            ctx.stroke();
            ctx.lineCap = 'butt';

            const thickEndX = gunStartX + forwardX * bodyLength;
            const thickEndY = gunStartY + forwardY * bodyLength;
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(gunStartX, gunStartY);
            ctx.lineTo(thickEndX, thickEndY);
            ctx.stroke();
            ctx.lineCap = 'butt';

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(thickEndX, thickEndY);
            ctx.lineTo(gunEndX, gunEndY);
            ctx.stroke();
        }

        // Sawed Off
        if (weapon && weapon.id === 'sawedOff') {
            const barrelLength = gunLength;
            const bodyLength = 4;
            const stockLength = 6;
            const bodyWidth = 5;

            const stockStartX = gunStartX;
            const stockStartY = gunStartY;
            const stockEndX = gunStartX - forwardX * stockLength;
            const stockEndY = gunStartY - forwardY * stockLength;
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(stockStartX, stockStartY);
            ctx.lineTo(stockEndX, stockEndY);
            ctx.stroke();
            ctx.lineCap = 'butt';

            const bodyCenterX = gunStartX;
            const bodyCenterY = gunStartY;
            ctx.fillStyle = '#666';
            ctx.save();
            ctx.translate(bodyCenterX, bodyCenterY);
            ctx.rotate(this.angle);
            ctx.fillRect(-bodyLength/2, -bodyWidth/2, bodyLength, bodyWidth);
            ctx.restore();

            const barrelOffset = 1;
            const leftBarrelStartX = gunStartX + forwardX * (bodyLength/2) + rightX * barrelOffset;
            const leftBarrelStartY = gunStartY + forwardY * (bodyLength/2) + rightY * barrelOffset;
            const rightBarrelStartX = gunStartX + forwardX * (bodyLength/2) - rightX * barrelOffset;
            const rightBarrelStartY = gunStartY + forwardY * (bodyLength/2) - rightY * barrelOffset;

            const barrelWidth = 2.5;
            const leftGrad = ctx.createLinearGradient(leftBarrelStartX, leftBarrelStartY,
                leftBarrelStartX + forwardX * barrelLength, leftBarrelStartY + forwardY * barrelLength);
            leftGrad.addColorStop(0, '#888');
            leftGrad.addColorStop(1, '#444');
            ctx.strokeStyle = leftGrad;
            ctx.lineWidth = barrelWidth;
            ctx.beginPath();
            ctx.moveTo(leftBarrelStartX, leftBarrelStartY);
            ctx.lineTo(leftBarrelStartX + forwardX * barrelLength, leftBarrelStartY + forwardY * barrelLength);
            ctx.stroke();

            const rightGrad = ctx.createLinearGradient(rightBarrelStartX, rightBarrelStartY,
                rightBarrelStartX + forwardX * barrelLength, rightBarrelStartY + forwardY * barrelLength);
            rightGrad.addColorStop(0, '#888');
            rightGrad.addColorStop(1, '#444');
            ctx.strokeStyle = rightGrad;
            ctx.beginPath();
            ctx.moveTo(rightBarrelStartX, rightBarrelStartY);
            ctx.lineTo(rightBarrelStartX + forwardX * barrelLength, rightBarrelStartY + forwardY * barrelLength);
            ctx.stroke();
        }

        // Револьвер
        if (weapon && weapon.type === 'weapon' && weapon.id === 'revolver') {
            const pistolOffset = 1;

            const gripLength = 4;
            const gripWidth = 3;
            const gripForwardOffset = 3;
            const gripX = gunStartX + forwardX * pistolOffset - forwardX * 2 + forwardX * gripForwardOffset;
            const gripY = gunStartY + forwardY * pistolOffset - forwardY * 2 + forwardY * gripForwardOffset;
            ctx.fillStyle = '#8B4513';
            ctx.save();
            ctx.translate(gripX, gripY);
            ctx.rotate(this.angle);
            ctx.beginPath();
            const radius = 1.5;
            ctx.moveTo(-gripLength + radius, -gripWidth/2);
            ctx.lineTo(gripLength - radius, -gripWidth/2);
            ctx.arcTo(gripLength, -gripWidth/2, gripLength, gripWidth/2, radius);
            ctx.lineTo(gripLength, gripWidth/2 - radius);
            ctx.arcTo(gripLength, gripWidth/2, -gripLength, gripWidth/2, radius);
            ctx.lineTo(-gripLength + radius, gripWidth/2);
            ctx.arcTo(-gripLength, gripWidth/2, -gripLength, -gripWidth/2, radius);
            ctx.lineTo(-gripLength, -gripWidth/2 + radius);
            ctx.arcTo(-gripLength, -gripWidth/2, gripLength, -gripWidth/2, radius);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            const drumWidth = 4;
            const drumLength = 5;
            const drumX = gunStartX + forwardX * (gunLength * 0.5) + forwardX * pistolOffset - forwardX * (drumLength / 2);
            const drumY = gunStartY + forwardY * (gunLength * 0.5) + forwardY * pistolOffset - forwardY * (drumLength / 2);
            ctx.fillStyle = '#444';
            ctx.save();
            ctx.translate(drumX, drumY);
            ctx.rotate(this.angle);
            ctx.fillRect(-drumLength/2, -drumWidth/2, drumLength, drumWidth);
            ctx.restore();

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(gunStartX + forwardX * pistolOffset, gunStartY + forwardY * pistolOffset);
            ctx.lineTo(gunEndX, gunEndY);
            ctx.stroke();
            ctx.lineCap = 'butt';

            const barrelLength = 2;
            const barrelStartX = gunEndX;
            const barrelStartY = gunEndY;
            const barrelEndX = barrelStartX + forwardX * barrelLength;
            const barrelEndY = barrelStartY + forwardY * barrelLength;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(barrelStartX, barrelStartY);
            ctx.lineTo(barrelEndX, barrelEndY);
            ctx.stroke();
        }

        // Пистолет
        if (weapon && weapon.id === 'pistol') {
            const pistolOffset = -3;

            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gunStartX + forwardX * pistolOffset, gunStartY + forwardY * pistolOffset);
            ctx.lineTo(gunEndX, gunEndY);
            ctx.stroke();

            const barrelLength = 2;
            const barrelStartX = gunEndX;
            const barrelStartY = gunEndY;
            const barrelEndX = barrelStartX + forwardX * barrelLength;
            const barrelEndY = barrelStartY + forwardY * barrelLength;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(barrelStartX, barrelStartY);
            ctx.lineTo(barrelEndX, barrelEndY);
            ctx.stroke();
        }

        // УЗИ
        if (weapon && weapon.id === 'uzi') {
            const bodyWidth = 6;
            const bodyLength = 12;
            const mainWidth = 4;

            // Затвор (рисуем ПЕРВЫМ)
            {
                const boltWidth = 4;
                const boltLength = 1;
                const boltBaseX = gunStartX + forwardX * (bodyLength * 0.5 + 2);
                const boltBaseY = gunStartY + forwardY * (bodyLength * 0.5 + 2);
                const boltOffsetRight = mainWidth / 2 + 1;
                const boltX = boltBaseX + rightX * boltOffsetRight - forwardX * this.uziBoltAnim;
                const boltY = boltBaseY + rightY * boltOffsetRight - forwardY * this.uziBoltAnim;
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(boltX, boltY);
                ctx.lineTo(boltX - forwardX * boltLength, boltY - forwardY * boltLength);
                ctx.stroke();
            }

            // Корпус
            const bodyStartX = gunStartX;
            const bodyStartY = gunStartY;
            const bodyEndX = gunStartX + forwardX * bodyLength;
            const bodyEndY = gunStartY + forwardY * bodyLength;
            ctx.fillStyle = '#888';
            ctx.save();
            ctx.translate(bodyStartX, bodyStartY);
            ctx.rotate(this.angle);
            ctx.fillRect(0, -bodyWidth/2, bodyLength, bodyWidth);
            ctx.restore();

            // Статичная тёмная линия по центру корпуса (с отступами)
            const railMargin = 2.5;
            ctx.fillStyle = '#333';
            ctx.save();
            ctx.translate(bodyStartX, bodyStartY);
            ctx.rotate(this.angle);
            ctx.fillRect(railMargin, -0.5, bodyLength - railMargin * 2, 1);
            ctx.restore();

            // Дуло
            const barrelLength = 3;
            const barrelStartX = bodyEndX;
            const barrelStartY = bodyEndY;
            const barrelEndX = barrelStartX + forwardX * barrelLength;
            const barrelEndY = barrelStartY + forwardY * barrelLength;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(barrelStartX, barrelStartY);
            ctx.lineTo(barrelEndX, barrelEndY);
            ctx.stroke();

            // Дуга (мушка) – движется по центру корпуса синхронно с затвором
            const arcRadius = 4;
            const arcCenterX = bodyStartX + forwardX * (bodyLength / 2) - forwardX * this.uziBoltAnim;
            const arcCenterY = bodyStartY + forwardY * (bodyLength / 2) - forwardY * this.uziBoltAnim;
            const arcStartAngle = this.angle - 0.5;
            const arcEndAngle = this.angle + 0.5;
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(arcCenterX, arcCenterY, arcRadius, arcStartAngle, arcEndAngle, false);
            ctx.stroke();
        }

        // Вектор / MP5
        if (weapon && (weapon.id === 'vector' || weapon.id === 'mp5')) {
            const thickLength = gunLength * 0.7;
            const thickEndX = gunStartX + forwardX * thickLength;
            const thickEndY = gunStartY + forwardY * thickLength;

            const mainColor = weapon.id === 'mp5' ? '#444' : '#111';
            const mainWidth = weapon.id === 'mp5' ? 4 : 4;

            // Затвор (рисуем ПЕРВЫМ)
            if (weapon.id === 'vector' || weapon.id === 'mp5') {
                const boltWidth = 4;
                const boltLength = 1;
                const boltBaseX = gunStartX + forwardX * (thickLength * 0.5 + 2);
                const boltBaseY = gunStartY + forwardY * (thickLength * 0.5 + 2);
                const boltOffsetRight = mainWidth / 2 + 1;
                const boltX = boltBaseX + rightX * boltOffsetRight - forwardX * this.boltAnim;
                const boltY = boltBaseY + rightY * boltOffsetRight - forwardY * this.boltAnim;
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(boltX, boltY);
                ctx.lineTo(boltX - forwardX * boltLength, boltY - forwardY * boltLength);
                ctx.stroke();
            }

            // Тонкое дуло
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(thickEndX, thickEndY);
            ctx.lineTo(gunEndX, gunEndY);
            ctx.stroke();

            // Основная часть (скруглённая)
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = mainWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(gunStartX, gunStartY);
            ctx.lineTo(thickEndX, thickEndY);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Квадратный приклад для Vector
            if (weapon.id === 'vector') {
                const stockLength = 5;
                ctx.fillStyle = '#111';
                ctx.save();
                ctx.translate(gunStartX, gunStartY);
                ctx.rotate(this.angle);
                ctx.fillRect(-stockLength, -1.5, stockLength, 3);
                ctx.restore();
            }

            // Квадратный приклад для MP5
            if (weapon.id === 'mp5') {
                const stockLength = 5;
                const stockWidth = 2;
                const stockStartX = gunStartX;
                const stockStartY = gunStartY;
                ctx.fillStyle = '#333';
                ctx.save();
                ctx.translate(stockStartX, stockStartY);
                ctx.rotate(this.angle);
                ctx.fillRect(-stockLength, -stockWidth/2, stockLength, stockWidth);
                ctx.restore();
            }

            // Мушка
            const arcRadius = 3;
            const arcCenterX = gunStartX + forwardX * (thickLength / 2);
            const arcCenterY = gunStartY + forwardY * (thickLength / 2);
            const arcStartAngle = this.angle - 0.6;
            const arcEndAngle = this.angle + 0.6;
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(arcCenterX, arcCenterY, arcRadius, arcStartAngle, arcEndAngle, false);
            ctx.stroke();
        }

        // Saiga
        if (weapon && weapon.id === 'saiga') {
            const thickLength = gunLength * 1;
            const thickEndX = gunStartX + forwardX * thickLength;
            const thickEndY = gunStartY + forwardY * thickLength;

            const mainWidth = 3.5;

            // Затвор (рисуем ПЕРВЫМ)
            {
                const boltWidth = 4;
                const boltLength = 1;
                const boltBaseX = gunStartX + forwardX * (thickLength * 0.5 + 2);
                const boltBaseY = gunStartY + forwardY * (thickLength * 0.5 + 2);
                const boltOffsetRight = mainWidth / 2 + 1;
                const boltX = boltBaseX + rightX * boltOffsetRight - forwardX * this.saigaBoltAnim;
                const boltY = boltBaseY + rightY * boltOffsetRight - forwardY * this.saigaBoltAnim;
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(boltX, boltY);
                ctx.lineTo(boltX - forwardX * boltLength, boltY - forwardY * boltLength);
                ctx.stroke();
            }

            // Основная часть (чёрная, скруглённая)
            ctx.strokeStyle = '#111';
            ctx.lineWidth = mainWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(gunStartX, gunStartY);
            ctx.lineTo(thickEndX, thickEndY);
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Дуло
            const barrelLength = 3;
            const barrelStartX = thickEndX;
            const barrelStartY = thickEndY;
            const barrelEndX = barrelStartX + forwardX * barrelLength;
            const barrelEndY = barrelStartY + forwardY * barrelLength;
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(barrelStartX, barrelStartY);
            ctx.lineTo(barrelEndX, barrelEndY);
            ctx.stroke();

            // Приклад (квадратный, тоньше)
            {
                const stockLength = 5;
                const stockWidth = 2;
                ctx.fillStyle = '#111';
                ctx.save();
                ctx.translate(gunStartX, gunStartY);
                ctx.rotate(this.angle);
                ctx.fillRect(-stockLength, -stockWidth / 2, stockLength, stockWidth);
                ctx.restore();
            }
        }

        // Остальное оружие
        if (!weapon || (weapon.id !== 'pistol' && weapon.id !== 'revolver' && weapon.id !== 'uzi' &&
            weapon.id !== 'vector' && weapon.id !== 'mp5' && weapon.id !== 'sawedOff' && weapon.id !== 'remington' &&
            weapon.id !== 'saiga')) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gunStartX, gunStartY);
            ctx.lineTo(gunEndX, gunEndY);
            ctx.stroke();
        }

        ctx.restore();
    }

    canShoot() {
        if (this.reloading || this.isDead) return false;
        if (this.pumpPhase !== 'idle') return false;
        const w = this.currentWeapon;
        if (!w || w.type !== 'weapon') return false;
        return w.ammo > 0 && this.shootCooldown <= 0;
    }

    shoot() {
        if (!this.canShoot()) return null;
        const wData = this.weaponData;
        this.shootCooldown = 1 / wData.fireRate;
        this.recoilOffset = 3;
        this.currentWeapon.ammo -= 1;

        const forwardX = Math.cos(this.angle), forwardY = Math.sin(this.angle);
        const rightX = Math.cos(this.angle + Math.PI/2), rightY = Math.sin(this.angle + Math.PI/2);

        let gunLength = 10;
        if (this.currentWeapon && this.currentWeapon.id === 'pistol') gunLength = 7;
        else if (this.currentWeapon && this.currentWeapon.id === 'revolver') gunLength = 12;
        else if (this.currentWeapon && this.currentWeapon.id === 'vector') gunLength = 20;
        else if (this.currentWeapon && this.currentWeapon.id === 'mp5') gunLength = 16;
        else if (this.currentWeapon && this.currentWeapon.id === 'uzi') gunLength = 16;
        else if (this.currentWeapon && this.currentWeapon.id === 'sawedOff') gunLength = 10;
        else if (this.currentWeapon && this.currentWeapon.id === 'remington') gunLength = 20;
        else if (this.currentWeapon && this.currentWeapon.id === 'saiga') gunLength = 20;

        let muzzleX, muzzleY;
        if (this.currentWeapon && this.currentWeapon.id === 'uzi') {
            const startX = this.x + forwardX * 0 + rightX * 6;
            const startY = this.y + forwardY * 0 + rightY * 6;
            muzzleX = startX + forwardX * gunLength - forwardX * this.recoilOffset;
            muzzleY = startY + forwardY * gunLength - forwardY * this.recoilOffset;
        } else if (this.currentWeapon && (this.currentWeapon.id === 'sawedOff' || this.currentWeapon.id === 'remington')) {
            const bodyLength = this.currentWeapon.id === 'sawedOff' ? 4 : 7;
            const baseX = this.x + forwardX * 12 + rightX * 6 + forwardX * bodyLength;
            const baseY = this.y + forwardY * 12 + rightY * 6 + forwardY * bodyLength;
            muzzleX = baseX + forwardX * (gunLength - bodyLength) - forwardX * this.recoilOffset;
            muzzleY = baseY + forwardY * (gunLength - bodyLength) - forwardY * this.recoilOffset;
        } else {
            muzzleX = this.x + forwardX * 6 + rightX * 6 + forwardX * gunLength - forwardX * this.recoilOffset;
            muzzleY = this.y + forwardY * 6 + rightY * 6 + forwardY * gunLength - forwardY * this.recoilOffset;
        }

        const projectiles = [];
        for (let i = 0; i < wData.pellets; i++) {
            let angle = this.angle;
            if (wData.pellets > 1) angle += (Math.random() - 0.5) * 0.3;
            angle += (Math.random() - 0.5) * (wData.spread - 1) * 0.5;
            projectiles.push(new Projectile(muzzleX, muzzleY, angle, wData.bulletSpeed, wData.range, wData.damage));
        }

        if (this.currentWeapon && this.currentWeapon.id === 'remington') {
            this.pumpPhase = 'backward';
            this.pumpTimer = this.pumpDuration;
            this.pumpOffset = 0;
        }

        if (this.currentWeapon && (this.currentWeapon.id === 'vector' || this.currentWeapon.id === 'mp5')) {
            this.boltPhase = 'backward';
            this.boltTimer = this.boltDuration;
            this.boltAnim = 0;
        }

        if (this.currentWeapon && this.currentWeapon.id === 'uzi') {
            this.uziBoltPhase = 'backward';
            this.uziBoltTimer = this.uziBoltDuration;
            this.uziBoltAnim = 0;
        }

        if (this.currentWeapon && this.currentWeapon.id === 'saiga') {
            this.saigaBoltPhase = 'backward';
            this.saigaBoltTimer = this.saigaBoltDuration;
            this.saigaBoltAnim = 0;
        }

        let gunStartX, gunStartY;
        if (this.currentWeapon && this.currentWeapon.id === 'uzi') {
            gunStartX = this.x + forwardX * 0 + rightX * 6;
            gunStartY = this.y + forwardY * 0 + rightY * 6;
        } else {
            gunStartX = this.x + forwardX * 6 + rightX * 6;
            gunStartY = this.y + forwardY * 6 + rightY * 6;
        }
        const casingX = gunStartX + forwardX * 1.5 + rightX * 4;
        const casingY = gunStartY + forwardY * 1.5 + rightY * 4;
        const casingAngle = this.angle;

        const noCasing = this.currentWeapon && (this.currentWeapon.id === 'revolver' || this.currentWeapon.id === 'sawedOff' || this.currentWeapon.id === 'remington' || this.currentWeapon.id === 'vector' || this.currentWeapon.id === 'mp5' || this.currentWeapon.id === 'uzi' || this.currentWeapon.id === 'saiga');

        return { projectiles, muzzleX, muzzleY, casingX, casingY, casingAngle, isRevolver: noCasing };
    }

    switchWeaponSlot(slotIndex) {
        if (slotIndex === 0 || slotIndex === 1) {
            if (this.slots[slotIndex] && this.slots[slotIndex].type === 'weapon') {
                this.activeWeaponSlot = slotIndex;
                this.reloading = false;
                this.reloadTimer = 0;
            }
        }
    }

    pickupItem(item) { this.inventory.push(item); }
    sellItem(index) {
        if (index < 0 || index >= this.inventory.length) return false;
        const item = this.inventory[index];
        if (item.type === 'weapon' && item.id === 'pistol') return false;
        const price = item.type === 'weapon' ? Weapons[item.id].price : Equipment[item.id].price;
        this.money += Math.floor(price * 0.75);
        this.inventory.splice(index, 1);
        return true;
    }
    buyWeapon(weaponId) {
        if (this.money < Weapons[weaponId].price) return false;
        this.money -= Weapons[weaponId].price;
        this.inventory.push({ type: 'weapon', id: weaponId, ammo: Weapons[weaponId].magazine });
        return true;
    }
    buyEquipment(equipId) {
        if (this.money < Equipment[equipId].price) return false;
        this.money -= Equipment[equipId].price;
        this.inventory.push({ type: 'equipment', id: equipId });
        return true;
    }
    equipItem(invIndex, slotIdx) {
        if (invIndex < 0 || invIndex >= this.inventory.length) return false;
        if (slotIdx < 0 || slotIdx >= this.slots.length) return false;
        const item = this.inventory[invIndex];
        if (item.type === 'equipment') {
            const eq = Equipment[item.id];
            if (eq.slot && eq.slot !== 'body' && eq.slot !== 'head' && eq.slot !== 'special') return false;
            if (eq.slot === 'body' && slotIdx !== 2) return false;
            if (eq.slot === 'head' && slotIdx !== 3) return false;
            if (eq.slot === 'special' && slotIdx !== 4) return false;
        } else if (item.type === 'weapon') {
            if (slotIdx !== 0 && slotIdx !== 1) return false;
        }
        this.inventory.splice(invIndex, 1);
        if (this.slots[slotIdx]) this.inventory.push(this.slots[slotIdx]);
        this.slots[slotIdx] = item;
        return true;
    }
    unequipSlot(slotIdx) {
        if (slotIdx < 0 || slotIdx >= this.slots.length) return;
        if (!this.slots[slotIdx]) return;
        this.inventory.push(this.slots[slotIdx]);
        this.slots[slotIdx] = null;
    }
    dropFromInventory(invIndex, map) {
        if (invIndex < 0 || invIndex >= this.inventory.length) return false;
        const item = this.inventory[invIndex];
        if (item.type === 'weapon' && item.id === 'pistol') return false;
        map.droppedItems.push({ x: this.x, y: this.y, item: {...item}, type: item.type });
        this.inventory.splice(invIndex, 1);
        return true;
    }
};