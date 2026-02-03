updateInterval = 1000/10;
maxPlayers = 12;
url = "https://nisseboy.github.io/gun-game";

let serverId;

const ITEMHOLDERID = 1;
const SKYID = 2;

class Server extends ServerBase {
  constructor() {
    super();
  }

  init() {
    super.init();
    scenes.game.loadWorld(createWorld());
    setTimeout(()=>{client.fire("world");}, 0);

    this.on("connection", (id, conn) => {      
      this.fire("createEntity", id, this.createPlayer(id).serialize(), world.id);
      this.send(id, "world", world.serialize());      
      this.sendAll("sendChat", undefined, id + " connected.");
    });
    this.on("disconnection", (id, conn) => {
      this.sendAll("mult", [
        ["sendChat", undefined, id + " disconnected."],
        ["removeEntity", id],
      ]);
    });
    this.on("ping", (id) => {      
      this.send(id, "ping");
    });

    this.on("respawn", (id) => {      
      this.sendAll("createEntity", this.createPlayer(id).serialize(), world.id);
    });


    this.on("*", (eventName, senderId, ...args) => {
      this.sendOthers(senderId, eventName, ...args);
    });
  }

  //Runs on updateInterval
  update(dt) {

  }

  createPlayer(id) {
    let player = EntityDuck.copy();
    player.name += " " + id;
    player.id = id;
    player.transform.pos.set(0, 0);
    return player;
  }
}



function createWorld() {
  noise.seed(5);
  
  /*
  let grid = new Grid({size: new Vec(5, 5)});
  grid.g = [
    1,1,0,1,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,1,0,1,
    1,1,1,1,1,
  ];

  let w = new Ob({name: "root"}, [
    grid,
  ], [
    
  ]);

  let itemHolder = new Ob({name: "itemHolder", id: 1});
  w.appendChild(itemHolder);

  for (let i = 0; i < 40; i++) {
    itemHolder.appendChild(createSpawner({
      pos: new Vec(Math.random(), Math.random()).mulV(grid.size),
      lootTable: "guns",
    }));
  }*/
 
  let grid = new Grid({size: new Vec(20, 20)});
  let w = new Ob({name: "root"}, [
    grid,
  ], [
    new Ob({name: "itemHolder", id: ITEMHOLDERID}),
    new Ob({name: "sky", id: SKYID, pos: grid.size._mul(0.5)}),
  ]);

  grid.placeRoom(allRooms[1], new Vec(5, 5));

  
  
  let player0 = EntityDuck.copy();
  player0.name += " 0";
  player0.id = 0;
  player0.transform.pos.set(2.5, 2.5);
  w.appendChild(player0);
  
  
  return w;
}