(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;

  function msg(text, good = true) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.style.color = good ? "#fff" : "#ff4d4d";
  }

  // =========================
  // HUD (FAST - NO FLICKER)
  // =========================
  function updateHUD() {
    if (!state) return;

    if (els.candyOrbs)
      els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs);

    if (els.cps)
      els.cps.textContent = econ.formatNumber(econ.getCPS(), 2);

    if (els.clickPower)
      els.clickPower.textContent = econ.formatNumber(state.clickPower);
  }

  // =========================
  // SHOP (FIXED - NO GLITCH)
  // =========================
  function renderShop() {
    if (!els.shop) return;

    let html = "";

    for (const b of state.buildings || []) {
      const cost = econ.getBuildingTotalCost(b, 1);
      const canBuy = state.candyOrbs >= cost;

      html += `
        <div class="card">
          <div>${b.name} (${b.count})</div>

          <button data-buy="${b.id}" ${!canBuy ? "disabled" : ""}>
            Buy - ${econ.formatNumber(cost)}
          </button>

          <button data-sell="${b.id}" ${b.count <= 0 ? "disabled" : ""}>
            Sell
          </button>
        </div>
      `;
    }

    els.shop.innerHTML = html;

    els.shop.querySelectorAll("[data-buy]").forEach(btn => {
      btn.onclick = () => COI.main.buyBuilding(btn.dataset.buy);
    });

    els.shop.querySelectorAll("[data-sell]").forEach(btn => {
      btn.onclick = () => COI.main.sellBuilding(btn.dataset.sell);
    });
  }

  function refreshShopUI() {
    renderShop();
  }

  // =========================
  // UPGRADES
  // =========================
  function renderUpgrades() {
    if (!els.upgrades) return;

    let html = "";

    for (const u of state.upgrades || []) {
      const owned = state.clickUpgradesBought.has(u.id);

      html += `
        <button data-upg="${u.id}" ${owned ? "disabled" : ""}>
          ${u.name} - ${econ.formatNumber(u.cost)}
        </button>
      `;
    }

    els.upgrades.innerHTML = html;

    els.upgrades.querySelectorAll("[data-upg]").forEach(btn => {
      btn.onclick = () => COI.main.buyUpgrade(btn.dataset.upg);
    });
  }

  function refreshUpgradesUI() {
    renderUpgrades();
  }

  // =========================
  // MASTER UPDATE
  // =========================
  function updateAll() {
    updateHUD();
    renderShop();
    renderUpgrades();
  }

  COI.ui = {
    msg,
    updateHUD,
    renderShop,
    refreshShopUI,
    renderUpgrades,
    refreshUpgradesUI,
    updateAll
  };
})();
