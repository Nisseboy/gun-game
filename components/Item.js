let groundItems = [];

class Item extends Component {
  constructor(props = {}) {
    super();

    this.stackSize = props.stackSize || 1;
    this.tags = "";

    this._held = false;
  }

  start() {
    this.ob.item = this;
    this.held = this.held;

    this.tracker = new Tracker({active: false});
    this.addComponent(this.tracker);

  }

  set held(value) {
    this._held = value;

    if (value) {
      this.ob.active = false;

      let index = groundItems.indexOf(this);
      if (index == -1) return;
      groundItems.splice(index, 1);
    } else {            
      this.ob.active = true;

      groundItems.push(this);
    }
  }
  get held() {
    return this._held;
  }

  update(dt) {

  }


  pickup() {
    this.held = true;
    client.send("set", this.ob.id, "item.held", true);
  }
  drop() {
    this.held = false;    
    this.tracker.snap();
    client.send("set", this.ob.id, "item.held", false);
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
    this._held = data._held;

    return this;
  }

  strip() {
    delete this.ob.item;

    super.strip();
  }
}