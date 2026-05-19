(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;
  const fx = COI.fx;
  const save = COI.save;

  let shopDirty = true;
  let upgradesDirty = true;

  function msg(text, good = true) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.style.color = good ? "#fbbf24" : "#ff4d4d";
  }

  function updateHUD() {
    if (!state || !els) return;

    els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs);
    els.cps.textContent = econ.formatNumber(econ.getCPS(), 2);
    els.clickPower.textContent = econ.formatNumber(state.clickPower);
    els.critChance.textContent = (state.critChance * 100).toFixed(1) + "%";
    els.prestigeLevel.textContent = state.prestige;
    els.prestigeTop.textContent = state.prestige;
  }

  // mark dirty instead of constant rebuild
  function markShopDirty() {
    shopDirty = true;
  }

  function markUpgradesDirty() {
    upgradesDirty = true;
  }

  function renderShop() {
    if (!els.shop) return;

    const scroll = els.shop.scrollTop;

    let html = `
      <div class="card">
        <div class="section-title">Buy Mode</div>
        <div class="row">
          <button onclick="COI.ui.setBuyMode(1)">1x</button>
          <button onclick="COI.ui.setBuyMode(10)">10x</button>
          <button onclick="COI.ui.setBuyMode(100)">100x</button>
          <button onclick="COI.ui.setBuyMode('max')">MAX</button>
        </div>
      </div>
    `;

    for (const b of state.buildings) {
      const cost = econ.getBuildingTotalCost(b, 1);
      const can = state.candyOrbs >= cost;

      html += `
        <div class="card">
          <div class="row">
            <span>${b.name}</span>
            <span>x${b.count}</span>
          </div>

          <button onclick="COI.main.buyBuilding('${b.id}')" ${can ? "" : "disabled"}>
            Buy (${econ.formatNumber(cost)})
          </button>

          <button onclick="COI.main.sellBuilding('${b.id}')" ${b.count ? "" : "disabled"}>
            Sell
          </button>
        </div>
      `;
    }

    els.shop.innerHTML = html;
    els.shop.scrollTop = scroll;

    shopDirty = false;
  }

  function renderUpgrades() {
    if (!els.upgrades) return;

    let html = "";

    for (const u of state.upgrades) {
      const owned = state.clickUpgradesBought.has(u.id);

      html += `
        <button onclick="COI.main.buyUpgrade('${u.id}')" ${owned ? "disabled" : ""}>
          ${u.name} - ${econ.formatNumber(u.cost)}
        </button>
      `;
    }

    els.upgrades.innerHTML = html;
    upgradesDirty = false;
  }

  function setBuyMode(mode) {
    state.buyMode = mode;
    markShopDirty();
  }

  function updateAll() {
    updateHUD();

    if (shopDirty) renderShop();
    if (upgradesDirty) renderUpgrades();
  }

  COI.ui = {
    msg,
    updateHUD,
    updateAll,
    renderShop,
    renderUpgrades,
    setBuyMode,
    markShopDirty,
    markUpgradesDirty
  };
})();
