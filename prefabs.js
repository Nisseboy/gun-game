let itemTypes = {
  "Item": {},

  "Pistol": {
    tex: "gun/pistol",
    gun: {
      ammoType: AMMOTYPE.light,
      maxAmmo: 12,
      damage: 20,
      cooldown: 0.1,
      reloadTime: 1,
      automatic: false,
      spread: 5 * deg2rad,
      shootAud: "gun/pistolShot",
      reloadAud: "gun/reloadMagazine",
    },
  },
  "Shotgun": {
    tex: "gun/shotgun",
    gun: {
      ammoType: AMMOTYPE.shotgun,
      maxAmmo: 4,
      damage: 16,
      cooldown: 1.5,
      reloadTime: 1,
      automatic: false,
      spread: 10 * deg2rad,
      shootAud: "gun/shotgunShot",
      reloadAud: "gun/shotgunReload",
    },
  },
  "SMG": {
    tex: "gun/smg",
    gun: {
      ammoType: AMMOTYPE.light,
      maxAmmo: 20,
      damage: 8,
      cooldown: 0.1,
      reloadTime: 1,
      automatic: true,
      spread: 10 * deg2rad,
      shootAud: "gun/pistolShot",
      reloadAud: "gun/reloadMagazine",
    },
  },
  "Sniper": {
    tex: "gun/sniper",
    gun: {
      ammoType: AMMOTYPE.heavy,
      maxAmmo: 1,
      damage: 80,
      cooldown: 1,
      reloadTime: 1.5,
      automatic: false,
      spread: 0 * deg2rad,
      laser: true,
      shootAud: "gun/sniperShot",
      reloadAud: "gun/reloadMagazine",
    },
  },
  "MachineGun": {
    tex: "gun/machinegun",
    gun: {
      ammoType: AMMOTYPE.heavy,
      maxAmmo: 20,
      damage: 20,
      cooldown: 0.2,
      reloadTime: 2,
      automatic: true,
      spread: 15 * deg2rad,
      shootAud: "gun/sniperShot",
      reloadAud: "gun/reloadMagazine",
    },
  },
};

for (let i in itemTypes) {
  let type = itemTypes[i];

  if (type.stackSize == undefined) type.stackSize = 1;
  if (type.tags == undefined) type.tags = "";
  if (type.tex == undefined) type.tex = "duck/1";

  let g = type.gun;
  if (g) {
    if (g.ammoType == undefined) g.ammoType = AMMOTYPE.light;
    if (g.maxAmmo == undefined) g.maxAmmo = 12;
    if (g.damage == undefined) g.damage = 20;
    if (g.cooldown == undefined) g.cooldown = 0;
    if (g.reloadTime == undefined) g.reloadTime = 1;
    if (g.automatic == undefined) g.automatic = false;
    if (g.spread == undefined) g.spread = 0;
    if (g.laser == undefined) g.laser = false;
    if (g.shootAud == undefined) g.shootAud = "gun/pistolShot";
    if (g.reloadAud == undefined) g.reloadAud = "gun/reloadMagazine";

    if (type.tags.length != 0) type.tags += ",";
    type.tags += "weapon";
  }
}
function processGunSprites() {
  for (let i in itemTypes) {
    let type = itemTypes[i];
    if (!type.gun) continue;

    let texture = nde.tex[type.tex];        

    let p = texture.ctx.getImageData(0, 0, texture.size.x, texture.size.y).data;

    for (let x = 0; x < texture.size.x; x++) {
      for (let y = 0; y < texture.size.y; y++) {
        let k = (x + y * texture.size.x) * 4;

        if (p[k] == 2 && p[k+1] == 0 && p[k+2] == 0 && p[k+3] == 255) {
          type.gun.tipOffset = new Vec(x, y).subV(texture.size._mul(0.5)).add(0.5).mul(1/20);
        }
      }
    }
  }
}

function createItem(props = {}) {
  return new Ob({}, [
    new Sprite(),
    new AudioSource(),
    new Interactable(),
    new Item(props),
  ]);
}
function createSpawner(props = {}) {
  return new Ob({name: "Spawner", pos: props.pos}, [
    new Spawner(props),
  ]);
}



let EntityDuck = new Ob({
  name: "Duck",
}, [
  new Sprite("duck/1"),
  new Entity({health: 100}),
  new Duck(),
  new AudioSource(),
]);


let Pistol = createItem({itemType: "Pistol"});
Pistol.addComponent(new Gun({ammo: itemTypes.Pistol.gun.maxAmmo}));
let Shotgun = createItem({itemType: "Shotgun"});
Shotgun.addComponent(new Gun({ammo: itemTypes.Shotgun.gun.maxAmmo}));
let SMG = createItem({itemType: "SMG"});
SMG.addComponent(new Gun({ammo: itemTypes.SMG.gun.maxAmmo}));
let Sniper = createItem({itemType: "Sniper"});
Sniper.addComponent(new Gun({ammo: itemTypes.Sniper.gun.maxAmmo}));
let MachineGun = createItem({itemType: "MachineGun"});
MachineGun.addComponent(new Gun({ammo: itemTypes.MachineGun.gun.maxAmmo}));



let lootTables = {
  guns: new LootTable([
    {item: Pistol, weight: 1}, 
    {item: Shotgun, weight: 1}, 
    {item: SMG, weight: 1}, 
    {item: Sniper, weight: 1}, 
    {item: MachineGun, weight: 1}, 
  ]),
};