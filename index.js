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

  "Editor Place": "mouse0",
  "Editor Break": "mouse2",


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

  processGunSprites();
  processRooms();

  serverId = initClient();
  if (serverId) scenes.mainMenu.lobbyDisplay.text = serverId;

  nde.setScene(scenes.mainMenu);

  if (serverId == "editor") {
    nde.setScene(scenes.editor);
    return;
  }

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