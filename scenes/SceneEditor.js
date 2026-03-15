EDITORSTATE = {
  none: 0,
  place: 1,
  break: 2,
  grab: 3,
  edge: 4,
};

const EditorComponents = ["Entity", "Interactable", "Inventory", "Item", "Light", "Spawner", "Tracker"];

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

    this.edge = {
      hovered: undefined,
      held: 0,
      startPos: 0,
      moved: 0,
    };

    this.renderLights = false;
  }

  get selectedMat() {
    return materials[this.selectedMatIndex];
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
      new UIBase({
        style: {
          position: "absolute",
          pos: new Vec(uicam.size.x / 2, 0),
          selfPos: new Vec(-0.5, 0),
        },

        children: [
          new UIButtonText({
            style: buttonStyle,
            textStyle: buttonStyle,
            text: "Lights",

            events: {mouseup: [() => {
              this.renderLights = !this.renderLights;
              world.getComponents(Light).forEach(c => c.cached = false);
            }]}
          }),
        ]
      }),
    ]);  
  }

  closeProperties() {
    if (this.uiProperties) this.ui.children.splice(this.ui.children.indexOf(this.uiProperties));
    this.uiProperties = undefined;
    this.uiPropertiesOb = undefined;
  }
  openProperties(ob, closeSame = true) {
    let temp = this.uiPropertiesOb;
    this.closeProperties();
    if (closeSame && temp == ob) return;
    
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
        new UISettingBase({
          style: {
            size: new Vec(this.ui.size.x * 0.3, this.ui.size.y),
            position: "relative",
          }
        }),
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


    for (let c of ob.components) {
      let elem = new UIBase({
        style: {
          direction: "column",
          gap: 5,
          growX: true,
        },

        children: [
          new UIBase({
            style: {
              align: new Vec(0, 1),
              growX: true,
            },

            children: [
              new UIText({
                style: buttonStyle,
                textStyle: buttonStyle,
                text: c.type,
              }),
              new UIBase({style: {growX: true}}),
              new UISettingCheckbox({
                style: buttonStyle,

                value: c.active,

                events: {change: [(e) => {
                  c.active = e;
                }]},
              }),
              new UIBase({style: {minSize: new Vec(5, 0)}}),
              new UIButtonText({
                style: buttonStyle,
                textStyle: buttonStyle,
                text: "X",

                events: {mouseup: [() => {
                  ob.removeComponent(c);
                  this.openProperties(ob, false);
                }]},
              }),
            ],
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
        setting("Tex", new UISettingDropdown({
          style: {...buttonStyle,
            maxSize: new Vec(1000, 600),
          },

          value: c.tex,
          choices: Object.keys(nde.tex),

          events: {change: [e => {
            c.tex = e;
          }]},
        }));
      } else if (c instanceof Prefab) {
        setting("pType", new UISettingDropdown({
          style: {...buttonStyle,},

          value: c.pType,

          choices: Object.keys(prefabs),

          events: {change: [e => {
            let ob2 = prefab(e);
            ob2.transform.pos.from(ob.transform.pos);
            ob2.transform.dir = ob.transform.dir;
            ob.parent.replaceChild(ob, ob2);
            this.openProperties(ob2);
          }]},
        }));
      } else if (c instanceof Item) {
        setting("Amount", new UISettingRange({
          style: {...buttonStyle,},

          min: 1,
          max: c.info.item.stackSize,
          value: c.amount,

          events: {change: [e => {
            c.amount = e;            
          }]},
        }));
      } else if (c instanceof Gun) {
        setting("Ammo", new UISettingRange({
          style: {...buttonStyle,},

          min: 1,
          max: ob.getComponent(Item).info.gun.maxAmmo,
          value: c.ammo,

          events: {change: [e => {
            c.ammo = e;            
          }]},
        }));
      } else if (c instanceof Inventory) {
        
      } else if (c instanceof Spawner) {
        setting("Loot Table", new UISettingDropdown({
          style: {...buttonStyle,},

          value: c.lootTable,

          choices: Object.keys(lootTables),

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
          }]},
        }));
      } else if (c instanceof Light) {
        setting("Tex", new UISettingDropdown({
          style: {...buttonStyle,
            maxSize: new Vec(1000, 600),
          },

          value: c.tex,
          choices: Object.keys(nde.tex),

          events: {change: [e => {
            c.tex = e;
          }]},
        }));
        setting("Max Radius", new UISettingRange({
          style: {...buttonStyle,},

          min: 0,
          max: 20.1,
          value: c.maxR,
          step: 0.1,

          events: {input: [e => {
            c.maxR = e;            
          }]},
        }));
        setting("Brightness", new UISettingRange({
          style: {...buttonStyle,},

          min: 0,
          max: 2.01,
          value: c.brightness,
          step: 0.01,

          events: {input: [e => {
            c.brightness = e;            
          }]},
        }));
        setting("Smoothing Enabled", new UISettingCheckbox({
          style: {...buttonStyle,},

          value: c.smooth,

          events: {change: [e => {
            c.smooth = e;            
          }]},
        }));
      }

      this.uiProperties.children.push(elem);
    }

    this.uiProperties.children.push(new UIButtonText({
      style: buttonStyle,
      textStyle: buttonStyle,

      text: "Add Component...",

      events: {mouseup: [async () => {
        let res = await nde.openPopup(new UIBase({
          style: {...buttonStyle,
            direction: "column",
          },

          children: [
            ...EditorComponents.map(comp => {
              return new UIButtonText({
                style: {...buttonStyle,
                  growX: true,
                },
                textStyle: buttonStyle,

                text: comp,

                events: {"mouseup": [() => {
                  nde.resolvePopup(comp);
                }]},
              });
            }),
          ]
        }));
        if (!res) return;
        
        ob.addComponent(new (eval(res))());
        this.openProperties(ob, false);
      }]},
    }));
    
    this.ui.children.push(this.uiProperties);
    this.uiProperties.calculateSize();
    this.uiProperties.growChildren();
    this.ui.positionChildren();    
  }

  async openInventory() {
    let elem = new UIBase({
      style: {...buttonStyle,
        direction: "column",
      },
    });

    function section(name, arr, getElem = (ob, i) => new UIBase(), evalElem = (ob, i) => ob) {
      elem.children.push(new UIText({
        style: buttonStyle,
        textStyle: buttonStyle,
        text: name,
      }));

      let row;
      for (let i in arr) {
        if (!row) {
          row = new UIBase(new UIBase({
            style: {gap: 5},

            children: [
              new UIBase({style: {minSize: new Vec(10, 0)}}),
            ]
          }));
          elem.children.push(row);
        }


        let e = arr[i];
        let uiElem = getElem(e, i);
        uiElem.style.minSize = new Vec(50, 50);

        row.children.push(new UIButton({
          style: {...buttonStyle,
            minSize: new Vec(50, 50),
            align: new Vec(1, 1),
            padding: 0,
          },

          events: {"mousedown": [() => {
            nde.resolvePopup(evalElem(e, i));
          }]},

          children: [uiElem,]
        }));
      }
    }

    section("Prefabs", prefabs, (ob, i) => new UIImage({
      style: buttonStyle,
      image: nde.tex[ob.tex],
    }), (ob, i) => {
      return prefab(i);
    });
    section("Spawners", lootTables, (ob, i) => new UIText({
      style: buttonStyle,
      text: i,
    }), (ob, i) => {
      return new Ob({name: "Spawner"}, [
        new Spawner({lootTable: i}),
      ])
    });


    let res = await nde.openPopup(elem);
    if (!res) return;

    res.randomizeId();
    world.appendChild(res);
    this.state = EDITORSTATE.grab;
    this.held.ob = res;
    this.held.offset.set(0, 0);
    this.held.startPos.from(this.mousePos);
  }

  loadWorld(w) {
    world = w.copy();
    this.cam.pos = world.getComponent(Grid).size._mul(0.5);
    let sky = new Sky();
    world.addComponent(sky);

    sky.init();
    sky.start();
    sky.update();
  }

  start() {
    this.loadWorld(allRooms[0]);

    if (!world) {
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
              this.loadWorld(new Ob({}, [new Grid({size: new Vec(5, 5)})]));
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
    
    this.mousePos = new Vec(0, 0);  
    this.state = EDITORSTATE.none;

    this.openProperties(world?.findId(318333));
  }

  inputdown(key) {
    if (nde.getKeyEqual(key,"Pause")) {
      if (this.uiProperties) {
        this.closeProperties();
        return;
      }
      nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
    }

    
    if (nde.getKeyEqual(key, "Editor Inventory")) {
      this.openInventory();
    }
    

    if (this.hovered) {
      if (nde.getKeyEqual(key, "Editor Place")) {
        this.state = EDITORSTATE.grab;
        this.held.ob = this.hovered;
        this.held.offset.from(this.held.ob.transform.pos).subV(this.mousePos);
        this.held.startPos.from(this.mousePos);
      }
      
      if (nde.getKeyEqual(key, "Editor Break")) {
        this.hovered.remove();
        if (this.uiPropertiesOb == this.hovered) this.closeProperties();        
      }
      return;
    }


    if (nde.getKeyEqual(key, "Editor Place")) {
      if (this.edge.hovered != undefined) {
        this.state = EDITORSTATE.edge;
        this.edge.held = this.edge.hovered;
        this.edge.startPos = (this.edge.held % 2 == 0 ? this.mousePos.x : this.mousePos.y) * (this.edge.held > 1 ? -1 : 1);
        this.edge.moved = 0;
        
        return;
      }

      this.state = EDITORSTATE.place;
    }
    if (nde.getKeyEqual(key, "Editor Break")) {      
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

    if (nde.getKeyPressed("Editor Pick")) {
      this.selectedMatIndex = world.getComponent(Grid).getMat(this.mousePos) ?? 0;
    }

    switch(this.state) {
      case EDITORSTATE.place:
        g.setMat(this.mousePos, this.selectedMatIndex);
        break;

      case EDITORSTATE.break:
        g.setMat(this.mousePos, 0);
        break;

      case EDITORSTATE.grab:
        this.held.ob.transform.pos.from(this.mousePos).addV(this.held.offset);
        if (!nde.getKeyPressed("Editor Snap Modifier") && !this.held.startPos.isEqualTo(this.mousePos)) this.held.ob.transform.pos.mul(6).round().mul(1/6);
        if (nde.scrolled) {
          if (!nde.getKeyPressed("Editor Snap Modifier")) {
            this.held.ob.transform.dir += Math.sign(nde.scrolled) * Math.PI / 4;
            this.held.ob.transform.dir = Math.round(this.held.ob.transform.dir / (Math.PI / 4)) * (Math.PI / 4);            
          } else {
            this.held.ob.transform.dir += nde.scrolled / 100 * Math.PI / 64;
          }
        }
        break;

      case EDITORSTATE.edge:
        let x = Math.round(((this.edge.held % 2 == 0 ? this.mousePos.x : this.mousePos.y) * (this.edge.held > 1 ? -1 : 1)) - this.edge.startPos);
        
        if (x == this.edge.moved) break;

        let dir = Math.sign(x - this.edge.moved);
        this.edge.moved = x;
        if (this.edge.held > 1) this.edge.moved -= dir;

        g.moveEdge(this.edge.held, dir);
        
        break;
    }

    this.hovered = this.getHoveredOb();
    this.edge.hovered = this.getHoveredEdge();
  }

  getHoveredOb(ob = world) {
    for (let c of ob.children) {
      let h = this.getHoveredOb(c);
      if (h) return h;

      if (this.mousePos.x >= c.transform.pos.x - c.transform.size.x * 0.5 && this.mousePos.y >= c.transform.pos.y - c.transform.size.y * 0.5 && this.mousePos.x <= c.transform.pos.x + c.transform.size.x * 0.5 && this.mousePos.y <= c.transform.pos.y + c.transform.size.y * 0.5 && c.id > 2) return c;
    }
  }

  getHoveredEdge() {
    let p = this.mousePos;
    let g = world.getComponent(Grid);

    let deltaTop = p.y;
    let deltaRight = g.size.x - p.x;
    let deltaDown = g.size.y - p.y;
    let deltaLeft = p.x;

    let eps = 0.1;

    if (deltaLeft > 0 && deltaRight > 0 && Math.abs(deltaTop) < eps) return 3;
    if (deltaTop > 0 && deltaDown > 0 && Math.abs(deltaRight) < eps) return 0;
    if (deltaRight > 0 && deltaLeft > 0 && Math.abs(deltaDown) < eps) return 1;
    if (deltaDown > 0 && deltaTop > 0 && Math.abs(deltaLeft) < eps) return 2;

    return undefined;
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


      if (this.renderLights) {
        this.findLights();      
        renderer.ctx.globalCompositeOperation = "multiply";
        renderLights(cam);
        renderer.ctx.globalCompositeOperation = "source-over";
      }

      { //Grid
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
      }
      
      { //Outlines
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
        else if (this.edge.hovered != undefined) {
          renderer.line(
            [new Vec(1, 0), new Vec(1, 1), new Vec(0, 1), new Vec(0, 0)][this.edge.hovered].mulV(g.size),
            [new Vec(1, 1), new Vec(0, 1), new Vec(0, 0), new Vec(1, 0)][this.edge.hovered].mulV(g.size),
          );
        }
      }

      let pos = new Vec(this.mousePos.x + 0.2, this.mousePos.y + 0.2);
      let size = new Vec(0.4, 0.4);
      renderer.image(nde.tex[this.selectedMat.tex], pos, size);
      renderer.rect(pos, size);

    });
    uicam._(renderer, () => {
      this.ui.renderUI();
    });

    renderer._(() => {
      cam.scaleRenderer(renderer);
    });
  }

  findLights() {
    lights.length = 0;
    let comps = world.getComponents(Light);
    for (let c of comps) {      
      if (!c.hasStarted) c.start();
      c.renderMask();
      lights.push(c);
    }
  }

  export() {
    return `(()=>{return cloneData('${world.serialize()}');})();`;
  }
}


async function downloadFile(content) {
  const options = {
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
