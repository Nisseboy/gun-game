class Sky extends Component {
  constructor(props = {}) {
    super();

    this.dayLengthS = props.dayLengthS ?? 20;
    this.offsetDays = props.day ?? 0.5;

    this.day = 0;
    this.hour = 0;
  }

  init() {
    this.offset = Date.now();
  }

  start() {
    this.lastDay = -100;
    this.sky = new SkyLight();
    this.addComponent(this.sky);
  }
  
  update() {
    let time = Date.now() - this.offset;

    this.day = ((time / 1000 / this.dayLengthS) + this.offsetDays);
    this.hour = this.day % 1 * 24;
    
    if (this.day - this.lastDay > settings.skyUpdateFreqH / 24) {
      this.lastDay = this.day;

      let res = sunSimulation(this.day % 1);
      
      this.sky.angle = res.angle;
      this.sky.length = res.length;
      this.sky.color.from(res.color);
      this.sky.cached = false;
    }
  }

  from(data) {
    super.from(data);

    this.offset = data.offset;
    this.dayLengthS = data.dayLengthS;
    this.offsetDays = data.offsetDays;

    return this;
  }
}







class SkyLight extends Light {
  constructor(props = {}) {
    super(props);
    
    this.cellSize = props.cellSize ?? 10;
    this.angle = props.angle ?? Math.PI / 4;
    this.length = props.length ?? 1;

    this.color = new Vec(255, 255, 255);
    this.shadowMult = 0.5;

    this.smooth = true

    this.clientOnly = true;
  }


  start() {
    super.start();

    let grid = world.getComponent(Grid);
    let w = grid.size.x + 16;
    this.maxR = w / 2;
    this.size = w * this.cellSize;

  }

