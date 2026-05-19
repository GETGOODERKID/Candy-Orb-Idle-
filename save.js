(() => {
  const { state } = window.COI;

  const SAVE_KEY = "candy_orb_idle_save_v1";

  function saveGame() {
    try {
      const data = {
        candyOrbs: state.candyOrbs,
        totalCandyEarned: state.totalCandyEarned,

        clickPower: state.clickPower,
        critChance: state.critChance,
        critMult: state.critMult,

        prestige: state.prestige,
        prestigePoints: state.prestigePoints,

        buildingMult: state.buildingMult,
        clickMult: state.clickMult,
        costMult: state.costMult,
        cpsFromUpgrades: state.cpsFromUpgrades,

        totalClicks: state.totalClicks,
        totalEarned: state.totalEarned,
        totalSpent: state.totalSpent,
        totalCrits: state.totalCrits,

        hotStreak: state.hotStreak,
        bestHotStreak: state.bestHotStreak,

        buildings: state.buildings,

        // 🔥 IMPORTANT FIX (your waterfall issue)
        waterfallUnlocked: state.waterfallUnlocked,

        clickUpgradesBought: Array.from(state.clickUpgradesBought),
        prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
        achievementsDone: Array.from(state.achievementsDone),

        startedAt: state.startedAt
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("Save failed:", err);
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);

      // Currency
      state.candyOrbs = data.candyOrbs ?? 0;
      state.totalCandyEarned = data.totalCandyEarned ?? 0;

      // Stats
      state.clickPower = data.clickPower ?? 1;
      state.critChance = data.critChance ?? 0.10;
      state.critMult = data.critMult ?? 1;

      state.prestige = data.prestige ?? 0;
      state.prestigePoints = data.prestigePoints ?? 0;

      state.buildingMult = data.buildingMult ?? 1;
      state.clickMult = data.clickMult ?? 1;
      state.costMult = data.costMult ?? 1;
      state.cpsFromUpgrades = data.cpsFromUpgrades ?? 1;

      // Lifetime stats
      state.totalClicks = data.totalClicks ?? 0;
      state.totalEarned = data.totalEarned ?? 0;
      state.totalSpent = data.totalSpent ?? 0;
      state.totalCrits = data.totalCrits ?? 0;

      state.hotStreak = data.hotStreak ?? 0;
      state.bestHotStreak = data.bestHotStreak ?? 0;

      // 🔥 FIX: WATERFALL PERSISTENCE
      state.waterfallUnlocked = data.waterfallUnlocked ?? false;

      // Buildings
      if (Array.isArray(data.buildings)) {
        state.buildings.forEach((b, i) => {
          if (data.buildings[i]) {
            b.count = data.buildings[i].count ?? 0;
            b.bonusMult = data.buildings[i].bonusMult ?? 1;
          }
        });
      }

      // Sets (VERY IMPORTANT FIX)
      state.clickUpgradesBought = new Set(data.clickUpgradesBought || []);
      state.prestigeUpgradesBought = new Set(data.prestigeUpgradesBought || []);
      state.achievementsDone = new Set(data.achievementsDone || []);

      state.startedAt = data.startedAt ?? Date.now();

    } catch (err) {
      console.warn("Load failed, resetting save:", err);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  window.COI = window.COI || {};
  window.COI.save = {
    saveGame,
    loadGame,
    resetSave
  };
})();
