updateInterval = 1000/10;
maxPlayers = 12;

const ITEMHOLDERID = 1;
const SKYID = 2;

class Server extends ServerBase {
  constructor() {
    super();
  }

  init() {
    super.init();

    setTimeout(()=>{
      scenes.game.loadWorld(this.createWorld());
      client.fire("world");
    }, 0);

    this.on("connection", (id, conn) => {      
      this.fire("createEntity", id, world.getComponent(PlayerStore).get(id).serialize(), world.id);
      let w = world.copy();
      w.stripClientComponents();
      this.send(id, "world", w.serialize());      
      this.sendAll("sendChat", undefined, id + " connected.");      
    });
    this.on("disconnection", (id, conn) => {
      world.getComponent(PlayerStore).store(idLookup[id]);

      this.sendAll("mult", [
        ["sendChat", undefined, id + " disconnected."],
        ["removeEntity", id],
      ]);
    });
    this.on("ping", (id) => {      
      this.send(id, "ping");
    });

    this.on("respawn", (id) => {      
      this.sendAll("createEntity", world.getComponent(PlayerStore).get(id).serialize(), world.id);
    });


    this.on("*", (eventName, senderId, ...args) => {
      this.sendOthers(senderId, eventName, ...args);
    });
  }

  //Runs on updateInterval
  update(dt) {

  }


  createWorld() {
    noise.seed(5);
  
    let grid = new Grid({size: new Vec(20, 20)});
    let w = new Ob({name: "root"}, [
      grid,
      new PlayerStore(),
    ], [
      new Ob({name: "itemHolder", id: ITEMHOLDERID}),
      new Ob({name: "sky", id: SKYID, pos: grid.size._mul(0.5)}),
    ]);

    grid.placeRoom(allRooms[1], new Vec(5, 5));

    
    let itemHolder = w.findId(ITEMHOLDERID);
    for (let i = 0; i < 20; i++) {
      itemHolder.appendChild(createSpawner({
        pos: new Vec(Math.random(), Math.random()).mulV(grid.size),
        lootTable: "guns",
      }));
      itemHolder.appendChild(createSpawner({
        pos: new Vec(Math.random(), Math.random()).mulV(grid.size),
        lootTable: "ammo",
      }));
    }


    let chest = createContainer({size: 10});
    chest.transform.pos.set(3, 3);
    w.appendChild(chest);

    let player0 = w.getComponent(PlayerStore).get(0);
    w.appendChild(player0);
    
    
    return w;
  }
}
