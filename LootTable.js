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

    if (e instanceof Ob || typeof e == "string") {
      ob = e;
    } else if (Array.isArray(e)) {
      ob = e[0];
      
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
      
      let ob = elem.ob;
      if (typeof ob == "string") ob = prefab(ob);
      let item = ob.copy();
      item.randomizeId();
      if (elem.min != undefined) item.getComponent(Item).amount = elem.min + Math.floor(Math.random() * (elem.max-elem.min));
      return item;
    }

    return this.pick();
  }
}