(() => {
  const { state } = window.COI;
  const cfg = window.COI_CONFIG;
  const { econ } = window.COI;

  function exportState() {
    return {
      candyOrbs: state.candyOrbs,
      clickPower: state.clickPower,
      critChance: state.critChance,
      critMult: state.critMult,
      prestige: state.prestige,
      prestigePoints: state.prestigePoints,
      buildingMult: state.buildingMult,
      clickMult: state.clickMult,
      costMult: state.costMult,
      prestigeGainMult: state.prestigeGainMult,

      totalClicks: state.totalClicks,
      totalEarned: state.totalEarned,
      totalSpent: state.totalSpent,
      totalCrits: state.totalCrits,
      totalSold: state.totalSold,
      totalSoldValue: state.totalSoldValue,
      hotStreak: state.hotStreak,
      bestHotStreak: state.bestHotStreak,
      lastPrestigeEarned: state.lastPrestigeEarned,

      buildings: state.buildings.map(b=>({ id:b.id, count:b.count, bonusMult:b.bonusMult })),
      clickUpgradesBought: Array.from(state.clickUpgradesBought),
      prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
      achievementsDone: Array.from(state.achievementsDone),

      waterfall: state.waterfall,
      paused: state.paused,
      reduceMotion: state.reduceMotion,
      startedAt: state.startedAt,
      lastTick: Date.now(),
    };
  }

  function importState(data) {
    state.candyOrbs = data.candyOrbs || 0;
    state.clickPower = data.clickPower || 1;
    state.critChance = data.critChance || 0.10;
    state.critMult = data.critMult || 1;
    state.prestige = data.prestige || 0;
    state.prestigePoints = data.prestigePoints || 0;
    state.buildingMult = data.buildingMult || 1;
    state.clickMult = data.clickMult || 1;
    state.costMult = data.costMult || 1;
    state.prestigeGainMult = data.prestigeGainMult || 1;

    state.totalClicks = data.totalClicks || 0;
    state.totalEarned = data.totalEarned || 0;
    state.totalSpent = data.totalSpent || 0;
    state.totalCrits = data.totalCrits || 0;
    state.totalSold = data.totalSold || 0;
    state.totalSoldValue = data.totalSoldValue || 0;
    state.hotStreak = data.hotStreak || 0;
    state.bestHotStreak = data.bestHotStreak || 0;
    state.lastPrestigeEarned = data.lastPrestigeEarned || 0;

    for (const b of data.buildings || []) {
      const bld = econ.getBuilding(b.id);
      if (bld) { bld.count = b.count; bld.bonusMult = b.bonusMult; }
    }

    state.clickUpgradesBought = new Set(data.clickUpgradesBought || []);
    state.prestigeUpgradesBought = new Set(data.prestigeUpgradesBought || []);
    state.achievementsDone = new Set(data.achievementsDone || []);

    state.waterfall = data.waterfall ?? true;
    state.paused = data.paused ?? false;
    state.reduceMotion = data.reduceMotion ?? false;
    state.startedAt = data.startedAt || Date.now();
    state.lastTick = data.lastTick || Date.now();

    econ.updateAchievementBonus();
  }

  function saveGame() {
    state.lastTick = Date.now();
    if (state.autoSave) localStorage.setItem("candyOrbIdleSave", JSON.stringify(exportState()));
  }

  function loadGame() {
    const saved = localStorage.getItem("candyOrbIdleSave");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      const last = Number(data.lastTick || Date.now());
      importState(data);

      const now = Date.now();
      const offlineSeconds = Math.max(0, Math.min(cfg.offlineCapSeconds, (now - last) / 1000));
      if (offlineSeconds >= 1 && !state.paused) {
        const cps = econ.getCPS();
        const gained = cps * offlineSeconds;
        if (gained > 0) {
          state.candyOrbs += gained;
          state.totalEarned += gained;
          window.COI.ui.msg(`Offline +${econ.formatNumber(gained)} (${Math.floor(offlineSeconds)}s)`);
        }
      }
      state.lastTick = now;
    } catch (e) {
      console.error("Failed to load save:", e);
    }
  }

  function resetToDefaults() {
    state.candyOrbs = 0;
    state.clickPower = 1;
    state.critChance = 0.10;
    state.critMult = 1;
    state.prestige = 0;
    state.prestigePoints = 0;
    state.buildingMult = 1;
    state.clickMult = 1;
    state.costMult = 1;
    state.prestigeGainMult = 1;
    state.cpsFromUpgrades = 1;
    state.achievementBonus = 1;

    state.clickUpgradesBought = new Set();
    state.prestigeUpgradesBought = new Set();
    state.achievementsDone = new Set();

    state.totalClicks = 0;
    state.totalEarned = 0;
    state.totalSpent = 0;
    state.totalCrits = 0;
    state.totalSold = 0;
    state.totalSoldValue = 0;
    state.hotStreak = 0;
    state.bestHotStreak = 0;
    state.lastPrestigeEarned = 0;

    state.waterfall = true;
    state.paused = false;
    state.reduceMotion = false;
    state.startedAt = Date.now();
    state.lastTick = Date.now();

    for (const b of state.buildings) { b.count = 0; b.bonusMult = 1; }
    econ.updateAchievementBonus();
  }

  function restartGame() {
    if (!confirm("Restart? This deletes your save and resets everything.")) return;
    resetToDefaults();
    localStorage.removeItem("candyOrbIdleSave");
    window.COI.ui.msg("Restarted.");
    window.COI.ui.updateAll();
  }

  window.COI.save = {
    exportState,
    importState,
    saveGame,
    loadGame,
    restartGame,
  };
})();

