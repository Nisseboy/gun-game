class BulletPath extends Component {
  constructor(start, end, duration) {
    super();

    this.startPos = start;
    this.end = end;
    this.duration = duration;

    this.clientOnly = true;
    
  }

  start() {
    this.time = 0;
    
    this.transform.pos.from(this.startPos);
    this.transform.dir = this.end._subV(this.startPos).angle();
    
    let light = new Light({maxR: 5, brightness: 1, tex: "light/cone45"});
    light.clientOnly = true;
    this.addComponent(light);

    light = new Light({maxR: 1, brightness: 1, tex: "light/1"});
    light.clientOnly = true;
    this.addComponent(light);
  }
  
  update(dt) {    
    this.time += dt;
    
    if (this.time >= this.duration && this.time != dt) this.ob.remove();
  }

  render() {
    renderer._(() => {
      renderer.set("lineWidth", 0.03);
      renderer.set("stroke", "rgba(255, 196, 86, 1)");
      renderer.line(this.transform.pos, this.end);
    });
  }
}