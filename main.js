(() => {
  const COI = window.COI || (window.COI = {});
  const state = COI.state;
  const econ = COI.econ;
  const fx = COI.fx;
  const ui = COI.ui;
  const save = COI.save;

  function buyBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b) return;

    const cost = econ.getBuildingTotalCost(b, 1);
    if (state.candyOrbs < cost) {
      ui.msg("Not enough candy", false);
      return;
    }

    state.candyOrbs -= cost;
    b.count++;

    ui.msg(`Bought ${b.name}`);

    ui.markShopDirty();
  }

  function sellBuilding(id) {
    const b = econ.getBuilding(id);
    if (!b || b.count <= 0) return;

    b.count--;
    state.candyOrbs += econ.getBuildingSellRefund(b, 1);

    ui.msg(`Sold ${b.name}`);

    ui.markShopDirty();
  }

  function buyUpgrade(id) {
    const u = state.upgrades.find(x => x.id === id);
    if (!u || state.clickUpgradesBought.has(id)) return;

    if (state.candyOrbs < u.cost) return;

    state.candyOrbs -= u.cost;
    state.clickUpgradesBought.add(id);
    u.effect?.();

    ui.msg(`${u.name} bought`);

    ui.markUpgradesDirty();
  }

  function gameLoop() {
    const cps = econ.getCPS();
    state.candyOrbs += cps / 10;
    state.totalEarned += cps / 10;

    ui.updateAll();
  }

  setInterval(gameLoop, 100);

  COI.main = {
    buyBuilding,
    sellBuilding,
    buyUpgrade
  };

  save.loadGame();
  ui.updateAll();
})();
