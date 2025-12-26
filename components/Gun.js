let gunScaling = 1/20;
let gunSpriteInfo = {};

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

    this.tags = props.tags || "weapon";

    this.ammoType = props.ammoType || AMMOTYPE.light;
    this.maxAmmo = props.maxAmmo || 12;
    this.ammo = props.ammo || this.maxAmmo;
    this.damage = props.damage || 20;
    this.cooldown = props.cooldown || 0;
    this.reloadCooldown = props.reloadCooldown || 0;
    this.automatic = props.automatic || false;
    this.spread = props.spread || 0;

    this.shootAud = props.shootAud || "gun/pistolShot";
    this.reloadAud = props.reloadAud || "gun/reloadMagazine";
  }

  start() {
    this.sprite = this.getComponent(Sprite);
    let texture = nde.tex[this.sprite.tex];

    this.transform.size.from(texture.size).mul(gunScaling);
    this.spriteInfo = gunSpriteInfo[this.sprite.tex];
    this.item = this.getComponent(Item);
    this.item.stackSize = 70;
    this.item.tags = this.tags;

    this.ob.gun = this;
  }
  
  update(dt) {
      
  }

  from(data) {
    super.from(data);
    
    this.tags = data.tags;

    this.ammoType = data.ammoType;
    this.maxAmmo = data.maxAmmo;
    this.ammo = data.ammo;
    this.damage = data.damage;
    this.cooldown = data.cooldown;
    this.reloadCooldown = data.reloadCooldown;
    this.automatic = data.automatic;
    this.spread = data.spread;

    this.shootAud = data.shootAud;
    this.reloadAud = data.reloadAud;

    return this;
  }

  strip() {
    delete this.ob.gun;

    super.strip();
  }
}



function processGunSprites() {
  for (let i in nde.tex) {
    if (i.split("/")[0] == "gun") {
      processGunSprite(i);
    }
  }
}
function processGunSprite(tex) {
  let texture = nde.tex[tex];
  let tip = new Vec(0, 0);

  let p = texture.ctx.getImageData(0, 0, texture.size.x, texture.size.y).data;

  for (let x = 0; x < texture.size.x; x++) {
    for (let y = 0; y < texture.size.y; y++) {
      let k = (x + y * texture.size.x) * 4;

      if (p[k] == 2 && p[k+1] == 0 && p[k+2] == 0 && p[k+3] == 255) tip.set(x, y);
    }
  }

  gunSpriteInfo[tex] = {
    tip: tip.subV(texture.size._mul(0.5)).add(0.5).mul(gunScaling),
  };
}