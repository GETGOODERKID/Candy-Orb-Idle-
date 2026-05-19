(() => {

  const COI = window.COI;

  const els = COI.els;
  const state = COI.state;

  const econ = COI.econ;
  const fx = COI.fx;
  const save = COI.save;

  // =========================
  // SAFE UI WRAPPER
  // =========================
  function ui() {
    return COI.ui;
  }

  function callUI(fn) {
    if (!ui()) return;
    try { fn(ui()); } catch (e) {}
  }

  // =========================
  // COMBO UI
  // =========================
  const comboText = document.getElementById("comboText");
  const comboBar = document.getElementById("comboBar");

  function updateComboUI() {
    const c = state.comboChain || 0;

    if (comboText) comboText.textContent = `COMBO x${c}`;
    if (comboBar) comboBar.style.width = Math.min(100, c * 5) + "%";
  }

  // =========================
  // COMBO EXPLOSION
  // =========================
  function comboExplosion(amount, x, y) {
    if (!amount || amount < 3) return;

    const bonus = amount * state.clickPower * state.clickMult * 3;

    state.candyOrbs += bonus;
    state.totalEarned += bonus;
    state.totalCandyEarned += bonus;

    fx.shake();

    callUI(u => u.msg(`Combo Break x${amount} +${Math.floor(bonus)}`));
  }

  // =========================
  // ACHIEVEMENTS
  // =========================
  function checkAchievements() {
    const list = COI.achievements || [];

    for (const a of list) {
      if (
        !state.achievementsDone.has(a.id) &&
        a.check({
          state,
          getCPS: econ.getCPS,
          getBuildingCount: econ.getBuildingCount
        })
      ) {
        state.achievementsDone.add(a.id);

        a.reward({
          updateAchievementBonus: econ.updateAchievementBonus
        });

        fx.playTone(880, 0.1, "triangle", 2);

        callUI(u => u.msg(`Achievement: ${a.name}`));
      }
    }
  }

  // =========================
  // CLICK ORB
  // =========================
  function clickOrb(ev) {
    state.totalClicks++;

    const x = ev?.clientX || innerWidth / 2;
    const y = ev?.clientY || innerHeight / 2;

    let mult = 1;

    const crit = Math.random() < state.critChance;

    if (crit) {
      state.totalCrits++;
      state.hotStreak++;

      state.comboChain = (state.comboChain || 0) + 1;
      state.comboTimer = 1.5;

      state.bestCombo = Math.max(state.bestCombo || 0, state.comboChain);

      mult = Math.max(2, 2 * state.critMult);

      fx.playCritSound();
      fx.shake();

      fx.spawnParticle(`COMBO x${state.comboChain}`, x, y, "#f1c04d");

      callUI(u => u.msg(`Combo x${state.comboChain}`));

    } else {
      state.hotStreak = 0;

      const broken = state.comboChain || 0;

      comboExplosion(broken, x, y);

      state.comboChain = 0;

      fx.spawnParticle("+", x, y, "#fff");
    }

    const gain = state.clickPower * state.clickMult * mult;

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

    if (!state.waterfallUnlocked && state.totalCandyEarned >= 1000) {
      state.waterfallUnlocked = true;
      callUI(u => u.msg("Waterfall Unlocked"));
      save.saveGame();
    }

    fx.playClickSound();

    updateComboUI();
    checkAchievements();

    callUI(u => u.updateHUD());
  }

  // =========================
  // BUILDINGS
  // =========================
  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;

    if (econ.isBuildingLocked(b)) {
      callUI(u => u.msg(`Locked - need ${b.unlockAt}`, false));
      return;
    }

    const amount = COI.ui?.getResolvedBuyCount?.(b) || 1;
    const price = econ.getBuildingTotalCost(b, amount);

    if (state.candyOrbs < price) return;

    state.candyOrbs -= price;
    state.totalSpent += price;
    b.count += amount;

    fx.playBuySound();

    callUI(u => {
      u.msg(`${b.name} x${amount}`);
      u.updateAll();
    });
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count <= 0) return;

    const amount = Math.min(
      b.count,
      COI.ui?.getResolvedSellCount?.(b) || 1
    );

    b.count -= amount;

    fx.playBuySound();

    callUI(u => u.updateAll());
  }

  // =========================
  // UPGRADE
  // =========================
  function buyUpgrade(id) {
    const upg = state.upgrades.find(u => u.id === id);
    if (!upg) return;

    if (state.clickUpgradesBought.has(id)) return;
    if (state.candyOrbs < upg.cost) return;

    state.candyOrbs -= upg.cost;
    state.totalSpent += upg.cost;

    state.clickUpgradesBought.add(id);

    upg.effect();

    fx.playBuySound();

    callUI(u => {
      u.msg(`${upg.name} unlocked`);
      u.updateAll();
    });
  }

  // =========================
  // PRESTIGE
  // =========================
  function prestigeReset() {
    const gain = econ.getPrestigeGain();

    if (gain < 1) {
      callUI(u => u.msg("Need more progress", false));
      return;
    }

    if (!confirm(`Prestige for ${gain}?`)) return;

    state.prestige += gain;
    state.prestigePoints += gain;

    state.candyOrbs = 0;
    state.totalEarned = 0;
    state.totalCandyEarned = 0;

    state.comboChain = 0;
    state.bestCombo = 0;

    for (const b of state.buildings) {
      if (b) b.count = 0;
    }

    fx.playPrestigeSound();
    fx.shake();

    callUI(u => {
      u.msg(`Prestige +${gain}`);
      u.updateAll();
    });

    save.saveGame();
  }

  // =========================
  // WATERFALL
  // =========================
  function updateWaterfall() {
    if (state.waterfallUnlocked) {
      fx.spawnWaterfall(state.lastTick);
    }
  }

  // =========================
  // EVENTS
  // =========================
  if (els.orbImg) {
    els.orbImg.addEventListener("click", clickOrb);
  }

  if (els.shop) {
    els.shop.addEventListener("click", (e) => {
      const buy = e.target.closest("[data-buy-building]");
      const sell = e.target.closest("[data-sell-building]");

      if (buy) buyBuilding(buy.dataset.buyBuilding);
      if (sell) sellBuilding(sell.dataset.sellBuilding);
    });
  }

  if (els.upgrades) {
    els.upgrades.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-buy-upgrade]");
      if (btn) buyUpgrade(btn.dataset.buyUpgrade);
    });
  }

  if (els.prestige) {
    els.prestige.addEventListener("click", (e) => {
      if (e.target.id === "prestigeBtn") prestigeReset();
    });
  }

  // =========================
  // GAME LOOP (SAFE)
  // =========================
  setInterval(() => {

    if (!state.paused) {

      const cps = econ.getCPS();
      const gain = cps / 10;

      state.candyOrbs += gain;
      state.totalEarned += gain;
      state.totalCandyEarned += gain;

      if (state.comboTimer > 0) {
        state.comboTimer -= 0.1;

        if (state.comboTimer <= 0) {
          comboExplosion(
            state.comboChain || 0,
            innerWidth / 2,
            innerHeight / 2
          );

          state.comboChain = 0;
        }
      }

      updateComboUI();
      updateWaterfall();
    }

    state.lastTick = Date.now();

    callUI(u => {
      u.updateHUD();
      u.refreshShopUI();
      u.refreshUpgradesUI();
    });

    checkAchievements();

  }, 100);

  // =========================
  // BOOT (SAFE)
  // =========================
  setTimeout(() => {
    save.loadGame();

    callUI(u => u.updateAll());
  }, 50);

})();
