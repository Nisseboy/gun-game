class WeaponUser extends Component {
  constructor() {
    super();

    this._held = undefined;
    this._item = undefined;
    this._gun = undefined;
    this._info = undefined;
    this.targetPos = new Vec(0, 0);

    this.lastTrigger = false;
    this.trigger = false;
    this.reloading = false;

    this.clientOnly = true;
  }

  set held(value) {            
    if (this._item?.held) {
      setVisible(this.held, false);      
    }
    if (this._gun) {
      cancelReload();
    }        
    
    this._held = value;
    this._item = undefined;
    this._gun = undefined;
    this._info = undefined;
    

    if (this.held) {
      this._item = this.held.getComponent(Item);
      this._gun = this.held.getComponent(Gun);
      this._info = this._item.info;        

      this.update();
      
      setVisible(this.held, true);
      
      this._item.tracker?.snap();
    }
  }
  get held() {
    return this._held;
  }

  start() {

  }
  
  update() {
    if (!this.held) return;

    this.held.transform.pos.from(this.transform.pos);
    let rightDir = this.transform.dir + Math.PI / 2;
    this.held.transform.pos.addV(new Vec(Math.cos(rightDir), Math.sin(rightDir)).mul(0.3));

    let tipOffset = this._info.gun?.tipOffset.copy() || new Vec(0.1, 0);
    
    this.held.transform.dir = Math.atan2(this.targetPos.y - this.held.transform.pos.y, this.targetPos.x - this.held.transform.pos.x) - Math.asin(tipOffset.y / Math.hypot(this.targetPos.x - this.held.transform.pos.x, this.targetPos.y - this.held.transform.pos.y));

    this._item.tracker?.track();


    if (!this._gun) return;
    
    if (this.trigger) {
      if ((this._info.gun.automatic && this._gun.ammo > 0) || !this.lastTrigger) {
        this.shoot();
      }
    }

    this.lastTrigger = this.trigger;
  }

  reload() {
    if (!this._gun) return;

    this._gun.reload(this.getComponent(Inventory));
  }
  shoot() {
    if (!this._gun) return;

    this._gun.shoot();
  }
}

