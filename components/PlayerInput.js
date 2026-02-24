let pickupRange = 1;

class PlayerInput extends Component {
  constructor() {
    super();

    this.speed = 4;
    this.mousePos = new Vec(0, 0);
    
    this.clientOnly = true;
  }

  start() {
    this.duck = this.getComponent(Duck);
    this.weaponUser = this.getComponent(WeaponUser);
    this.light = this.getComponent(Light);
    this.inventory = this.getComponent(Inventory);
    
return
    if (this.inventory.slots[0]) return;
    let items = [];
    for (let slotIndex in this.inventory.slots) {      
      let ob = lootTables["all"].pick();
      let item = ob.getComponent(Item);
      item.amount = Math.ceil(Math.random() * item.info.stackSize);
      ob = createEntity(ob, itemHolder);

      items.push(ob);
    }

    setTimeout(() => {
      for (let ob of items) {      
        this.inventory.pickup(ob);
      }
    }, 100);
  }
  
  update(dt) {    
    let speedMult = nde.getKeyPressed("Run") ? 2 : 1;

    this.duck.move(new Vec(
      nde.getKeyPressed("Move Right") - nde.getKeyPressed("Move Left"),
      nde.getKeyPressed("Move Down") - nde.getKeyPressed("Move Up"),
    ).normalize().mul(this.speed * speedMult * dt));

    this.closestInteractable = undefined;
    let closestSqd = 1000;
    for (let i = 0; i < interactable.length; i++) {
      let item = interactable[i];
      let sqd = this.transform.pos._subV(item.transform.pos).sqMag();
      if (sqd < pickupRange) {
        let sqd2 = this.mousePos._subV(item.transform.pos).sqMag();
        if (sqd2 < closestSqd) {
          this.closestInteractable = item;
          closestSqd = sqd2;
        }
      }
    }

    if (nde.getKeyDown("Interact")) {
      if (this.closestInteractable) this.closestInteractable.interact(this.ob);      
      else scenes.game.closeInventory();
    }

    let pressedSlot = getSlotDown();
    if (pressedSlot != -1) this.inventory.heldIndex = pressedSlot;
    
    if (nde.scrolled) {
      this.inventory.scrollHeld(Math.sign(nde.scrolled));
    }

    if (this.inventory.held) {
      if (nde.getKeyDown("Drop Item")) {
        let amount = 1;
        if (nde.getKeyPressed("Drop Stack Modifier")) {
          amount = Infinity;
        }
        this.inventory.drop(this.inventory.heldIndex, amount, false);
      }
    }

    
    if (this.weaponUser.held != this.inventory.held) this.weaponUser.held = this.inventory.held;
    
    if (this.inventory.held) {
      this.weaponUser.targetPos.from(this.mousePos);

      this.weaponUser.trigger = nde.getKeyPressed("Use/Shoot");

      if (nde.getKeyDown("Reload")) {
        this.weaponUser.reload();
      }
    } else {
      this.weaponUser.weapon = undefined;
    }
    
  }

  render() {
    if (this.closestInteractable) {
      renderer._(() => {
        renderer.set("fill", "rgb(255,255,255)");
        renderer.set("font", "0.3px monospace");
        renderer.set("textAlign", ["center", "middle"]);
        renderer.text(`${this.closestInteractable.text} [${nde.getKeyCodes("Interact")[0]}]`, this.closestInteractable.transform.pos._subV(new Vec(0, this.closestInteractable.transform.size.y / 2)), 0.5);
      });
    }

    if (this.weaponUser._gun) {
      renderer._(() => {
        if (this.weaponUser._info.gun.laser) {
          let laserDir = this.weaponUser.held.transform.dir;
          renderer.set("stroke", "rgb(255, 0, 0)");
          renderer.set("lineWidth", 0.005);
          renderer.line(this.weaponUser._gun.tipPos, this.weaponUser._gun.tipPos._addV(new Vec(Math.cos(laserDir), Math.sin(laserDir)).mul(100)));
        } else {
          renderer.image(nde.tex["crosshair"], vecHalf._div(-2).addV(this.mousePos), vecHalf);
        }
      });
    }
  }

  from(data) {
    super.from(data);

    this.speed = data.speed;

    return this;
  }
}