let idLookup;
let world;
let player;
let itemHolder;

let uiInventoryHolder;

class SceneGame extends Scene {
  constructor() {
    super();

    this.cam = new Camera(new Vec(0, 0));
    this.cam.w = 16;
    this.cam.renderW = nde.w;

    this.ui = new UIRoot({
      style: {
        size: uicam.size,
      },
      children: [],
    }); 

    this.initInventoryUI();
    this.initChatBox();

    this.ui.initUI();

    this.queuedText = [];
    this.openInventories = [];
  }

  initInventoryUI() {
    uiInventoryHolder = new UIBase();
    this.ui.children.push(
      uiInventoryHolder,
    );
  }
  initChatBox() {
    this.uiChat = new UISettingText({
      value: "",

      style: {
        size: new Vec(400, 200),
        padding: 5,
        editor: {
          readOnly: true,
          multiLine: true,
          autoScroll: true,
        },
        fill: "rgba(0, 0, 0, 0.2)",
        
        scroll: {
          alwaysShow: true,
          fill: buttonStyle.scroll.fill,
        },
      },
    });
    this.uiChatBox = new UISettingText({
      value: "",

      style: {
        size: new Vec(400, 40),
        fill: "rgba(0, 0, 0, 0.2)",
        padding: 5,
        scroll: {y: false, alwaysShow: true, fill: buttonStyle.scroll.fill},
      },

      events: {change: [(value, wasSubmitted) => {
        this.uiChatBox.setValue("");

        if (!value || !wasSubmitted) return;
        
        sendChat(this.player, value);
      }]},
    }),
    this.shownChatMessages = [];

    this.ui.children.push(new UIBase({
      style: {
        position: "absolute",
        pos: new Vec(0, 900),
        selfPos: new Vec(0, -1),
        direction: "column",
        align: new Vec(0, 2),
        gap: 4,
        padding: 5,
      },

      children: [
        this.uiChat,
        this.uiChatBox,
      ],
    }));
  }

