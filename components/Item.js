



let groundItems = [];

class Item extends Component {
  constructor(props = {}) {
    super();

    this.stackSize = props.stackSize || 1;
    this.tags = "";

    this.held = false;
  }

  start() {
    this.ob.item = this;

    this.tracker = new Tracker({active: false});
    this.addComponent(this.tracker);

    this.on("pickup", () => {
      this.held = true;
      this.ob.active = false;

      let index = groundItems.indexOf(this);
      if (index == -1) return;
      groundItems.splice(index, 1);
    });
    this.on("drop", () => {
      this.held = false;
      this.ob.active = true;

      groundItems.push(this);
    });

    if (this.held) this.fire("pickup");
    else this.fire("drop");
  }

  update(dt) {

  }


  sendPickup() {
    sendFire(this.ob, "pickup");
  }
  sendDrop() {
    this.tracker.snap();
    sendFire(this.ob, "drop");
  }



  remove() {
    let index = groundItems.indexOf(this);
    if (index == -1) return;

    groundItems.splice(index, 1);
  }

  from(data) {
    super.from(data);

    this.stackSize = data.stackSize;
    this.tags = data.tags;
    this.held = data.held;

    return this;
  }

  strip() {
    delete this.ob.item;

    super.strip();
  }
}