class SceneSettings extends Scene {
  constructor() {
    super();

    this.cam = new Camera(new Vec(800, 450));
    this.cam.w = 1600;
    this.cam.renderW = nde.w;

    this.start(); //To initialize settings
  }

  start() {
    let textInputSize = new Vec(300, 100);
    renderer._(() => {
      renderer.setAll(buttonStyle.text);
      let charSize = renderer.measureText("a");
      textInputSize.divV(charSize).floor().mulV(charSize).add(buttonStyle.padding * 2);
    });


    this.ui = createDefaultUIRoot([
      new UIButtonText({
        text: "Back",

        style: {...buttonStyle},
        textStyle: {...buttonStyle},

        events: {mousedown: [() => {
          nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
        }]},
      }),

      new UISettingCollection({
        value: settings,
        hasLabels: true,

        style: {
          gap: 10,

          row: {gap: 10},
          label: {...buttonStyle,},
        },

        children: [
          new UISettingRange({
            name: "renderResolution", displayName: "Render Resolution",
            value: 100,
            min: 25, max: 100, step: 1,

            style: {...rangeStyle,},

            events: {
              change: [e=>{window.dispatchEvent(new Event('resize'));}]
            },
          }),
          new UISettingRange({
            name: "lightResolution", displayName: "Light Resolution",
            value: 512,
            min: 64, max: 2048, step: 1,

            style: {...rangeStyle,},
          }),
          new UISettingRange({
            name: "visionResolution", displayName: "Vision Resolution",
            value: 1024,
            min: 64, max: 2048, step: 1,

            style: {...rangeStyle,},
          }),
          new UISettingRange({
            name: "visionSamples", displayName: "Vision Samples",
            value: 1000,
            min: 100, max: 2000, step: 100,

            style: {...rangeStyle,},
          }),

          new UIBase({
            style: {
              minSize: buttonStyle.minSize || new Vec(0, 0),
            },
          }),

          new UISettingCheckbox({
            name: "autoConnect", displayName: "Autoconnect to dev server",
            value: false,

            style: {...buttonStyle,}
          }),
          
        ],

        events: {
          input: [function (value) {
            setBackgroundCol();
          }],
          change: [function (value) {
            localStorage.setItem(settingsName, JSON.stringify(settings));          
          }],
        },
      }),
    ]);    
  }


  inputdown(key) {    
    if (nde.getKeyEqual(key,"Pause")) {
      nde.transition = new TransitionSlide(scenes.mainMenu, new TimerTime(0.2));
    }
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