let EntityDuck = new Ob({
  name: "Duck",
}, [
  new Sprite("duck/1"),
  new Entity({health: 100}),
  new Duck(),
  new AudioSource(),
]);





let GunBase = new Ob({
  name: "Gun",
}, [
  new Sprite(),
  new AudioSource(),
  new Item(),
  new Gun(),
]);

let Pistol = GunBase.copy();
{
  Pistol.name = "Pistol";
  Pistol.getComponent(Sprite).tex = "gun/pistol";
  let gun = Pistol.getComponent(Gun);

  gun.tags = "weapon,secondary";
  gun.ammoType = AMMOTYPE.light;
  gun.maxAmmo = 12;
  gun.ammo = 12;
  gun.damage = 20;
  gun.cooldown = 0.1;
  gun.reloadCooldown = 1;
  gun.automatic = false;
  gun.spread = 5 / 180 * Math.PI;

  gun.shootAud = "gun/pistolShot";
  gun.reloadAud = "gun/reloadMagazine";
}
let Shotgun = GunBase.copy();
{
  Shotgun.name = "Shotgun";
  Shotgun.getComponent(Sprite).tex = "gun/shotgun";
  let gun = Shotgun.getComponent(Gun);

  gun.tags = "weapon,primary";
  gun.ammoType = AMMOTYPE.shotgun;
  gun.maxAmmo = 4;
  gun.ammo = 4;
  gun.damage = 16;
  gun.cooldown = 1.5;
  gun.reloadCooldown = 1;
  gun.automatic = false;
  gun.spread = 10 / 180 * Math.PI;

  gun.shootAud = "gun/shotgunShot";
  gun.reloadAud = "gun/shotgunReload";
}

let gunLootTable = new LootTable([
  {item: Pistol, weight: 1}, 
  {item: Shotgun, weight: 1}, 
]);