  setupListeners() {    
    client.on("world", world => {          
      if (world) this.loadWorld(cloneData(world));
    });

    client.on("connection", (id, name) => {
      client.fire("sendChat", undefined, name + " connected.");

      scenes.mainMenu.updatePlayerList();
    });
    client.on("disconnection", (id, name) => {      
      client.fire("sendChat", undefined, name + " disconnected.");

      scenes.mainMenu.updatePlayerList();
    });
    client.on("createEntity", (entity, parentId) => {
      let e = cloneData(entity);
      e.stripClientComponents();
      idLookup[parentId].appendChild(e);

      let table = e.createLookupTable();
      for (let id in table) {
        idLookup[id] = table[id];
      }  

      if (e.id == id) this.setPlayer(e);

      e.update(1/60);
    });
    client.on("removeEntity", (entityId) => {      
      let table = (idLookup[entityId]?.createLookupTable()) || {};
      idLookup[entityId]?.remove();

      for (let id in table) {
        delete idLookup[id];
      }  
    });
    client.on("customization", (id, c) => {      
      let entity = idLookup[id];      

      entity.name = c.name || entity.id;
      scenes.mainMenu.updatePlayerList();
       
    });
    client.on("changeId", (oldId, newId) => {      
      let e = idLookup[oldId];
      if (!e) return;

      e.id = newId;
      delete idLookup[oldId];
      idLookup[newId] = e;      
    });
    client.on("moveChildren", (_ob, _target) => {
      let ob = idLookup[_ob];
      let target = idLookup[_target];

      while (ob.children.length > 0) ob.children[0].setParent(target);
    });
    client.on("setParent", (entityId, parentId) => {
      let e = idLookup[entityId];
      let p = idLookup[parentId];
      if (!e || !p) return;

      e.setParent(p);
    });
    client.on("playAudio", (entityId, aud) => {
      let entity = idLookup[entityId];
      let audio = nde.aud[aud];
      if (!entity || !audio) return;

      entity.audioSource.play(audio);
    });
    client.on("shoot", (gunId, start, ends) => {
      let ob = idLookup[gunId];
      let audioSource = ob.getComponent(AudioSource);
      let gun = ob.getComponent(Gun);
      let item = ob.getComponent(Item);

      start = new Vec().from(start);

      gun.ammo--;
      for (let end of ends) world.appendChild(new Ob({},[new BulletPath(start.copy(), new Vec().from(end), 0.02)]));
      audioSource.play(nde.aud[item.info.gun.shootAud]);
    });
    client.on("changeHp", (entityId, hp) => {
      let e = idLookup[entityId];
      if (!e) return;

      e.getComponent(Entity).hp += hp;

      if (hp < 0) client.fire("sendChat", entityId, "*ow*");
    });
    client.on("startRespawnTimer", () => {
      this.deathTimer = new TimerTime(5, () => {
        if (this.deathTimer.progress == 1) {
          delete this.deathTimer;

          client.send("respawn");
        }
      });
      this.closeInventory();
    });
    client.on("sendChat", (entityId, message) => {
      let entity = idLookup[entityId];

      let italics = message[0] == "*" && message[message.length - 1] == "*";
      
      if (!italics) this.uiChat.setValue(this.uiChat.value + `\n${entity?entity.name + ": ":""}${message}`);
      this.uiChat.parent.positionChildren();    
      
      let index = this.shownChatMessages.findIndex(e => e.entity == entity);
      if (index != -1 && entity) this.shownChatMessages.splice(index, 1);
      this.shownChatMessages.push({time: 1.5, entity, message, italics});
    });

    //Position entity smoothly
    client.on("p", (entityId, pos, dir) => {                 
      let e = idLookup?.[entityId];      
      if (!e) return;

      let diffPos = new Vec().from(pos).subV(e.transform.pos).mul(1000/updateInterval);
      let diffDir = getDeltaAngle(e.transform.dir, dir) * 1000 / updateInterval;
      
      if (e.pTimer) e.pTimer.stop();
      let lastDt = 1;
      e.pTimer = new TimerTime(updateInterval * 0.001, (dt) => {
        e.transform.pos.addV(diffPos.mul(dt / lastDt))
        e.transform.dir += diffDir * dt;

        lastDt = dt;

        if (e.pTimer.progress == 1) {
          let sqd = (e.transform.pos.x - pos.x) ** 2 + (e.transform.pos.y - pos.y) ** 2;
          
          if (sqd > 1.5) e.transform.pos.from(pos);
        }
      });
    });
    const parseProp = (e, step) => {
      let split = step.split("!");
      
      if (split.length == 2) return e.getComponent(eval(split[1]));
      else return e[step];
    }
    //Set properties of entity
    client.on("set", ( entityId, path, value) => { 
      try {        
        let e = idLookup[entityId];
        let steps = path.split(".");
        for (let i = 0; i < steps.length - 1; i++) {
          e = parseProp(e, steps[i]);
        }
        
        if (value.type) 
          e[steps[steps.length - 1]] = cloneData(value);
        else
          e[steps[steps.length - 1]] = value;
      } catch {}
      
    });
    //Call function on entity
    client.on("call", ( entityId, path, ...args) => { 
      let e = idLookup[entityId];
      let steps = path.split(".");
      for (let i = 0; i < steps.length - 1; i++) {
        e = parseProp(e, steps[i]);
      }

      args = args.map(e => {
        if (e?.type) return cloneData(e);
        else return e;
      });
      e[steps[steps.length - 1]](...args);
    });
    //Fire event on entity
    client.on("fire", ( entityId, eventName, ...args) => {       
      let e = idLookup[entityId];

      args = args.map(e => {
        if (e?.type) return cloneData(e);
        else return e;
      });
      
      e.fire(eventName, ...args);
    });
  }
  loadWorld(w) {            
    world = w;
    if (id != 0) world.stripClientComponents();

    idLookup = world.createLookupTable();
    itemHolder = world.findId(ITEMHOLDERID);

    this.setPlayer(idLookup[id]);
    this.update(1/60);

    scenes.mainMenu.updatePlayerList();
    
  }
  setPlayer(entity) {
    player = entity;
    this.player = entity;
    this.player.addComponent(
      new PlayerInput(),
      new Tracker(),
      new WeaponUser(),
      new Light({maxR: 2, brightness: 0.5, tex: "light/1", clientOnly: true}),
    );
    this.playerInput = this.player.getComponent(PlayerInput);

    for (let c of uiInventoryHolder.children) closeInventory(c);
    uiInventoryHolder.children = [];

    openInventory(this.player.getComponent(Inventory), {
      pos: new Vec(uicam.size.x / 2, uicam.size.y),
      selfPos: new Vec(-0.5, -1),
      padding: 5,
      stroke: "rgba(0,0,0,0)",

      inventory: {
        w: hotbarSize,
        startIndex: 0,
        stopIndex: hotbarSize,
      }
    });

    
  }

