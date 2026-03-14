

let lootTables = {
  guns: new LootTable([
    {ob: "Pistol", weight: 1}, 
    {ob: "Shotgun", weight: 1}, 
    {ob: "SMG", weight: 1}, 
    {ob: "Sniper", weight: 1}, 
    {ob: "Machine Gun", weight: 1}, 
  ]),

  ammo: new LootTable([
    ["Light Ammo", 1, 4,30],
    ["Heavy Ammo", 1, 1,5],
    ["Shotgun Shell", 1, 2,12],
  ]),
};


let prefabs = {
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

    item: {
      tags: "ammo",
      stackSize: 30,
      ammoType: AMMOTYPE.light,
    },
  },
  "Heavy Ammo": {
    tex: "ammo/heavy",

    item: {
      tags: "ammo",
      stackSize: 12,
      ammoType: AMMOTYPE.heavy,
    },
  },
  "Shotgun Shell": {
    tex: "ammo/shotgun",

    item: {
      tags: "ammo",
      stackSize: 12,
      ammoType: AMMOTYPE.shotgun,
    },
  },

  "Light Armor": {
    tex: "armor/light",

    item: {
      tags: "armor",
      dr: 0.4,
    },

    scale: 0.8,
  },
};



let EntityPlayerInventory = new Inventory({size: hotbarSize * 3, w: hotbarSize, startIndex: hotbarSize});
  EntityPlayerInventory.tags[0] = "weapon";
  EntityPlayerInventory.tags[1] = "weapon";
  EntityPlayerInventory.tags[2] = "!weapon";
  EntityPlayerInventory.tags[3] = "!weapon";
  EntityPlayerInventory.tags[4] = "!weapon";
  EntityPlayerInventory.tags[armorSlot] = "armor";
  EntityPlayerInventory.allowedHeldSlots = [0, 1, 2, 3, 4];
  EntityPlayerInventory.heldIndex = 0; 
let EntityPlayer = new Ob({
  name: "Duck",
}, [
  new Sprite("duck/1"),
  new Entity({health: 100, nametag: true}),
  new Duck(),
  new AudioSource(),
  EntityPlayerInventory,
]);