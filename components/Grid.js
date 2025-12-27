
class Grid extends Component {
  constructor(size) {
    super();

    this.size = size;
    this.g = [];
    this.cam = undefined;
  }

  start() {
    this.ob.grid = this;
  }

  render() {
    renderer.set("stroke", "rgba(0, 0, 0, 0)")


    let bounds = new Vec(
      Math.max(Math.floor(this.cam.pos.x - this.cam.w / 2), 0),
      Math.max(Math.floor(this.cam.pos.y - this.cam.w / 2 * nde.ar), 0),
      Math.min(Math.floor(this.cam.pos.x + this.cam.w / 2 + 1), this.size.x),
      Math.min(Math.floor(this.cam.pos.y + this.cam.w / 2 * nde.ar + 1), this.size.y),
    );
    let p = new Vec(0, 0), mat = 0;
    for (p.x = bounds.x; p.x < bounds.z; p.x++) {
      for (p.y = bounds.y; p.y < bounds.w; p.y++) {
        mat = this.g[p.x + p.y * this.size.x];

        if (!mat) continue;

        renderer.set("fill", "rgba(189, 94, 94, 1)")
        renderer.rect(p, vecOne);      
      }
    }
  }

  random() {
    this.g = new Array(this.size.x * this.size.y)
    let scale = 0.2;
    for (let x = 0; x < this.size.x; x++) {
      for (let y = 0; y < this.size.y; y++) {
        this.g[x + y * this.size.x] = noise.perlin2(x * scale, y * scale) > 0.3 ? 0 : 1;
      }
    }

    this.g = [
      1,1,0,1,1,
      1,0,0,0,1,
      1,0,0,0,1,
      1,0,1,0,1,
      1,1,1,1,1,
    ];
  }


  raycast(pos, dirVec, maxDist) {return this.raycastFast(pos.x, pos.y, dirVec.x, dirVec.y, maxDist)}
  raycastFast(posx, posy, dirx, diry, maxDist = 100) {
    const gridW = this.size.x;
    const gridH = this.size.h;

    // current grid cell
    let mapX = Math.floor(posx);
    let mapY = Math.floor(posy);

    // step direction
    const stepX = dirx < 0 ? -1 : 1;
    const stepY = diry < 0 ? -1 : 1;

    // avoid division by zero
    const deltaX = dirx !== 0 ? Math.abs(1 / dirx) : 1e6;
    const deltaY = diry !== 0 ? Math.abs(1 / diry) : 1e6;

    // distance to first grid boundary
    let tMaxX =
      dirx > 0
        ? (mapX + 1 - posx) * deltaX
        : (posx - mapX) * deltaX;

    let tMaxY =
      diry > 0
        ? (mapY + 1 - posy) * deltaY
        : (posy - mapY) * deltaY;

    let t = 0;
    let hitVertical = false;

    for (let i = 0; i < 80; i++) {
      if (tMaxX < tMaxY) {
        t = tMaxX;
        tMaxX += deltaX;
        mapX += stepX;
        hitVertical = true;
      } else {
        t = tMaxY;
        tMaxY += deltaY;
        mapY += stepY;
        hitVertical = false;
      }

      if (t >= maxDist || mapX < 0 || mapX >= gridW || mapY < 0 || mapY >= gridH) break;

      if (this.g[mapX + mapY * gridW]) {
        return {
          x: posx + dirx * t,
          y: posy + diry * t,
          d: t,
          isHor: !hitVertical,
          mat: this.g[mapX + mapY * gridW],
        };
      }
    }
  }

  createMask(pos, maxR, ar, texture) {
    let ctx = texture.ctx;

    if (pos.x <= 0 || pos.y <= 0 || pos.x >= this.size.x - 1 || pos.y >= this.size.y - 1) {
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(0, 0, texture.size.x, texture.size.y);
      return;
    }

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.strokeStyle = "rgb(255, 255, 255)";
    ctx.lineWidth = 15;
    ctx.beginPath();

    let dirStep = Math.PI * 2 / settings.visionSamples; 
    let scaling = 1 / maxR;
    let invAr = 1 / ar;
    let res, cos, sin, d;
    for (let i = 0; i < settings.visionSamples + 1; i++) {
      cos = Math.cos(i * dirStep);
      sin = Math.sin(i * dirStep)

      res = this.raycastFast(pos.x, pos.y, cos, sin, maxR); 
      d = res?.d || maxR;
      
      ctx.lineTo(texture.size.x * 0.5 * (1 + cos * d * scaling), texture.size.y * 0.5 * (1 + sin * d * scaling * invAr));
    }

    ctx.fill();
    ctx.stroke();

    return texture;
  }


  from(data) {
    super.from(data);

    this.size = new Vec().from(data.size);
    this.g = data.g;

    return this;
  }

  strip() {
    delete this.ob.grid;

    super.strip();
  }
}