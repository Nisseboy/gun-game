let interactable = [];

class Interactable extends Component {
  constructor(props = {}) {
    super();
    
    this.text = props.text || "";

    this.lastActive = false;
    this.active = true;
  }

  start() {
    this.ob.interactable = this;
  }

  update() {
    if (this.active && !this.lastActive) {      
      interactable.push(this);
    } else if (!this.active && this.lastActive) {
      let index = interactable.indexOf(this);
      if (index == -1) return;
      interactable.splice(index, 1);
    }

    this.lastActive = this.active;
  }

  interact(...args) {
    this.fire("interact", ...args);
  }

  remove() {
    let index = interactable.indexOf(this);
    if (index == -1) return;
    interactable.splice(index, 1);
  }
  from(data) {
    super.from(data);

    this.text = data.text;
    this.active = data.active;

    return this;
  }

  strip() {
    delete this.ob.interactable;

    super.strip();
  }
}