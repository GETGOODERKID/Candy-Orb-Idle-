(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ || {};
  const fx = COI.fx || {};
  const save = COI.save || {};

  // =========================================================
  // MESSAGE SYSTEM
  // =========================================================
  function msg(text, good = true) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.style.color = good ? "var(--accent)" : "var(--bad)";
  }

  // =========================================================
  // BUY MODE
  // =========================================================
  function setBuyMode(mode) {
    state.buyMode = mode;
    renderShop();
  }

  function getBuyCount(b) {
    if (state.buyMode === "max") return econ.getMaxAffordableCount(b);
    return Math.max(1, Number(state.buyMode) || 1);
  }

  function getSellCount(b) {
    if (state.buyMode === "max") return b.count;
    return Math.max(1, Number(state.buyMode) || 1);
  }

  // =========================================================
  // HUD
  // =========================================================
  function updateHUD() {
    if (!state || !els) return;

    els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs || 0);
    els.cps.textContent = econ.formatNumber(econ.getCPS?.() || 0, 2);
    els.clickPower.textContent = econ.formatNumber(state.clickPower || 1);

    els.critChance.textContent =
      (Math.min(99, (state.critChance || 0) * 100)).toFixed(1) + "%";

    els.prestigeLevel.textContent = state.prestige || 0;
    els.prestigeTop.textContent = state.prestige || 0;
  }

  // =========================================================
  // SHOP
  // =========================================================
  function renderShop() {
    if (!els.shop) return;

    const scrollTop = els.shop.scrollTop;
    let html = "";

    html += `
      <div class="card">
        <div class="section-title">Buy Amount</div>
        <div class="qty-toggle">
          <button onclick="COI.ui.setBuyMode(1)" class="main-btn">1x</button>
          <button onclick="COI.ui.setBuyMode(10)" class="main-btn">10x</button>
          <button onclick="COI.ui.setBuyMode(100)" class="main-btn">100x</button>
          <button onclick="COI.ui.setBuyMode('max')" class="main-btn">Max</button>
        </div>
      </div>
    `;

    for (const b of state.buildings || []) {
      const buyCount = getBuyCount(b);
      const cost = econ.getBuildingTotalCost?.(b, buyCount) || 0;
      const canBuy = state.candyOrbs >= cost;

      const sellCount = getSellCount(b);
      const sellAmount = Math.min(b.count, sellCount);
      const refund = econ.getBuildingSellRefund?.(b, sellAmount) || 0;

      html += `
        <div class="building-card">
          <div class="building-header">
            <span>${b.name}</span>
            <span>${b.count}</span>
          </div>

          <button data-buy="${b.id}" ${canBuy ? "" : "disabled"}>
            Buy ${buyCount} - ${econ.formatNumber(cost)}
          </button>

          <button data-sell="${b.id}" ${b.count ? "" : "disabled"}>
            Sell - ${econ.formatNumber(refund)}
          </button>
        </div>
      `;
    }

    els.shop.innerHTML = html;
    els.shop.scrollTop = scrollTop;

    // attach clicks
    els.shop.querySelectorAll("[data-buy]").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.buy;
        COI.main?.buyBuilding?.(id);
      };
    });

    els.shop.querySelectorAll("[data-sell]").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.sell;
        COI.main?.sellBuilding?.(id);
      };
    });
  }

  function refreshShopUI() {
    renderShop();
  }

  // =========================================================
  // UPGRADES (MINIMAL SAFE VERSION)
  // =========================================================
  function renderUpgrades() {
    if (!els.upgrades) return;

    let html = "";

    for (const upg of state.upgrades || []) {
      const owned = state.clickUpgradesBought.has(upg.id);
      const canBuy = state.candyOrbs >= upg.cost && !owned;

      html += `
        <button data-upg="${upg.id}" ${canBuy ? "" : "disabled"}>
          ${upg.name} - ${econ.formatNumber(upg.cost)}
        </button>
      `;
    }

    els.upgrades.innerHTML = html;

    els.upgrades.querySelectorAll("[data-upg]").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.upg;
        COI.main?.buyUpgrade?.(id);
      };
    });
  }

  function refreshUpgradesUI() {
    renderUpgrades();
  }

  // =========================================================
  // STATS / PRESTIGE / ACHIEVEMENTS (SAFE SIMPLE RENDER)
  // =========================================================
  function renderStats() {
    if (!els.stats) return;

    els.stats.innerHTML = `
      <div class="card">
        <div class="section-title">Stats</div>
        <div>Total Earned: ${econ.formatNumber(state.totalEarned || 0)}</div>
        <div>Total Clicks: ${state.totalClicks || 0}</div>
      </div>
    `;
  }

  function renderPrestige() {
    if (!els.prestige) return;

    els.prestige.innerHTML = `
      <div class="card">
        <div class="section-title">Prestige</div>
        <button onclick="COI.main?.prestigeReset?.()">
          Prestige
        </button>
      </div>
    `;
  }

  function renderAchievements() {
    if (!els.achievements) return;

    els.achievements.innerHTML = `
      <div class="card">
        <div class="section-title">Achievements</div>
        ${(COI.achievements || [])
          .map(a => `<div>${a.name}</div>`)
          .join("")}
      </div>
    `;
  }

  // =========================================================
  // SETTINGS (SAFE EXPORT FIX)
  // =========================================================
  function renderSettings() {
    if (!els.settings) return;

    let exportData = "";

    try {
      exportData = COI.save?.exportState?.() || "";
    } catch (e) {
      exportData = "ERROR EXPORTING SAVE";
    }

    els.settings.innerHTML = `
      <div class="card">
        <div class="section-title">Settings</div>

        <button onclick="COI.save?.saveGame?.()">Save</button>
        <button onclick="COI.save?.resetSave?.()">Reset</button>

        <textarea readonly>${exportData}</textarea>
      </div>
    `;
  }

  // =========================================================
  // MASTER UPDATE
  // =========================================================
  function updateAll() {
    updateHUD();
    renderShop();
    renderUpgrades();
    renderStats();
    renderPrestige();
    renderAchievements();
    renderSettings();
  }

  // =========================================================
  // EXPORT UI MODULE
  // CRITICAL FIX: THIS WAS YOUR MAIN BUG
  // =========================================================
  COI.ui = {
    msg,
    setBuyMode,
    getBuyCount,
    getSellCount,
    updateHUD,
    renderShop,
    refreshShopUI,
    renderUpgrades,
    refreshUpgradesUI,
    renderStats,
    renderPrestige,
    renderAchievements,
    renderSettings,
    updateAll
  };

})();
