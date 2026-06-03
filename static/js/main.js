window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas, () => {
        document.getElementById('menu-screen').classList.add('active');
    });
    new Menu(game);
    document.getElementById('menu-screen').classList.add('active');
});