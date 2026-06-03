window.Menu = class Menu {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.playBtn = document.getElementById('play-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.backBtn = document.getElementById('back-from-settings-btn');
        this.waveFrequency = document.getElementById('wave-frequency');
        this.waveDifficulty = document.getElementById('wave-difficulty');
        this.dayNightToggle = document.getElementById('day-night-toggle');
        this.bonusType = document.getElementById('bonus-type');

        this.loadSettings();
        this.initEvents();
    }

    initEvents() {
        this.playBtn.addEventListener('click', () => {
            this.saveSettings();
            this.game.start(this.getSettings());
        });
        this.settingsBtn.addEventListener('click', () => {
            document.getElementById('menu-screen').classList.remove('active');
            document.getElementById('settings-screen').classList.add('active');
        });
        this.backBtn.addEventListener('click', () => {
            this.saveSettings();
            document.getElementById('settings-screen').classList.remove('active');
            document.getElementById('menu-screen').classList.add('active');
        });
    }

    getSettings() {
        return {
            waveFrequency: this.waveFrequency.value,
            waveDifficulty: this.waveDifficulty.value,
            dayNight: this.dayNightToggle.checked,
            bonus: this.bonusType.value
        };
    }

    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.getSettings()));
    }

    loadSettings() {
        let saved = localStorage.getItem('gameSettings');
        if (saved) {
            let settings = JSON.parse(saved);
            if (settings.waveFrequency) this.waveFrequency.value = settings.waveFrequency;
            if (settings.waveDifficulty) this.waveDifficulty.value = settings.waveDifficulty;
            this.dayNightToggle.checked = settings.dayNight || false;
            if (settings.bonus) this.bonusType.value = settings.bonus;
        }
    }

    showMenu() {
        document.getElementById('menu-screen').classList.add('active');
    }
};