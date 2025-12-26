class Light extends Component {
  constructor() {
    super();
  }
}


let visionMask = new Img(vecOne);
function renderVision(cam) {
  if (visionMask.size.x != settings.visionResolution) visionMask.resize(vecOne._mul(settings.visionResolution));

  let size = new Vec(cam.w, cam.w * nde.ar);
  let halfSize = size._mul(0.5);

  world.grid.createMask(cam.pos, halfSize.x * 1.2, cam, visionMask);

  renderer.image(visionMask, cam.pos._subV(halfSize), size);
}