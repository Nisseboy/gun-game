class Material {
  constructor(props = {}) {
    this.tex = props.tex;
    let split = this.tex.split("/");
    this.solid = split[0] == "wall";


  }
}


let materials = [
  new Material({tex: "floor/1"}),
  new Material({tex: "wall/1"}),
];