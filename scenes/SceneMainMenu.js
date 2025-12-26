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
  }

  start() {

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
            navigator.clipboard.writeText(url + "?id=" + server.id);

            return;
          }
          connectToServer("host");
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
        style: {...buttonStyle},
        textStyle: {...buttonStyle},
        text: "Settings",

        events: {mousedown: [() => {
          nde.transition = new TransitionSlide(scenes.settings, new TimerTime(0.2));
        }]},
      }),
    ],
    );     
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