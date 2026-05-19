(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const els = COI.els;
  const econ = COI.econ;

  let currentTab = "shop";

  // =========================
  // MESSAGE
  // =========================
  function msg(text, good = true) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.style.color = good ? "#f472b6" : "#ef4444";
  }

  // =========================
  // TABS (FIXED)
  // =========================
  function setTab(tab) {
    currentTab = tab;

    const panels = document.querySelectorAll(".panel");
    panels.forEach(p => p.classList.remove("active"));

    const el = document.getElementById(tab);
    if (el) el.classList.add("active");
  }

  // hotkeys 1–6
  document.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    const map = {
      "1": "shop",
      "2": "upgrades",
      "3": "stats",
      "4": "prestige",
      "5": "achievements",
      "6": "settings"
    };

    if (map[e.key]) setTab(map[e.key]);
  });

  // =========================
  // BUY MODE
  // =========================
  function setBuyMode(mode) {
    state.buyMode = mode;
    renderShop();
  }

  function getBuyCount(b) {
    if (state.buyMode === "max") return econ.getMaxAffordableCount(b);
    return Number(state.buyMode) || 1;
  }

  function getSellCount(b) {
    if (state.buyMode === "max") return b.count;
    return Number(state.buyMode) || 1;
  }

  // =========================
  // HUD (FAST)
  // =========================
  function updateHUD() {
    if (!els.candyOrbs) return;

    els.candyOrbs.textContent = econ.formatNumber(state.candyOrbs);
    els.cps.textContent = econ.formatNumber(econ.getCPS(), 2);
    els.clickPower.textContent = econ.formatNumber(state.clickPower);

    els.critChance.textContent =
      (state.critChance * 100).toFixed(1) + "%";

    els.prestigeLevel.textContent = state.prestige;
    els.prestigeTop.textContent = state.prestige;
  }

  // =========================
  // SHOP (NO MORE FLICKER FIX)
  // =========================
  function renderShop() {
    if (!els.shop) return;

    const scroll = els.shop.scrollTop;

    let html = `
      <div class="card">
        <button onclick="COI.ui.setBuyMode(1)">1x</button>
        <button onclick="COI.ui.setBuyMode(10)">10x</button>
        <button onclick="COI.ui.setBuyMode(100)">100x</button>
        <button onclick="COI.ui.setBuyMode('max')">MAX</button>
      </div>
    `;

    for (const b of state.buildings) {
      const buy = getBuyCount(b);
      const cost = econ.getBuildingTotalCost(b, buy);

      html += `
        <div class="building">
          <div>${b.name} (${b.count})</div>

          <button data-buy="${b.id}">Buy ${buy}</button>
          <button data-sell="${b.id}">Sell</button>
        </div>
      `;
    }

    els.shop.innerHTML = html;
    els.shop.scrollTop = scroll;
  }

  // =========================
  // UPGRADES
  // =========================
  function renderUpgrades() {
    if (!els.upgrades) return;

    let html = "";

    for (const u of state.upgrades) {
      const owned = state.clickUpgradesBought.has(u.id);

      html += `
        <button data-up="${u.id}" ${owned ? "disabled" : ""}>
          ${u.name}
        </button>
      `;
    }

    els.upgrades.innerHTML = html;
  }

  // =========================
  // SAFE UPDATERS (SMOOTHNESS FIX)
  // =========================
  function updateAll() {
    updateHUD();

    // only rerender visible tab (BIG performance fix)
    if (currentTab === "shop") renderShop();
    if (currentTab === "upgrades") renderUpgrades();
  }

  // =========================
  // EXPORT
  // =========================
  COI.ui = {
    msg,
    setBuyMode,
    getBuyCount,
    getSellCount,
    updateHUD,
    renderShop,
    renderUpgrades,
    updateAll,
    setTab
  };

  // default tab
  setTab("shop");
})();
