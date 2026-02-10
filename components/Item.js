class Item extends Component {
  constructor(props = {}) {
    super();

    this.held = false;

    this.itemType = undefined;
    this.info = undefined;
    this.itemType = props.itemType || "Item";

    this.amount = props.amount || 1;

    this.visible = false;
  }

  init() {
    let info = itemTypes[this.itemType];
    this.getComponent(Sprite).tex = info.tex;
    this.transform.size.from(nde.tex[info.tex].size).mul(1/20);
  }

  start() {
    this.info = itemTypes[this.itemType];    

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
    });

    if(this.held) {
      this.ob.visible = false;
      interactable.active = false;    
    } else {
      this.ob.visible = true;
      interactable.active = true;
    }

    this.ob.name = this.itemType;
    interactable.text = this.itemType;
  }

  split(amount) {
    amount = Math.min(amount, this.amount);

    this.amount -= amount;

    let ob = this.ob.copy(true);
    let item = ob.getComponent(Item);
    item.amount = amount;

    return createEntity(ob, itemHolder);
  }
  


  sendPickup() {    
    sendFire(this.ob, "pickup");
  }
  sendDrop() {
    this.tracker.snap();
    sendFire(this.ob, "drop");
  }


  render() {
    let size = this.transform.size;
    let ar = size.y / size.x;

    if (ar <= 1) size = new Vec(itemUISize, itemUISize*ar);
    else size = new Vec(itemUISize/ar, itemUISize);

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