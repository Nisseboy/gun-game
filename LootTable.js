class LootTable {
  constructor(elems = []) {
    this.elems = [];
    this.totalWeight = 0;

    for (let i = 0; i < elems.length; i++) {
      this.addElem(elems[i]);
    }
  }

  addElem(e) {
    let ob;
    let weight = 1;
    let min;
    let max;

    if (e instanceof Ob) {
      ob = e;
    } else if (typeof e == "string") {
      ob = createItem(e);
    } else if (Array.isArray(e)) {
      if (e[0] instanceof Ob) ob = e[0];
      else if (typeof e[0] == "string") ob = createItem(e[0]);
      
      if (e[1] != undefined) weight = e[1];
      min = e[2];
      max = e[3];
    } else {      
      ob = e.ob;
      if (e.weight != undefined) weight = e.weight;
      min = e.min;
      max = e.max;
    }

    this.elems.push({ob, weight, min, max});
    this.totalWeight += weight;
  }

  pick() {
    let r = Math.random() * this.totalWeight;
    let tot = 0;
    let elem;

    for (let i = 0; i < this.elems.length; i++) {
      elem = this.elems[i];
      tot += elem.weight;

      if (tot < r) continue;
      
      let item = elem.ob.copy();
      item.randomizeId();
      if (elem.min != undefined) item.getComponent(Item).amount = elem.min + Math.floor(Math.random() * (elem.max-elem.min));
      return item;
    }

    return this.pick();
  }
}