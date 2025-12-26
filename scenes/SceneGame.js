let idLookup;
let world;
let itemHolder;

class SceneGame extends Scene {
  constructor() {
    super();

    this.cam = new Camera(new Vec(0, 0));
    this.cam.w = 16;
    this.cam.renderW = nde.w;
  }

  setupListeners() {
    client.on("world", world => {      
      if (world) this.loadWorld(cloneData(world));
    });

    client.on("createEntity", (parentId, entity) => {
      let e = cloneData(entity);
      e.stripClientComponents();
      idLookup[parentId].appendChild(e);
      idLookup[e.id] = e;      

      if (e.id == client.id) this.setPlayer(e);
    });
    client.on("removeEntity", (entityId) => {
      idLookup[entityId]?.remove();
      delete idLookup[entityId];
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
      let gun = idLookup[gunId].gun;
      start = new Vec().from(start);

      gun.ammo--;
      for (let end of ends) world.appendChild(new Ob({},[new BulletPath(start.copy(), new Vec().from(end), 0.02)]));
      playAudio(nde.aud[gun.shootAud], start);
    });
    client.on("changeHp", (entityId, hp) => {
      let entity = idLookup[entityId];

      entity.entity.hp += hp;
      

      if (entityId == client.id) checkDead(entity);
    });
    client.on("kill", (entityId) => {
      let entity = idLookup[entityId];
      
      itemHolder.appendChild(new Ob({name: "Dead " + entity.name}, [
        entity.transform.copy(),
        new Sprite("duck/dead"),
      ]));

      entity.remove();

      if (entityId == client.id) {
        this.deathTimer = new TimerTime(5, () => {
          if (this.deathTimer.progress == 1) {
            delete this.deathTimer;

            client.send("respawn");
          }
        });
      }
    });

    //Position entity smoothly
    client.on("p", (entityId, pos, dir) => {                 
      let e = idLookup[entityId];

      let diffPos = new Vec().from(pos).subV(e.transform.pos).mul(1000/updateInterval);
      let diffDir = getDeltaAngle(e.transform.dir, dir) * 1000 / updateInterval;
      
      if (e.pTimer) e.pTimer.stop();
      let lastDt = 1;
      e.pTimer = new TimerTime(updateInterval * 0.001, (dt) => {
        e.transform.pos.addV(diffPos.mul(dt / lastDt))
        e.transform.dir += diffDir * dt;

        lastDt = dt;
      });
    });
    //Set properties of entity
    client.on("set", ( entityId, path, value) => { 
      try {        
        let e = idLookup[entityId];
        let steps = path.split(".");
        for (let i = 0; i < steps.length - 1; i++) {
          e = e[steps[i]];
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
        e = e[steps[i]];
      }

      args = args.map(e => {
        if (value.type) return cloneData(e);
        else return e;
      });
      e[steps[steps.length - 1]](...args);
    });
  }
  loadWorld(w) {
    world = w;
    if (client.id != 0) world.stripClientComponents();
    

    idLookup = world.createLookupTable();
    itemHolder = world.findId(1);

    this.setPlayer(idLookup[client.id]);
  }
  setPlayer(entity) {
    this.player = entity;
    this.player.addComponent(
      new PlayerInput(),
      new Tracker(),
    );
    this.playerInput = this.player.getComponent(PlayerInput);
  }

  start() {
    
  }

  inputdown(key) {
    if (nde.getKeyEqual(key,"Pause")) {
      nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
    }
  }
  inputup(key) {
    
  }

  update(dt) {  
    this.playerInput.mousePos.from(this.cam.untransformVec(nde.mouse));
    world.update(dt);
    

    this.cam.pos.from(this.player.transform.pos);
    moveListener(this.cam.pos);
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

      renderer.ctx.globalCompositeOperation = "multiply";
      renderVision(cam);
      renderer.ctx.globalCompositeOperation = "source-over"

      for (let i = 0; i < openInventories.length; i++) {
        openInventories[i].renderSlots();
      }
    });

    renderer._(() => {
      cam.scaleRenderer(renderer);

      let inv = this.player.inventory;
      inv.renderSlot(0, new Vec(cam.w - 1.1, cam.w * cam.ar - 2.15));
      inv.renderSlot(1, new Vec(cam.w - 1.1, cam.w * cam.ar - 1.1));

      if (this.deathTimer) {
        renderer.set("fill", "rgba(131, 0, 0, 0.27)");
        renderer.set("stroke", "rgba(255, 0, 0, 0)");
        renderer.rect(vecZero, new Vec(cam.w, cam.w * cam.ar));

        renderer.set("fill", "rgba(255, 255, 255, 1)");
        renderer.set("font", "1px monospace");
        renderer.set("textAlign", ["left", "middle"]);
        renderer.text(`You are dead [${Math.ceil(5 - this.deathTimer.elapsedTime)}]`, new Vec(1, cam.w * cam.ar * 0.5));
      }
    });
  }
}

function removeEntity(entity) {
  client.fire("removeEntity", entity.id);
  client.send("removeEntity", entity.id);
}
function setActive(entity, active) {
  entity.active = active;
  
  client.send("set", entity.id, "active", active);
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
  client.fire("changeHp", entity.id, hp);
  client.send("changeHp", entity.id, hp);
}
function kill(entity) {
  client.fire("kill", entity.id);
  client.send("kill", entity.id);
}

function checkDead(entity) {
  if (entity.entity.hp <= 0) {
    kill(entity);
  }
}