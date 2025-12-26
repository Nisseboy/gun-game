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
let SMG = GunBase.copy();
{
  SMG.name = "SMG";
  SMG.getComponent(Sprite).tex = "gun/smg";
  let gun = SMG.getComponent(Gun);

  gun.tags = "weapon,primary";
  gun.ammoType = AMMOTYPE.light;
  gun.maxAmmo = 20;
  gun.ammo = 20;
  gun.damage = 8;
  gun.cooldown = 0.1;
  gun.reloadCooldown = 1;
  gun.automatic = true;
  gun.spread = 10 / 180 * Math.PI;

  gun.shootAud = "gun/pistolShot";
  gun.reloadAud = "gun/reloadMagazine";
}
let Sniper = GunBase.copy();
{
  Sniper.name = "Sniper";
  Sniper.getComponent(Sprite).tex = "gun/sniper";
  let gun = Sniper.getComponent(Gun);

  gun.tags = "weapon,primary";
  gun.ammoType = AMMOTYPE.heavy;
  gun.maxAmmo = 1;
  gun.ammo = 1;
  gun.damage = 80;
  gun.cooldown = 1;
  gun.reloadCooldown = 1.5;
  gun.automatic = false;
  gun.spread = 0 / 180 * Math.PI;

  gun.shootAud = "gun/sniperShot";
  gun.reloadAud = "gun/reloadMagazine";
}
let MachineGun = GunBase.copy();
{
  MachineGun.name = "Machine Gun";
  MachineGun.getComponent(Sprite).tex = "gun/machinegun";
  let gun = MachineGun.getComponent(Gun);

  gun.tags = "weapon,primary";
  gun.ammoType = AMMOTYPE.heavy;
  gun.maxAmmo = 30;
  gun.ammo = 20;
  gun.damage = 20;
  gun.cooldown = 0.2;
  gun.reloadCooldown = 2;
  gun.automatic = true;
  gun.spread = 0 / 180 * Math.PI;

  gun.shootAud = "gun/sniperShot";
  gun.reloadAud = "gun/reloadMagazine";
}

let gunLootTable = new LootTable([
  {item: Pistol, weight: 1}, 
  {item: Shotgun, weight: 1}, 
  {item: SMG, weight: 1}, 
  {item: Sniper, weight: 1}, 
  {item: MachineGun, weight: 1}, 
]);