  closeInventory() {
    for (let inv of this.openInventories) {
      closeInventory(inv);
    }
    this.openInventories.length = 0;
  }
  openInventory(inventory) {
    if (this.openInventories.find(e=>e.inventory == inventory)) {
      this.closeInventory();
      return;
    }

    if (this.openInventories.length != 0) this.closeInventory();
    
    this.openInventories.push(openInventory(this.player.getComponent(Inventory), {
      pos: uicam.size._mul(0.5),
      selfPos: new Vec(-0.5, 0.5),
      padding: 3,
    }));

    if (!inventory) return;
    this.openInventories.push(openInventory(inventory, {
      pos: uicam.size._mul(0.5),
      selfPos: new Vec(-0.5, -1),
      padding: 3,
    }));
  }

  start() {
    
  }

  inputdown(key) {
    if (nde.getKeyEqual(key,"Pause")) {
      if (this.openInventories.length != 0) {
        this.closeInventory();
      } else {
        nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
      }
    }
    if (nde.getKeyEqual(key,"Open Chat")) {
      this.uiChatBox.setFocus(true);
    }
    
    if (nde.getKeyEqual(key, "Inventory") && !this.deathTimer) {
      if (this.openInventories.length != 0) {
        this.closeInventory();
      } else {
        this.openInventory(undefined);
      }
    }
  }
  inputup(key) {
    
  }

  update(dt) {  
    this.playerInput.mousePos.from(this.cam.untransformVec(nde.mouse));    
    world.update(dt);
    

    this.cam.pos.from(this.player.transform.pos);
    moveListener(this.cam.pos);

    let chatShown = false;
    for (let i = 0; i < this.shownChatMessages.length; i++) {
      let m = this.shownChatMessages[i];
      m.time -= dt;

      if (m.time <= 0) {
        this.shownChatMessages.splice(i, 1);
        i--;
      } else if (!m.italics) chatShown = true;
    }
    this.uiChat.parent.style.render = (this.uiChatBox.focused || chatShown) ? "normal" : "hidden";

    nde.debugStats.idLookup = Object.keys(idLookup).length;
  }

