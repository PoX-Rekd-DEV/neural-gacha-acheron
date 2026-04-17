const CONFIG = {
    ITEMS: [
        {n: "Data Blade", w: 1, i: "🔪"}, {n: "Neural Link", w: 1, i: "🧠"}, {n: "Pulse Core", w: 2, i: "🔋"}, 
        {n: "Void Lens", w: 2, i: "👁️"}, {n: "Nano Swarm", w: 2, i: "🐝"}, {n: "Cyber Fin", w: 3, i: "🐬"}, 
        {n: "Logic Gate", w: 3, i: "⛩️"}, {n: "Proxy Shield", w: 3, i: "🛡️"}, {n: "Ghost Drive", w: 4, i: "👻"}, 
        {n: "Signal Jam", w: 4, i: "📡"}, {n: "Bit Crusher", w: 4, i: "🔨"}, {n: "RAM Spike", w: 5, i: "🔱"}
    ],
    BOSSES: [
        {n: "Leech Sentinel", i: "🧛", a: "siphon"}, {n: "Overclock Droid", i: "⚡", a: "haste"},
        {n: "EMP Weaver", i: "🕸️", a: "drain"}, {n: "Plague Crawler", i: "☣", a: "corrode"},
        {n: "Titan Shield", i: "🛡️", a: "armor"}
    ]
};

class NeuralGame {
    constructor() {
        this.state = this.load();
        this.battle = { active: false, processing: false };
        this.init();
    }

    load() {
        const s = localStorage.getItem('acheron_save_vfinal');
        try { return s ? JSON.parse(s) : this.defaultState(); } catch(e) { return this.defaultState(); }
    }

    defaultState() {
        return { gems: 500, sector: 1, hp: 100, mHp: 100, pp: 50, mPp: 50, loadout: [], history: [] };
    }

    save() { localStorage.setItem('acheron_save_vfinal', JSON.stringify(this.state)); }

    log(msg, color = "#888") {
        const logEl = document.getElementById('battle-log');
        const line = document.createElement('div');
        line.style.color = color;
        line.innerText = `> ${msg}`;
        logEl.prepend(line);
        if (logEl.childNodes.length > 6) logEl.lastChild.remove();
    }

    get resonance() {
        const eqIds = this.state.loadout.map(i => i.id);
        return this.state.history.filter(i => !eqIds.includes(i.id)).reduce((a, b) => a + b.pwr, 0);
    }

    get divineHistoryTotal() {
        return this.state.history.filter(i => i.rarity >= 4).reduce((a, b) => a + b.pwr, 0);
    }

    get equippedPower() { return this.state.loadout.reduce((a, b) => a + b.pwr, 0); }

    pull() {
        if (this.state.gems < 50) return this.log("INSUFFICIENT GEMS", "var(--red)");
        this.state.gems -= 50;
        const r = Math.random() * 1000;
        const rarity = r > 990 ? 5 : r > 940 ? 4 : r > 800 ? 3 : r > 500 ? 2 : 1;
        const base = CONFIG.ITEMS[Math.floor(Math.random() * CONFIG.ITEMS.length)];
        const item = { id: Date.now() + Math.random(), name: base.n, i: base.i, rarity: rarity, pwr: base.w * rarity * 30, level: 0 };
        
        this.state.history.push(item);
        this.state.loadout.push(item);
        this.state.loadout.sort((a,b) => b.pwr - a.pwr);
        if(this.state.loadout.length > 3) this.state.loadout.splice(3);

        this.showPopup(`<h1 class="${rarity >= 4 ? 'glitch' : ''}">${item.i}</h1><h2>${item.name}</h2><p>PWR: ${item.pwr}</p>`, true);
        this.save(); this.updateUI();
    }

    enhance(idx) {
        const item = this.state.loadout[idx];
        const cost = Math.floor(100 * Math.pow(1.6, item.level));
        if (this.state.gems < cost) return;
        this.state.gems -= cost;
        item.level++; item.pwr = Math.floor(item.pwr * 1.15);
        this.save(); this.updateUI();
    }

    startBattle() {
        const isMega = this.state.sector % 10 === 0;
        const boss = isMega ? {n: "METATRON", i: "👁️", a: "omega"} : CONFIG.BOSSES[Math.floor(Math.random() * CONFIG.BOSSES.length)];
        const scale = 1 + (this.state.sector * 0.25);
        const hp = Math.floor((200 * scale + (this.equippedPower * 0.6)) * (isMega ? 5 : 1));
        
        this.battle = { active: true, processing: false, type: boss, eHp: hp, eMHp: hp, ePwr: Math.floor(20 * scale) };
        this.log(`ENCOUNTER: ${boss.n}`, "var(--gold)");
        this.updateUI();
    }

