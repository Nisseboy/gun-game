class WeaponUser extends Component {
  constructor() {
    super();

    this._item = undefined;
    this._gun = undefined;
    this._info = undefined;
    this.targetPos = new Vec(0, 0);

    this.lastTrigger = false;
    this.trigger = false;
    this.reloading = false;

    this.clientOnly = true;
  }

  set item(value) {        
    if (this.item?.item.held) {
      setActive(this.item, false);
      setParent(this.item, itemHolder);
    }
    if (this._gun) {
      this._gun.cancelReload();
    }
    
    this._item = value;
    this._gun = undefined;
    this._info = undefined;

    if (this.item) {
      this._gun = this.item.gun;
      this._info = this.item.item.info;

      this.update(0);
      setActive(this.item, true);
      setParent(this.item, world);
      this.item.item.tracker.snap();
    }
  }
  get item() {
    return this._item;
  }

  start() {

  }
  
  update(dt) {
    if (!this.item) return;

    this.item.transform.pos.from(this.transform.pos);
    let rightDir = this.transform.dir + Math.PI / 2;
    this.item.transform.pos.addV(new Vec(Math.cos(rightDir), Math.sin(rightDir)).mul(0.3));

    let tipOffset = this._info.gun?.tipOffset.copy() || new Vec(0.1, 0);
    
    this.item.transform.dir = Math.atan2(this.targetPos.y - this.item.transform.pos.y, this.targetPos.x - this.item.transform.pos.x) - Math.asin(tipOffset.y / Math.hypot(this.targetPos.x - this.item.transform.pos.x, this.targetPos.y - this.item.transform.pos.y));

    this.item.item.tracker.track();


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

    this._gun.reload(false);
  }
  shoot() {
    if (!this._gun) return;

    this._gun.shoot();
  }
}






/*class WeaponUser extends Component {
  constructor() {
    super();

    this._weapon = undefined;

    this.targetPos = new Vec(0, 0);
    this.trigger = false;

    this.reloading = false;
    this.reloadProgress = 0;
    this.lastTrigger = false;
    this.hasClicked = false;
    this.tipPos = new Vec(0, 0);
    this.cooldown = 0;
    this.gun = undefined;
    this.ammo = undefined;

    this.clientOnly = true;
  }

  set weapon(value) {
    if (this.weapon) {
      this.reloadProgress = 0;
      this.reloading = false;

      if (this.weapon.item?.held) {        
        setActive(this.weapon, false);
        setParent(this.weapon, itemHolder);
      }
    }
    

    this._weapon = value;

    if (this.weapon) {
      this.gun = this.weapon.gun;
      this.ammo = ammos[this.weapon.gun.ammoType];

      this.update(0);
      setActive(this.weapon, true);
      setParent(this.weapon, world);
      this.weapon.item.tracker.snap();
    }
  }
  get weapon() {
    return this._weapon;
  }

  start() {

  }
  
  update(dt) {
    this.cooldown = Math.max(this.cooldown - dt, 0);
    if (this.reloading && !this.cooldown) {
      if (this.weapon.name == "Shotgun") {
        sendAudio(this.ob, this.gun.reloadAud);

        sendSet(this.weapon, "gun.ammo", this.gun.ammo + 1);

        if (this.gun.ammo == this.gun.maxAmmo) {
          this.reloading = false;
        } else
          this.cooldown = this.gun.reloadCooldown;
          this.reloadProgress = 0;
      } else {
        sendAudio(this.ob, this.gun.reloadAud + "End");

        sendSet(this.weapon, "gun.ammo", this.gun.maxAmmo);
        this.reloading = false;
      }
    } 
    if (this.reloading) this.reloadProgress += dt / this.gun.reloadCooldown;
    else this.reloadProgress = 0;

    if (!this.weapon) return;

    this.weapon.transform.pos.from(this.transform.pos);
    let rightDir = this.transform.dir + Math.PI / 2;
    this.weapon.transform.pos.addV(new Vec(Math.cos(rightDir), Math.sin(rightDir)).mul(0.3));

    let tipOffset = this.gun.spriteInfo.tip.copy();
    
    this.weapon.transform.dir = Math.atan2(this.targetPos.y - this.weapon.transform.pos.y, this.targetPos.x - this.weapon.transform.pos.x) - Math.asin(tipOffset.y / Math.hypot(this.targetPos.x - this.weapon.transform.pos.x, this.targetPos.y - this.weapon.transform.pos.y));
    this.tipPos.from(this.weapon.transform.pos).addV(tipOffset._rotateZAxis(this.weapon.transform.dir));

    this.weapon.item.tracker.track();

    if ((this.trigger && !this.lastTrigger) || (this.gun.automatic && this.trigger)) {
      this.shoot();
    }

    this.lastTrigger = this.trigger;
    if (!this.trigger) this.hasClicked = false;
  }

  shoot() {
    if (!this.weapon) return;
    if (this.cooldown) {
      if (this.weapon.name == "Shotgun") {
        if (!this.reloading) return;
        this.reloading = false;
      } else return;
    }

    if (this.gun.ammo <= 0) {
      if (!this.hasClicked) sendAudio(this.ob, "gun/reloadMagazineStart");
      this.hasClicked = true;
      return;
    }



    
    
    this.cooldown = this.gun.cooldown;
  }

  reload() {
    if (!this.weapon || this.cooldown || this.gun.ammo == this.gun.maxAmmo) return;

    this.reloading = true;
    this.reloadProgress = 0;
    this.cooldown = this.gun.reloadCooldown;

    if (!this.weapon.name == "Shotgun") sendAudio(this.ob, this.gun.reloadAud + "Start");
    else sendAudio(this.ob, "gun/reloadMagazineStart");
  }

  from(data) {
    super.from(data);

    return this;
  }
}*/