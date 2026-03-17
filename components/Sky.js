/*class Sky extends Component {
  constructor(props = {}) {
    super();

    this.dayLengthS = props.dayLengthS ?? 20;
    this.offsetDays = props.day ?? 0.5;

    this.day = 0;
    this.hour = 0;
  }

  init() {
    this.startTime = Date.now();
  }

  start() {
    this.lastDay = -100;
    this.sky = new SkyLight();
    this.addComponent(this.sky);
  }
  
  update() {
    let time = Date.now() - this.startTime;

    this.day = ((time / 1000 / this.dayLengthS) + this.offsetDays);
    this.hour = this.day % 1 * 24;    
    
    if (Math.abs(this.day - this.lastDay) > settings.skyUpdateFreqH / 24) {      
      this.lastDay = this.day;
      
      let res = sunSimulation(this.day % 1);
      
      this.sky.angle = res.angle;
      this.sky.length = res.length;
      this.sky.color.from(res.color);
      this.sky.cached = false;
    }
  }

  setDay(day) {
    this.update();

    let diff = day - this.day;
    
    this.offsetDays += diff;

    this.update();
  }

  from(data) {
    super.from(data);

    this.startTime = data.startTime;
    this.dayLengthS = data.dayLengthS;
    this.offsetDays = data.offsetDays;

    return this;
  }
}*/







class Sky extends Light {
  constructor(props = {}) {
    super(props);

    this.startTime;
    this.dayLengthS = props.dayLengthS ?? 20;
    this.offsetDays = props.day ?? 0.5;

    this.cellSize = props.cellSize ?? 10;
    this.shadowMult = props.shadowMult ?? 0.5;

    this.lastMaxR;
    this.lastPos = new Vec();
    this.pos = new Vec();
    this.setMinBounds(new Vec(7.5, 7.5), 5);


    this.lastAngle;
    this.angle = props.angle ?? Math.PI / 4;
    this.lastLength;
    this.length = props.length ?? 1;
    this.lastColor = new Vec();
    this.color = props.color ?? new Vec(255, 255, 255);


    this.day = 0;
    this.hour = 0;

    this.cull = false;
  }

  init() {
    this.startTime = Date.now();
  }


  start() {
    this.lastDay = -100;
  }

  update() {
    let time = Date.now() - this.startTime;

    this.day = ((time / 1000 / this.dayLengthS) + this.offsetDays);
    this.hour = this.day % 1 * 24;    
    
    if (Math.abs(this.day - this.lastDay) > settings.skyUpdateFreqH / 24) {      
      this.lastDay = this.day;
      
      let res = sunSimulation(this.day % 1);
      
      this.angle = res.angle;
      this.length = res.length;
      this.color.from(res.color);
      this.cached = false;
    }
  }

  setDay(day) {
    this.update();

    let diff = day - this.day;
    
    this.offsetDays += diff;

    this.update();
  }
  setMinBounds(pos, r, roundingFactor = 2) {
    let rf = Math.round(roundingFactor*0.5)*2;

    let x1 = Math.floor((pos.x-r)/rf)*rf;
    let y1 = Math.floor((pos.y-r)/rf)*rf;
    let x2 = Math.ceil((pos.x+r)/rf)*rf;
    let y2 = Math.ceil((pos.y+r)/rf)*rf;

    this.pos.set((x1+x2)*0.5, (y1+y2)*0.5);
    
    let w = Math.max(x2 - x1, y2 - y1);
    this.size = w * this.cellSize;
    this.maxR = w * 0.5;
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
    if (!this.lastPos.isEqualTo(this.pos) || this.lastMaxR != this.maxR) {
      this.cached = false;
      this.lastPos.from(this.pos);
      this.lastMaxR = this.maxR;
    }
    if (this.lastAngle != this.angle || this.lastLength != this.length || !this.lastColor.isEqualTo(this.color)) {
      this.cached = false;
      this.lastAngle = this.angle;
      this.lastLength = this.length;
      this.lastColor.from(this.color);
    }
    
    if (this.cached) return this.mask;
    this.cached = true;    
    


    let ctx = this.mask.ctx;
    let grid = world.getComponent(Grid);
    let tl = this.pos._sub(this.maxR);
    let br = this.pos._add(this.maxR);
    
  
    ctx.getImageData(0, 0, this.size, this.size);

    ctx.clearRect(0, 0, this.size, this.size);
    ctx.imageSmoothing = false;

    let padding = 2;
    ctx.fillStyle = `rgb(${this.color.r * this.shadowMult}, ${this.color.b * this.shadowMult}, ${this.color.g * this.shadowMult})`;
    let mat;
    let openings = [];
    for (let x = tl.x; x < br.x; x++) {      
      for (let y = tl.y; y < br.y; y++) {
        if (x >= 0 && x < grid.size.x && y >= 0 && y < grid.size.y) mat = materials[grid.g[x + y * grid.size.x]];        
        else mat = materials[0];

        if (mat.sky) {
          ctx.fillRect((x-tl.x) * this.cellSize - padding, (y-tl.y) * this.cellSize - padding, this.cellSize + padding * 2, this.cellSize + padding * 2);
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
    let cos = Math.cos(this.angle);
    let sin = Math.sin(this.angle);
    let l = this.length;
    let dx = Math.floor(cos * l * this.cellSize);
    let dy = Math.floor(sin * l * this.cellSize);
    let invCellSize = 1 / this.cellSize;
    let res;
    let eps = 0.00001;

    let absDelta = new Vec(cos * l, sin * l).abs();

    let tl2 = tl._subV(absDelta).floor();
    let br2 = br._addV(absDelta).ceil();

    let a,b,c,d;
    

    for (let x = tl2.x; x < br2.x; x++) {      
      for (let y = tl2.y; y < br2.y; y++) {
        if (x >= 0 && x < grid.size.x && y >= 0 && y < grid.size.y && materials[grid.g[x + y * grid.size.x]].inside) continue;
        
        a = grid.raycastFast(x+eps, y+eps, cos, sin, l, "opaque");
        b = grid.raycastFast(x+1-eps, y+eps, cos, sin, l, "opaque");
        c = grid.raycastFast(x+1-eps, y+1-eps, cos, sin, l, "opaque");
        d = grid.raycastFast(x+eps, y+1-eps, cos, sin, l, "opaque");

        if (!(a||b||c||d)) {          
          ctx.fillRect((x-tl.x) * this.cellSize + dx, (y-tl.y) * this.cellSize + dy, this.cellSize, this.cellSize);
          continue;
        }
        if (a&&b&&c&&d) continue;

        for (let X = 0; X < this.cellSize; X++) {      
          for (let Y = 0; Y < this.cellSize; Y++) {
            res = grid.raycastFast(x + X * invCellSize, y + Y * invCellSize, cos, sin, l, "opaque");
            if (!res) ctx.fillRect((x-tl.x) * this.cellSize + X + dx, (y-tl.y) * this.cellSize + Y + dy, 1, 1);            
          }
        }
      }
    }
    
    ctx.globalCompositeOperation = "lighten";    
    for (let o of openings) {
      ctx.save();
      ctx.translate((o.pos.x-tl.x) * this.cellSize, (o.pos.y-tl.y) * this.cellSize);
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


    return this.mask;
  }


  from(data) {
    super.from(data);

    this.startTime = data.startTime;
    this.dayLengthS = data.dayLengthS;
    this.offsetDays = data.offsetDays;
    
    this.cellSize = data.cellSize;
    this.shadowMult = data.shadowMult;

    this.angle = data.angle;
    this.length = data.length;
    this.color = new Vec().from(data.color);

    return this;
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