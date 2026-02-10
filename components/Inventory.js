let openInventories = [];

class Inventory extends Component {
  constructor(props = {}) {
    super();

    this.w = props.w || 9;
    this.startIndex = props.startIndex || 0;
    this.stopIndex = props.stopIndex == undefined ? Infinity : props.stopIndex;
    this.offset = props.offset || new Vec(0, 0);

    this._open = false;

    this.slots = new Array(props.size || 1).fill(undefined);
    this.tags = new Array(props.size || 1).fill("");

    this.allowedHeldSlots = [];
    this._heldIndex = undefined;
    this.held = undefined;
  }

  set heldIndex(value) {
    this._heldIndex = value;
    if (idLookup) this.held = idLookup[this.slots[this.heldIndex]];    
  }
  get heldIndex() {
    return this._heldIndex;
  }
  set open(value) {
    this._open = value;

    if (value) {
      openInventories.push(this);
    } else {
      let index = openInventories.indexOf(this);
      if (index == -1) return;

      openInventories.splice(index, 1);
    }
  }
  get open() {
    return this._open;
  }

  scrollHeld(sign) {
    let index = this.allowedHeldSlots.indexOf(this.heldIndex);
    if (index == -1) return;

    index = (index + sign + this.allowedHeldSlots.length) % this.allowedHeldSlots.length;
    this.heldIndex = this.allowedHeldSlots[index];
  }

  start() {
    this.ob.inventory = this;
  }


  pickup(item) {
    for (let i = 0; i < this.slots.length; i++) {
      let res = this.putInSlot(item, i)
      if (!res) return;
    }
    return item;
  }
  putInSlot(ob, slotIndex) {
    if (!ob) return ob;

    let item = ob.getComponent(Item);

    let slotOb = idLookup[this.slots[slotIndex]];    
    if (slotOb) {
      if (slotOb.name != ob.name) return ob;

      let slotItem = slotOb.getComponent(Item);  
      slotItem.amount += item.amount;

      let diff = Math.max(slotItem.amount - slotItem.info.stackSize, 0);
      if (diff) {
        slotItem.amount -= diff;
        item.amount = diff;
        return ob;
      }

      item.sendPickup();
      removeEntity(ob);
      
    } else {
      if (!this.checkAllowedTags(slotIndex, item)) return ob;

      this.slots[slotIndex] = ob.id;
      item.sendPickup();
      

      slotOb = ob;
      if (slotIndex == this.heldIndex) this.held = ob;
    }

    return;
  }
  getFromSlot(slotIndex, amount = Infinity) {
    let ob = idLookup[this.slots[slotIndex]];    
    if (!ob) return;
    
    let item = ob.getComponent(Item);

    let ob2 = item.split(amount);

    if (item.amount <= 0) {
      this.slots[slotIndex] = undefined;

      if (slotIndex == this.heldIndex) {
        this.heldIndex = this.heldIndex;
      }
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
    } 

    return ob;
  }
  checkAllowedTags(slotIndex, item) {
    let tags = this.tags[slotIndex];
    if (!tags) return true;

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

    this.open = data._open;

    this.slots = data.slots.map(e => {return e == null ? undefined : e});
    this.tags = data.tags;

    this.allowedHeldSlots = data.allowedHeldSlots;
    this.heldIndex = data._heldIndex;

    return this;
  }

  strip() {
    delete this.ob.inventory;
    delete this.heldSlot;
    delete this.heldItem

    super.strip();
  }
}