(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;

  function msg(t, good = true) {
    if (!els.msg) return;
    els.msg.textContent = t;
    els.msg.style.color = good ? "lime" : "red";
  }

  function updateHUD() {
    if (!state) return;

    els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs);
    els.cps.textContent = econ.formatNumber(econ.getCPS(), 2);
    els.clickPower.textContent = econ.formatNumber(state.clickPower);
  }

  // ONLY BUILD SHOP ONCE OR ON DEMAND
  function renderShop() {
    if (!els.shop) return;

    els.shop.innerHTML = state.buildings.map(b => `
      <div class="building">
        <div>${b.name} (${b.count})</div>
        <button data-buy="${b.id}">Buy</button>
        <button data-sell="${b.id}">Sell</button>
      </div>
    `).join("");
  }

  function updateAll() {
    updateHUD();
    renderShop();
  }

  COI.ui = {
    msg,
    updateHUD,
    renderShop,
    updateAll
  };
})();
