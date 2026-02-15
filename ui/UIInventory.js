let itemUISize = 80;

class UIInventory extends UIBase {
  constructor(props = {}) {
    super(props);

    this.inventory = props.inventory;

    this.defaultStyle = {
      position: "absolute",
      direction: "column",

      stroke: "rgba(0, 0, 0, 0.3)",
      lineWidth: 5,

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

    let w = Math.min(this.style.inventory.w, slotAmount);
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
    this.on("inputdown", (e)=>{this.inputdown(e)});
    
  }

  mousedown(e) {
    let open = scenes.game.openInventories;
    if (open.length == 0) {
      this.inventory.heldIndex = this.i;
      return;
    }

    
    if (nde.getKeyPressed("Instamove Modifier")) {
      let other = open.find(e=>e.inventory!=this.inventory)?.inventory;
      let start = 0;
      let stop = Infinity;
      
      if (!other) {
        other = this.inventory;
        start = this.i >= hotbarSize ? 0 : hotbarSize;
        stop = this.i >= hotbarSize ? hotbarSize : Infinity;
      }       
      
      let left = other.pickup(this.inventory.getSlot(this.i), start, stop)
      if (!left) {
        this.inventory.setSlot(undefined, this.i);
        closeTooltip();
      }
      
      return;
    }
  

    if (!cursorItem.ob) {
      let ob = idLookup[this.inventory.slots[this.i]];
      if (!ob) return;

      let amount = e.button == 2 ? Math.ceil(ob.getComponent(Item).amount / 2) : Infinity;
      cursorItem.ob = this.inventory.getFromSlot(this.i, amount);
      cursorItem.item = cursorItem.ob.getComponent(Item);
      cursorItem.amount = cursorItem.item.amount;

      cursorItem.button = undefined;
      cursorItem.pickupTime = performance.now();
      cursorItem.startElem = this;

      nde.on("mousedown", inventoryDownFunc, true);
      closeTooltip();

      return;
    } else {            
      inventoryDownFunc(e);
    }
  }

  inputdown(key) {
    if (nde.getKeyEqual(key, "Drop Item")) {
      let amount = 1;
      if (nde.getKeyPressed("Drop Stack Modifier")) {
        amount = Infinity;
      }

      this.inventory.drop(this.i, amount);

      return false;
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
      if (!tags) return;
      let tagTex = undefined;
      let splitSlot = tags.split(",");
      for (let i = 0; i < splitSlot.length; i++) {
        tagTex = nde.tex["inventory/" + splitSlot[i]] || tagTex;
      }
      if (tagTex) {
        renderer.image(tagTex, vecZero, vecOne._mul(itemUISize));
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

  pickupTime: 0,
  startElem: undefined,
}

function inventoryDownFunc(e) {
  if (cursorItem.button) return;

  if (performance.now() - cursorItem.pickupTime <= 200 && nde.hoveredUIElement == cursorItem.startElem) {
    cursorItem.item.merge(nde.hoveredUIElement.inventory.gather(cursorItem.ob, Math.max(cursorItem.item.info.stackSize - cursorItem.amount, 0)));
    cursorItem.amount = cursorItem.item.amount;
    return;
  }

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
    cursorItem.item.amount++;
    let possible = elem.inventory.checkPossible(cursorItem.ob, elem.i);
    cursorItem.item.amount--;
    if (!possible) return;

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

      cursorItem.ob = pass.elem.inventory.putInSlot(cursorItem.ob, pass.elem.i, pass.amount);
    }
    cursorItem.passed.length = 0;

    if (cursorItem.ob) {
      cursorItem.item = cursorItem.ob.getComponent(Item);
      cursorItem.amount = cursorItem.item.amount;
      return;
    }
  } else {
    let elem = nde.hoveredUIElement;
    if (elem instanceof UISlot) {
      if (!elem.inventory.checkAllowedTags(cursorItem.item, elem.i)) return;

      let ob = elem.inventory.getSlot(elem.i);
      if (ob.name == cursorItem.ob.name) {
        let item = ob.getComponent(Item);

        cursorItem.ob = item.merge(cursorItem.ob, e.button == 2 ? 1 : Infinity);

        if (cursorItem.ob) {
          cursorItem.item = cursorItem.ob.getComponent(Item);
          cursorItem.amount = cursorItem.item.amount;
          return;
        }
      } else {
        elem.inventory.setSlot(cursorItem.ob, elem.i);

        cursorItem.ob = ob;
        cursorItem.item = ob.getComponent(Item);
        cursorItem.amount = cursorItem.item.amount;

        return;
      }
    } else {
      let ob = cursorItem.ob;
      if (e.button == 2) ob = ob.getComponent(Item).split(1);
      
      ob.transform.pos.from(scenes.game.cam.untransformVec(nde.mouse));
      ob.getComponent(Item).sendDrop();

      cursorItem.amount = item.amount;
      if (e.button == 2 && item.amount > 0) return;
    }
  }

  nde.off("mousedown", inventoryDownFunc);
  cursorItem.ob = undefined;
  cursorItem.item = undefined;
  tooltipMove();
}


function openInventory(inventory, style = {}) {
  let elem = new UIInventory({
    style: style,
    inventory: inventory,
  });

  uiInventoryHolder.children.push(elem);
  elem.calculateSize();
  uiInventoryHolder.positionChildren();

  tooltipMove();

  return elem;
}

function closeInventory(inventory) {
  let index = uiInventoryHolder.children.indexOf(inventory);
  if (index == -1) return;
  uiInventoryHolder.children.splice(index, 1);

  closeTooltip();
}


function tooltipMove() {
  if (cursorItem.ob || uiInventoryHolder?.children.length <= 1) return;

  let elem = nde.hoveredUIElement;
  if (elem instanceof UISlot) {
    if (tooltip.slot != elem) {
      if (tooltip.elem) closeTooltip();

      openTooltip(elem);
    }

    if (!tooltip.elem) return;

    tooltip.elem.pos.from(uicam.untransformVec(nde.mouse));
    let diff = Math.max(tooltip.elem.pos.y + tooltip.elem.size.y - uicam.size.y, 0);
    tooltip.elem.pos.y -= diff;
    tooltip.elem.positionChildren();
  } else if (tooltip.elem)  {
    closeTooltip();
  }
}
let tooltip = {
  elem: undefined,
  slot: undefined,
};
function openTooltip(slot) {
  let ob = slot.inventory.getSlot(slot.i);
  if (!ob) return;
  let item = ob.getComponent(Item);

  tooltip.slot = slot;
  tooltip.elem = new UIBase({
    style: {
      fill: "rgba(0, 0, 0, 0.4)",
      minSize: new Vec(200, 50),
      padding: 4,
    },

    children: [
      new UIText({
        text: ob.name,

        style: buttonStyle,
      }),
    ],
  });

  scenes.game.ui.children.push(tooltip.elem);
  tooltip.elem.calculateSize();
}
function closeTooltip() {
  let index = scenes.game.ui.children.indexOf(tooltip.elem);
  if (index != -1) scenes.game.ui.children.splice(index, 1);
  tooltip.slot = undefined;
  tooltip.elem = undefined;
}