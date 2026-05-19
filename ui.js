(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;

  const econ = COI.econ;
  const fx = COI.fx;
  const save = COI.save;

  // =========================
  // MESSAGE
  // =========================
  function msg(text, good = true) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.style.opacity = "1";
    els.msg.style.color = good ? "#fbbf24" : "#ff4d4d";
  }

  // =========================
  // HUD (SAFE + FAST)
  // =========================
  function updateHUD() {
    if (!state || !els) return;

    els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs);
    els.cps.textContent = econ.formatNumber(econ.getCPS(), 2);
    els.clickPower.textContent = econ.formatNumber(state.clickPower);

    els.critChance.textContent =
      ((state.critChance * 100).toFixed(1) + "%");

    els.prestigeLevel.textContent = state.prestige;
    els.prestigeTop.textContent = state.prestige;
  }

  // =========================
  // SHOP RENDER (ONLY WHEN NEEDED)
  // =========================
  function renderShop() {
    if (!els.shop) return;

    let html = `
      <div class="card">
        <div class="section-title">Buy Mode</div>
        <div class="row">
          <button data-mode="1">1x</button>
          <button data-mode="10">10x</button>
          <button data-mode="100">100x</button>
          <button data-mode="max">MAX</button>
        </div>
      </div>
    `;

    for (const b of state.buildings) {
      const cost = econ.getBuildingTotalCost(b, 1);
      const canBuy = state.candyOrbs >= cost;

      html += `
        <div class="card building">
          <div class="row">
            <div>${b.name}</div>
            <div>x${b.count}</div>
          </div>

          <button data-buy="${b.id}" ${canBuy ? "" : "disabled"}>
            Buy (${econ.formatNumber(cost)})
          </button>

          <button data-sell="${b.id}" ${b.count > 0 ? "" : "disabled"}>
            Sell
          </button>
        </div>
      `;
    }

    els.shop.innerHTML = html;
  }

  // =========================
  // UPGRADES (SAME IDEA)
  // =========================
  function renderUpgrades() {
    if (!els.upgrades) return;

    let html = "";

    for (const u of state.upgrades) {
      const owned = state.clickUpgradesBought.has(u.id);

      html += `
        <button data-upgrade="${u.id}" ${owned ? "disabled" : ""}>
          ${u.name} - ${econ.formatNumber(u.cost)}
        </button>
      `;
    }

    els.upgrades.innerHTML = html;
  }

  // =========================
  // STABLE EVENT SYSTEM (IMPORTANT FIX)
  // =========================
  function attachEvents() {
    if (els.shop && !els.shop._bound) {
      els.shop.addEventListener("click", (e) => {
        const buy = e.target.closest("[data-buy]");
        const sell = e.target.closest("[data-sell]");
        const mode = e.target.closest("[data-mode]");

        if (mode) {
          state.buyMode = mode.dataset.mode;
          renderShop();
        }

        if (buy) COI.main.buyBuilding(buy.dataset.buy);
        if (sell) COI.main.sellBuilding(sell.dataset.sell);
      });

      els.shop._bound = true;
    }

    if (els.upgrades && !els.upgrades._bound) {
      els.upgrades.addEventListener("click", (e) => {
        const u = e.target.closest("[data-upgrade]");
        if (u) COI.main.buyUpgrade(u.dataset.upgrade);
      });

      els.upgrades._bound = true;
    }
  }

  // =========================
  // MASTER UPDATE (DO NOT CALL EVERY 100MS)
  // =========================
  function updateAll() {
    updateHUD();
    renderShop();
    renderUpgrades();
    attachEvents();
  }

  function refreshShopUI() {
    renderShop();
    attachEvents();
  }

  function refreshUpgradesUI() {
    renderUpgrades();
    attachEvents();
  }

  COI.ui = {
    msg,
    updateHUD,
    renderShop,
    renderUpgrades,
    updateAll,
    refreshShopUI,
    refreshUpgradesUI
  };
})();
