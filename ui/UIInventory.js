class UIInventory extends UIBase {
  constructor(props = {}) {
    super(props);

    this.inventory = props.inventory;

    this.defaultStyle = {
      position: "absolute",
      direction: "column",

      stroke: "rgba(0, 0, 0, 0.3)",
      lineWidth: 10,

      inventory: {
        w: undefined,
        startIndex: undefined,
        stopIndex: undefined,
      }
    };
    this.fillStyle(props.style);  
    
    if (this.style.inventory.w == undefined) this.style.inventory.w = this.inventory.w;
    if (this.style.inventory.startIndex == undefined) this.style.inventory.startIndex = this.inventory.startIndex;
    if (this.style.inventory.stopIndex == undefined) this.style.inventory.stopIndex = this.inventory.stopIndex;
    this.style.inventory.startIndex = Math.max(this.style.inventory.startIndex, 0);
    this.style.inventory.stopIndex = Math.min(this.style.inventory.stopIndex, this.inventory.slots.length);

    let slotAmount = this.style.inventory.stopIndex - this.style.inventory.startIndex;

    let w = this.style.inventory.w;
    let h = Math.floor(slotAmount / w);
    for (let y = 0; y < h; y++) {
      let row = new UIBase({});

      for (let x = 0; x < w; x++) {
        let slot = new UISlot({
          inventory: this.inventory,
          i: this.style.inventory.startIndex + y * w + x,

        });

        slot.calculateSize();
        row.children.push(slot);
      }

      row.calculateSize();
      this.children.push(row);
    }

    this.positionChildren();
  }
}

class UISlot extends UIBase {
  constructor(props) {
    super(props);

    this.inventory = props.inventory;
    this.i = props.i;

    this.defaultStyle = {
      padding: 1,

      fill: "rgba(255, 255, 255, 0.05)",
    };
    this.fillStyle(props.style);  

    this.children = [
      new UIImage({
        image: nde.tex["inventory/slot"],
        style: {
          minSize: new Vec(80, 80),
        }
      }),
    ];
    this.children[0].calculateSize();     

    this.interactable = true;
  }

  render() {
    this.children[0].image = nde.tex[(this.i == this.inventory.heldIndex) ? "inventory/heldSlot" : "inventory/slot"];

    if (this.hovered) super.render();

    
    renderer._(()=>{
      renderer.translate(this.pos);
      let ob = idLookup[this.inventory.slots[this.i]];
      if (ob) {
        let item = ob.getComponent(Item);

        let size = ob.transform.size;
        let ar = size.y / size.x;

        let s = this.size.x;
        if (ar <= 1) size = new Vec(s, s*ar);
        else size = new Vec(s/ar, s);

        renderer._(() => {
          renderer.translate(this.size._mul(0.5));
          renderer.rotate(-Math.PI/4);

          renderer.translate(size._mul(-0.5));
          renderer.image(ob.getComponent(Sprite).texture, vecZero, size);
        });


        renderer.set("fill", "rgb(255,255,255)");

        if (item.amount != 1) {
          renderer.set("textAlign", ["right", "bottom"]);
          renderer.set("font", "20px monospace");
          renderer.text(item.amount, new Vec(0.9, 0.95).mulV(this.size));
        }

        let gun = ob.getComponent(Gun);
        if (gun) {
          renderer.set("textAlign", ["center", "bottom"]);
          renderer.set("font", "20px monospace");
          renderer.text(`${gun.ammo}/${ob.item.info.gun.maxAmmo}`, new Vec(0.5, 0.9).mulV(this.size));
        }
        return;
      }
      
      let tags = this.inventory.tags[this.i];
      if (tags) return;
      let tagTex = undefined;
      let splitSlot = tags.split(",");
      for (let i = 0; i < splitSlot.length; i++) {
        tagTex = nde.tex["inventory/" + splitSlot[i]] || tagTex;
      }
      if (tagTex) {
        renderer.image(tagTex, vecZero, vecOne);
      }
    });
  }
}


function openInventory(inventory, style = {}) {
  let elem = new UIInventory({
    style: style,
    inventory: inventory,
  });

  uiInventoryHolder.children.push(elem);
  elem.calculateSize();
  uiInventoryHolder.positionChildren();

  return elem;
}

function closeInventory(inventory) {
  let index = uiInventoryHolder.children.indexOf(inventory);
  uiInventoryHolder.children.splice(index, 1);
}
