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
    
  }
  
  update(dt) {    
    this.time += dt;
    
    if (this.time >= this.duration && this.time != dt) this.ob.remove();
  }

  render() {
    renderer._(() => {
      renderer.set("lineWidth", 0.03);
      renderer.set("stroke", "rgba(255, 196, 86, 1)");
      renderer.line(this.startPos, this.end);
    });
  }
}