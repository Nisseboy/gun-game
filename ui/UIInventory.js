let itemUISize = 80;

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

    this.pass = undefined;

    this.defaultStyle = {
      padding: 1,

      fill: "rgba(255, 255, 255, 0.05)",
    };
    this.fillStyle(props.style);  

    this.children = [
      new UIImage({
        image: nde.tex["inventory/slot"],
        style: {
          minSize: new Vec(itemUISize - 2, itemUISize - 2),
        }
      }),
    ];
    this.children[0].calculateSize();     

    this.interactable = true;
    
    this.on("mousedown", (e)=>{this.mousedown(e)});
  }

  mousedown(e) {
    if (!cursorItem.ob) {
      let ob = idLookup[this.inventory.slots[this.i]];
      if (!ob) return;

      let amount = e.button == 2 ? Math.ceil(ob.getComponent(Item).amount / 2) : Infinity;
      cursorItem.ob = this.inventory.getFromSlot(this.i, amount);
      cursorItem.item = cursorItem.ob.getComponent(Item);
      cursorItem.amount = cursorItem.item.amount;

      cursorItem.button = undefined;


      nde.on("mousedown", inventoryDownFunc, true);

      return;
    } else {
      inventoryDownFunc(e);
    }
  }


  render() {
    this.children[0].image = nde.tex[(this.i == this.inventory.heldIndex) ? "inventory/heldSlot" : "inventory/slot"];

    if (this.hovered || this.pass) super.render();

    renderer._(()=>{
      renderer.translate(this.pos);

      let ob = idLookup[this.inventory.slots[this.i]];
      let item = ob?.getComponent(Item);

      if (this.pass) {
        let startAmount = this.pass.item.amount;

        let amount = this.pass.amount;
        if (item) {
          amount -= Math.max(item.amount + amount - item.info.stackSize, 0);
        }


        this.pass.item.amount = amount + (item?.amount || 0);
        this.pass.item.render();
        this.pass.item.amount = startAmount - amount;

        return;
      }

      if (ob) {
        item.render();

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

let cursorItem = {
  ob: undefined,
  item: undefined,

  button: undefined,

  passed: [],
  amount: undefined,
  lastHovered: undefined,
}

function inventoryDownFunc(e) {
  if (cursorItem.button) return;

  cursorItem.button = e.button;
  cursorItem.item.amount = cursorItem.amount;
  for (let pass of cursorItem.passed) pass.elem.pass = undefined;
  cursorItem.passed.length = 0;
  cursorItem.lastHovered = undefined;

  nde.on("mousemove", inventoryMoveFunc, true);
  nde.on("mouseup", inventoryUpFunc, true);
  inventoryMoveFunc(e);

  return false;
}
function inventoryMoveFunc(e) {  
  let elem = nde.hoveredUIElement;
  if (!(elem instanceof UISlot) || elem == cursorItem.lastHovered || cursorItem.passed.length >= cursorItem.amount) return;
  cursorItem.lastHovered = elem;

  let ob = idLookup[elem.inventory.slots[elem.i]];
  if (ob && ob.name != cursorItem.ob.name) return;

  let passed = cursorItem.passed;
  let existing = passed.find(e=>e.elem==elem);
  
  if (!existing) {
    let item = ob?.getComponent(Item);

    let pass = {
      elem: elem, 
      amount: 1,
      slotItem: item,
      item: cursorItem.item,
    };

    if (item && item.amount >= item.info.stackSize) return;
    if (!elem.inventory.checkAllowedTags(elem.i, cursorItem.item)) return;

    cursorItem.passed.push(pass);
    elem.pass = pass;
  }

  if (cursorItem.button == 0) {
    let amount = Math.floor(cursorItem.amount / passed.length);
    for (let pass of passed) pass.amount = amount;
  }
  
}
function inventoryUpFunc(e) {
  if (e.button != cursorItem.button) return;

  nde.off("mousemove", inventoryMoveFunc);
  nde.off("mouseup", inventoryUpFunc);

  let item = cursorItem.item;
  item.amount = cursorItem.amount;

  cursorItem.button = undefined;

  if (cursorItem.passed.length > 0) {
    for (let pass of cursorItem.passed) {
      pass.elem.pass = undefined;

      if (!pass.slotItem) {
        let ob = item.split(pass.amount);
        pass.elem.inventory.putInSlot(ob, pass.elem.i);
      } else {
        pass.slotItem.amount += pass.amount;
        let diff = Math.max(pass.slotItem.amount - pass.slotItem.info.stackSize, 0);
        pass.slotItem.amount -= diff;
        item.amount -= pass.amount - diff; 
      }
    }
    cursorItem.passed.length = 0;
    cursorItem.amount = item.amount;

    if (item.amount > 0) return;

  } else {
    let ob = cursorItem.ob;
    if (e.button == 2) ob = ob.getComponent(Item).split(1);
    
    ob.transform.pos.from(scenes.game.cam.untransformVec(nde.mouse));
    ob.getComponent(Item).sendDrop();

    cursorItem.amount = item.amount;
    if (e.button == 2 && item.amount > 0) return;
  }

  nde.off("mousedown", inventoryDownFunc);
  cursorItem.ob = undefined;
  cursorItem.item = undefined;
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
