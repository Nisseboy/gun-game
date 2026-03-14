let nde = new NDE(document.getElementsByTagName("main")[0]); //nde needs to be defined globally and be the single instance of NDE
nde.debug = true;
nde.uiDebug = false;
//nde.targetFPS = 60;

let renderer = nde.renderer;
for (let asset of assetPaths) {
  nde.loadAsset(asset);
}


let settingsName = "gunGameSettings";
let settings = JSON.parse(localStorage.getItem(settingsName)) || {};


let scenes = {};

nde.controls = {
  "Move Up": "w",
  "Move Down": "s",
  "Move Left": "a",
  "Move Right": "d",
  "Run": "Shift",
  
  "Inventory": "e",
  "Interact": "f",
  "Open Chat": "Enter",

  "Use/Shoot": "mouse0",
  "Secondary Use": "mouse0",
  "Reload": "r",
  "Instamove Modifier": "Shift",
  "Drop Stack Modifier": "Control",
  "Drop Item": "q",
  "Slot 1": "1,!",
  "Slot 2": "2,\"",
  "Slot 3": "3,#",
  "Slot 4": "4,¤",
  "Slot 5": "5,%",

  "Editor Place": "mouse0",
  "Editor Break": "mouse2",
  "Editor Snap Modifier": "Shift",
  "Editor Inventory": "e",


  "Pause": "Escape",
  "Debug Mode": "l",
  "UI Debug Mode": "k",
};


nde.on("keydown", e => {
  if (nde.getKeyEqual(e.key,"Debug Mode")) nde.debug = !nde.debug;
  if (nde.getKeyEqual(e.key,"UI Debug Mode")) nde.uiDebug = !nde.uiDebug;
});

nde.on("afterSetup", () => {
  initStyles();
  
  for (let path of scenePaths) {
    let name = path.split("Scene")[1];
    name = name[0].toLowerCase() + name.slice(1);
    scenes[name] = new (eval(path))();
  }

  processPrefabs();
  processGunSprites();
  processRooms();
  
  initClient();
  scenes.mainMenu.lobbyDisplay.text = serverId;
  if (server) scenes.mainMenu.lobbyDisplay.text = "Hosting: " + server.id;

  if (serverId == "_editor") {
    nde.setScene(scenes.editor);
    return;
  }
  
  nde.setScene(scenes.mainMenu);

  if (client) {
    scenes.game.setupListeners();

    client.on("world", () => {
      if (settings.autoConnect)  {
        nde.setScene(scenes.game);
      };

      client.on("ping", () => {
        ping = Math.round(performance.now() - lastPingTime);
      })
      setInterval(sendPing, 5000);
      setTimeout(sendPing, 200);
    });
  }

});

nde.on("update", dt => {
  renderer.set("font", "16px monospace");
  renderer.set("imageSmoothing", false);

  nde.debugStats.ping = ping;
  if (server) nde.debugStats.serverTime = Math.round(server.lastUpdateDuration);
});

nde.on("resize", e => {
  return nde.w * settings.renderResolution / 100;
  //return 432; //new width
});

nde.on("mousemove", tooltipMove);

function getSlotDown(key) {
  if (key) {
    if (nde.getKeyEqual(key, "Slot 1")) return 0;
    if (nde.getKeyEqual(key, "Slot 2")) return 1;
    if (nde.getKeyEqual(key, "Slot 3")) return 2;
    if (nde.getKeyEqual(key, "Slot 4")) return 3;
    if (nde.getKeyEqual(key, "Slot 5")) return 4;
    return -1;
  }

  if (nde.getKeyDown("Slot 1")) return 0;
  if (nde.getKeyDown("Slot 2")) return 1;
  if (nde.getKeyDown("Slot 3")) return 2;
  if (nde.getKeyDown("Slot 4")) return 3;
  if (nde.getKeyDown("Slot 5")) return 4;
  return -1;
}

function pixelScale(ob, scale = 1) {
  ob.transform.size.from(nde.tex[ob.getComponent(Sprite).tex].size).mul(1/20 * scale);
}

function processPrefabs() {
  for (let i in prefabs) {
    let p = prefabs[i];

    p.tex ??= "duck/1";
    p.components ??= [];

    if (p.gun) p.item ??= {};
    if (p.item) {
      let e = p.item;

      e.stackSize ??= 1;
      e.tags ??= "";

      p.components.push(Interactable, Item);

      if (e.tags.includes("ammo")) {
        e.ammoType ??= AMMOTYPE.light;
        p.scale ??= 0.5;
      }
      if (e.tags.includes("armor")) {
        e.dr ??= 0.5;
      }
    }

    if (p.gun) {
      let e = p.gun;

      e.ammoType ??= AMMOTYPE.light;
      e.maxAmmo ??= 12;
      e.damage ??= 20;
      e.cooldown ??= 0;
      e.reloadTime ??= 1;
      e.automatic ??= false;
      e.spread ??= 0;
      e.laser ??= false;
      e.shootAud ??= "gun/pistolShot";
      e.reloadAud ??= "gun/reloadMagazine";

      if (p.item.tags.length != 0) p.item.tags += ",";
      p.item.tags += "weapon";

      p.components.push(AudioSource, Gun);
    }



    p.scale ??= 1;
  }


  
  lootTables["all"] = new LootTable(Object.keys(prefabs).map(type=>prefab(type)));
}
function prefab(prefab, props = {}) {
  let type = prefabs[prefab];

  let ob = new Ob({name: prefab, ...props}, [
    new Sprite(type.tex),
    new Prefab(prefab),
  ]);
  

  for (let c of type.components) {
    ob.addComponent(new c());
  }

  ob.update();
  
  return ob;
}


let ping = 100;
let lastPingTime = 0;
function sendPing() {
  lastPingTime = performance.now();
  client.send("ping");
}




//For nde-Editor
function getContext() {
  return {
    nde,
    scenes,
  }
}