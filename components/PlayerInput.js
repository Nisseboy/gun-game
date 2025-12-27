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

    this.weaponUser = new WeaponUser();
    this.addComponent(this.weaponUser);

    this.inventory = new Inventory({size: 12});
    this.inventory.clientOnly = true;
    this.addComponent(this.inventory);

    this.inventory.w = 5;
    this.inventory.renderStart = 2;
    this.inventory.slots[0].tag = "weapon,primary";
    this.inventory.slots[1].tag = "weapon,secondary";
    this.inventory.allowedHeldSlots = [0, 1];
    this.inventory.heldIndex = 0; 

    this.light = new Light({maxR: 2, brightness: 0.5, tex: "light/1"});
    this.light.clientOnly = true;
    this.addComponent(this.light);

    return;
    for (let slot of this.inventory.slots) {      
      if (slot.tag) continue;

      let item = Pistol.copy();
      item.randomizeId();
      world.appendChild(item);
      idLookup[item.id] = item;

      slot.item = item.id;
      slot.amount = Math.floor(Math.random() * 40);
    }
  }
  
  update(dt) {    
    let speedMult = nde.getKeyPressed("Run") ? 2 : 1;

    this.duck.move(new Vec(
      nde.getKeyPressed("Move Right") - nde.getKeyPressed("Move Left"),
      nde.getKeyPressed("Move Down") - nde.getKeyPressed("Move Up"),
    ).normalize().mul(this.speed * speedMult * dt));

    this.closestItem = undefined;
    let closestSqd = 1000;
    for (let i = 0; i < groundItems.length; i++) {
      let item = groundItems[i];
      let sqd = this.transform.pos._subV(item.transform.pos).sqMag();
      if (sqd < pickupRange) {
        let sqd2 = this.mousePos._subV(item.transform.pos).sqMag();
        if (sqd2 < closestSqd) {
          this.closestItem = item;
          closestSqd = sqd2;
        }
      }
    }

    if (nde.getKeyDown("Interact") && this.closestItem) {
      this.inventory.pickup(this.closestItem.ob.id);
    }
    if (nde.getKeyDown("Inventory")) {
      this.inventory.open = !this.inventory.open;
    }
    if (this.inventory.open) {
      this.inventory.offset.from(this.transform.pos);
      this.inventory.offset.x -= this.inventory.w / 2;
      this.inventory.offset.y += 0.5;
    }
    if (nde.getKeyDown("Primary Weapon")) {
      this.inventory.heldIndex = 0;
    }
    if (nde.getKeyDown("Secondary Weapon")) {
      this.inventory.heldIndex = 1;
    }
    if (nde.scrolled) {
      this.inventory.scrollHeld(Math.sign(nde.scrolled));
    }

    if (this.inventory.heldSlot) {
      if (nde.getKeyDown("Drop Item")) {
        this.inventory.drop(this.inventory.heldIndex, 1);
      }
    }

    
    if (this.weaponUser.weapon != this.inventory.heldItem) this.weaponUser.weapon = this.inventory.heldItem;
    
    if (this.inventory.heldItem?.item.tags.split(",").includes("weapon")) {
      this.weaponUser.targetPos.from(this.mousePos);

      this.weaponUser.trigger = nde.getKeyPressed("Shoot");

      if (nde.getKeyDown("Reload")) {
        this.weaponUser.reload();
      }
    } else {
      this.weaponUser.weapon = undefined;
    }
    
  }

  render() {
    if (this.closestItem) {
      renderer._(() => {
        renderer.set("fill", "rgb(255,255,255)");
        renderer.set("font", "0.3px monospace");
        renderer.set("textAlign", ["center", "middle"]);
        renderer.text(`${this.closestItem.ob.name} [${nde.getKeyCodes("Interact")[0]}]`, this.closestItem.transform.pos._subV(new Vec(0, this.closestItem.transform.size.y / 2)), 0.5);
      });
    }

    if (this.weaponUser.weapon) {
      renderer._(() => {
        if (this.weaponUser.weapon.name == "Sniper") {
          let laserDir = this.weaponUser.weapon.transform.dir;
          renderer.set("stroke", "rgb(255, 0, 0)");
          renderer.set("lineWidth", 0.005);
          renderer.line(this.weaponUser.tipPos, this.weaponUser.tipPos._addV(new Vec(Math.cos(laserDir), Math.sin(laserDir)).mul(100)));
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