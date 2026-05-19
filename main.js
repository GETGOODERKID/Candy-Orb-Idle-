(() => {
  const { els, state } = window.COI;
  const { econ, ui, fx, save } = window.COI;

  // =========================
  // COMBO UI
  // =========================
  const comboText = document.getElementById("comboText");
  const comboBar = document.getElementById("comboBar");

  // initialize safely
  state.comboChain ??= 0;
  state.comboTimer ??= 0;
  state.bestCombo ??= 0;

  function updateComboUI() {
    if (comboText) {
      comboText.textContent = `COMBO x${state.comboChain}`;
    }

    if (comboBar) {
      const percent = Math.min(100, state.comboChain * 4);
      comboBar.style.width = percent + "%";
    }
  }

  // =========================
  // COMBO EXPLOSION
  // =========================
  function comboExplosion(amount, x, y) {
    if (!amount || amount < 5) return;

    const bonus =
      amount *
      state.clickPower *
      state.clickMult *
      Math.max(1, amount * 0.4);

    state.candyOrbs += bonus;
    state.totalEarned += bonus;
    state.totalCandyEarned += bonus;

    fx.shake();

    fx.playTone(120, 0.25, "sawtooth", 0.5);
    fx.playTone(220, 0.25, "triangle", 0.4);

    ui.msg(`💥 COMBO EXPLOSION x${amount} +${econ.formatNumber(bonus)}`);

    for (let i = 0; i < Math.min(40, amount * 2); i++) {
      fx.spawnParticle(
        `+${Math.floor(bonus / 10)}`,
        x + (Math.random() * 300 - 150),
        y + (Math.random() * 300 - 150),
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
  // ORB CLICK
  // =========================
  function clickOrb(ev) {
    state.totalClicks += 1;

    const x = ev?.clientX ?? window.innerWidth / 2;
    const y = ev?.clientY ?? window.innerHeight / 2;

    let multiplier = 1;

    const critRoll = Math.random();

    // =========================
    // CRIT SUCCESS
    // =========================
    if (critRoll < Math.min(0.99, state.critChance)) {

      state.totalCrits += 1;
      state.hotStreak += 1;

      // combo system
      state.comboChain += 1;
      state.comboTimer = 2;

      if (state.comboChain > state.bestCombo) {
        state.bestCombo = state.comboChain;
      }

      if (state.hotStreak > state.bestHotStreak) {
        state.bestHotStreak = state.hotStreak;
      }

      // combo scaling
      const comboBoost =
        1 +
        Math.min(10, state.comboChain * 0.15);

      multiplier = Math.max(
        2,
        Math.round(
          2 *
          state.critMult *
          comboBoost
        )
      );

      // massive combos
      if (state.comboChain >= 25) {
        multiplier *= 2;
      }

      if (state.comboChain >= 50) {
        multiplier *= 2;
      }

      fx.playCritSound();

      if (state.comboChain >= 8) {
        fx.shake();
      }

      fx.spawnParticle(
        `COMBO x${state.comboChain}`,
        x,
        y,
        "#f1c04d"
      );

      fx.spawnParticle(
        `CRIT x${multiplier}`,
        x,
        y - 40,
        "#ffffff"
      );

      ui.msg(
        `🔥 Combo x${state.comboChain} • Crit x${multiplier}`
      );

    } else {

      // =========================
      // COMBO BREAK
      // =========================
      state.hotStreak = 0;

      const broken = state.comboChain;

      comboExplosion(broken, x, y);

      state.comboChain = 0;
      state.comboTimer = 0;

      fx.spawnParticle("+", x, y);
    }

    // =========================
    // FINAL GAIN
    // =========================
    const gain =
      state.clickPower *
      state.clickMult *
      multiplier;

    state.candyOrbs += gain;
    state.totalEarned += gain;
    state.totalCandyEarned += gain;

    // =========================
    // WATERFALL UNLOCK
    // =========================
    if (
      !state.waterfallUnlocked &&
      state.totalCandyEarned >= 1000
    ) {
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
      ui.msg(
        `Locked - earn ${econ.formatNumber(b.unlockAt)} first`,
        false
      );
      return;
    }

    const amount = ui.getResolvedBuyCount(b);

    if (amount <= 0) {
      ui.msg("Can't buy any right now", false);
      return;
    }

    const price =
      econ.getBuildingTotalCost(b, amount);

    if (state.candyOrbs < price) {
      ui.msg(
        `Need ${econ.formatNumber(price - state.candyOrbs)} more`,
        false
      );
      return;
    }

    state.candyOrbs -= price;
    state.totalSpent += price;

    b.count += amount;

    fx.playBuySound();

    ui.msg(`${b.name} x${amount} (${b.count})`);

    ui.updateAll();
  }

  // =========================
  // SELL BUILDING
  // =========================
  function sellBuilding(id) {
    const b = econ.getBuilding(id);

    if (!b || b.count === 0) return;

    const amount = Math.min(
      b.count,
      ui.getResolvedSellCount(b)
    );

    const refund =
      econ.getBuildingSellRefund(b, amount);

    state.candyOrbs += refund;

    b.count -= amount;

    state.totalSold += amount;
    state.totalSoldValue += refund;

    fx.playBuySound();

    ui.msg(`Sold x${amount}`);

    ui.updateAll();
  }

  // =========================
  // BUY UPGRADE
  // =========================
  function buyUpgrade(id) {
    const upg =
      state.upgrades.find(u => u.id === id);

    if (!upg) return;

    if (state.clickUpgradesBought.has(id)) {
      return;
    }

    if (state.candyOrbs < upg.cost) {
      ui.msg(
        `Need ${econ.formatNumber(upg.cost - state.candyOrbs)} more`,
        false
      );
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
  // BUY PRESTIGE UPGRADE
  // =========================
  function buyPrestigeUpgrade(id) {
    const upg =
      state.prestigeUpgrades.find(
        p => p.id === id
      );

    if (!upg) return;

    if (
      state.prestigeUpgradesBought.has(id)
    ) {
      return;
    }

    if (state.prestigePoints < upg.cost) {
      ui.msg(
        `Need ${upg.cost - state.prestigePoints} more`,
        false
      );
      return;
    }

    state.prestigePoints -= upg.cost;

    state.prestigeUpgradesBought.add(id);

    upg.effect();

    fx.playPrestigeSound();

    ui.msg(`${upg.name} purchased`);

    ui.updateAll();
  }

  // =========================
  // PRESTIGE RESET
  // =========================
  function prestigeReset() {
    const gain = econ.getPrestigeGain();

    if (gain < 1) {
      ui.msg(
        "Need 100,000 earned to prestige",
        false
      );
      return;
    }

    if (
      !confirm(
        `Prestige for ${gain} point(s)?`
      )
    ) {
      return;
    }

    state.prestige += gain;
    state.prestigePoints += gain;

    state.lastPrestigeEarned =
      state.prestigePoints;

    state.totalEarned = 0;
    state.totalCandyEarned = 0;

    state.candyOrbs = 0;

    state.clickPower = 1;
    state.critChance = 0.10;
    state.critMult = 1;

    state.hotStreak = 0;

    state.comboChain = 0;
    state.comboTimer = 0;

    state.clickUpgradesBought.clear();

    for (const b of state.buildings) {
      b.count = 0;
      b.bonusMult = 1;
    }

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

    if (
      !state.waterfallUnlocked &&
      state.totalCandyEarned >= 1000
    ) {
      state.waterfallUnlocked = true;

      ui.msg("🌊 Waterfall Unlocked!");

      save.saveGame();
    }

    if (state.waterfallUnlocked) {
      fx.spawnWaterfall(state.lastTick);
    }
  }

  // =========================
  // EVENT HANDLERS
  // =========================
  function attachDelegatedHandlers() {

    els.shop.addEventListener("click", (ev) => {

      const target =
        ev.target.closest?.("button");

      if (!target) return;

      if (target.dataset.buyBuilding) {
        buyBuilding(
          target.dataset.buyBuilding
        );
      }

      else if (
        target.dataset.sellBuilding
      ) {
        sellBuilding(
          target.dataset.sellBuilding
        );
      }
    });

    els.upgrades.addEventListener(
      "click",
      (ev) => {

        const target =
          ev.target.closest?.("button");

        if (!target) return;

        if (target.dataset.buyUpgrade) {
          buyUpgrade(
            target.dataset.buyUpgrade
          );
        }
      }
    );

    els.prestige.addEventListener(
      "click",
      (ev) => {

        const target =
          ev.target.closest?.("button");

        if (!target) return;

        if (target.id === "prestigeBtn") {
          prestigeReset();
        }

        else if (
          target.dataset.buyPrestige
        ) {
          buyPrestigeUpgrade(
            target.dataset.buyPrestige
          );
        }
      }
    );
  }

  // =========================
  // TABS
  // =========================
  document
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.addEventListener("click", () => {

        document
          .querySelectorAll(".tab")
          .forEach(t =>
            t.classList.remove("active")
          );

        document
          .querySelectorAll(".panel")
          .forEach(p =>
            p.classList.remove("active")
          );

        tab.classList.add("active");

        const panel =
          document.getElementById(
            tab.dataset.tab
          );

        if (panel) {
          panel.classList.add("active");
        }
      });
    });

  // =========================
  // ORB EVENTS
  // =========================
  const orbImg =
    document.getElementById("orbImg");

  const orbFallback =
    document.getElementById("orbFallback");

  if (orbImg) {
    orbImg.addEventListener(
      "click",
      clickOrb
    );

    orbImg.addEventListener(
      "error",
      () => {
        orbImg.style.display = "none";

        if (orbFallback) {
          orbFallback.style.display =
            "block";
        }
      }
    );
  }

  if (orbFallback) {
    orbFallback.addEventListener(
      "click",
      clickOrb
    );
  }

  // =========================
  // KEYBINDS
  // =========================
  document.addEventListener(
    "keydown",
    (ev) => {

      if (
        !els.shop.classList.contains(
          "active"
        )
      ) {
        return;
      }

      if (ev.key === "1") {
        ui.setBuyMode(1);
      }

      else if (ev.key === "2") {
        ui.setBuyMode(10);
      }

      else if (ev.key === "3") {
        ui.setBuyMode(100);
      }

      else if (ev.key === "4") {
        ui.setBuyMode("max");
      }
    }
  );

  // IMPORTANT
  attachDelegatedHandlers();

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

      // combo decay
      if (state.comboTimer > 0) {

        state.comboTimer -= 0.1;

        if (state.comboTimer <= 0) {

          const broken =
            state.comboChain;

          comboExplosion(
            broken,
            window.innerWidth / 2,
            window.innerHeight / 2
          );

          state.comboChain = 0;
          state.comboTimer = 0;

          updateComboUI();
        }
      }

      updateWaterfall();
    }

    state.lastTick = Date.now();

    ui.updateHUD();

    ui.refreshShopUI();

    ui.refreshUpgradesUI();

    checkAchievements();

  }, 100);

  // =========================
  // AUTO SAVE
  // =========================
  setInterval(() => {

    if (state.autoSave !== false) {
      save.saveGame();
    }

  }, 10000);

  // =========================
  // BOOT
  // =========================
  save.loadGame();

  ui.updateAll();

  updateComboUI();

})();
