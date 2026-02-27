let openInventories = [];
let hotbarSize = 6;
let armorSlot = 5;

class Inventory extends Component {
  constructor(props = {}) {
    super();

    this.w = props.w || hotbarSize;
    this.startIndex = props.startIndex || 0;
    this.stopIndex = props.stopIndex == undefined ? 1000 : props.stopIndex;
    this.offset = props.offset || new Vec(0, 0);

    this.slots = new Array(props.size || 1).fill(undefined);
    this.tags = new Array(props.size || 1).fill("");

    this.allowedHeldSlots = [];
    this.heldIndex = undefined;
  }

  get held() {
    return idLookup[this.slots[this.heldIndex]];
  }

  scrollHeld(sign) {
    let index = this.allowedHeldSlots.indexOf(this.heldIndex);
    if (index == -1) return;

    index = (index + sign + this.allowedHeldSlots.length) % this.allowedHeldSlots.length;
    this.heldIndex = this.allowedHeldSlots[index];
  }

  start() {
    this.ob.inventory = this;

    let interactable = this.getComponent(Interactable);
    if (interactable) {
      interactable.text = "Open " + this.ob.name;
    }

    this.on("interact", e => {
      scenes.game.openInventory(this);
    });

    this.on("setSlot", (i, id) => {
      this.slots[i] = id || undefined;

      this.getSlot(i)?.setParent(this.ob);
    });
    
  }

  pickup(ob, startIndex = 0, stopIndex = Infinity) {
    if (!ob) return;

    stopIndex = Math.min(stopIndex, this.slots.length);

    for (let i = startIndex; i < stopIndex; i++) {
      let slotOb = this.getSlot(i);
      if (!slotOb || slotOb.name != ob.name) continue;

      ob = slotOb.getComponent(Item).merge(ob);
      if (!ob) return;
    }

    for (let i = startIndex; i < stopIndex; i++) {
      let res = this.putInSlot(ob, i);
      if (!res) return;
    }
    return ob;
  }
  putInSlot(ob, slotIndex, amount = Infinity) {
    if (!ob) return ob;
    let item = ob.getComponent(Item);

    let slotOb = idLookup[this.slots[slotIndex]];    
    if (slotOb) {
      let slotItem = slotOb.getComponent(Item);  
      return slotItem.merge(ob, amount);
    } else {
      if (!this.checkAllowedTags(item, slotIndex)) return ob;

      item.sendPickup();
      this.setSlot(ob, slotIndex);

      let diff = Math.max(item.amount - amount, 0);
      if (diff) return item.split(diff);  
    }
  }
  getFromSlot(slotIndex, amount = Infinity) {
    let ob = idLookup[this.slots[slotIndex]];    
    if (!ob) return;
    
    let item = ob.getComponent(Item);

    let ob2 = item.split(amount);

    if (item.amount <= 0) {
      this.setSlot(undefined, slotIndex);
    }

    return ob2;
  }

  find(predicate = (ob) => false) {
    return this.getSlot(this.findIndex(predicate));
  }
  findIndex(predicate = (ob) => false) {
    if (typeof predicate == "string") predicate = (ob) => ob.name == predicate;

    for (let i = 0; i < this.slots.length; i++) {
      let ob = this.getSlot(i);
      if (!ob || !predicate(ob)) continue;

      return i;
    }
  }

  gather(ob, amount = 1) {
    let ob2 = ob.copy(true);
    let item2 = ob2.getComponent(Item);

    item2.amount = 0;
    for (let i = 0; i < this.slots.length; i++) {
      let ob3 = this.getSlot(i);
      let item3 = ob3?.getComponent(Item);
      if (!item3 || ob3.name != ob.name) continue;

      item2.amount += item3.amount;
      item3.amount = 0;

      let diff = Math.max(item2.amount - amount, 0);
      if (diff) {
        item2.amount -= diff;
        item3.amount = diff;
        return ob2;
      }

      this.setSlot(undefined, i)
    }

    return ob2;
  }

  drop(slotIndex, amount = 1, randomize = true) {
    let ob = this.getFromSlot(slotIndex, amount);
    if (!ob) return;

    let item = ob.getComponent(Item);
    item.sendDrop();

    if (randomize) {
      let transform = ob.getComponent(Transform);
      transform.pos.from(this.transform.pos).addV(new Vec(Math.random(), Math.random()).sub(0.5).mul(2));
      transform.dir = Math.random() * Math.PI * 2;
      let tracker = ob.getComponent(Tracker);
      if (tracker) tracker.snap();      
    } 

    return ob;
  }

  getSlot(slotIndex) {
    return idLookup[this.slots[slotIndex]];
  }
  setSlot(ob, slotIndex) {
    if (!this.clientOnly) sendFire(this.ob, "setSlot", slotIndex, ob?.id);
    else this.fire("setSlot", slotIndex, ob?.id);
  }

  checkPossible(ob, slotIndex) {
    let item = ob.getComponent(Item);
    
    if (!this.checkAllowedTags(item, slotIndex)) return 0;

    let slotOb = this.getSlot(slotIndex);
    if (!slotOb) return item.amount;
    
    if (slotOb.name != ob.name) return 0;
    
    let slotItem = slotOb.getComponent(Item);
    return Math.min(slotItem.info.stackSize - slotItem.amount, item.amount);
  }

  checkAllowedTags(item, slotIndex) {
    let tags = this.tags[slotIndex];
    if (!tags || !item) return true;

    let splitSlot = tags.split(",");
    
    let splitItem = item.info.tags.split(",");
    for (let i = 0; i < splitSlot.length; i++) {
      let tag = splitSlot[i];
      let splitTag = tag.split("!");
      if (splitTag.length == 1) {        
        if (!splitItem.includes(tag)) return false;
      } else {
        if (splitItem.includes(splitTag[1])) return false;
      }
    }

    return true;
  }


  from(data) {
    super.from(data);

    this.w = data.w;
    this.startIndex = data.startIndex;
    this.stopIndex = data.stopIndex;
    this.offset = new Vec().from(data.offset);

    this.slots = data.slots.map(e => {return e == null ? undefined : e});
    this.tags = data.tags;

    this.allowedHeldSlots = data.allowedHeldSlots;
    this.heldIndex = data.heldIndex;    

    return this;
  }

  strip() {
    delete this.ob.inventory;
    delete this.heldSlot;
    delete this.heldItem

    super.strip();
  }
}



function createContainer(props = {}) {
  let ob = new Ob({
    name: props.name || "Chest",
  }, [
    new Sprite(props.tex || "duck/1"),
    new Interactable(),
    new Inventory(props),
  ]);

  pixelScale(ob, props.scale);

  return ob;
}