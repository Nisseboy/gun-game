updateInterval = 1000/10;
maxPlayers = 12;

const ITEMHOLDERID = 1;

class Server extends ServerBase {
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

    

    this.on("damage", (id, entityId, dmg) => {
      this.fire("changeHp", id, entityId, -dmg);
    });
    this.on("changeHp", (id, entityId, hp) => {
      let entity = idLookup[entityId];
      if (!entity) return;

      if (entity.getComponent(Entity).hp + hp <= 0) {
        let inventory = entity.getComponent(Inventory);
        inventory.startIndex = 0;
        inventory.stopIndex = 1000;

        let ob = new Ob({name: "Dead " + entity.name}, [
          entity.transform.copy(),
          new Sprite("duck/dead"),
          inventory,
          new Interactable(),
        ]);

        this.sendAll("mult", [
          ["createEntity", ob.serialize(), itemHolder.id],
          ["moveChildren", entity.id, ob.id],
          ["removeEntity", entity.id],
          ["sendChat", entity.id, entity.name + " died."],
        ]);

        this.send(entityId, "startRespawnTimer");
      } else {
        this.sendAll("changeHp", entityId, hp);
      }
    })




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
      new Sky({day: 0.7, dayLengthS: 5}),
      new PlayerStore(),
    ], [
      new Ob({name: "itemHolder", id: ITEMHOLDERID}),
    ]);

    grid.placeRoom(allRooms[1], new Vec(5, 5));
    grid.fenceOff();

    
    let itemHolder = w.findId(ITEMHOLDERID);
    for (let i = 0; i < 20; i++) {
      itemHolder.appendChild(new Ob({name: "Spawner", pos: new Vec(Math.random(), Math.random()).mulV(grid.size)}, [
        new Spawner({lootTable: "guns"}),
      ]));
      itemHolder.appendChild(new Ob({name: "Spawner", pos: new Vec(Math.random(), Math.random()).mulV(grid.size)}, [
        new Spawner({lootTable: "ammo"}),
      ]));
    }


    let chest = createContainer({size: 5, tex: "box/ammo", scale: 0.6});
    chest.addComponent(new Spawner({lootTable: "ammo", amount: 5}));
    chest.transform.pos.set(3, 3);
    w.appendChild(chest);    

    /*
    world = w;
    console.log(scenes.editor.export());
*/
    let player0 = w.getComponent(PlayerStore).get(0);
    w.appendChild(player0);
    

    
    
    return w;
  }
}
