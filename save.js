(() => {
  const { state } = window.COI;

  const SAVE_KEY = "candy_orb_idle_save_v1";

  // =========================
  // BUILD SAVE DATA
  // =========================
  function buildSaveData() {
    return {
      // currency
      candyOrbs: state.candyOrbs,
      totalCandyEarned: state.totalCandyEarned,

      // click stats
      clickPower: state.clickPower,
      critChance: state.critChance,
      critMult: state.critMult,

      // combo system
      combo: state.combo ?? 0,
      comboMult: state.comboMult ?? 1,
      bestCombo: state.bestCombo ?? 0,
      comboLevel: state.comboLevel ?? 0,
      comboExpiresAt: state.comboExpiresAt ?? 0,

      // prestige
      prestige: state.prestige,
      prestigePoints: state.prestigePoints,
      lastPrestigeEarned: state.lastPrestigeEarned ?? 0,

      // totals
      totalClicks: state.totalClicks,
      totalEarned: state.totalEarned,
      totalSpent: state.totalSpent,
      totalCrits: state.totalCrits ?? 0,
      totalSold: state.totalSold ?? 0,
      totalSoldValue: state.totalSoldValue ?? 0,

      // streaks
      hotStreak: state.hotStreak,
      bestHotStreak: state.bestHotStreak,

      // gameplay
      buyMode: state.buyMode ?? 1,
      paused: state.paused ?? false,
      reduceMotion: state.reduceMotion ?? false,

      // settings
      sound: state.sound ?? true,
      soundVolume: state.soundVolume ?? 0.4,
      clickSoundVol: state.clickSoundVol ?? 1,
      buySoundVol: state.buySoundVol ?? 0.5,
      critSoundVol: state.critSoundVol ?? 0.5,
      prestigeSoundVol: state.prestigeSoundVol ?? 0.5,

      particles: state.particles ?? true,
      waterfall: state.waterfall ?? true,
      autoSave: state.autoSave ?? true,
      useShortFormat: state.useShortFormat ?? true,

      // unlocks
      waterfallUnlocked: state.waterfallUnlocked ?? false,

      // collections
      buildings: state.buildings.map(b => ({
        id: b.id,
        count: b.count ?? 0,
        bonusMult: b.bonusMult ?? 1
      })),

      clickUpgradesBought: Array.from(state.clickUpgradesBought || []),
      prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought || []),
      achievementsDone: Array.from(state.achievementsDone || []),

      // time
      startedAt: state.startedAt ?? Date.now(),
      lastOnline: Date.now(),

      // version
      version: 2
    };
  }

  // =========================
  // SAVE GAME
  // =========================
  function saveGame() {
    try {
      if (state.autoSave === false) return;

      const data = buildSaveData();

      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
      );

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

      if (!raw) {
        console.log("No save found.");
        return;
      }

      const data = JSON.parse(raw);

      // =====================
      // BASIC
      // =====================

      state.candyOrbs = data.candyOrbs ?? 0;
      state.totalCandyEarned = data.totalCandyEarned ?? 0;

      // =====================
      // CLICK
      // =====================

      state.clickPower = data.clickPower ?? 1;
      state.critChance = data.critChance ?? 0.10;
      state.critMult = data.critMult ?? 1;

      // =====================
      // COMBO
      // =====================

      state.combo = data.combo ?? 0;
      state.comboMult = data.comboMult ?? 1;
      state.bestCombo = data.bestCombo ?? 0;
      state.comboLevel = data.comboLevel ?? 0;
      state.comboExpiresAt = data.comboExpiresAt ?? 0;

      // =====================
      // PRESTIGE
      // =====================

      state.prestige = data.prestige ?? 0;
      state.prestigePoints = data.prestigePoints ?? 0;
      state.lastPrestigeEarned = data.lastPrestigeEarned ?? 0;

      // =====================
      // TOTALS
      // =====================

      state.totalClicks = data.totalClicks ?? 0;
      state.totalEarned = data.totalEarned ?? 0;
      state.totalSpent = data.totalSpent ?? 0;

      state.totalCrits = data.totalCrits ?? 0;
      state.totalSold = data.totalSold ?? 0;
      state.totalSoldValue = data.totalSoldValue ?? 0;

      // =====================
      // STREAKS
      // =====================

      state.hotStreak = data.hotStreak ?? 0;
      state.bestHotStreak = data.bestHotStreak ?? 0;

      // =====================
      // SETTINGS
      // =====================

      state.sound = data.sound ?? true;
      state.soundVolume = data.soundVolume ?? 0.4;

      state.clickSoundVol = data.clickSoundVol ?? 1;
      state.buySoundVol = data.buySoundVol ?? 0.5;
      state.critSoundVol = data.critSoundVol ?? 0.5;
      state.prestigeSoundVol = data.prestigeSoundVol ?? 0.5;

      state.particles = data.particles ?? true;
      state.waterfall = data.waterfall ?? true;
      state.autoSave = data.autoSave ?? true;
      state.useShortFormat = data.useShortFormat ?? true;

      // =====================
      // GAMEPLAY
      // =====================

      state.buyMode = data.buyMode ?? 1;
      state.paused = data.paused ?? false;
      state.reduceMotion = data.reduceMotion ?? false;

      // =====================
      // UNLOCKS
      // =====================

      state.waterfallUnlocked =
        data.waterfallUnlocked ?? false;

      // =====================
      // BUILDINGS
      // =====================

      if (Array.isArray(data.buildings)) {

        data.buildings.forEach((savedBuilding) => {

          const existing = state.buildings.find(
            b => b.id === savedBuilding.id
          );

          if (!existing) return;

          existing.count =
            savedBuilding.count ?? 0;

          existing.bonusMult =
            savedBuilding.bonusMult ?? 1;
        });
      }

      // =====================
      // SETS
      // =====================

      state.clickUpgradesBought =
        new Set(data.clickUpgradesBought || []);

      state.prestigeUpgradesBought =
        new Set(data.prestigeUpgradesBought || []);

      state.achievementsDone =
        new Set(data.achievementsDone || []);

      // =====================
      // TIME
      // =====================

      state.startedAt =
        data.startedAt ?? Date.now();

      // =====================
      // OFFLINE PROGRESS
      // =====================

      const now = Date.now();

      const lastOnline =
        data.lastOnline ?? now;

      const secondsOffline =
        Math.floor((now - lastOnline) / 1000);

      const cappedOffline =
        Math.min(secondsOffline, 7200);

      if (
        cappedOffline > 5 &&
        window.COI?.econ?.getCPS
      ) {
        const cps = window.COI.econ.getCPS();

        const earnedOffline =
          cps * cappedOffline;

        state.candyOrbs += earnedOffline;
        state.totalEarned += earnedOffline;
        state.totalCandyEarned += earnedOffline;

        if (window.COI?.ui?.msg) {
          window.COI.ui.msg(
            `Offline Progress: +${window.COI.econ.formatNumber(earnedOffline)}`
          );
        }
      }

      console.log("Save loaded.");

    } catch (e) {

      console.warn("Load failed:", e);

      localStorage.removeItem(SAVE_KEY);
    }
  }

  // =========================
  // EXPORT SAVE
  // =========================
  function exportState() {
    return JSON.stringify(
      buildSaveData()
    );
  }

  // =========================
  // IMPORT SAVE
  // =========================
  function importState(json) {

    try {

      const data =
        typeof json === "string"
          ? JSON.parse(json)
          : json;

      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
      );

      loadGame();

      saveGame();

      console.log("Save imported.");

    } catch (e) {

      console.warn("Import failed:", e);

      alert("Invalid save data.");
    }
  }

  // =========================
  // HARD RESET
  // =========================
  function resetSave() {

    const confirmed = confirm(
      "Delete your entire save?"
    );

    if (!confirmed) return;

    localStorage.removeItem(SAVE_KEY);

    location.reload();
  }

  // =========================
  // RESTART GAME
  // =========================
  function restartGame() {
    resetSave();
  }

  // =========================
  // FORCE SAVE
  // =========================
  function forceSave() {
    const old = state.autoSave;

    state.autoSave = true;

    saveGame();

    state.autoSave = old;
  }

  // =========================
  // AUTO SAVE LOOP
  // =========================
  setInterval(() => {

    if (!state.autoSave) return;

    saveGame();

  }, 10000);

  // =========================
  // SAVE ON TAB CLOSE
  // =========================
  window.addEventListener(
    "beforeunload",
    () => {
      forceSave();
    }
  );

  // =========================
  // SAVE ON TAB HIDDEN
  // =========================
  document.addEventListener(
    "visibilitychange",
    () => {

      if (document.hidden) {
        forceSave();
      }
    }
  );

  // =========================
  // EXPOSE API
  // =========================
  window.COI.save = {

    saveGame,
    loadGame,

    exportState,
    importState,

    resetSave,
    restartGame,

    forceSave
  };

})();
