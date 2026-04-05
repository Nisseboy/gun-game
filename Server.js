updateInterval = 1000/10;
maxPlayers = 12;

const ITEMHOLDERID = 1;

class Server extends ServerBase {
  init() {
    this.on("connection", (id, conn) => {      
      this.fire("createEntity", id, world.getComponent(PlayerStore).get(id).serialize(), world.id);
    });
    this.on("disconnection", (id, conn) => {
      world.getComponent(PlayerStore).store(idLookup[id]);

      let name = idLookup[id].name;
      this.sendAll("mult", [
        ["removeEntity", id],
        ["disconnection", id, name],
      ]);
    });
    this.on("join", (id) => {
      if (id == 0) {
        this.send(0, "world");        
        this.send(0, "customization", 0, customization);        
        return;
      }

      let w = world.copy();
      w.stripClientComponents();
      let name = idLookup[id].name;
      this.send(id, "world", w.serialize());       
      this.sendAll("connection", id, name);      
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
      let _entity = entity.getComponent(Entity);      
      let info = entity.getComponent(Prefab)?.info;


      if (_entity.hp + hp <= 0) {
        let sends = [];

        if (info?.deadTex) {
          let ob = new Ob({name: "Dead " + entity.name}, [
            entity.transform.copy(),
            new Sprite("duck/dead"),
          ]);

          let inventory = entity.getComponent(Inventory);
          if (inventory) {
            inventory.startIndex = 0;
            inventory.stopIndex = 1000;

            ob.addComponent(inventory, new Interactable());
          }
          sends.push(
          ["createEntity", ob.serialize(), itemHolder.id], 
          ["moveChildren", entity.id, ob.id],)
        }
        
        
       sends.push(["removeEntity", entity.id]
        );
        if (entity.getComponent(Duck)) sends.push(["sendChat", entity.id, entity.name + " died."]);

        this.sendAll("mult", sends);
        this.send(entityId, "startRespawnTimer");
      } else {
        this.sendAll("changeHp", entityId, hp);
      }
    })


    this.on("*", (eventName, senderId, ...args) => {
      this.sendOthers(senderId, eventName, ...args);
    });


    setTimeout(() => {
      scenes.game.loadWorld(this.createWorld());
    }, 0);
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

    grid.placeRoom(allRooms[0], new Vec(5, 5));
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
