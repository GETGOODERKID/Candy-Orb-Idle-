(() => {
  const { els, state } = window.COI;
  const econ = window.COI.econ;
  const ui = window.COI.ui;
  const fx = window.COI.fx;
  const save = window.COI.save;

  // =========================
  // REGISTER MAIN API (CRITICAL FIX)
  // =========================
  window.COI.main = {
    buyBuilding,
    sellBuilding,
    buyUpgrade,
    prestigeReset
  };

  // =========================
  // COMBO UI (lightweight)
  // =========================
  function updateComboUI() {
    const comboText = document.getElementById("comboText");
    const comboBar = document.getElementById("comboBar");

    const c = state.comboChain || 0;

    if (comboText) comboText.textContent = `COMBO x${c}`;

    if (comboBar) {
      comboBar.style.width = Math.min(100, c * 5) + "%";
    }
  }

  // =========================
  // CLICK ORB
  // =========================
  function clickOrb(ev) {
    state.totalClicks++;

    const x = ev?.clientX || innerWidth / 2;
    const y = ev?.clientY || innerHeight / 2;

    const crit = Math.random() < state.critChance;

    let mult = 1;

    if (crit) {
      state.comboChain = (state.comboChain || 0) + 1;
      state.hotStreak++;

      mult = 2 + state.comboChain * 0.1;

      fx?.playCritSound?.();
      fx?.spawnParticle?.("CRIT", x, y, "#ffd");

    } else {
      const broken = state.comboChain || 0;

      if (broken >= 3) {
        state.candyOrbs += broken * 10;
      }

      state.comboChain = 0;
    }

    const gain = state.clickPower * state.clickMult * mult;

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

    updateComboUI();
    ui.updateHUD();
  }

  // =========================
  // BUILDINGS
  // =========================
  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;

    const cost = econ.getBuildingTotalCost(b, 1);

    if (state.candyOrbs < cost) return;

    state.candyOrbs -= cost;
    b.count++;

    ui.msg(`Bought ${b.name}`);
    ui.updateHUD();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count <= 0) return;

    b.count--;
    state.candyOrbs += Math.floor(b.baseCost * 0.5);

    ui.msg(`Sold ${b.name}`);
    ui.updateHUD();
  }

  // =========================
  // UPGRADES
  // =========================
  function buyUpgrade(id) {
    const upg = state.upgrades.find(u => u.id === id);
    if (!upg) return;

    if (state.candyOrbs < upg.cost) return;

    state.candyOrbs -= upg.cost;
    state.clickUpgradesBought.add(id);

    upg.effect();

    ui.msg(`Upgrade bought`);
    ui.updateHUD();
  }

  // =========================
  // PRESTIGE
  // =========================
  function prestigeReset() {
    const gain = econ.getPrestigeGain();
    if (gain < 1) return;

    state.prestige += gain;
    state.candyOrbs = 0;
    state.totalEarned = 0;
    state.comboChain = 0;

    save.saveGame();
    location.reload();
  }

  // =========================
  // CLICK EVENTS (ONLY ONCE)
  // =========================
  const orb = document.getElementById("orbImg");
  if (orb) orb.addEventListener("click", clickOrb);

  document.addEventListener("click", (e) => {
    const buy = e.target.closest("[data-buy]");
    const sell = e.target.closest("[data-sell]");
    const upg = e.target.closest("[data-upg]");

    if (buy) buyBuilding(buy.dataset.buy);
    if (sell) sellBuilding(sell.dataset.sell);
    if (upg) buyUpgrade(upg.dataset.upg);
  });

  // =========================
  // GAME LOOP (NO UI SPAM FIX)
  // =========================
  setInterval(() => {
    if (!state.paused) {
      state.candyOrbs += econ.getCPS() / 10;

      if (state.comboTimer > 0) {
        state.comboTimer -= 0.1;
      }
    }

    state.lastTick = Date.now();

    ui.updateHUD();
    updateComboUI();
  }, 100);

  // =========================
  // START
  // =========================
  save.loadGame();
  ui.updateAll();
})();
