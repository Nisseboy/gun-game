/*
         Opaque  Solid   Inside
Ground   N       N       N
Floor    N       N       Y
Wall     Y       Y       Y
Window   N       Y       Y
Fence    N       Y       N


*/

let materialGroups = {};
class Material {
  constructor(tex, props = {}) {
    this.tex = "material/" + tex;
    let split = tex.split("/");
    let type = split.splice(0, 1);

    this.opaque = type == "wall";
    this.solid = type == "wall"   || type == "window" || type == "fence";
    this.inside = type == "floor" || type == "wall" || type == "window";
    this.sky = !this.inside;

    this.group = type;
    this.name = split.join("/");
    this.fullName = tex;

    this.hp = props.hp;

    if (!materialGroups[type]) materialGroups[type] = [];
    materialGroups[type].push(this);
  }
}