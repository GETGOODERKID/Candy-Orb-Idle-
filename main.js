(() => {
  const { els, state } = window.COI;
  const { econ, ui, fx, save } = window.COI;

  // =========================
  // COMBO UI
  // =========================
  const comboText = document.getElementById("comboText");
  const comboBar = document.getElementById("comboBar");

  function updateComboUI() {
    const c = state.comboChain || 0;

    if (comboText) comboText.textContent = `COMBO x${c}`;

    const percent = Math.min(100, (c / 20) * 100);
    if (comboBar) comboBar.style.width = percent + "%";
  }

  // =========================
  // 💥 COMBO EXPLOSION
  // =========================
  function comboExplosion(amount, x, y) {
    if (!amount || amount < 3) return;

    const bonus = amount * state.clickPower * 2;

    state.candyOrbs += bonus;
    state.totalEarned += bonus;
    state.totalCandyEarned += bonus;

    fx.shake();

    ui.msg(`💥 COMBO BREAK x${amount}! +${Math.floor(bonus)}`);

    for (let i = 0; i < Math.min(14, amount); i++) {
      fx.spawnParticle(
        `+${Math.floor(bonus / 10)}`,
        x + (Math.random() * 200 - 100),
        y + (Math.random() * 200 - 100),
        "#fbbf24"
      );
    }
  }

  // =========================
  // ACHIEVEMENTS
  // =========================
  function checkAchievements() {
    const list = window.COI.achievements || [];

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

        ui.msg(`Achievement: ${a.name}`);
        fx.playTone(880, 0.1, "triangle", 2);
      }
    }
  }

  // =========================
  // ORB CLICK (COMBO SYSTEM)
  // =========================
  function clickOrb(ev) {
    state.totalClicks += 1;

    const x = ev?.clientX ?? window.innerWidth / 2;
    const y = ev?.clientY ?? window.innerHeight / 2;

    let multiplier = 1;

    const critRoll = Math.random();

    if (critRoll < Math.min(0.99, state.critChance)) {
      state.totalCrits += 1;
      state.hotStreak += 1;

      state.comboChain = (state.comboChain || 0) + 1;
      state.comboTimer = 1.5;

      if (state.comboChain > state.bestCombo) {
        state.bestCombo = state.comboChain;
      }

      const comboMult = 1 + state.comboChain * 0.12;

      multiplier = Math.max(
        2,
        Math.round(2 * state.critMult * comboMult)
      );

      fx.playCritSound();
      fx.shake();

      fx.spawnParticle(`COMBO x${state.comboChain}`, x, y, "#f1c04d");
      ui.msg(`Combo x${state.comboChain} → Crit x${multiplier}`);
    } else {
      state.hotStreak = 0;

      const broken = state.comboChain;

      // 💥 COMBO BREAK EXPLOSION
      comboExplosion(broken, x, y);

      state.comboChain = 0;

      fx.spawnParticle("+", x, y);
    }

    const gain = state.clickPower * state.clickMult * multiplier;

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

    // 🌊 WATERFALL UNLOCK
    if (!state.waterfallUnlocked && state.totalCandyEarned >= 1000) {
      state.waterfallUnlocked = true;
      ui.msg("🌊 Waterfall Unlocked!");
      save.saveGame();
    }

    fx.playClickSound();

    checkAchievements();
    ui.updateHUD();

    updateComboUI();
  }

  // =========================
  // BUILDINGS
  // =========================
  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;

    if (econ.isBuildingLocked(b)) {
      ui.msg(`Locked - earn ${econ.formatNumber(b.unlockAt)} first`, false);
      return;
    }

    const amount = ui.getResolvedBuyCount(b);
    if (amount <= 0) return;

    const price = econ.getBuildingTotalCost(b, amount);

    if (state.candyOrbs < price) {
      ui.msg(`Need ${econ.formatNumber(price - state.candyOrbs)} more`, false);
      return;
    }

    state.candyOrbs -= price;
    state.totalSpent += price;

    b.count += amount;

    fx.playBuySound();
    ui.msg(`${b.name} x${amount} (${b.count})`);

    ui.updateAll();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count === 0) return;

    const amount = Math.min(b.count, ui.getResolvedSellCount(b));
    const refund = econ.getBuildingSellRefund(b, amount);

    state.candyOrbs += refund;
    b.count -= amount;

    state.totalSold += amount;
    state.totalSoldValue += refund;

    fx.playBuySound();
    ui.msg(`Sold x${amount}`);

    ui.updateAll();
  }

  // =========================
  // UPGRADES
  // =========================
  function buyUpgrade(id) {
    const upg = state.upgrades.find(u => u.id === id);
    if (!upg) return;

    if (state.clickUpgradesBought.has(id)) return;

    if (state.candyOrbs < upg.cost) {
      ui.msg(`Need ${econ.formatNumber(upg.cost - state.candyOrbs)} more`, false);
      return;
    }

    state.candyOrbs -= upg.cost;
    state.totalSpent += upg.cost;

    state.clickUpgradesBought.add(id);
    upg.effect();

    fx.playBuySound();
    ui.msg(`${upg.name} unlocked`);

    ui.updateAll();
  }

  // =========================
  // PRESTIGE
  // =========================
  function prestigeReset() {
    const gain = econ.getPrestigeGain();

    if (gain < 1) return ui.msg("Need 100,000 earned", false);

    if (!confirm(`Prestige for ${gain}?`)) return;

    state.prestige += gain;
    state.prestigePoints += gain;

    state.totalEarned = 0;
    state.totalCandyEarned = 0;
    state.candyOrbs = 0;

    state.comboChain = 0;
    state.bestCombo = 0;

    fx.playPrestigeSound();
    fx.shake();

    ui.msg(`Prestige +${gain}`);
    ui.updateAll();
    save.saveGame();
  }

  // =========================
  // WATERFALL
  // =========================
  function updateWaterfall() {
    if (!state.waterfallUnlocked && state.totalCandyEarned >= 1000) {
      state.waterfallUnlocked = true;
      ui.msg("🌊 Waterfall Unlocked!");
      save.saveGame();
    }

    if (state.waterfallUnlocked) {
      fx.spawnWaterfall(state.lastTick);
    }
  }

  // =========================
  // GAME LOOP
  // =========================
  setInterval(() => {
    if (!state.paused) {
      const cps = econ.getCPS();
      const gain = cps / 10;

      state.candyOrbs += gain;
      state.totalEarned += gain;
      state.totalCandyEarned += gain;

      // 🔥 COMBO DECAY
      if (state.comboTimer > 0) {
        state.comboTimer -= 0.1;
        if (state.comboTimer <= 0) {
          const broken = state.comboChain;

          comboExplosion(broken, window.innerWidth / 2, window.innerHeight / 2);

          state.comboChain = 0;
        }
      }

      updateComboUI();
      updateWaterfall();
    }

    state.lastTick = Date.now();

    ui.updateHUD();
    ui.refreshShopUI();
    ui.refreshUpgradesUI();

    checkAchievements();
  }, 100);

  // =========================
  // BOOT
  // =========================
  save.loadGame();
  ui.updateAll();
})();
