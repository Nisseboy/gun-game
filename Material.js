/*
         Opaque  Solid   Inside
Ground   N       N       N
Floor    N       N       Y
Wall     Y       Y       Y
Window   N       Y       Y
Fence    N       Y       N


*/


class Material {
  constructor(tex, props = {}) {
    this.tex = "material/" + tex;
    let type = tex.split("/")[0];

    this.opaque = type == "wall";
    this.solid = type == "wall"   || type == "window" || type == "fence";
    this.inside = type == "floor" || type == "wall" || type == "window";
    this.sky = !this.inside;
  }
}