  render() {
    let cam = this.cam;
    cam.renderW = nde.w;
    renderer.set("fill", "rgba(255, 255, 255, 1");


    renderer._(()=>{
      renderer.set("fill", "rgb(100, 100, 50)");
      renderer.rect(vecZero, new Vec(nde.w, nde.w / 16 * 9));
    });



    cam._(renderer, () => {
      world.grid.cam = cam;
      world.render();

      world.getComponent(Sky).setMinBounds(cam.pos, cam.w*0.5);
      renderer.ctx.globalCompositeOperation = "multiply";
      renderLights(cam);
      renderer.ctx.globalCompositeOperation = "multiply";
      renderVision(cam);
      renderer.ctx.globalCompositeOperation = "source-over";


      for (let i = 0; i < openInventories.length; i++) {
        openInventories[i].renderSlots();
      }

      renderer.set("textAlign", ["center", "bottom"]);
      renderer.set("font", "0.3px monospace");
      for (let i = 0; i < this.shownChatMessages.length; i++) {
        let m = this.shownChatMessages[i];
        if (!m.entity) continue;

        if (m.italics) renderer.set("fill", "rgba(184, 184, 184, 0.51)");
        else renderer.set("fill", "rgb(255, 255, 255)");
        renderer.text(m.message, m.entity.transform.pos._subV(new Vec(0, 0.4)));
      }
    });

    renderer._(() => {
      cam.scaleRenderer(renderer);


      renderer.set("fill", "rgba(0, 0, 0, 0)");
      renderer.set("stroke", "rgba(0, 0, 0, 255");
      renderer.set("lineWidth", 0.03);

      let size = new Vec(2, 0.4);
      let pos = new Vec(cam.w - 1.2 - size.x, cam.w * cam.ar - 0.1 - size.y);
      renderer.rect(pos, size);
      renderer.rect(new Vec(pos.x, pos.y - 0.1 - size.y), size);

      renderer.set("stroke", "rgba(0, 0, 0, 0)");
      
      renderer.set("fill", "rgba(255, 0, 0, 0.51)");
      renderer.rect(pos, new Vec(size.x * Math.max(this.player.getComponent(Entity).hp / 100, 0), size.y));
      renderer.set("fill", "rgba(255, 238, 0, 0.51)");
      if (reloadTimer)
        renderer.rect(new Vec(pos.x, pos.y - 0.1 - size.y), new Vec(size.x * reloadTimer.progress, size.y));



      if (this.deathTimer) {        
        renderer.set("fill", "rgba(131, 0, 0, 0.27)");
        renderer.set("stroke", "rgba(255, 0, 0, 0)");
        renderer.rect(vecZero, new Vec(cam.w, cam.w * cam.ar));

        renderer.set("fill", "rgba(255, 255, 255, 1)");
        renderer.set("font", "1px monospace");
        renderer.set("textAlign", [1, 1]);
        renderer.text(`You are dead [${Math.ceil(5 - this.deathTimer.elapsedTime)}]`, new Vec(cam.w * 0.5, cam.w * cam.ar * 0.5));
      }
    });

    uicam._(renderer, () => {
      if (cursorItem.ob) cursorItem.item.amount = cursorItem.amount;

      this.ui.renderUI();

      if (cursorItem.ob) {
        let pos = uicam.untransformVec(nde.mouse)._sub(itemUISize * 0.5);
        renderer.translate(pos);
        if (cursorItem.item.amount) cursorItem.item.render();
        renderer.translate(pos._mul(-1));
      }
    });
  }
}

function sendSet(entity, path, value) {
  client.fire("set", entity.id, path, value);
  client.send("set", entity.id, path, value);
}
function sendCall(entity, path, ...args) {
  client.fire("call", entity.id, path, ...args);
  client.send("call", entity.id, path, ...args);
}
function sendFire(entity, eventName, ...args) {
  client.fire("fire", entity.id, eventName, ...args);
  client.send("fire", entity.id, eventName, ...args);  
}
function createEntity(entity, parent) {
  client.fire("createEntity", entity.serialize(), parent.id);
  client.send("createEntity", entity.serialize(), parent.id);

  return idLookup[entity.id];
}
function removeEntity(entity) {
  client.fire("removeEntity", entity.id);
  client.send("removeEntity", entity.id);
}
function moveChildren(ob, target) {
  client.fire("moveChildren", ob.id, target.id);
  client.send("moveChildren", ob.id, target.id);
}
function setActive(entity, active) {
  entity.active = active;
  
  client.send("set", entity.id, "active", active);
}
function setVisible(entity, visible) {
  entity.visible = visible;
  
  client.send("set", entity.id, "visible", visible);
}
function setParent(entity, parent) {    
  client.fire("setParent", entity.id, parent.id);
  client.send("setParent", entity.id, parent.id);
}
function sendAudio(entity, aud) {
  client.fire("playAudio", entity.id, aud);
  client.send("playAudio", entity.id, aud);
}
function shoot(gun, start, ends) {    
  client.fire("shoot", gun.ob.id, start, ends);
  client.send("shoot", gun.ob.id, start, ends);
}
function changeHp(entity, hp) {
  client.send("changeHp", entity.id, hp);
}
function damage(entity, dmg) {
  client.send("damage", entity.id, dmg);
}

function sendChat(entity, message) {
  client.fire("sendChat", entity?.id, message);
  client.send("sendChat", entity?.id, message);
}