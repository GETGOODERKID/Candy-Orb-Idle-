(() => {
  const { state } = window.COI;

  const SAVE_KEY = "candy_orb_idle_save_v1";

  // =========================
  // BUILD SAVE DATA
  // =========================
  function buildSaveData() {
    return {
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

      totalCrits: state.totalCrits,
      totalSold: state.totalSold,
      totalSoldValue: state.totalSoldValue,

      hotStreak: state.hotStreak,
      bestHotStreak: state.bestHotStreak,

      // combo system
      combo: state.combo ?? 0,
      comboMult: state.comboMult ?? 1,
      bestCombo: state.bestCombo ?? 0,

      // settings
      useShortFormat: state.useShortFormat,
      sound: state.sound,
      soundVolume: state.soundVolume,
      clickSoundVol: state.clickSoundVol,
      buySoundVol: state.buySoundVol,
      critSoundVol: state.critSoundVol,
      prestigeSoundVol: state.prestigeSoundVol,

      particles: state.particles,
      autoSave: state.autoSave,
      waterfall: state.waterfall,
      paused: state.paused,
      reduceMotion: state.reduceMotion,

      // unlocks
      waterfallUnlocked: state.waterfallUnlocked,

      // arrays
      buildings: state.buildings.map(b => ({
        id: b.id,
        count: b.count,
        bonusMult: b.bonusMult ?? 1
      })),

      clickUpgradesBought: Array.from(state.clickUpgradesBought),
      prestigeUpgradesBought: Array.from(state.prestigeUpgradesBought),
      achievementsDone: Array.from(state.achievementsDone),

      // time
      startedAt: state.startedAt,
      lastSave: Date.now()
    };
  }

  // =========================
  // SAVE GAME
  // =========================
  function saveGame() {
    try {
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

      if (!raw) return;

      const data = JSON.parse(raw);

      // currency
      state.candyOrbs = data.candyOrbs ?? 0;
      state.totalCandyEarned = data.totalCandyEarned ?? 0;

      // click
      state.clickPower = data.clickPower ?? 1;
      state.critChance = data.critChance ?? 0.10;
      state.critMult = data.critMult ?? 1;

      // prestige
      state.prestige = data.prestige ?? 0;
      state.prestigePoints = data.prestigePoints ?? 0;

      // totals
      state.totalClicks = data.totalClicks ?? 0;
      state.totalEarned = data.totalEarned ?? 0;
      state.totalSpent = data.totalSpent ?? 0;

      state.totalCrits = data.totalCrits ?? 0;
      state.totalSold = data.totalSold ?? 0;
      state.totalSoldValue = data.totalSoldValue ?? 0;

      // streaks
      state.hotStreak = data.hotStreak ?? 0;
      state.bestHotStreak = data.bestHotStreak ?? 0;

      // combo
      state.combo = data.combo ?? 0;
      state.comboMult = data.comboMult ?? 1;
      state.bestCombo = data.bestCombo ?? 0;

      // settings
      state.useShortFormat = data.useShortFormat ?? true;

      state.sound = data.sound ?? true;
      state.soundVolume = data.soundVolume ?? 0.4;

      state.clickSoundVol = data.clickSoundVol ?? 1;
      state.buySoundVol = data.buySoundVol ?? 0.5;
      state.critSoundVol = data.critSoundVol ?? 0.5;
      state.prestigeSoundVol = data.prestigeSoundVol ?? 0.5;

      state.particles = data.particles ?? true;
      state.autoSave = data.autoSave ?? true;
      state.waterfall = data.waterfall ?? true;

      state.paused = data.paused ?? false;
      state.reduceMotion = data.reduceMotion ?? false;

      // unlocks
      state.waterfallUnlocked =
        data.waterfallUnlocked ?? false;

      // buildings
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

      // sets
      state.clickUpgradesBought =
        new Set(data.clickUpgradesBought || []);

      state.prestigeUpgradesBought =
        new Set(data.prestigeUpgradesBought || []);

      state.achievementsDone =
        new Set(data.achievementsDone || []);

      // time
      state.startedAt =
        data.startedAt ?? Date.now();

      // offline progress
      if (
        data.lastSave &&
        window.COI?.econ?.getCPS
      ) {
        const secondsOffline =
          Math.floor(
            (Date.now() - data.lastSave) / 1000
          );

        const cappedSeconds =
          Math.min(secondsOffline, 7200);

        if (cappedSeconds > 5) {

          const cps =
            window.COI.econ.getCPS();

          const earned =
            cps * cappedSeconds;

          state.candyOrbs += earned;
          state.totalEarned += earned;
          state.totalCandyEarned += earned;

          if (window.COI?.ui?.msg) {
            window.COI.ui.msg(
              `Offline Progress +${window.COI.econ.formatNumber(earned)}`
            );
          }
        }
      }

    } catch (e) {

      console.warn("Load failed:", e);

      localStorage.removeItem(SAVE_KEY);
    }
  }

  // =========================
  // EXPORT SAVE
  // =========================
  function exportState() {
    return buildSaveData();
  }

  // =========================
  // IMPORT SAVE
  // =========================
  function importState(data) {
    try {

      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
      );

      loadGame();

    } catch (e) {

      console.warn("Import failed:", e);
    }
  }

  // =========================
  // RESET SAVE
  // =========================
  function resetSave() {

    localStorage.removeItem(SAVE_KEY);

    location.reload();
  }

  // =========================
  // RESTART GAME
  // =========================
  function restartGame() {

    const confirmed = confirm(
      "Restart your entire save?"
    );

    if (!confirmed) return;

    resetSave();
  }

  // =========================
  // SAVE ON TAB CLOSE
  // =========================
  window.addEventListener(
    "beforeunload",
    () => {
      saveGame();
    }
  );

  // =========================
  // SAVE WHEN TAB HIDDEN
  // =========================
  document.addEventListener(
    "visibilitychange",
    () => {

      if (document.hidden) {
        saveGame();
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
    restartGame
  };

})();
