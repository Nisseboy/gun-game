let itemTypes = {
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
  "Machine Gun": {
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

  "Light Ammo": {
    tex: "ammo/light",
    stackSize: 30,

    ammo: {
      type: AMMOTYPE.light,
    }
  },
  "Heavy Ammo": {
    tex: "ammo/heavy",
    stackSize: 12,

    ammo: {
      type: AMMOTYPE.heavy,
    }
  },
  "Shotgun Shell": {
    tex: "ammo/shotgun",
    stackSize: 12,

    ammo: {
      type: AMMOTYPE.shotgun,
    }
  },
};

for (let i in itemTypes) {
  let type = itemTypes[i];

  if (type.stackSize == undefined) type.stackSize = 1;
  if (type.tags == undefined) type.tags = "";
  if (type.tex == undefined) type.tex = "duck/1";
  if (type.scale == undefined) type.scale = 1;
  if (type.components == undefined) type.components = [];

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

    type.components.push(Gun);
  }

  let a = type.ammo;
  if (a) {
    if (a.type == undefined) a.type = AMMOTYPE.light;

    type.scale *= 0.5;
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
  if (typeof props == "string") props = {itemType: props};

  let ob = new Ob({}, [
    new Sprite(),
    new AudioSource(),
    new Interactable(),
    new Item(props),
  ]);

  let type = itemTypes[props.itemType];
  for (let c of type.components) {
    ob.addComponent(new c());
  }

  return ob;
}
function createSpawner(props = {}) {
  return new Ob({name: "Spawner", pos: props.pos}, [
    new Spawner(props),
  ]);
}
function createContainer(props = {}) {
  let ob = new Ob({
    name: props.name || "Chest",
  }, [
    new Sprite("duck/1"),
    new Interactable(),
    new Inventory(props),
  ]);

  return ob;
}


let EntityPlayerInventory = new Inventory({size: hotbarSize * 3, w: hotbarSize, startIndex: hotbarSize});
    EntityPlayerInventory.tags[0] = "weapon";
    EntityPlayerInventory.tags[1] = "weapon";
    EntityPlayerInventory.tags[2] = "!weapon";
    EntityPlayerInventory.tags[3] = "!weapon";
    EntityPlayerInventory.tags[4] = "!weapon";
    EntityPlayerInventory.allowedHeldSlots = [0, 1, 2, 3, 4];
    EntityPlayerInventory.heldIndex = 0; 
let EntityPlayer = new Ob({
  name: "Duck",
}, [
  new Sprite("duck/1"),
  new Entity({health: 100}),
  new Duck(),
  new AudioSource(),
  EntityPlayerInventory,
]);






let lootTables = {
  guns: new LootTable([
    {item: createItem({itemType: "Pistol"}), weight: 1}, 
    {item: createItem({itemType: "Shotgun"}), weight: 1}, 
    {item: createItem({itemType: "SMG"}), weight: 1}, 
    {item: createItem({itemType: "Sniper"}), weight: 1}, 
    {item: createItem({itemType: "Machine Gun"}), weight: 1}, 
  ]),
};

lootTables["all"] = new LootTable(Object.keys(itemTypes).map(type=>createItem(type)));