(() => {
  const { els, state } = window.COI;
  const { econ, ui, fx, save } = window.COI;

  // -------------------------
  // ACHIEVEMENTS
  // -------------------------
  function checkAchievements() {
    const list = window.COI.achievements || [];

    for (const a of list) {
      if (!state.achievementsDone.has(a.id) &&
        a.check({ state, getCPS: econ.getCPS, getBuildingCount: econ.getBuildingCount })
      ) {
        state.achievementsDone.add(a.id);
        a.reward({ updateAchievementBonus: econ.updateAchievementBonus });

        ui.msg(`Achievement: ${a.name}`);
        fx.playTone(880, 0.1, "triangle", 2);
      }
    }
  }

  // -------------------------
  // ORB CLICK
  // -------------------------
  function clickOrb(ev) {
    state.totalClicks++;

    const x = ev?.clientX ?? window.innerWidth / 2;
    const y = ev?.clientY ?? window.innerHeight / 2;

    let multiplier = 1;

    const crit = Math.random() < state.critChance;

    if (crit) {
      state.hotStreak++;
      state.bestHotStreak = Math.max(state.bestHotStreak, state.hotStreak);

      multiplier = Math.max(2, Math.round(2 * state.critMult));

      fx.playCritSound();
      fx.spawnParticle(`x${multiplier}`, x, y, "#f1c04d");
    } else {
      state.hotStreak = 0;
      fx.spawnParticle("+", x, y);
    }

    const gain = state.clickPower * state.clickMult * multiplier;

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

    // 🌊 UNLOCK + SAVE INSTANTLY (CRITICAL FIX)
    if (!state.waterfallUnlocked && state.totalCandyEarned >= 1000) {
      state.waterfallUnlocked = true;
      ui.msg("🌊 Waterfall Unlocked!");
      save.saveGame(); // 🔥 THIS FIXES YOUR BUG
    }

    fx.playClickSound();
    ui.updateHUD();
    checkAchievements();
  }

  // -------------------------
  // BUILD / BUY / ETC (UNCHANGED)
  // -------------------------
  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;

    const amount = ui.getResolvedBuyCount(b);
    const price = econ.getBuildingTotalCost(b, amount);

    if (state.candyOrbs < price) return;

    state.candyOrbs -= price;
    b.count += amount;

    fx.playBuySound();
    ui.updateAll();
  }

  // -------------------------
  // WATERFALL (FIXED)
  // -------------------------
  function updateWaterfall() {
    if (!state.waterfallUnlocked) return;
    fx.spawnWaterfall(state.lastTick);
  }

  // -------------------------
  // LOOP
  // -------------------------
  setInterval(() => {
    if (!state.paused) {
      const cps = econ.getCPS();
      const gain = cps / 10;

      state.candyOrbs += gain;
      state.totalEarned += gain;
      state.totalCandyEarned += gain;
    }

    state.lastTick = Date.now();

    updateWaterfall();

    ui.updateHUD();
    checkAchievements();
  }, 100);

  // SAVE
  setInterval(save.saveGame, 10000);
  window.addEventListener("beforeunload", save.saveGame);

  // BOOT
  save.loadGame();
  ui.updateAll();
})();
