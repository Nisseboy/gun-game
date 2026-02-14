let AMMOTYPE = {
  light: 0,
  heavy: 1,
  shotgun: 2,
};
let ammos = [
  {name: "Light Ammo", shotsFired: 1, pierces: 0},
  {name: "Heavy Ammo", shotsFired: 1, pierces: 2},
  {name: "Shotgun Shell", shotsFired: 5, pierces: 1},
];

class Gun extends Component {
  constructor(props = {}) {
    super();

    this.ammo = props.ammo;

    this.shootTimer = undefined;
    this.reloadTimer = undefined;
  }

  get tipPos() {
    let item = this.getComponent(Item);
    return item.transform.pos._addV(item.info.gun.tipOffset._rotateZAxis(item.transform.dir));
  }

  init() {
    if (this.ammo == undefined) this.ammo = this.getComponent(Item).info.gun.maxAmmo;
    
  }

  start() {
    this.ob.gun = this;
  }

  shoot() {
    let info = this.getComponent(Item).info.gun;

    if (this.shootTimer) return;
    if (this.reloadTimer) {
      if (info.ammoType != AMMOTYPE.shotgun) return;

      this.cancelReload();
    }

    if (this.ammo <= 0) {
      sendAudio(this.ob, "gun/reloadMagazineStart");
      return;
    }



    let ammoType = ammos[info.ammoType];
    let endPoses = [];
    let hitPlayers = {};
    for (let i = 0; i < ammoType.shotsFired; i++) {
      let pierces = ammoType.pierces + 1;
      let dir = this.transform.dir + (Math.random() * 2 - 1) * info.spread;
      let dirVec = new Vec().fromAngle(dir); 
      let pos = this.tipPos;

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

          //if (resEntity.entity == this.ob.entity) continue;

          if (!hitPlayers[resEntity.entity.id]) hitPlayers[resEntity.entity.id] = 0;
          hitPlayers[resEntity.entity.id] += info.damage;
        }
        
        pos.addV(dirVec._mul(0.001))
        

        pierces--;
      }
      
      
      endPoses.push(pos);
    }
    shoot(this, this.tipPos, endPoses);
    for (let id in hitPlayers) {
      changeHp(idLookup[id], -hitPlayers[id]);
    }



    this.shootTimer = new TimerTime(info.cooldown, () => {
      if (this.shootTimer.progress == 1) this.shootTimer = undefined;
    });
  }
  reload(instant = false) {
    let info = this.ob.item.info.gun;

    if (this.ammo == info.maxAmmo) return;

    if (instant) {
      this.cancelReload();
      sendSet(this.ob, "gun.ammo", info.maxAmmo);
      return;
    }

    if (this.reloadTimer || this.shootTimer) return;
    
    sendAudio(this.ob, "gun/reloadMagazineStart");

    this.reloadTimer = new TimerTime(info.reloadTime, () => {
      if (this.reloadTimer.progress == 1) {
        if (info.ammoType == AMMOTYPE.shotgun) {
          sendSet(this.ob, "gun.ammo", Math.min(this.ammo + 1, info.maxAmmo));
          this.reloadTimer.reset();
          sendAudio(this.ob, info.reloadAud);
          if (this.ammo != info.maxAmmo) return;
        } else {
          sendAudio(this.ob, info.reloadAud + "End");
        }

        this.cancelReload();
        this.reload(true);
      }
    });
  }
  cancelReload() {
    if (!this.reloadTimer) return;

    this.reloadTimer.stop();
    this.reloadTimer = undefined;
  }


  from(data) {
    super.from(data);
    
    this.ammo = data.ammo;

    return this;
  }

  strip() {
    delete this.ob.gun;

    super.strip();
  }
}


