class Item extends Component {
  constructor(props = {}) {
    super();

    this.held = false;

    this.itemType = undefined;
    this.itemType = props.itemType || "Item";

    this.amount = props.amount || 1;

    this.visible = false;
  }

  get info() {
    return itemTypes[this.itemType];
  }

  init() {
    this.getComponent(Sprite).tex = this.info.tex;
    this.transform.size.from(nde.tex[this.info.tex].size).mul(1/20 * this.info.scale);
  }

  start() {
    this.ob.item = this;

    this.tracker = new Tracker({active: false});
    this.addComponent(this.tracker);

    let interactable = this.getComponent(Interactable);

    this.on("interact", (ob) => {
      let inventory = ob.getComponent(Inventory);
      
      inventory.pickup(this.ob);
    });
    
    this.on("pickup", () => {      
      this.held = true;
      this.ob.visible = false;
      interactable.active = false;           
    });
    this.on("drop", () => {
      this.held = false;
      this.ob.visible = true;
      interactable.active = true; 
      interactable.text = this.itemType + ((this.amount != 1) ? ` (${this.amount})` : "");
      this.ob.setParent(itemHolder);
    });

    if(this.held) {
      this.ob.visible = false;
      interactable.active = false;    
    } else {
      this.ob.visible = true;
      interactable.active = true;
    }

    this.ob.name = this.itemType;
    interactable.text = this.itemType + ((this.amount != 1) ? ` (${this.amount})` : "");
  }

  split(amount) {
    amount = Math.min(amount, this.amount);

    let ob = this.ob.copy(true);
    let item = ob.getComponent(Item);
    item.amount = amount;

    this.sendAmount(this.amount - amount);
    return createEntity(ob, itemHolder);
  }
  merge(ob, amount = Infinity) {
    let item = ob?.getComponent(Item);
    if (!ob || !item || ob.name != this.ob.name) return ob;

    amount = Math.min(item.amount, amount, Math.max(this.info.stackSize - this.amount, 0));

    this.sendAmount(this.amount + amount);
    item.sendAmount(item.amount - amount);

    if (item.amount > 0) return ob;
  }
  


  sendPickup() {    
    sendFire(this.ob, "pickup");
  }
  sendDrop() {
    this.tracker.snap();
    sendFire(this.ob, "drop");
  }
  sendAmount(amount) {
    if (amount <= 0) {
      this.amount = amount;
      removeEntity(this.ob);
      return;
    }
    sendSet(this.ob, "item.amount", amount);
  }


  render() {
    let size = this.transform.size;
    let ar = size.y / size.x;

    if (ar <= 1) size = new Vec(itemUISize, itemUISize*ar);
    else size = new Vec(itemUISize/ar, itemUISize);
    size.mul(this.info.scale);

    renderer._(() => {
      renderer.translate(new Vec(itemUISize * 0.5, itemUISize * 0.5));
      renderer.rotate(-Math.PI/4);

      renderer.translate(size._mul(-0.5));
      let sprite = this.getComponent(Sprite);
      sprite.updateTexture();
      renderer.image(sprite.texture, vecZero, size);
    });


    renderer.set("fill", "rgb(255,255,255)");

    if (this.amount != 1) {
      renderer.set("textAlign", ["right", "bottom"]);
      renderer.set("font", "20px monospace");
      renderer.text(this.amount, new Vec(0.9, 0.95).mul(itemUISize));
    }

    let gun = this.getComponent(Gun);
    if (gun) {
      renderer.set("textAlign", ["center", "bottom"]);
      renderer.set("font", "20px monospace");
      renderer.text(`${gun.ammo}/${this.info.gun.maxAmmo}`, new Vec(0.5, 0.9).mul(itemUISize));
    }
  }


  from(data) {
    super.from(data);

    this.stackSize = data.stackSize;
    this.tags = data.tags;
    this.held = data.held;
    this.itemType = data.itemType;

    this.amount = data.amount;

    return this;
  }

  strip() {
    delete this.ob.item;

    super.strip();
  }
}