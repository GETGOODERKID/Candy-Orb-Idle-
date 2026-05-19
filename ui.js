(() => {
  const { state } = window.COI;

  const SAVE_KEY = "candy_orb_idle_save_v1";

  // =========================================================
  // SAVE GAME
  // =========================================================
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
        prestigeGainMult: state.prestigeGainMult,
        cpsFromUpgrades: state.cpsFromUpgrades,
        achievementBonus: state.achievementBonus,

        useShortFormat: state.useShortFormat,
        sound: state.sound,
        soundVolume: state.soundVolume,
        clickSoundVol: state.clickSoundVol,
        buySoundVol: state.buySoundVol,
        critSoundVol: state.critSoundVol,
        prestigeSoundVol: state.prestigeSoundVol,
        particles: state.particles,
        autoSave: state.autoSave,

        totalClicks: state.totalClicks,
        totalEarned: state.totalEarned,
        totalSpent: state.totalSpent,
        totalCrits: state.totalCrits,
        totalSold: state.totalSold,
        totalSoldValue: state.totalSoldValue,

        hotStreak: state.hotStreak,
        bestHotStreak: state.bestHotStreak,

        lastPrestigeEarned: state.lastPrestigeEarned,

        buildings: state.buildings,

        clickUpgradesBought: Array.from(state.clickUpgradesBought),
        prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
        achievementsDone: Array.from(state.achievementsDone),

        waterfallUnlocked: state.waterfallUnlocked,

        paused: state.paused,
        reduceMotion: state.reduceMotion,

        startedAt: state.startedAt,
        lastTick: state.lastTick,

        buyMode: state.buyMode
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  // =========================================================
  // LOAD GAME
  // =========================================================
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

      state.buildingMult = data.buildingMult ?? 1;
      state.clickMult = data.clickMult ?? 1;
      state.costMult = data.costMult ?? 1;
      state.prestigeGainMult = data.prestigeGainMult ?? 1;
      state.cpsFromUpgrades = data.cpsFromUpgrades ?? 1;
      state.achievementBonus = data.achievementBonus ?? 1;

      state.useShortFormat = data.useShortFormat ?? true;
      state.sound = data.sound ?? true;
      state.soundVolume = data.soundVolume ?? 0.4;
      state.clickSoundVol = data.clickSoundVol ?? 1.0;
      state.buySoundVol = data.buySoundVol ?? 0.5;
      state.critSoundVol = data.critSoundVol ?? 0.5;
      state.prestigeSoundVol = data.prestigeSoundVol ?? 0.5;
      state.particles = data.particles ?? true;
      state.autoSave = data.autoSave ?? true;

      state.totalClicks = data.totalClicks ?? 0;
      state.totalEarned = data.totalEarned ?? 0;
      state.totalSpent = data.totalSpent ?? 0;
      state.totalCrits = data.totalCrits ?? 0;
      state.totalSold = data.totalSold ?? 0;
      state.totalSoldValue = data.totalSoldValue ?? 0;

      state.hotStreak = data.hotStreak ?? 0;
      state.bestHotStreak = data.bestHotStreak ?? 0;

      state.lastPrestigeEarned = data.lastPrestigeEarned ?? 0;

      state.waterfallUnlocked = data.waterfallUnlocked ?? false;

      state.paused = data.paused ?? false;
      state.reduceMotion = data.reduceMotion ?? false;

      state.startedAt = data.startedAt ?? Date.now();
      state.lastTick = data.lastTick ?? Date.now();

      state.buyMode = data.buyMode ?? 1;

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
      console.warn("Load failed:", e);
      localStorage.removeItem(SAVE_KEY);
    }
  }

  // =========================================================
  // EXPORT STATE (UI DEPENDS ON THIS)
  // =========================================================
  function exportState() {
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
      prestigeGainMult: state.prestigeGainMult,
      cpsFromUpgrades: state.cpsFromUpgrades,
      achievementBonus: state.achievementBonus,

      useShortFormat: state.useShortFormat,
      sound: state.sound,
      soundVolume: state.soundVolume,
      clickSoundVol: state.clickSoundVol,
      buySoundVol: state.buySoundVol,
      critSoundVol: state.critSoundVol,
      prestigeSoundVol: state.prestigeSoundVol,
      particles: state.particles,
      autoSave: state.autoSave,

      totalClicks: state.totalClicks,
      totalEarned: state.totalEarned,
      totalSpent: state.totalSpent,
      totalCrits: state.totalCrits,
      totalSold: state.totalSold,
      totalSoldValue: state.totalSoldValue,

      hotStreak: state.hotStreak,
      bestHotStreak: state.bestHotStreak,

      lastPrestigeEarned: state.lastPrestigeEarned,

      buildings: state.buildings,

      clickUpgradesBought: Array.from(state.clickUpgradesBought),
      prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
      achievementsDone: Array.from(state.achievementsDone),

      waterfallUnlocked: state.waterfallUnlocked,

      paused: state.paused,
      reduceMotion: state.reduceMotion,

      startedAt: state.startedAt,
      lastTick: state.lastTick,

      buyMode: state.buyMode
    };

    return btoa(JSON.stringify(data));
  }

  // =========================================================
  // IMPORT STATE
  // =========================================================
  function importState(encoded) {
    try {
      const data = JSON.parse(atob(encoded));

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      loadGame();
    } catch (e) {
      console.warn("Import failed:", e);
    }
  }

  // =========================================================
  // RESET SAVE
  // =========================================================
  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }

  // =========================================================
  // EXPOSE API
  // =========================================================
  window.COI.save = {
    saveGame,
    loadGame,
    resetSave,
    exportState,
    importState
  };
})();
