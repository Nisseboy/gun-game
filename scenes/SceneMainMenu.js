class SceneMainMenu extends Scene {
  constructor() {
    super();

    this.cam = new Camera(new Vec(800, 450));
    this.cam.w = 1600;
    this.cam.renderW = nde.w;
    
    this.lobbyDisplay = new UIText({
      style: buttonStyle,

      text: "No Lobby",
    });

    this.start(); //Initialize settings
  }

  start() {
    this.playerList = new UIBase({
      style: {
        gap: 5,
        padding: 5,       
        growX: true,         


        fill: "rgba(255, 255, 255, 0.05)",
      },
    });

    let playerListHolder = new UIBase({
      style: {
        position: "absolute",
        pos: new Vec(uicam.size.x - 45, 45),
        selfPos: new Vec(-1, 0),
        gap: 10,

        direction: "column",
      },

      children: [
        new UISettingCollection({
          value: customization,
          hasLabels: true,

          style: {
            gap: 10,
            padding: 5,

            fill: "rgba(255, 255, 255, 0.05)",

            row: {gap: 10},
            label: {...buttonStyle,},
          },

          children: [
            new UISettingText({
              name: "name", displayName: "Name",
              style: {...buttonStyle,
                minSize: new Vec(300, 0),
                maxSize: new Vec(300, Infinity),
                editor: {
                  multiLine: false,
                }
              },

              value: "",
            }),

            /*
            new UISettingVec({
              name: "col", displayName: "Color",
              style: {...buttonStyle,
                minSize: new Vec(200, 0),
                
                vec: {
                  numAxes: 3,
                }
              },

              value: new Vec(255, 255, 255),
            }),*/
          ],

          events: {
            change: [function (value) {
              localStorage.setItem(settingsName+"-customization", JSON.stringify(customization));  
              client?.send("customization", id, customization);        
            }],
          },
        }),
        this.playerList,
      ],
    });
    
    
    

    this.ui = createDefaultUIRoot([
      this.lobbyDisplay,
      new UIButtonText({
        style: {...buttonStyle,},
        textStyle: {...buttonStyle,
          text: {
            fill: client ? "rgba(161, 247, 62, 1)" : "rgba(252, 54, 54, 1)",
          }
        },
        text: "Play",

        events: {mousedown: [() => {
          if (serverId == "_editor") nde.setScene(scenes.editor);

          if (!client || !world) return;
          nde.transition = new TransitionNoise(scenes.game, new TimerTime(0.2), true, 160);
        }]},
      }),


      new UIButtonText({
        style: {...buttonStyle,},
        textStyle: {...buttonStyle},
        text: "Host" + (server ? "ing, copy url" : ""),

        events: {mousedown: [() => {
          if (server) {
            if (navigator.clipboard) navigator.clipboard.writeText(window.location.origin + window.location.pathname + "?id=" + server.id);
            else alert(window.location.origin + "?id=" + server.id);
            
            return;
          }
          connectToServer("_host");
        }]},
      }),
      new UIButtonText({
        style: {...buttonStyle,},
        textStyle: {...buttonStyle},
        text: "Join",

        events: {mousedown: [() => {
          let id = prompt("Server ID: ");
          if (!id) return;

          connectToServer(id);
        }]},
      }),

          
      new UIBase({
        style: {
          minSize: buttonStyle.minSize || new Vec(0, 0),
        },
      }),
      new UIButtonText({
        style: {...buttonStyle,},
        textStyle: {...buttonStyle},
        text: "Editor",

        events: {mousedown: [() => {
          connectToServer("_editor");
        }]},
      }),
      new UIBase({
        style: {
          minSize: buttonStyle.minSize || new Vec(0, 0),
        },
      }),

      new UIButtonText({
        style: {...buttonStyle},
        textStyle: {...buttonStyle},
        text: "Settings",

        events: {mousedown: [() => {
          nde.transition = new TransitionSlide(scenes.settings, new TimerTime(0.2));
        }]},
      }),


      playerListHolder,
      
    ]);     
    this.updatePlayerList();
  }

  updatePlayerList() {
    this.playerList.children = world?.getComponents(Duck).map(e=>e.ob).filter(e=>e.id!=id).map(ob => {
      let elem = new UIText({
        style: {...buttonStyle,
          
        },

        text: ob.name,
      });

      return elem;
    }) || [];
  
    this.ui.calculateSize();
    this.ui.growChildren();
    this.ui.positionChildren();
  }

  render() {
    let cam = this.cam;
    cam.renderW = nde.w;

    renderer._(()=>{
      renderer.set("fill", backgroundCol);
      renderer.rect(vecZero, new Vec(nde.w, nde.w / 16 * 9));
    });



    cam._(renderer, ()=>{
      this.ui.renderUI();
    });
  }
}