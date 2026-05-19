(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;
  const save = COI.save;

  function msg(text, good = true) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.style.color = good ? "#f472b6" : "#ef4444";
  }

  function updateHUD() {
    if (!state || !els) return;

    els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs);
    els.cps.textContent = econ.formatNumber(econ.getCPS(), 2);
    els.clickPower.textContent = econ.formatNumber(state.clickPower);

    els.critChance.textContent =
      (state.critChance * 100).toFixed(1) + "%";

    els.prestigeLevel.textContent = state.prestige;
    els.prestigeTop.textContent = state.prestige;

    if (els.hotStreak) {
      els.hotStreak.textContent = state.hotStreak || 0;
    }
  }

  function renderShop() {
    if (!els.shop) return;

    const scroll = els.shop.scrollTop;
    let html = "";

    for (const b of state.buildings) {
      const cost = econ.getBuildingTotalCost(b, 1);
      const canBuy = state.candyOrbs >= cost;

      html += `
        <div class="building-card">
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
    els.shop.scrollTop = scroll;
  }

  function renderUpgrades() {
    if (!els.upgrades) return;

    let html = "";

    for (const u of state.upgrades) {
      const owned = state.clickUpgradesBought.has(u.id);
      const canBuy = state.candyOrbs >= u.cost && !owned;

      html += `
        <button data-upgrade="${u.id}" ${!canBuy ? "disabled" : ""}>
          ${u.name} - ${econ.formatNumber(u.cost)}
        </button>
      `;
    }

    els.upgrades.innerHTML = html;
  }

  function updateAll() {
    updateHUD();
    renderShop();
    renderUpgrades();
  }

  COI.ui = {
    msg,
    updateHUD,
    renderShop,
    renderUpgrades,
    updateAll
  };
})();
