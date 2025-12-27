let lights = [];

class Light extends Component {
  constructor(props = {}) {
    super();

    this.maxR = props.maxR || 2;
    this.tex = props.tex || "light/1";
    this.brightness = props.brightness || 1;
  }

  start() {
    lights.push(this);

    this.cached = false;
    this.lastPos = this.transform.pos.copy();
    this.lastDir = this.transform.dir;
  }

  renderMask() {
    if (!this.lastPos.isEqualTo(this.transform.pos) || this.lastDir != this.transform.dir) {
      this.cached = false;
      this.lastPos.from(this.transform.pos);
      this.lastDir = this.transform.dir;
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

    let rotate = (this.transform.dir && this.tex != "light/1");
    ctx.globalCompositeOperation = "source-in";
    if (rotate) {
      ctx.save();
      ctx.translate(this.mask.size.x / 2, this.mask.size.y / 2);
      ctx.rotate(this.transform.dir);
      ctx.drawImage(nde.tex[this.tex].canvas, -this.mask.size.x / 2, -this.mask.size.y / 2, this.mask.size.x, this.mask.size.y);
      ctx.restore();
    } else {
      ctx.drawImage(nde.tex[this.tex].canvas, 0, 0, this.mask.size.x, this.mask.size.y);
    }
    
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
    this.brightness = data.brightness;

    return this;
  }
}


let lightTex = new Img(vecOne);
function renderLights(cam) {
  if (lightTex.size.x != settings.visionResolution) {
    lightTex.resize(vecOne._mul(settings.visionResolution));
    nde.tex["light/1"] = createLightGradient(vecOne._mul(settings.visionResolution), new Vec(255, 180, 80)); 
    nde.tex["light/cone20"] = createLightCone(vecOne._mul(settings.visionResolution), new Vec(255, 180, 80), 20); 
    nde.tex["light/cone45"] = createLightCone(vecOne._mul(settings.visionResolution), new Vec(255, 180, 80), 45); 
  }

  lightTex.ctx.fillStyle = "rgb(0,0,0)";
  lightTex.ctx.fillRect(0, 0, lightTex.size.x, lightTex.size.y);

  let tempW = cam.renderW;
  cam.renderW = settings.visionResolution;
  cam._(lightTex, () => {
    lightTex.ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < lights.length; i++) {
      let light = lights[i];
      let sqd = light.transform.pos._subV(cam.pos).sqMag();
      if (sqd > (light.maxR + cam.w / 2) ** 2) {
        light.mask = undefined;
        continue;
      }

      if (light.brightness != 1) lightTex.ctx.filter = `brightness(${lights[i].brightness*100}%)`;
      renderLight(light, cam);
      if (light.brightness != 1) lightTex.ctx.filter = `brightness(100%)`;
    }
  });
  cam.renderW = tempW;


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




function createLightGradient(size, color) {
  let img = new Img(size);
  let middle = size._div(2);
  let imageData = img.ctx.getImageData(0, 0, size.x, size.y);
  let data = imageData.data;

  let smallest = Math.min(size.x, size.y);

  let pos = new Vec(0, 0);
  for (pos.x = 0; pos.x < size.x; pos.x++) {
    for (pos.y = 0; pos.y < size.y; pos.y++) {
      let d = pos._subV(middle).mag();

      let m = Math.max(1 - d / (size.x / 2), 0) ** 2;

      let k = (pos.x + pos.y * size.x) * 4;
      data[k++] = color.x * m;
      data[k++] = color.y * m;
      data[k++] = color.z * m;
      data[k++] = 255;
      
    }
  }
  
  img.ctx.putImageData(imageData, 0, 0);

  return img;
}

function createLightCone(size, color, angle) {
  let img = new Img(size);
  let middle = size._div(2);
  let imageData = img.ctx.getImageData(0, 0, size.x, size.y);
  let data = imageData.data;

  let smallest = Math.min(size.x, size.y);

  let pos = new Vec(0, 0);
  for (pos.x = 0; pos.x < size.x; pos.x++) {
    for (pos.y = 0; pos.y < size.y; pos.y++) {
      let diff = pos._subV(middle);
      let d = diff.mag();

      let aTerm = Math.max(1 - d / (size.x / 2), 0) ** 2;
      let bTerm = Math.max((1 - Math.abs(diff.angle() / (angle / 180 * Math.PI) * 2)), 0);

      let m = Math.min(aTerm * bTerm, 1);

      let k = (pos.x + pos.y * size.x) * 4;
      data[k++] = color.x * m;
      data[k++] = color.y * m;
      data[k++] = color.z * m;
      if (color.w) data[k++] = color.w * m;
      else data[k++] = 255;
      
    }
  }
  
  img.ctx.putImageData(imageData, 0, 0);

  return img;
}