  renderMask() {    
    if (!this.mask) {
      this.cached = false;
      this.mask = new Img(vecOne._mul(this.size));
    }
    if (this.mask.size.x != this.size) {
      this.cached = false;
      this.mask.resize(vecOne._mul(this.size));
    }
    
    if (this.cached) return this.mask;

    let ctx = this.mask.ctx;
    let size = this.mask.size;
    let grid = world.getComponent(Grid);
    
    ctx.getImageData(0, 0, this.size, this.size);

    ctx.fillStyle = `rgb(${this.color.r}, ${this.color.b}, ${this.color.g})`;
    ctx.fillRect(0, 0, size.x, size.y);
    ctx.clearRect(8*this.cellSize, 8*this.cellSize, grid.size.x*this.cellSize, grid.size.y*this.cellSize);

    let padding = 2;
    ctx.fillStyle = `rgb(${this.color.r * this.shadowMult}, ${this.color.b * this.shadowMult}, ${this.color.g * this.shadowMult})`;
    let mat;
    let openings = [];
    for (let x = 0; x < grid.size.x; x++) {      
      for (let y = 0; y < grid.size.y; y++) {
        if (x >= 0 && x < grid.size.x && y >= 0 && y < grid.size.y) mat = materials[grid.g[x + y * grid.size.x]];        
        else mat = materials[0];

        if (mat.sky) {
          ctx.fillRect((x+8) * this.cellSize - padding, (y+8) * this.cellSize - padding, this.cellSize + padding * 2, this.cellSize + padding * 2);
          continue;
        }
        
        if (mat.opaque) continue;

        if (materials[grid.g[(x-1) + (y+0) * grid.size.x]]?.sky) openings.push({pos: new Vec(x, y+1), dir: -Math.PI / 2});
        if (materials[grid.g[(x+1) + (y+0) * grid.size.x]]?.sky) openings.push({pos: new Vec(x+1, y), dir: Math.PI / 2});
        if (materials[grid.g[(x+0) + (y-1) * grid.size.x]]?.sky) openings.push({pos: new Vec(x, y), dir: 0});
        if (materials[grid.g[(x+0) + (y+1) * grid.size.x]]?.sky) openings.push({pos: new Vec(x+1, y+1), dir: Math.PI});
      }
    }

    ctx.fillStyle = `rgb(${this.color.r}, ${this.color.b}, ${this.color.g})`;
    let a = this.angle// + Math.PI;
    let cos = Math.cos(a);
    let sin = Math.sin(a);
    let l = this.length;
    let dx = cos * l * this.cellSize;
    let dy = sin * l * this.cellSize;
    let invCellSize = 1 / this.cellSize;
    let res;
    let eps = 0.00001;

    for (let X = -8; X < grid.size.x + 8; X++) {
      for (let Y = -8; Y < grid.size.y + 8; Y++) {
        if (X >= 0 && Y >= 0 && X < grid.size.x && Y < grid.size.y && materials[grid.g[X + Y * grid.size.x]]?.inside) continue;

        if (!(
          grid.raycastFast(X+eps, Y+eps, cos, sin, l, "opaque") || 
          grid.raycastFast(X+1-eps, Y+eps, cos, sin, l, "opaque") || 
          grid.raycastFast(X+1-eps, Y+1-eps, cos, sin, l, "opaque") || 
          grid.raycastFast(X+eps, Y+1-eps, cos, sin, l, "opaque")
        )) {
          ctx.fillRect((X+8) * this.cellSize + Math.round(dx), (Y+8) * this.cellSize + Math.round(dy), this.cellSize, this.cellSize);
          continue;
        }
        

        
        for (let x = 0; x < this.cellSize; x++) {      
          for (let y = 0; y < this.cellSize; y++) {
            res = grid.raycastFast(X + x * invCellSize, Y + y * invCellSize, cos, sin, l, "opaque");
            if (!res) ctx.fillRect((X+8) * this.cellSize + x + Math.round(dx), (Y+8) * this.cellSize + y + Math.round(dy), 1, 1);            
          }
        }
      }
    }
    
    ctx.globalCompositeOperation = "lighten";    
    for (let o of openings) {
      ctx.save();
      ctx.translate((o.pos.x+8) * this.cellSize, (o.pos.y+8) * this.cellSize);
      ctx.rotate(o.dir);

      
      let brightness;
      for (let x = -padding; x < this.cellSize + padding; x++) {
        for (let y = -padding; y < this.cellSize * 2 + padding; y++) {
          brightness = (1 - y / (this.cellSize * 2)) * this.shadowMult;
          ctx.fillStyle = `rgb(${this.color.r * brightness}, ${this.color.b * brightness}, ${this.color.g * brightness})`;
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      }

      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";


    this.cached = true;    
    return this.mask;
  }
}





//ChatGPT
function _lerp(a, b, t) {
    return a + (b - a) * t;
}

function _lerpVec(a, b, t) {
    return new Vec(
        _lerp(a.r, b.r, t),
        _lerp(a.g, b.g, t),
        _lerp(a.b, b.b, t)
    );
}

function _smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function _softCap(x, cap) {
    // smooth compression toward cap
    return cap * (1 - Math.exp(-x / cap));
}

function sunSimulation(dayFrac) {

    dayFrac = Math.max(0, Math.min(1, dayFrac));

    const buildingHeight = 2;

    // sun path (east → west)
    const azimuth = (dayFrac - 0.5) * Math.PI;

    // elevation curve
    const elevation = Math.max(0, Math.sin(dayFrac * Math.PI));
    const elevationAngle = elevation * Math.PI / 2;

    // shadow length
    let rawShadow;

    if (elevationAngle < 0.05) {
        rawShadow = 20;
    } else {
        rawShadow = buildingHeight / Math.tan(elevationAngle);
    }

    const shadowLength = _softCap(rawShadow, 5);

    // better sky colors
    const night   = new Vec(8, 8, 20);
    const horizon = new Vec(180, 170, 90);   // warm orange (less pink)
    const zenith  = new Vec(255, 255, 255);  // cleaner blue (less green)

    const horizonFactor = Math.pow(1 - elevation, 2.2);
    const horizonMix = _smoothstep(horizonFactor);

    let skyColor = _lerpVec(zenith, horizon, horizonMix);

    const nightFactor = Math.max(0, 1 - elevation * 3);
    skyColor = _lerpVec(skyColor, night, nightFactor);

    return {
        angle: azimuth,
        length: shadowLength,
        color: skyColor,
    };
}