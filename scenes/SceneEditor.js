EDITORSTATE = {
  none: 0,
  place: 1,
  break: 2,
};

class SceneEditor extends Scene {
  constructor() {
    super();

    this.cam = new Camera(new Vec(8, 4.5));
    this.cam.w = 16;
    this.cam.renderW = nde.w;

    this.uicam = new Camera(new Vec(800, 450));
    this.uicam.w = 1600;
    this.uicam.renderW = nde.w;

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

    this.selectedMat = undefined;
    this._selectedMatIndex = undefined;
    this.selectedMatIndex = 0;
  }

  set selectedMatIndex(value) {
    this._selectedMatIndex = value;
    this.selectedMat = materials[value];
  }
  get selectedMatIndex() {
    return this._selectedMatIndex;
  }

  loadWorld(w) {
    world = w;
    world.update(0.001);
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
    this.loadWorld(allRooms[0]);
    
    this.mousePos = new Vec(0, 0);  
    this.state = EDITORSTATE.none;
  }

  inputdown(key) {
    if (nde.getKeyEqual(key,"Pause")) {
      nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
    }

    if (nde.getKeyEqual(key, "Editor Place")) {
      this.state = EDITORSTATE.place;
    }
    if (nde.getKeyEqual(key, "Editor Break")) {
      this.state = EDITORSTATE.break;
    }
  }
  inputup(key) {
    
    if (nde.getKeyEqual(key, "Editor Place")) {
      this.state = EDITORSTATE.none;
    }
    if (nde.getKeyEqual(key, "Editor Break")) {
      this.state = EDITORSTATE.none;
    }
  }

  update(dt) {  
    let g = world.grid;
    
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
    }
  }

  render() {

    let cam = this.cam;
    cam.renderW = nde.w;
    let uicam = this.uicam;
    uicam.renderW = nde.w;

    renderer.set("fill", "rgba(255, 255, 255, 1");


    renderer._(()=>{
      renderer.set("fill", "rgb(100, 100, 50)");
      renderer.rect(vecZero, new Vec(nde.w, nde.w / 16 * 9));
    });


    if (!world) return;
    cam._(renderer, () => {
      let g = world.grid;
      g.cam = cam;
      world.render();
      
      renderer.set("fill", "rgba(0, 0, 0, 0)")
      renderer.set("stroke", "rgba(0, 0, 0, 0.5)")
      let bounds = new Vec(
        Math.max(Math.floor(cam.pos.x - cam.w / 2), 0),
        Math.max(Math.floor(cam.pos.y - cam.w / 2 * cam.ar), 0),
        Math.min(Math.floor(cam.pos.x + cam.w / 2 + 1), g.size.x),
        Math.min(Math.floor(cam.pos.y + cam.w / 2 * cam.ar + 1), g.size.y),
      );
      let p = new Vec(0, 0), mat = 0;
      for (p.x = bounds.x; p.x < bounds.z; p.x++) {
        for (p.y = bounds.y; p.y < bounds.w; p.y++) {
          mat = g.g[p.x + p.y * g.size.x];

          renderer.rect(p, vecOne);      
        }
      }
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
