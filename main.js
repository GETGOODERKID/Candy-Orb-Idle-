(() => {
  const COI = window.COI;
  const state = COI.state;
  const econ = COI.econ;
  const ui = COI.ui;
  const fx = COI.fx;
  const save = COI.save;

  // =========================
  // MAIN API (CRITICAL FIX)
  // =========================
  COI.main = {
    buyBuilding,
    sellBuilding,
    buyUpgrade,
    prestigeReset
  };

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

      ui.msg(`CRIT x${state.comboChain}`, true);
      fx?.playCritSound?.();
      fx?.spawnParticle?.("CRIT", x, y, "#ffd54a");
    } else {
      const broken = state.comboChain || 0;

      if (broken >= 3) {
        state.candyOrbs += broken * 5;
      }

      state.comboChain = 0;
      fx?.spawnParticle?.("+", x, y, "#fff");
    }

    const gain = state.clickPower * state.clickMult * mult;

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

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
    ui.refreshShopUI();
    ui.updateHUD();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count <= 0) return;

    b.count--;
    state.candyOrbs += Math.floor(b.baseCost * 0.5);

    ui.msg(`Sold ${b.name}`);
    ui.refreshShopUI();
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

    ui.msg(`Upgrade purchased`);
    ui.refreshUpgradesUI();
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
  // CLICK BIND
  // =========================
  const orb = document.getElementById("orbImg");
  if (orb) orb.addEventListener("click", clickOrb);

  // =========================
  // GAME LOOP (CLEAN)
  // =========================
  setInterval(() => {
    if (!state.paused) {
      state.candyOrbs += econ.getCPS() / 10;
    }

    state.lastTick = Date.now();

    ui.updateHUD();
  }, 100);

  save.loadGame();
  ui.updateAll();
})();
