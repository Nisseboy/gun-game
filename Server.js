updateInterval = 1000/10;
maxPlayers = 12;
url = "https://nisseboy.github.io/gun-game";

class Server extends ServerBase {
  constructor() {
    super();
  }

  init() {
    super.init();
    scenes.game.loadWorld(createWorld());
    client.fire("world");

    this.on("connection", (id, conn) => {      
      this.fire("createEntity", id, this.createPlayer(id).serialize(), world.id);
      this.send(id, "world", world.serialize());
    });
    this.on("disconnection", (id, conn) => {
      this.fire("removeEntity", id, id);
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
  
  let grid = new Grid(new Vec(5, 5));
  grid.random();

  let itemHolder = new Ob({name: "itemHolder", id: 1});

  let player0 = EntityDuck.copy();
  player0.name += " 0";
  player0.id = 0;
  player0.transform.pos.set(2.5, 2.5);

  let w = new Ob({name: "root"}, [
    grid,
  ], [

    new Ob({name: "text", pos: new Vec(0, -4)}, [
      new TextRenderer("[w a s d shift], [arrow keys]", {}),
    ]),
    
    itemHolder,

    player0,
  ]);


  for (let i = 0; i < 40; i++) {
    let p = gunLootTable.pick().copy();
    p.randomizeId();
    p.transform.pos.from(player0.transform.pos).addV(new Vec(Math.random(), Math.random()).sub(0.5).mul(10));
    itemHolder.appendChild(p);
  }
  
  return w;
}