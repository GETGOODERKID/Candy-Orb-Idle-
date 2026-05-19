(() => {
  const COI = window.COI;

  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;
  const fx = COI.fx;
  const save = COI.save;
  const ui = COI.ui;

  function safe(fn) {
    return (...args) => {
      try {
        return fn?.(...args);
      } catch (e) {
        console.warn("Game error:", e);
      }
    };
  }

  function clickOrb(e) {
    const x = e?.clientX || innerWidth / 2;
    const y = e?.clientY || innerHeight / 2;

    const crit = Math.random() < state.critChance;

    let gain = state.clickPower;

    if (crit) {
      state.hotStreak++;
      gain *= 2;

      fx?.playCritSound?.();
      fx?.spawnParticle?.("CRIT!", x, y, "#fbbf24");

      ui.msg("Critical hit!");
    } else {
      state.hotStreak = 0;
      fx?.spawnParticle?.("+", x, y, "#fff");
    }

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

    ui.updateHUD();
  }

  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;

    const cost = econ.getBuildingTotalCost(b, 1);
    if (state.candyOrbs < cost) return;

    state.candyOrbs -= cost;
    b.count++;

    ui.msg("Bought " + b.name);
    ui.updateAll();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count <= 0) return;

    b.count--;
    state.candyOrbs += 1;

    ui.msg("Sold " + b.name);
    ui.updateAll();
  }

  function buyUpgrade(id) {
    const u = state.upgrades.find(x => x.id === id);
    if (!u) return;

    if (state.candyOrbs < u.cost) return;

    state.candyOrbs -= u.cost;
    state.clickUpgradesBought.add(id);

    u.effect?.();

    ui.msg("Upgrade bought");
    ui.updateAll();
  }

  function loop() {
    const cps = econ.getCPS();
    state.candyOrbs += cps / 10;

    ui.updateHUD();
  }

  function bind() {
    els.orbImg?.addEventListener("click", clickOrb);

    els.shop?.addEventListener("click", (e) => {
      const buy = e.target.closest("[data-buy]");
      const sell = e.target.closest("[data-sell]");

      if (buy) buyBuilding(buy.dataset.buy);
      if (sell) sellBuilding(sell.dataset.sell);
    });

    els.upgrades?.addEventListener("click", (e) => {
      const u = e.target.closest("[data-upgrade]");
      if (u) buyUpgrade(u.dataset.upgrade);
    });
  }

  bind();
  ui.updateAll();

  setInterval(loop, 100);

})();
