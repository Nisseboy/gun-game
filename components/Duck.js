class Duck extends Component {
  constructor() {
    super();
  }

  start() {
    this.lastPos = new Vec(0, 0);
    this.vel = new Vec(0, 0);
    
    this.sprite = this.getComponent(Sprite);

    this.sprite.tex = new StateMachineImg(
      new StateMachineNodeCondition(()=>{return (this.vel.x != 0 || this.vel.y != 0)}, 
        new StateMachineNodeResult(nde.tex["duck/walk"]),
        new StateMachineNodeResult(nde.tex["duck/1"]),
      )
    );

    //From "duck/walk" when thats the state
    this.on("step", (angle) => {
      this.transform.dir += angle;
      this.ob.audioSource.play(nde.aud[`duck/step/${Math.floor(Math.random() * 4 + 1)}`]);
    })
  }
  
  update(dt) {
    this.vel.from(this.transform.pos).subV(this.lastPos).mul(1/dt);
    this.lastPos.from(this.transform.pos);

    this.sprite.speed = this.vel.mag() / 4;   
    
    if (this.vel.sqMag() != 0) {
      let diff = getDeltaAngle((Math.atan2(this.vel.y, this.vel.x)), this.transform.dir);
      this.transform.dir -= diff * 20 * dt;
    }      
  }

  move(v) {  
    let eps = 0.0001;

    if (v.x) {
      let dir = Math.sign(v.x);
      let res = world.grid.raycastFast(this.transform.pos.x - dir * eps, this.transform.pos.y, dir, 0, v.x * dir);
      
      
      this.transform.pos.x += (res ? dir * (res.d - eps * 2) : v.x);
    }
    if (v.y) {
      let dir = Math.sign(v.y);
      let res = world.grid.raycastFast(this.transform.pos.x, this.transform.pos.y - dir * eps, 0, dir, v.y * dir);
      
      this.transform.pos.y += (res ? dir * (res.d - eps * 2) : v.y);
    }
  }

  remove() {
    this.sprite.speed = 0;
  }


}