(() => {

  // =========================
  // SAFE REFERENCES
  // =========================

  const { els, state } = window.COI;

  const econ = window.COI.econ;
  const fx = window.COI.fx;
  const save = window.COI.save;

  // IMPORTANT:
  // DO NOT CACHE ui HERE
  // ui.js loads later sometimes

  // =========================
  // COMBO UI
  // =========================

  const comboText = document.getElementById("comboText");
  const comboBar = document.getElementById("comboBar");

  function updateComboUI() {

    const combo = state.comboChain || 0;

    if (comboText) {
      comboText.textContent = `COMBO x${combo}`;
    }

    if (comboBar) {

      const percent = Math.min(100, combo * 5);

      comboBar.style.width = percent + "%";

      if (combo >= 20) {
        comboBar.style.filter = "brightness(1.8)";
      } else {
        comboBar.style.filter = "brightness(1)";
      }

    }

  }

  // =========================
  // COMBO EXPLOSION
  // =========================

  function comboExplosion(amount, x, y) {

    if (!amount || amount < 5) return;

    const explosionBonus =
      amount *
      state.clickPower *
      state.clickMult *
      4;

    state.candyOrbs += explosionBonus;
    state.totalEarned += explosionBonus;
    state.totalCandyEarned += explosionBonus;

    fx.shake();

    window.COI.ui.msg(
      `💥 COMBO EXPLOSION x${amount} +${Math.floor(explosionBonus)}`
    );

    for (let i = 0; i < Math.min(amount, 25); i++) {

      fx.spawnParticle(
        `+${Math.floor(explosionBonus / 10)}`,
        x + (Math.random() * 240 - 120),
        y + (Math.random() * 240 - 120),
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

        fx.playTone(900, 0.12, "triangle", 2);

        window.COI.ui.msg(`🏆 ${a.name}`);

      }

    }

  }

  // =========================
  // CLICK ORB
  // =========================

  function clickOrb(ev) {

    state.totalClicks += 1;

    const x = ev?.clientX || window.innerWidth / 2;
    const y = ev?.clientY || window.innerHeight / 2;

    let multiplier = 1;

    const crit = Math.random() < Math.min(0.99, state.critChance);

    // =========================
    // CRIT
    // =========================

    if (crit) {

      state.totalCrits += 1;

      state.hotStreak += 1;

      state.comboChain = (state.comboChain || 0) + 1;

      state.comboTimer = 1.5;

      if (!state.bestCombo) {
        state.bestCombo = 0;
      }

      if (state.comboChain > state.bestCombo) {
        state.bestCombo = state.comboChain;
      }

      const comboMult =
        1 + (state.comboChain * 0.12);

      multiplier =
        Math.max(
          2,
          Math.round(
            2 *
            state.critMult *
            comboMult
          )
        );

      fx.playCritSound();

      fx.shake();

      fx.spawnParticle(
        `COMBO x${state.comboChain}`,
        x,
        y,
        "#f1c04d"
      );

      if (state.comboChain >= 10) {

        fx.spawnParticle(
          "INSANE!",
          x,
          y - 80,
          "#ff4d6d"
        );

      }

      window.COI.ui.msg(
        `🔥 Combo x${state.comboChain}`
      );

    }

    // =========================
    // NORMAL HIT
    // =========================

    else {

      state.hotStreak = 0;

      const broken = state.comboChain || 0;

      comboExplosion(broken, x, y);

      state.comboChain = 0;

      fx.spawnParticle(
        "+",
        x,
        y,
        "#ffffff"
      );

    }

    // =========================
    // GAIN
    // =========================

    const gain =
      state.clickPower *
      state.clickMult *
      multiplier;

    state.candyOrbs += gain;

    state.totalEarned += gain;

    state.totalCandyEarned += gain;

    // =========================
    // WATERFALL
    // =========================

    if (
      !state.waterfallUnlocked &&
      state.totalCandyEarned >= 1000
    ) {

      state.waterfallUnlocked = true;

      window.COI.ui.msg(
        "🌊 Waterfall Unlocked!"
      );

      save.saveGame();

    }

    // =========================
    // FX
    // =========================

    fx.playClickSound();

    updateComboUI();

    checkAchievements();

    window.COI.ui.updateHUD();

  }

  // =========================
  // BUILDINGS
  // =========================

  function buyBuilding(id) {

    const b = econ.getBuilding(id);

    if (!b) return;

    if (econ.isBuildingLocked(b)) {

      window.COI.ui.msg(
        `Need ${econ.formatNumber(b.unlockAt)}`,
        false
      );

      return;

    }

    const amount =
      window.COI.ui.getResolvedBuyCount(b);

    if (amount <= 0) return;

    const price =
      econ.getBuildingTotalCost(b, amount);

    if (state.candyOrbs < price) {

      window.COI.ui.msg(
        `Need ${econ.formatNumber(price - state.candyOrbs)} more`,
        false
      );

      return;

    }

    state.candyOrbs -= price;

    state.totalSpent += price;

    b.count += amount;

    fx.playBuySound();

    window.COI.ui.msg(
      `${b.name} x${amount}`
    );

    window.COI.ui.updateAll();

  }

  // =========================
  // SELL BUILDING
  // =========================

  function sellBuilding(id) {

    const b = econ.getBuilding(id);

    if (!b) return;

    if (b.count <= 0) return;

    const amount =
      Math.min(
        b.count,
        window.COI.ui.getResolvedSellCount(b)
      );

    const refund =
      econ.getBuildingSellRefund(b, amount);

    b.count -= amount;

    state.candyOrbs += refund;

    state.totalSold += amount;

    state.totalSoldValue += refund;

    fx.playBuySound();

    window.COI.ui.msg(
      `Sold x${amount}`
    );

    window.COI.ui.updateAll();

  }

  // =========================
  // BUY UPGRADE
  // =========================

  function buyUpgrade(id) {

    const upg =
      state.upgrades.find(u => u.id === id);

    if (!upg) return;

    if (state.clickUpgradesBought.has(id)) return;

    if (state.candyOrbs < upg.cost) {

      window.COI.ui.msg(
        `Need ${econ.formatNumber(upg.cost - state.candyOrbs)}`,
        false
      );

      return;

    }

    state.candyOrbs -= upg.cost;

    state.totalSpent += upg.cost;

    state.clickUpgradesBought.add(id);

    upg.effect();

    fx.playBuySound();

    window.COI.ui.msg(
      `${upg.name} purchased`
    );

    window.COI.ui.updateAll();

  }

  // =========================
  // PRESTIGE
  // =========================

  function prestigeReset() {

    const gain =
      econ.getPrestigeGain();

    if (gain < 1) {

      window.COI.ui.msg(
        "Need 100,000 earned",
        false
      );

      return;

    }

    if (!confirm(`Prestige for ${gain} points?`)) {
      return;
    }

    state.prestige += gain;

    state.prestigePoints += gain;

    state.candyOrbs = 0;

    state.totalEarned = 0;

    state.totalCandyEarned = 0;

    state.comboChain = 0;

    state.bestCombo = 0;

    for (const b of state.buildings) {
      b.count = 0;
    }

    fx.playPrestigeSound();

    fx.shake();

    window.COI.ui.msg(
      `✨ Prestige +${gain}`
    );

    save.saveGame();

    window.COI.ui.updateAll();

  }

  // =========================
  // WATERFALL
  // =========================

  function updateWaterfall() {

    if (
      state.waterfallUnlocked
    ) {

      fx.spawnWaterfall(
        state.lastTick
      );

    }

  }

  // =========================
  // EVENTS
  // =========================

  if (els.orbImg) {
    els.orbImg.addEventListener(
      "click",
      clickOrb
    );
  }

  if (els.shop) {

    els.shop.addEventListener("click", (e) => {

      const buy =
        e.target.closest("[data-buy-building]");

      const sell =
        e.target.closest("[data-sell-building]");

      if (buy) {
        buyBuilding(buy.dataset.buyBuilding);
      }

      if (sell) {
        sellBuilding(sell.dataset.sellBuilding);
      }

    });

  }

  if (els.upgrades) {

    els.upgrades.addEventListener("click", (e) => {

      const btn =
        e.target.closest("[data-buy-upgrade]");

      if (btn) {
        buyUpgrade(btn.dataset.buyUpgrade);
      }

    });

  }

  if (els.prestige) {

    els.prestige.addEventListener("click", (e) => {

      if (e.target.id === "prestigeBtn") {
        prestigeReset();
      }

    });

  }

  // =========================
  // GAME LOOP
  // =========================

  setInterval(() => {

    if (!state.paused) {

      const cps =
        econ.getCPS();

      const gain =
        cps / 10;

      state.candyOrbs += gain;

      state.totalEarned += gain;

      state.totalCandyEarned += gain;

      // =========================
      // COMBO TIMER
      // =========================

      if (state.comboTimer > 0) {

        state.comboTimer -= 0.1;

        if (state.comboTimer <= 0) {

          const broken =
            state.comboChain || 0;

          comboExplosion(
            broken,
            window.innerWidth / 2,
            window.innerHeight / 2
          );

          state.comboChain = 0;

        }

      }

      updateComboUI();

      updateWaterfall();

    }

    state.lastTick = Date.now();

    // SAFE UI CALLS

    if (window.COI.ui) {

      window.COI.ui.updateHUD();

      window.COI.ui.refreshShopUI();

      window.COI.ui.refreshUpgradesUI();

    }

    checkAchievements();

  }, 100);

  // =========================
  // START
  // =========================

  save.loadGame();

  if (window.COI.ui) {
    window.COI.ui.updateAll();
  }

})();
