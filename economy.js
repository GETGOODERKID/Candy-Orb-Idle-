(() => {
  const { state } = window.COI;
  const cfg = window.COI_CONFIG;

  function getBuilding(id) {
    return state.buildings.find(b => b.id === id);
  }

  function getBuildingCount(id) {
    const b = getBuilding(id);
    return b ? b.count : 0;
  }

  function updateAchievementBonus() {
    state.achievementBonus = Math.pow(
      cfg.achievementPow,
      state.achievementsDone.size
    );
  }

  function formatNumber(n, decimals = 0) {
    n = Number(n);
    if (!isFinite(n)) return "∞";

    if (!state.useShortFormat) {
      if (decimals > 0 && n < 1e6) return n.toFixed(decimals);
      return Math.floor(n).toLocaleString();
    }

    const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];

    let value = Math.abs(n);
    let u = 0;

    while (value >= 1000 && u < units.length - 1) {
      value /= 1000;
      u++;
    }

    if (u === 0) return value.toFixed(decimals);

    return value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2) + units[u];
  }

  function formatDurationSeconds(t) {
    t = Math.max(0, Math.floor(t || 0));
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function getPrestigeMultiplier() {
    return Math.pow(1.1, state.prestige);
  }

  function getCPS() {
    let total = 0;

    for (const b of state.buildings) {
      total += b.count * b.baseCps * b.bonusMult;
    }

    return total *
      state.buildingMult *
      state.achievementBonus *
      getPrestigeMultiplier() *
      state.cpsFromUpgrades;
  }

  function isBuildingLocked(b) {
    return b.unlockAt > 0 && state.totalEarned < b.unlockAt;
  }

  function getBuildingTotalCost(b, amount) {
    const g = cfg.buildingGrowth;
    const d = g - 1;

    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) return 0;

    const startFactor = Math.pow(g, b.count);
    const series = (Math.pow(g, amount) - 1) / d;

    return Math.ceil(
      b.baseCost *
      state.costMult *
      startFactor *
      series
    );
  }

  function getBuildingSellRefund(b, amount) {
    const g = cfg.buildingGrowth;
    const d = g - 1;

    amount = Math.max(0, Math.min(b.count, Math.floor(Number(amount) || 0)));
    if (amount <= 0) return 0;

    const startCount = b.count - amount;
    const startFactor = Math.pow(g, startCount);
    const series = (Math.pow(g, amount) - 1) / d;

    const paid =
      b.baseCost *
      state.costMult *
      startFactor *
      series;

    return Math.floor(paid * cfg.sellRefundRate);
  }

  // ✅ IMPORTANT: this is what your shop depends on
  function getMaxAffordableCount(b) {
    const g = cfg.buildingGrowth;
    const d = g - 1;

    const funds = state.candyOrbs;
    if (!funds || funds <= 0) return 0;

    const startFactor = Math.pow(g, b.count);
    const a = (b.baseCost * state.costMult * startFactor) / d;

    if (!isFinite(a) || a <= 0) return 0;

    let n = Math.floor(Math.log((funds / a) + 1) / Math.log(g));
    n = Math.max(0, n);

    while (n > 0 && getBuildingTotalCost(b, n) > funds) n--;
    while (getBuildingTotalCost(b, n + 1) <= funds) n++;

    return n;
  }

  function getPrestigeGain() {
    const req = cfg.prestigeRequiredEarned;
    const earned = Math.floor(state.totalEarned || 0);

    if (earned < req) return 0;

    const ratio = earned / req;

    const points = Math.floor(
      Math.pow(ratio, cfg.prestigeExponent) *
      state.prestigeGainMult
    );

    return points - (state.prestigePoints - state.lastPrestigeEarned);
  }

  window.COI.econ = {
    getBuilding,
    getBuildingCount,
    updateAchievementBonus,
    formatNumber,
    formatDurationSeconds,
    getPrestigeMultiplier,
    getCPS,
    isBuildingLocked,
    getBuildingTotalCost,
    getBuildingSellRefund,
    getMaxAffordableCount,
    getPrestigeGain
  };
})();
