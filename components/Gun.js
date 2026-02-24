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

let shootTimer = undefined;
let reloadTimer = undefined;
let reloadingAmmo = undefined;

class Gun extends Component {
  constructor(props = {}) {
    super();

    this.ammo = props.ammo;
  }

  get tipPos() {
    let item = this.getComponent(Item);
    return item.transform.pos._addV(item.info.gun.tipOffset._rotateZAxis(item.transform.dir));
  }

  init() {
    if (this.ammo == undefined) this.ammo = this.getComponent(Item).info.gun.maxAmmo;
    
  }

  shoot() {
    let info = this.getComponent(Item).info.gun;

    if (shootTimer) return;
    if (reloadTimer) {
      if (info.ammoType != AMMOTYPE.shotgun) return;

      cancelReload();
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



    shootTimer = new TimerTime(info.cooldown, () => {
      if (shootTimer.progress == 1) shootTimer = undefined;
    });
  }
  reload(inventory) {
    let info = this.ob.item.info.gun;

    if (this.ammo == info.maxAmmo) return;
    if (reloadTimer || shootTimer) return;

    sendAudio(this.ob, "gun/reloadMagazineStart");

    reloadingAmmo = inventory.find((ob) => {return ob.item.info.ammo?.type == info.ammoType});
    if (!reloadingAmmo) return;

    reloadTimer = new TimerTime(info.reloadTime, () => {
      if (reloadTimer.progress == 1) {
        if (info.ammoType == AMMOTYPE.shotgun) {
          let ammoItem = inventory.gather(reloadingAmmo, 1)?.getComponent(Item);
          if (!ammoItem) {
            cancelReload();
            return;
          }

          this.setAmmo(this.ammo + 1);
          sendAudio(this.ob, info.reloadAud);
          reloadTimer.reset();

          reloadingAmmo = inventory.find((ob) => {return ob.item.info.ammo?.type == info.ammoType});
          if (this.ammo >= info.maxAmmo || !reloadingAmmo) cancelReload();
          return;
        } 

        let missing = info.maxAmmo - this.ammo;
        let ammoItem = inventory.gather(reloadingAmmo, missing)?.getComponent(Item);
        if (!ammoItem) {
          cancelReload();
          return;
        }

        this.setAmmo(this.ammo + ammoItem.amount);
        sendAudio(this.ob, info.reloadAud + "End");
        cancelReload();
      }
    });
  }

  setAmmo(ammo) {
    sendSet(this.ob, "!Gun.ammo", ammo);
  }


  from(data) {
    super.from(data);
    
    this.ammo = data.ammo;

    return this;
  }
}


function cancelReload() {
  if (!reloadTimer) return;

  reloadTimer.stop();
  reloadTimer = undefined;
  reloadingAmmo = undefined;
}

