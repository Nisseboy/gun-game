let openInventories = [];

class Inventory extends Component {
  constructor(props = {}) {
    super();

    this.w = props.w || 9;
    this.renderStart = props.renderStart || 0;
    this.offset = props.offset || new Vec(0, 0);
    this._open = false;

    this.slots = new Array(props.size || 1).fill(0).map(e => {
      return {
        item: undefined,
        amount: 0,

        tag: undefined,
      };
    });


    this.allowedHeldSlots = [];
    this._heldIndex = undefined;
    this.heldSlot = undefined;
    this.heldItem = undefined;
  }

  set heldIndex(value) {
    if (!this.allowedHeldSlots.includes(value)) return;

    this._heldIndex = value;
    this.heldSlot = this.slots[this.heldIndex];
    if (idLookup) this.heldItem = idLookup[this.heldSlot.item];
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


  pickup(itemId) {
    for (let i = 0; i < this.slots.length; i++) {
      let res = this.putInSlot(itemId, i)
      if (res) return res;
    }
  }
  putInSlot(itemId, slotIndex) {
    let item = idLookup[itemId];
    if (!item) return;

    let slot = this.slots[slotIndex];
    if (slot.item) {
      let i2 = idLookup[slot.item];

      if (i2.name != item.name) return;
      if (slot.amount >= item.item.stackSize) return;

      slot.amount++;

      item.item.pickup();
      removeEntity(item);
    } else {
      if (slot.tag) {
        let splitSlot = slot.tag.split(",");
        let splitItem = item.item.tags.split(",");
        for (let i = 0; i < splitSlot.length; i++) {
          if (!splitItem.includes(splitSlot[i])) return;
        }
      }

      slot.item = itemId;
      slot.amount = 1;
      item.item.pickup();
    }

    if (slotIndex == this.heldIndex) this.heldItem = idLookup[slot.item];
    return idLookup[slot.item];
  }


  renderSlots() {    
    if (!this.open) return;

    renderer._(() => {
      let pos = this.offset.copy();
      let size = 1.05;
      let j = 0;

      for (let i = this.renderStart; i < this.slots.length; i++) {
        this.renderSlot(i, pos);

        pos.x+=size;
        j++;
        if (j % this.w == 0) {
          pos.x -= this.w*size;
          pos.y+=size;
        }
      }
    });
  }
  renderSlot(slotIndex, pos) {
    let slot = this.slots[slotIndex];

    renderer._(() => {
      renderer.translate(pos);

      renderer.image(nde.tex["inventory/slot"], vecZero, vecOne);
      if (slotIndex == this.heldIndex) renderer.image(nde.tex["inventory/heldSlot"], vecZero, vecOne);
      
      if (slot.item) {
        let item = idLookup[slot.item];
        let size = item.transform.size;
        let ar = size.y / size.x;

        if (ar <= 1) size = new Vec(1, ar);
        else size = new Vec(1/ar, 1);

        renderer._(() => {
          renderer.translate(vecHalf);
          renderer.rotate(-Math.PI/4);

          renderer.translate(size._mul(-0.5));
          renderer.image(item.getComponent(Sprite).texture, vecZero, size);
        });


        renderer.set("fill", "rgb(255,255,255)");

        if (slot.amount != 1) {
          renderer.set("textAlign", ["right", "bottom"]);
          renderer.set("font", "0.3px monospace");
          renderer.text(slot.amount, new Vec(0.9, 0.95));
        }

        let gun = item.getComponent(Gun);
        if (gun) {
          renderer.set("textAlign", ["center", "bottom"]);
          renderer.set("font", "0.2px monospace");
          //renderer.text(`${gun.ammo}/${gun.maxAmmo}`, new Vec(0.5, 0.9));
        }
        return;
      }
      
      if (!slot.tag) return;
      let tagTex = undefined;
      let splitSlot = slot.tag.split(",");
      for (let i = 0; i < splitSlot.length; i++) {
        tagTex = nde.tex["inventory/" + splitSlot[i]] || tagTex;
      }
      if (tagTex) {
        renderer.image(tagTex, vecZero, vecOne);
      }
    });
  }


  from(data) {
    super.from(data);

    this.w = data.w;
    this.renderStart = data.renderStart;
    this.offset = new Vec().from(data.offset);
    this.open = data._open;

    this.slots = data.slots;

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