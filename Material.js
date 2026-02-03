class Material {
  constructor(props = {}) {
    this.tex = props.tex;
    let split = this.tex.split("/");
    this.solid = split[0] == "wall";
    this.dark = split[0] == "floor";
    this.outside = split[0] == "ground";


  }
}


let materials = [
  new Material({tex: "ground/grass"}),
  new Material({tex: "wall/1"}),
  new Material({tex: "floor/floor"}),
];