let nde = new NDE(document.getElementsByTagName("main")[0]); //nde needs to be defined globally and be the single instance of NDE
nde.debug = true;
nde.uiDebug = false;
//nde.targetFPS = 60;

let renderer = nde.renderer;
for (let p of assetPaths) {
  nde.loadAsset(p);
}
preloadAnimations();


let settingsName = "gunGameSettings";
let settings = JSON.parse(localStorage.getItem(settingsName)) || {};
setBackgroundCol(); //Set the background color if it was overridden by settings


let scenes = {};

nde.controls = {
  "Move Up": "w",
  "Move Down": "s",
  "Move Left": "a",
  "Move Right": "d",
  "Run": "Shift",
  
  "Inventory": "e",
  "Interact": "f",

  "Shoot": "mouse0",
  "Reload": "r",
  "Drop Item": "g",
  "Primary Weapon": "1,!",
  "Secondary Weapon": "2,\"",


  "Pause": "Escape",
  "Debug Mode": "l",
  "UI Debug Mode": "k",
};


nde.on("keydown", e => {
  if (nde.getKeyEqual(e.key,"Debug Mode")) nde.debug = !nde.debug;
  if (nde.getKeyEqual(e.key,"UI Debug Mode")) nde.uiDebug = !nde.uiDebug;
});

nde.on("afterSetup", () => {
  Object.assign(scenes, {
    game: new SceneGame(), 
    mainMenu: new SceneMainMenu(),
    settings: new SceneSettings(),
  })
  processGunSprites();

  initClient();

  nde.setScene(scenes.mainMenu);

  if (client) {
    scenes.game.setupListeners();
    scenes.mainMenu.lobbyDisplay.text = client.serverId;

    if (settings.autoConnect)  {
      client.on("world", () => {
        nde.setScene(scenes.game);

        client.on("ping", () => {
          ping = Math.round(performance.now() - lastPingTime);
        })
        setInterval(sendPing, 5000);
        sendPing();
      }) 
    };
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