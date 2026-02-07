class Tracker extends Component {
  constructor(props = {}) {
    super(props);
    
    this.trackPos = props.trackPos == undefined ? true : props.trackPos;
    this.trackDir = props.trackDir == undefined ? true : props.trackDir;

    this.clientOnly = true;
  }

  start() {
    this.oldPos = this.transform.pos.copy();
    this.oldDir = this.transform.dir;

    this.ob.tracker = this;
  }
  
  update() {
    this.track();
  }

  track() {
    let changed = false;
    if (this.trackPos && !this.transform.pos.isEqualTo(this.oldPos)) changed = true;
    if (this.trackDir && this.oldDir != this.transform.dir) changed = true;

    if (!changed) return;
    this.oldPos.from(this.transform.pos);
    this.oldDir = this.transform.dir;
    
    client.sendLater("p", this.ob.id, this.trackPos ? this.oldPos : undefined, this.trackDir ? this.oldDir : undefined);     
  }

  snap() {
    this.oldPos.from(this.transform.pos);
    this.oldDir = this.transform.dir;

    let requests = [];
    if (this.trackPos) requests.push(["set", this.ob.id, "transform.pos", this.oldPos]);       
    if (this.trackDir) requests.push(["set", this.ob.id, "transform.dir", this.oldDir]);  
    client.send("mult", requests);
  }

  strip() {
    delete this.ob.tracker;

    super.strip();
  }
}