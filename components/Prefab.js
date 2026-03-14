class Prefab extends Component {
  constructor(pType) {
    super();

    this.pType = pType;
  }

  get info() {
    return prefabs[this.pType];
  }

  init() {
    this.setPType(this.pType);
  }

  start() {
    this.ob.info = this.info;
  }

  setPType(pType) {
    this.pType = pType;

    this.getComponent(Sprite).tex = this.info.tex;

    pixelScale(this.ob, this.info.scale);

    this.ob.info = this.info;
  }



  from(data) {
    super.from(data);

    this.pType = data.pType;

    return this;
  }

  strip() {
    delete this.ob.info;

    super.strip();
  }
}
