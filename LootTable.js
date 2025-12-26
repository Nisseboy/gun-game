class LootTable {
  constructor(elems = []) {
    this.elems = [];
    this.totalWeight = 0;

    for (let i = 0; i < elems.length; i++) {
      this.addElem(elems[i]);
    }
  }

  addElem(item, weight = 1) {
    if (item.weight) {
      weight = item.weight;
      item = item.item;
    }

    this.elems.push({item, weight});
    this.totalWeight += weight;
  }

  pick() {
    let r = Math.random() * this.totalWeight;
    let tot = 0;
    let elem;

    for (let i = 0; i < this.elems.length; i++) {
      elem = this.elems[i];
      tot += elem.weight;

      if (tot >= r) return elem.item;
    }

    return this.pick();
  }
}