EDITORSTATE = {
  none: 0,
  place: 1,
  break: 2,
  grab: 3,
};

class SceneEditor extends Scene {
  constructor() {
    super();

    this.cam = new Camera(new Vec(8, 4.5));
    this.cam.w = 16;
    this.cam.renderW = nde.w;

    this.initializeUI();

    this.selectedMatIndex = 0;

    this.hovered = undefined;
    this.held = {
      ob: undefined,
      offset: new Vec(0, 0),
      startPos: new Vec(0, 0),
    }
  }

  initializeUI() {
    this.uiProperties = undefined;
    this.uiPropertiesOb = undefined;

    this.ui = createDefaultUIRoot([
      new UIButtonText({
        style: {...buttonStyle,},
        textStyle: {...buttonStyle,},
        text: "Copy",

        events: {mousedown: [() => {
          navigator.clipboard.writeText(this.export());
        }]},
      }),
      new UIButtonText({
        style: {...buttonStyle,},
        textStyle: {...buttonStyle,},
        text: "Download",

        events: {mousedown: [() => {
          downloadFile(this.export());
        }]},
      }),
    ]);  
  }

  closeProperties() {
    if (this.uiProperties) this.ui.children.splice(this.ui.children.indexOf(this.uiProperties));
    this.uiProperties = undefined;
    this.uiPropertiesOb = undefined;
  }
  openProperties(ob) {
    let temp = this.uiPropertiesOb;
    this.closeProperties();
    if (temp == ob) return;
    
    this.uiPropertiesOb = ob;
    this.uiProperties = new UIBase({
      style: {
        fill: "rgba(0, 0, 0, 0.44)",
        position: "absolute",
        pos: new Vec(this.ui.size.x, 0),
        selfPos: new Vec(-1, 0),
        size: new Vec(this.ui.size.x * 0.3, this.ui.size.y),

        padding: 5,
        direction: "column",
        gap: 5,
      },

      children: [
        new UIBase({
          style: {
            align: new Vec(0, 1),
            growX: true,
            gap: 5,
          },
          children: [
            new UISettingText({
              style: {...buttonStyle,
                growX: true,
              },

              value: ob.name,

              events: {change: [e => {
                ob.name = e;
                
              }]},
            }),
            new UIText({
              style: buttonStyle,
              textStyle: buttonStyle,

              text: ob.id,
            }),
          ]
        }),
      ],
    });

    /*
    if (ob.transform.pos) {
      this.uiProperties.children.push(new UISettingText({
        style: {...buttonStyle,
          editor: {
            numberOnly: true,
          }
        },

        value: ob.transform.pos.x,

        events: {change: [e => {
          console.log(e);
          
        }]},
      }));
    }*/

    for (let c of ob.components) {
      let elem = new UIBase({
        style: {
          direction: "column",
          gap: 5,
        },

        children: [
          new UIText({
            style: buttonStyle,
            textStyle: buttonStyle,
            text: c.type,
          }),
        ],
      });

      function setting(name, _elem) {
        elem.children.push(new UIBase({
          style: {
            gap: 10,
            align: new Vec(0, 1),
          },

          children: [
            new UIBase(),
            new UIText({
              style: buttonStyle,
              textStyle: buttonStyle,

              text: name,
            }),
            _elem,
          ]
        }));
      }

      if (c instanceof Sprite) {
        setting("Tex", new UISettingText({
          style: {...buttonStyle,},

          value: c.tex,

          events: {change: [e => {
            c.tex = e;
          }]},
        }));
      } else if (c instanceof Inventory) {
        
      } else if (c instanceof Spawner) {
        setting("Loot Table", new UISettingText({
          style: {...buttonStyle,},

          value: c.lootTable,

          events: {change: [e => {
            c.lootTable = e;
          }]},
        }));
        setting("Amount", new UISettingRange({
          style: {...buttonStyle,},

          min: 0,
          max: 20,
          value: c.amount,

          events: {change: [e => {
            c.amount = e;
            console.log(e);
            
          }]},
        }));
      } else continue;

      this.uiProperties.children.push(elem);
    }
    
    this.ui.children.push(this.uiProperties);
    this.uiProperties.calculateSize();
    this.uiProperties.growChildren();
    this.ui.positionChildren();    
  }

  get selectedMat() {
    return materials[value];
  }

  loadWorld(w) {
    world = w;
  }

  start() {
    if (false && !world) {
      nde.openPopup(new UIBase({
        style: {...buttonStyle,
          direction: "column",
        },

        children: [
          new UIButtonText({
            style: {...buttonStyle,
              growX: true,
            },
            textStyle: buttonStyle,

            text: "New Room...",

            events: {"mouseup": [() => {
              this.loadWorld(new Ob({}, [new Grid({size: new Vec(16, 9)})]));
              nde.resolvePopup();
            }]},
          }),

          ...allRooms.map(room => {
            return new UIButtonText({
              style: {...buttonStyle,
                growX: true,
              },
              textStyle: buttonStyle,

              text: room.name,

              events: {"mouseup": [() => {
                this.loadWorld(room);
                nde.resolvePopup();
              }]},
            });
          }),
        ]
      }));
    }
    this.loadWorld(allRooms[2]);
    
    this.mousePos = new Vec(0, 0);  
    this.state = EDITORSTATE.none;

    this.openProperties(world.findId(318333));
  }

