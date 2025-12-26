let lights = [];

class Light extends Component {
  constructor(props = {}) {
    super();

    this.maxR = props.maxR || 2;
    this.tex = props.tex || "duck/1";
  }

  start() {
    lights.push(this);

    this.cached = false;
    this.lastPos = this.transform.pos.copy();
  }

  renderMask() {
    if (!this.lastPos.isEqualTo(this.transform.pos)) {
      this.cached = false;
      this.lastPos.from(this.transform.pos);
    }
    if (!this.mask) {
      this.cached = false;
      this.mask = new Img(vecOne._mul(settings.lightResolution));
    }
    if (this.mask.size.x != settings.lightResolution) {
      this.cached = false;
      this.mask.resize(vecOne._mul(settings.lightResolution));
    }

    if (this.cached) return this.mask;


    let ctx = this.mask.ctx;


    ctx.globalCompositeOperation = "source-over";
    world.grid.createMask(this.transform.pos, this.maxR, 1, this.mask);

    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(nde.tex[this.tex].canvas, 0, 0, this.mask.size.x, this.mask.size.y);
    

    return this.mask;
  }

  remove() {
    let index = lights.indexOf(this);
    if (index == -1) return;

    lights.splice(index, 1);
  }

  from(data) {
    super.from(data);

    this.maxR = data.maxR;
    this.tex = data.tex;

    return this;
  }
}


let lightTex = new Img(vecOne);
function renderLights(cam) {
  if (lightTex.size.x != settings.visionResolution) lightTex.resize(vecOne._mul(settings.visionResolution));
  lightTex.ctx.fillStyle = "rgb(0,0,0)";
  lightTex.ctx.fillRect(0, 0, lightTex.size.x, lightTex.size.y);

  cam.renderW = settings.visionResolution;
  cam._(lightTex, () => {
    for (let i = 0; i < lights.length; i++) {
      renderLight(lights[i], cam);
    }
  });

  
  let size = new Vec(cam.w, cam.w * cam.ar);
  renderer.image(lightTex, cam.pos._subV(size.mul(0.5)), size.mul(2));

}
function renderLight(light, cam) {
  let mask = light.renderMask();
  let size = new Vec(light.maxR * 2, light.maxR * 2);

  lightTex.image(mask, light.transform.pos._subV(size.mul(0.5)), size.mul(2));
}


let visionMask = new Img(vecOne);
function renderVision(cam) {
  if (visionMask.size.x != settings.visionResolution) visionMask.resize(vecOne._mul(settings.visionResolution));

  let size = new Vec(cam.w, cam.w * nde.ar);
  let halfSize = size._mul(0.5);

  visionMask.ctx.fillStyle = "rgb(0,0,0)";
  visionMask.ctx.fillRect(0, 0, visionMask.size.x, visionMask.size.y);
  world.grid.createMask(cam.pos, halfSize.x, cam.ar, visionMask);

  renderer.image(visionMask, cam.pos._subV(halfSize), size);
}