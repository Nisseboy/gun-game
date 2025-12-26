let audsPaths = [
  {"path": "duck/step/1"},
  {"path": "duck/step/2"},
  {"path": "duck/step/3"},
  {"path": "duck/step/4"},

  {"path": "gun/pistolShot"},
  {"path": "gun/reloadMagazineStart"},
  {"path": "gun/reloadMagazineEnd"},
  {"path": "gun/shotgunShot"},
  {"path": "gun/shotgunReload"},
  {"path": "gun/sniperShot"},
];

let texPaths = [
  {"path": "duck/1"},
  {"path": "duck/dead"},
  {"path": "duck/rot/1,2,3,4,5,6,7,8"},

  //{"path": "gun/pistol,shotgun,sniper,smg,machinegun"},
  {"path": "gun/pistol"},
  {"path": "gun/shotgun"},
  {"path": "gun/sniper"},
  {"path": "gun/smg"},
  {"path": "gun/machinegun"},

  {"path": "crosshair"},

  {"path": "inventory/slot"},
  {"path": "inventory/heldSlot"},
  {"path": "inventory/primary"}, //opacity: 120*182
  {"path": "inventory/secondary"},
];

function preloadAnimations() {
  let frame = AnimationFrame;
  let loop = AnimationFrameLoop;
  let event = AnimationFrameEvent;

  { //duck/walk
    nde.tex["duck/walk"] = new Animation([
      new event("step", -0.2),
      new frame(nde.tex["duck/1"]),
      new event("step", 0.2),
      new frame(nde.tex["duck/1"]),
      new loop(),
    ], 1/6);
  }
  
  { //duck/rot
    nde.tex["duck/rot"] = new Animation([
      new frame(nde.tex["duck/rot/1"]),
      new frame(nde.tex["duck/rot/2"]),
      new frame(nde.tex["duck/rot/3"]),
      new frame(nde.tex["duck/rot/4"]),
      new frame(nde.tex["duck/rot/5"]),
      new frame(nde.tex["duck/rot/6"]),
      new frame(nde.tex["duck/rot/7"]),
      new frame(nde.tex["duck/rot/8"]),
      new loop(),
    ], 1/10);
  }
}