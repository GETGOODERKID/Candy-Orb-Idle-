(() => {
  const { els, state } = window.COI;
  const { econ, ui, fx, save } = window.COI;

  function checkAchievements() {
    const list = window.COI.achievements || [];
    for (const a of list) {
      if (!state.achievementsDone.has(a.id) && a.check({ state, getCPS: econ.getCPS, getBuildingCount: econ.getBuildingCount })) {
        state.achievementsDone.add(a.id);
        a.reward({ updateAchievementBonus: econ.updateAchievementBonus });
        ui.msg(`Achievement: ${a.name}`);
        fx.playTone(880, 0.1, "triangle", 2);
      }
    }
  }

  function clickOrb(ev) {
    state.totalClicks += 1;
    const x = ev?.clientX ?? window.innerWidth / 2;
    const y = ev?.clientY ?? window.innerHeight / 2;

    let multiplier = 1, critText = "";
    const critRoll = Math.random();
    if (critRoll < Math.min(0.99, state.critChance)) {
      state.totalCrits += 1;
      state.hotStreak += 1;
      if (state.hotStreak > state.bestHotStreak) state.bestHotStreak = state.hotStreak;
      multiplier = Math.max(2, Math.round(2 * state.critMult));
      critText = `Crit x${multiplier}`;
    } else {
      state.hotStreak = 0;
    }

    const gain = state.clickPower * state.clickMult * multiplier;
    state.candyOrbs += gain;
    state.totalEarned += gain;

    fx.playClickSound();
    if (multiplier > 1) {
      fx.playCritSound();
      fx.shake();
      fx.spawnParticle(`x${multiplier}`, x, y, "#f1c04d");
      if (critText) ui.msg(critText);
    } else {
      fx.spawnParticle("+", x, y);
    }

    checkAchievements();
    ui.updateHUD();
  }

  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;
    if (econ.isBuildingLocked(b)) { ui.msg(`Locked - earn ${econ.formatNumber(b.unlockAt)} first`, false); return; }

    const amount = ui.getResolvedBuyCount(b);
    if (amount <= 0) { ui.msg("Can't buy any right now", false); return; }
    const price = econ.getBuildingTotalCost(b, amount);
    if (state.candyOrbs < price) { ui.msg(`Need ${econ.formatNumber(price - state.candyOrbs)} more`, false); return; }

    state.candyOrbs -= price;
    state.totalSpent += price;
    b.count += amount;
    fx.playBuySound();
    ui.msg(`${b.name} x${amount} (${b.count} total)`);
    ui.updateAll();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count === 0) return;
    const amount = Math.min(b.count, ui.getResolvedSellCount(b));
    if (amount <= 0) return;

    const refund = econ.getBuildingSellRefund(b, amount);
    state.candyOrbs += refund;
    b.count -= amount;
    state.totalSold += amount;
    state.totalSoldValue += refund;
    fx.playBuySound();
    ui.msg(`Sold x${amount} for ${econ.formatNumber(refund)}`);
    ui.updateAll();
  }

  function buyUpgrade(id) {
    const upg = state.upgrades.find(u=>u.id===id);
    if (!upg) return;
    if (state.clickUpgradesBought.has(id)) return;
    if (state.candyOrbs < upg.cost) { ui.msg(`Need ${econ.formatNumber(upg.cost - state.candyOrbs)} more`, false); return; }
    state.candyOrbs -= upg.cost;
    state.totalSpent += upg.cost;
    state.clickUpgradesBought.add(id);
    upg.effect();
    fx.playBuySound();
    ui.msg(`${upg.name} unlocked!`);
    ui.updateAll();
  }

  function prestigeReset() {
    const gain = econ.getPrestigeGain();
    if (gain < 1) { ui.msg("Need 100,000 earned to prestige", false); return; }
    if (!confirm(`Prestige and gain ${gain} point(s)? All progress resets.`)) return;

    state.prestige += gain;
    state.prestigePoints += gain;
    state.lastPrestigeEarned = state.prestigePoints;
    state.totalEarned = 0;
    state.candyOrbs = 0;
    state.clickPower = 1;
    state.critChance = 0.10;
    state.critMult = 1;
    state.hotStreak = 0;
    state.buildingMult = 1;
    state.clickMult = 1;
    state.costMult = 1;
    state.cpsFromUpgrades = 1;
    state.clickUpgradesBought.clear();

    for (const b of state.buildings) { b.count = 0; b.bonusMult = 1; }
    fx.playPrestigeSound();
    fx.shake();
    ui.msg(`Prestige +${gain}! Total: ${state.prestige}`);
    ui.updateAll();
    save.saveGame();
  }

  function buyPrestigeUpgrade(id) {
    const upg = state.prestigeUpgrades.find(p=>p.id===id);
    if (!upg) return;
    if (state.prestigeUpgradesBought.has(id)) return;
    if (state.prestigePoints < upg.cost) { ui.msg(`Need ${upg.cost - state.prestigePoints} more`, false); return; }

    state.prestigePoints -= upg.cost;
    state.prestigeUpgradesBought.add(id);
    upg.effect();
    fx.playPrestigeSound();
    ui.msg(`${upg.name} purchased!`);
    ui.updateAll();
  }

  function attachDelegatedHandlers() {
    els.shop.addEventListener("click", (ev) => {
      const target = ev.target.closest?.("button");
      if (!target || target.disabled) return;
      if (target.dataset.buyBuilding) buyBuilding(target.dataset.buyBuilding);
      else if (target.dataset.sellBuilding) sellBuilding(target.dataset.sellBuilding);
    });

    els.upgrades.addEventListener("click", (ev) => {
      const target = ev.target.closest?.("button");
      if (!target || target.disabled) return;
      if (target.dataset.buyUpgrade) buyUpgrade(target.dataset.buyUpgrade);
    });

    els.prestige.addEventListener("click", (ev) => {
      const target = ev.target.closest?.("button");
      if (!target || target.disabled) return;
      if (target.id === "prestigeBtn") prestigeReset();
      else if (target.dataset.buyPrestige) buyPrestigeUpgrade(target.dataset.buyPrestige);
    });
  }

  // Tabs
  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", ()=> {
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
      tab.classList.add("active");
      const panelId = tab.dataset.tab;
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add("active");
    });
  }

  // Orb click
  const orbImg = document.getElementById("orbImg");
  const orbFallback = document.getElementById("orbFallback");
  orbImg.addEventListener("click", clickOrb);
  orbFallback.addEventListener("click", clickOrb);
  orbImg.addEventListener("error", () => { orbImg.style.display = "none"; orbFallback.style.display = "block"; });

  // Hotkeys (shop only)
  document.addEventListener("keydown", (ev) => {
    if (!els.shop.classList.contains("active")) return;
    if (ev.target && (ev.target.tagName === "INPUT" || ev.target.tagName === "TEXTAREA")) return;
    const code = ev.code;
    if (ev.key === "1" || code === "Digit1" || code === "Numpad1") { ev.preventDefault(); ui.setBuyMode(1); }
    else if (ev.key === "2" || code === "Digit2" || code === "Numpad2") { ev.preventDefault(); ui.setBuyMode(10); }
    else if (ev.key === "3" || code === "Digit3" || code === "Numpad3") { ev.preventDefault(); ui.setBuyMode(100); }
    else if (ev.key === "4" || code === "Digit4" || code === "Numpad4") { ev.preventDefault(); ui.setBuyMode("max"); }
  });

  attachDelegatedHandlers();

  // Main tick (smooth UI updates without re-rendering panels)
  setInterval(() => {
    if (!state.paused) {
      const cps = econ.getCPS();
      state.candyOrbs += cps / 10;
      state.totalEarned += cps / 10;
    }
    state.lastTick = Date.now();
    ui.updateHUD();
    ui.refreshShopUI();
    ui.refreshUpgradesUI();
    checkAchievements();
    fx.spawnWaterfall(state.lastTick);
  }, 100);

  // Auto save
  setInterval(save.saveGame, 10000);

  // Boot
  save.loadGame();
  ui.updateAll();
})();
