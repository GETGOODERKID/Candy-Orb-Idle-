(() => {
  const COI = window.COI;

  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;
  const fx = COI.fx;
  const save = COI.save;
  const ui = COI.ui;

  // =========================
  // ORB CLICK
  // =========================
  function clickOrb(e) {
    const x = e?.clientX || innerWidth / 2;
    const y = e?.clientY || innerHeight / 2;

    let gain = state.clickPower * state.clickMult;

    const crit = Math.random() < state.critChance;

    if (crit) {
      gain *= state.critMult || 2;

      state.totalCrits++;

      fx?.playCritSound?.();
      fx?.spawnParticle?.("CRIT!", x, y, "#fbbf24");

      ui.msg("Critical hit!");
    } else {
      fx?.spawnParticle?.("+", x, y, "#fff");
    }

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
    if (state.candyOrbs < cost) {
      ui.msg("Not enough Candy Orbs", false);
      return;
    }

    state.candyOrbs -= cost;
    b.count++;

    ui.msg("Bought " + b.name);

    ui.refreshShopUI();
    ui.updateHUD();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count <= 0) return;

    const refund = econ.getBuildingSellRefund(b, 1);

    b.count--;
    state.candyOrbs += refund;

    ui.msg("Sold " + b.name);

    ui.refreshShopUI();
    ui.updateHUD();
  }

  // =========================
  // UPGRADES
  // =========================
  function buyUpgrade(id) {
    const u = state.upgrades.find(x => x.id === id);
    if (!u || state.clickUpgradesBought.has(id)) return;

    if (state.candyOrbs < u.cost) return;

    state.candyOrbs -= u.cost;
    state.clickUpgradesBought.add(id);

    u.effect?.();

    ui.msg("Upgrade bought");

    ui.refreshUpgradesUI();
    ui.updateHUD();
  }

  // =========================
  // TAB SYSTEM (FIXED)
  // =========================
  function bindTabs() {
    document.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll(".panel").forEach(p => {
          p.classList.remove("active");
        });

        document.getElementById(tab)?.classList.add("active");

        document.querySelectorAll(".tab").forEach(t => {
          t.classList.remove("active");
        });

        btn.classList.add("active");
      });
    });
  }

  // =========================
  // HOTKEYS (1–4 RESTORED)
  // =========================
  function bindHotkeys() {
    document.addEventListener("keydown", (e) => {
      if (e.repeat) return;

      if (e.key === "1") ui.setBuyMode(1);
      if (e.key === "2") ui.setBuyMode(10);
      if (e.key === "3") ui.setBuyMode(100);
      if (e.key === "4") ui.setBuyMode("max");
    });
  }

  // =========================
  // GAME LOOP (SMOOTHED)
  // =========================
  let last = performance.now();

  function loop(now) {
    const delta = (now - last) / 1000;
    last = now;

    if (!state.paused) {
      const cps = econ.getCPS();
      const gain = cps * delta;

      state.candyOrbs += gain;
      state.totalEarned += gain;
      state.totalCandyEarned += gain;

      ui.updateHUD();
    }

    requestAnimationFrame(loop);
  }

  // =========================
  // BIND EVENTS
  // =========================
  function bind() {
    els.orbImg?.addEventListener("click", clickOrb);

    els.shop?.addEventListener("click", (e) => {
      const buy = e.target.closest("[data-buy]");
      const sell = e.target.closest("[data-sell]");

      if (buy) buyBuilding(buy.dataset.buy);
      if (sell) sellBuilding(sell.dataset.sell);
    });

    els.upgrades?.addEventListener("click", (e) => {
      const u = e.target.closest("[data-upg]");
      if (u) buyUpgrade(u.dataset.upg);
    });
  }

  // =========================
  // START
  // =========================
  bind();
  bindTabs();
  bindHotkeys();

  ui.updateAll();

  requestAnimationFrame(loop);

})();
