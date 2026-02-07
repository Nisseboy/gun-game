let interactable = [];

class Interactable extends Component {
  constructor(props = {}) {
    super();
    
    this.text = props.text || "";
  }

  start() {
    this.ob.interactable = this;
  }

  enable() {
    interactable.push(this);
  }
  disable() {
    let index = interactable.indexOf(this);
    if (index == -1) return;
    interactable.splice(index, 1);
  }

  interact(...args) {
    this.fire("interact", ...args);
  }

  from(data) {
    super.from(data);

    this.text = data.text;
    
    return this;
  }

  strip() {
    delete this.ob.interactable;

    super.strip();
  }
}