    attack(t) {
        if (!this.battle.active || this.battle.processing) return;
        this.battle.processing = true;
        let dmg = 0;

        if (t === 'heavy' && this.state.pp >= 15) { 
            this.state.pp -= 15; dmg = (this.equippedPower + 50) * 1.5; 
            this.log(`HEAVY STRIKE: ${Math.floor(dmg)}`, "var(--text)");
        } else if (t === 'focus') { 
            this.state.pp = Math.min(this.state.mPp, this.state.pp + 25); 
            this.log("RESTORING PP...");
        } else if (t === 'heal') { 
            this.state.hp = Math.min(this.state.mHp, this.state.hp + 40); 
            this.log("REPAIRING SYSTEMS...", "#2ecc71");
        }

        if (this.battle.type.a === 'armor') dmg *= 0.5;
        this.battle.eHp = Math.max(0, this.battle.eHp - dmg);
        this.updateUI();

        if (this.battle.eHp <= 0) setTimeout(() => this.win(), 600);
        else setTimeout(() => this.enemyTurn(), 800);
    }

    enemyTurn() {
        let dmg = this.battle.ePwr;
        const a = this.battle.type.a;

        if (a === 'siphon') this.battle.eHp = Math.min(this.battle.eMHp, this.battle.eHp + dmg);
        if (a === 'drain') this.state.pp = Math.max(0, this.state.pp - 15);
        if (a === 'haste' && Math.random() > 0.7) { dmg *= 2; this.log("CRITICAL HIT!"); }
        if (a === 'omega') { this.state.pp -= 5; this.battle.eHp += 10; }

        this.state.hp -= dmg;
        this.log(`${this.battle.type.n} DEALT ${dmg}`, "var(--red)");
        this.battle.processing = false;

        if (this.state.hp <= 0) {
            document.getElementById('main-body').classList.add('glitch');
            this.showPopup(`<h1 style="color:var(--red)">DELETED</h1><button onclick="location.reload()">REBOOT</button>`);
        }
        this.updateUI();
    }

    win() {
        this.log("SECTOR CLEARED", "var(--gold)");
        this.state.gems += 150 + (this.state.sector * 20);
        this.state.sector++; this.state.hp = this.state.mHp;
        this.battle.active = false; this.save(); this.updateUI();
    }

    updateUI() {
        document.getElementById('gems').innerText = Math.floor(this.state.gems);
        document.getElementById('sector').innerText = this.state.sector;
        document.getElementById('resonance').innerText = this.resonance;
        document.getElementById('divine-pwr').innerText = this.divineHistoryTotal;

        const loadoutUI = document.getElementById('loadout-ui');
        loadoutUI.innerHTML = '';
        for(let i=0; i<3; i++) {
            const item = this.state.loadout[i];
            loadoutUI.innerHTML += `<div class="slot ${item ? 'r-'+item.rarity : ''}">${item ? `<b>${item.i}</b>${item.name}<br>PWR: ${item.pwr}<button class="enhance-btn" onclick="game.enhance(${i})">UP</button>` : 'EMPTY'}</div>`;
        }

        document.getElementById('p-hp').style.width = (this.state.hp/this.state.mHp*100) + "%";
        document.getElementById('p-pp').style.width = (this.state.pp/this.state.mPp*100) + "%";
        document.getElementById('lobby-ui').style.display = this.battle.active ? 'none' : 'grid';
        document.getElementById('battle-ui').style.display = this.battle.active ? 'grid' : 'none';
        document.getElementById('viewport-cont').classList.toggle('active', this.battle.active);

        if (this.battle.active) {
            document.getElementById('e-hp').style.width = (this.battle.eHp/this.battle.eMHp*100) + "%";
            document.getElementById('e-name').innerText = this.battle.type.n;
            document.getElementById('e-img').innerText = this.battle.type.i;
            document.querySelectorAll('#battle-ui button').forEach(b => b.disabled = this.battle.processing);
        }
    }

    toggle(id) {
        const m = document.getElementById(id);
        m.style.display = (getComputedStyle(m).display === 'none') ? 'flex' : 'none';
        if (id === 'codex') {
            document.getElementById('codex-list').innerHTML = this.state.history.map(h => `<div class="slot r-${h.rarity}"><b>${h.i}</b>${h.name}</div>`).join('');
        }
    }

    showPopup(html, btn) {
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('overlay-content').innerHTML = html + (btn ? '<br><button onclick="document.getElementById(\'overlay\').style.display=\'none\'">OK</button>' : '');
    }

    wipeRequest() { this.showPopup(`<h2>RESET?</h2><button onclick="localStorage.clear();location.reload()">WIPE DATA</button><button onclick="document.getElementById('overlay').style.display='none'">CANCEL</button>`); }
    init() { this.updateUI(); }
}

const game = new NeuralGame();

