(() => {
  const { state } = window.COI;

  const SAVE_KEY = "candy_orb_idle_save_v1";

  // =========================
  // SAVE GAME
  // =========================
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

        totalClicks: state.totalClicks,
        totalEarned: state.totalEarned,
        totalSpent: state.totalSpent,

        hotStreak: state.hotStreak,
        bestHotStreak: state.bestHotStreak,

        buildings: state.buildings,

        waterfallUnlocked: state.waterfallUnlocked,

        clickUpgradesBought: Array.from(state.clickUpgradesBought),
        prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
        achievementsDone: Array.from(state.achievementsDone),

        startedAt: state.startedAt
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  // =========================
  // LOAD GAME
  // =========================
  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);

      state.candyOrbs = data.candyOrbs ?? 0;
      state.totalCandyEarned = data.totalCandyEarned ?? 0;

      state.clickPower = data.clickPower ?? 1;
      state.critChance = data.critChance ?? 0.10;
      state.critMult = data.critMult ?? 1;

      state.prestige = data.prestige ?? 0;
      state.prestigePoints = data.prestigePoints ?? 0;

      state.totalClicks = data.totalClicks ?? 0;
      state.totalEarned = data.totalEarned ?? 0;
      state.totalSpent = data.totalSpent ?? 0;

      state.hotStreak = data.hotStreak ?? 0;
      state.bestHotStreak = data.bestHotStreak ?? 0;

      state.waterfallUnlocked = data.waterfallUnlocked ?? false;

      if (Array.isArray(data.buildings)) {
        data.buildings.forEach((b, i) => {
          if (state.buildings[i]) {
            state.buildings[i].count = b.count ?? 0;
          }
        });
      }

      state.clickUpgradesBought = new Set(data.clickUpgradesBought || []);
      state.prestigeUpgradesBought = new Set(data.prestigeUpgradesBought || []);
      state.achievementsDone = new Set(data.achievementsDone || []);

      state.startedAt = data.startedAt ?? Date.now();

    } catch (e) {
      console.warn("Load failed:", e);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  // =========================
  // EXPORT SAVE (FIXED)
  // =========================
  function exportState() {
    return JSON.stringify({
      candyOrbs: state.candyOrbs,
      totalCandyEarned: state.totalCandyEarned,

      clickPower: state.clickPower,
      critChance: state.critChance,
      critMult: state.critMult,

      prestige: state.prestige,
      prestigePoints: state.prestigePoints,

      totalClicks: state.totalClicks,
      totalEarned: state.totalEarned,
      totalSpent: state.totalSpent,

      hotStreak: state.hotStreak,
      bestHotStreak: state.bestHotStreak,

      buildings: state.buildings,

      waterfallUnlocked: state.waterfallUnlocked,

      clickUpgradesBought: Array.from(state.clickUpgradesBought),
      prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
      achievementsDone: Array.from(state.achievementsDone),

      startedAt: state.startedAt
    });
  }

  // =========================
  // IMPORT SAVE (FIXED)
  // =========================
  function importState(json) {
    try {
      const data = JSON.parse(json);

      state.candyOrbs = data.candyOrbs ?? state.candyOrbs;
      state.totalCandyEarned = data.totalCandyEarned ?? state.totalCandyEarned;

      state.clickPower = data.clickPower ?? state.clickPower;
      state.critChance = data.critChance ?? state.critChance;
      state.critMult = data.critMult ?? state.critMult;

      state.prestige = data.prestige ?? state.prestige;
      state.prestigePoints = data.prestigePoints ?? state.prestigePoints;

      state.totalClicks = data.totalClicks ?? state.totalClicks;
      state.totalEarned = data.totalEarned ?? state.totalEarned;
      state.totalSpent = data.totalSpent ?? state.totalSpent;

      state.hotStreak = data.hotStreak ?? state.hotStreak;
      state.bestHotStreak = data.bestHotStreak ?? state.bestHotStreak;

      state.waterfallUnlocked = data.waterfallUnlocked ?? state.waterfallUnlocked;

      if (Array.isArray(data.buildings)) {
        data.buildings.forEach((b, i) => {
          if (state.buildings[i]) {
            state.buildings[i].count = b.count ?? 0;
          }
        });
      }

      state.clickUpgradesBought = new Set(data.clickUpgradesBought || []);
      state.prestigeUpgradesBought = new Set(data.prestigeUpgradesBought || []);
      state.achievementsDone = new Set(data.achievementsDone || []);

    } catch (e) {
      console.warn("Import failed:", e);
    }
  }

  // =========================
  // RESET
  // =========================
  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  // =========================
  // EXPOSE API
  // =========================
  window.COI.save = {
    saveGame,
    loadGame,
    resetSave,
    exportState,
    importState
  };
})();
