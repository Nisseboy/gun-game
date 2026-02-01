class Item extends Component {
  constructor(props = {}) {
    super();

    this.held = false;

    this._itemType = undefined;
    this.info = undefined;
    this.itemType = props.itemType || "Item";
  }

  set itemType(value) {
    this._itemType = value;
    this.info = itemTypes[value];    
  }
  get itemType() {
    return this._itemType;
  }

  start() {
    this.ob.item = this;

    this.tracker = new Tracker({active: false});
    this.addComponent(this.tracker);

    this.on("interact", (ob) => {
      let inventory = ob.getComponent(Inventory);
      
      inventory.pickup(this.ob);
    });

    this.on("pickup", () => {
      this.held = true;
      this.ob.active = false;
      this.ob.interactable.active = false;
    });
    this.on("drop", () => {
      this.held = false;
      this.ob.active = true;
      this.ob.interactable.active = true;
    });

    this.ob.name = this.itemType;
    this.ob.interactable.text = this.itemType;

    this.getComponent(Sprite).tex = this.info.tex;
    this.transform.size.from(nde.tex[this.info.tex].size).mul(1/20);
  }
  


  sendPickup() {
    sendFire(this.ob, "pickup");
  }
  sendDrop() {
    this.tracker.snap();
    sendFire(this.ob, "drop");
  }

  from(data) {
    super.from(data);

    this.stackSize = data.stackSize;
    this.tags = data.tags;
    this.held = data.held;
    this.itemType = data._itemType;

    return this;
  }

  strip() {
    delete this.ob.item;

    super.strip();
  }
}