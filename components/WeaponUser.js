class WeaponUser extends Component {
  constructor() {
    super();

    this._weapon = undefined;

    this.targetPos = new Vec(0, 0);
    this.trigger = false;

    this.reloading = false;
    this.lastTrigger = false;
    this.hasClicked = false;
    this.tipPos = new Vec(0, 0);
    this.cooldown = 0;
    this.gun = undefined;
    this.ammo = undefined;

    this.clientOnly = true;
  }

  set weapon(value) {
    if (this.weapon && this.weapon.item.held) {
      setActive(this.weapon, false);
      setParent(this.weapon, itemHolder);

      this.reloading = false;
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

        this.gun.ammo++;

        if (this.gun.ammo == this.gun.maxAmmo) {
          this.reloading = false;
        } else
          this.cooldown = this.gun.reloadCooldown;
      } else {
        sendAudio(this.ob, this.gun.reloadAud + "End");

        this.gun.ammo = this.gun.maxAmmo;
        this.reloading = false;
      }
    }

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



    let endPoses = [];
    let hitPlayers = {};
    for (let i = 0; i < this.ammo.shotsFired; i++) {
      let pierces = this.ammo.pierces + 1;
      let dir = this.weapon.transform.dir + (Math.random() * 2 - 1) * this.gun.spread;
      let dirVec = new Vec().fromAngle(dir); 
      let pos = this.tipPos.copy();

      while (pierces > 0) {
        let resWorld = world.grid.raycast(pos, dirVec);
        let resEntity = raycastEntities(pos, dirVec);
        

        if (!resWorld && !resEntity) {
          pos.addV(dirVec.mul(100));
          break;
        }

        if (!resEntity || (resWorld && resWorld.d < resEntity.d)) {
          pos.set(resWorld.x, resWorld.y);
        } else {          
          pos.set(resEntity.x, resEntity.y);    

          if (resEntity.entity == this.ob.entity) continue;

          if (!hitPlayers[resEntity.entity.id]) hitPlayers[resEntity.entity.id] = 0;
          hitPlayers[resEntity.entity.id] += this.gun.damage;
        }
        
        pos.addV(dirVec._mul(0.001))
        

        pierces--;
      }
      
      
      endPoses.push(pos);
    }
    shoot(this.gun, this.tipPos, endPoses);
    for (let id in hitPlayers) {
      changeHp(idLookup[id], -hitPlayers[id]);
    }
    
    this.cooldown = this.gun.cooldown;
  }

  reload() {
    if (!this.weapon || this.cooldown || this.gun.ammo == this.gun.maxAmmo) return;

    this.reloading = true;
    this.cooldown = this.gun.reloadCooldown;

    if (!this.weapon.name == "Shotgun") sendAudio(this.ob, this.gun.reloadAud + "Start");
    else sendAudio(this.ob, "gun/reloadMagazineStart");
  }

  from(data) {
    super.from(data);

    return this;
  }
}