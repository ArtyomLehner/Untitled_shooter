window.Weapons = {
    pistol:    { name: 'Пистолет', magazine: 20, automatic: false, damage: 16, range: 0.3, fireRate: 5, pellets: 1, bulletSpeed: 1000, reloadTime: 3, price: 0, weight: 0, spread: 1 },
    revolver:  { name: 'Револьвер', magazine: 8, automatic: false, damage: 45, range: 0.5, fireRate: 2, pellets: 1, bulletSpeed: 1300, reloadTime: 5, price: 1200, weight: 5, spread: 1.02 },
    vector:    { name: 'ПП "Вектор"', magazine: 25, automatic: true, damage: 14, range: 0.35, fireRate: 20, pellets: 1, bulletSpeed: 1000, reloadTime: 2.7, price: 2800, weight: 10, spread: 1.2 },
    mp5:       { name: 'ПП "МП5"', magazine: 30, automatic: true, damage: 16, range: 0.4, fireRate: 12, pellets: 1, bulletSpeed: 1100, reloadTime: 3, price: 3500, weight: 15, spread: 1.07 },
    uzi:       { name: 'Узи', magazine: 30, automatic: true, damage: 12, range: 0.27, fireRate: 25, pellets: 1, bulletSpeed: 950, reloadTime: 2, price: 2800, weight: 10, spread: 1.4 },
    sawedOff:  { name: 'Обрез "Sawed off"', magazine: 2, automatic: false, damage: 18, range: 0.2, fireRate: 2, pellets: 9, bulletSpeed: 1100, reloadTime: 4, price: 2000, weight: 30, spread: 1.6, reloadEjectCount: 2 },
    remington: { name: 'Дробовик "Remington"', magazine: 7, automatic: false, damage: 20, range: 0.25, fireRate: 1, pellets: 7, bulletSpeed: 1150, reloadTime: 7.5, price: 4000, weight: 35, spread: 1.2 },
    saiga:     { name: 'Дробовик "Saiga"', magazine: 15, automatic: true, damage: 15, range: 0.35, fireRate: 2.4, pellets: 8, bulletSpeed: 1000, reloadTime: 3, price: 5500, weight: 35, spread: 1.3 },
    sks:       { name: 'СКС', magazine: 20, automatic: false, damage: 40, range: 0.7, fireRate: 0.9, pellets: 1, bulletSpeed: 1400, reloadTime: 2.9, price: 4500, weight: 25, spread: 1.08 },
    m4a4:      { name: 'М4А4', magazine: 30, automatic: true, damage: 25, range: 0.6, fireRate: 2, pellets: 1, bulletSpeed: 1250, reloadTime: 2.5, price: 6000, weight: 35, spread: 1.09 },
    ak47:      { name: 'АК-47', magazine: 30, automatic: true, damage: 32, range: 0.65, fireRate: 1.8, pellets: 1, bulletSpeed: 1300, reloadTime: 2.5, price: 6500, weight: 30, spread: 1.06 },
    aug:       { name: 'AUG-A3', magazine: 30, automatic: true, damage: 30, range: 0.6, fireRate: 1.5, pellets: 1, bulletSpeed: 1350, reloadTime: 2.7, price: 7000, weight: 30, spread: 1.04 },
    ssg08:     { name: 'SSG-08', magazine: 10, automatic: false, damage: 75, range: 2, fireRate: 0.2, pellets: 1, bulletSpeed: 1500, reloadTime: 3.5, price: 8000, weight: 35, spread: 1.01 },
    l96:       { name: 'L96', magazine: 7, automatic: false, damage: 175, range: 3, fireRate: 0.1, pellets: 1, bulletSpeed: 1750, reloadTime: 4, price: 9000, weight: 50, spread: 1 },
    scar20:    { name: 'SCAR-20', magazine: 20, automatic: true, damage: 60, range: 2.5, fireRate: 0.3, pellets: 1, bulletSpeed: 1350, reloadTime: 3.3, price: 10000, weight: 55, spread: 1.1 },
    fnm249:    { name: 'FN-M249', magazine: 200, automatic: true, damage: 18, range: 1.8, fireRate: 1.5, pellets: 1, bulletSpeed: 1100, reloadTime: 8, price: 15000, weight: 75, spread: 1.12 }
};

window.Equipment = {
    br1:               { name: 'Бронежилет БР-1', price: 500,  defense: 10, weight: 10, slot: 'body' },
    br2:               { name: 'Бронежилет БР-2', price: 1000, defense: 15, weight: 20, slot: 'body' },
    br3:               { name: 'Бронежилет БР-3', price: 1500, defense: 20, weight: 25, slot: 'body' },
    br5:               { name: 'Бронежилет БР-5', price: 2500, defense: 40, weight: 30, slot: 'body' },
    motorcycleHelmet:  { name: 'Мотоциклетный шлем', price: 300,  defense: 5,  weight: 5,  slot: 'head' },
    kevlarHelmet:      { name: 'Кевларовый шлем', price: 800, defense: 10, weight: 10, slot: 'head' },
    tacticalHelmet:    { name: 'Тактический шлем', price: 1200, defense: 25, weight: 15, slot: 'head' },
    smallBackpack:     { name: 'Небольшой рюкзак', price: 400, backpackSlots: 3, weight: 30, slot: 'special' },
    flashlight:        { name: 'Фонарик', price: 200, flashlight: true, weight: 5, slot: 'special' },
    nightVision:       { name: 'Прибор Ночного Видения', price: 1500, nightVision: true, weight: 10, slot: 'special' },

    sight1x05: { name: 'Голографический прицел x1.05', price: 500, zoom: 1.05, weight: 0, slot: null },
    sight1x1:  { name: 'Калиматорный прицел x1.1', price: 700, zoom: 1.1, weight: 0, slot: null },
    sight1x2:  { name: 'Оптический прицел x1.2', price: 1000, zoom: 1.2, weight: 0, slot: null },
    sight1x5:  { name: 'Оптический прицел x1.5', price: 1500, zoom: 1.5, weight: 0, slot: null },
    sight2x:   { name: 'Снайперский прицел x2', price: 3000, zoom: 2.0, weight: 0, slot: null },
    sight3x5:  { name: 'Снайперский прицел x3.5', price: 5000, zoom: 3.5, weight: 0, slot: null }
};