  inputdown(key) {
    if (nde.getKeyEqual(key,"Pause")) {
      if (this.uiProperties) {
        this.closeProperties();
        return;
      }
      nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
    }



    if (this.state != EDITORSTATE.none) return;

    if (this.hovered) {
      if (nde.getKeyEqual(key, "Editor Place")) {
        this.state = EDITORSTATE.grab;
        this.held.ob = this.hovered;
        this.held.offset.from(this.held.ob.transform.pos).subV(this.mousePos);
        this.held.startPos.from(this.mousePos);
      }
      
      if (nde.getKeyEqual(key, "Editor Break")) {
        this.hovered.remove();
      }
      return;
    }


    if (nde.getKeyEqual(key, "Editor Place")) {
      if (this.uiProperties) {
        this.closeProperties();
        return;
      }

      this.state = EDITORSTATE.place;
    }
    if (nde.getKeyEqual(key, "Editor Break")) {
      if (this.uiProperties) {
        this.closeProperties();
        return;
      }
      
      this.state = EDITORSTATE.break;
    }
  }
  inputup(key) {
    if (nde.getKeyEqual(key, "Editor Place")) {
      if (this.state == EDITORSTATE.grab && this.held.startPos.isEqualTo(this.mousePos)) this.openProperties(this.held.ob);
      this.state = EDITORSTATE.none;
    }
    if (nde.getKeyEqual(key, "Editor Break")) {
      this.state = EDITORSTATE.none;
    }
  }

  update(dt) {  
    let g = world.getComponent(Grid);
    
    this.mousePos.from(this.cam.untransformVec(nde.mouse));    

    let speedMult = nde.getKeyPressed("Run") ? 2 : 1;
    this.cam.pos.addV(new Vec(
      nde.getKeyPressed("Move Right") - nde.getKeyPressed("Move Left"),
      nde.getKeyPressed("Move Down") - nde.getKeyPressed("Move Up"),
    ).normalize().mul(10 * speedMult * dt));

    switch(this.state) {
      case EDITORSTATE.place:
        g.setMat(this.mousePos, 1);
        break;
      case EDITORSTATE.break:
        g.setMat(this.mousePos, 0);
        break;
      case EDITORSTATE.grab:
        this.held.ob.transform.pos.from(this.mousePos).addV(this.held.offset);
        if (!nde.getKeyPressed("Editor Snap Modifier") && !this.held.startPos.isEqualTo(this.mousePos)) this.held.ob.transform.pos.mul(6).round().mul(1/6);
        break;
    }

    this.hovered = this.getHoveredOb(world);
  }

  getHoveredOb(ob) {
    for (let c of ob.children) {
      let h = this.getHoveredOb(c);
      if (h) return h;

      if (this.mousePos.x >= c.transform.pos.x - c.transform.size.x * 0.5 && this.mousePos.y >= c.transform.pos.y - c.transform.size.y * 0.5 && this.mousePos.x <= c.transform.pos.x + c.transform.size.x * 0.5 && this.mousePos.y <= c.transform.pos.y + c.transform.size.y * 0.5 && c.id > 2) return c;
    }
  }

  render() {
    let cam = this.cam;
    cam.renderW = nde.w;

    renderer.set("fill", "rgba(255, 255, 255, 1");


    renderer._(()=>{
      renderer.set("fill", "rgb(100, 100, 50)");
      renderer.rect(vecZero, new Vec(nde.w, nde.w / 16 * 9));
    });


    if (!world) return;
    cam._(renderer, () => {
      let g = world.getComponent(Grid);
      g.cam = cam;
      world.render();
      
      renderer.set("fill", "rgba(0, 0, 0, 0)");
      renderer.set("stroke", "rgba(0, 0, 0, 0.5)");
      let bounds = new Vec(
        Math.max(Math.floor(cam.pos.x - cam.w / 2), 0),
        Math.max(Math.floor(cam.pos.y - cam.w / 2 * cam.ar), 0),
        Math.min(Math.floor(cam.pos.x + cam.w / 2 + 1), g.size.x),
        Math.min(Math.floor(cam.pos.y + cam.w / 2 * cam.ar + 1), g.size.y),
      );
      let p = new Vec(0, 0);
      for (p.x = bounds.x; p.x < bounds.z; p.x++) {
        for (p.y = bounds.y; p.y < bounds.w; p.y++) {
          renderer.rect(p, vecOne);      
        }
      }

      renderer.set("stroke", "rgba(255, 255, 255, 1)");
      function renderOutlines(ob) {
        for (let c of ob.children) {
          if (c.id > 2) renderer.rect(c.transform.pos._subV(c.transform.size._mul(0.5)), c.transform.size);
          renderOutlines(c);
        }
      }
      renderOutlines(world);

      renderer.set("stroke", "rgba(255, 0, 0, 1)");
      if (this.hovered) renderer.rect(this.hovered.transform.pos._subV(this.hovered.transform.size._mul(0.5)), this.hovered.transform.size);
    });
    uicam._(renderer, () => {
      this.ui.renderUI();
    });

    renderer._(() => {
      cam.scaleRenderer(renderer);
    });
  }

  export() {
    return `(()=>{return cloneData('${world.serialize()}');})();`;
  }
}


async function downloadFile(content) {
  const options = {
    suggestedName: "room.ob",
    types: [
      {
        description: "Room file",
        accept: { "text/plain": [".ob"] }
      }
    ]
  };

  const handle = await window.showSaveFilePicker(options);
  const writable = await handle.createWritable();

  await writable.write(content);
  await writable.close();
}
