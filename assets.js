let assetPaths = [
  {"path": "duck/1.png"},
  {"path": "duck/dead.png"},
  {"path": "duck/rot/1,2,3,4,5,6,7,8.png"},

  {"path": "duck/step/1.mp3"},
  {"path": "duck/step/2.mp3"},
  {"path": "duck/step/3.mp3"},
  {"path": "duck/step/4.mp3"},


  {"path": "gun/pistol.png"},
  {"path": "gun/shotgun.png"},
  {"path": "gun/sniper.png"},
  {"path": "gun/smg.png"},
  {"path": "gun/machinegun.png"},

  {"path": "gun/pistolShot.mp3"},
  {"path": "gun/reloadMagazineStart.mp3"},
  {"path": "gun/reloadMagazineEnd.mp3"},
  {"path": "gun/shotgunShot.mp3"},
  {"path": "gun/shotgunReload.mp3"},
  {"path": "gun/sniperShot.mp3"},

  
  {"path": "crosshair.png"},

  {"path": "inventory/slot.png"},
  {"path": "inventory/heldSlot.png"},
  {"path": "inventory/primary.png"}, //opacity: 120*182
  {"path": "inventory/secondary.png"},
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