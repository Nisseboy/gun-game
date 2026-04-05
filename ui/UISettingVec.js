class UISettingVec extends UISettingBase {
  
}


/*
class UISettingVec extends UISettingBase {
  constructor(props) {
    super(props);
    this.interactable = false;

    this.defaultStyle = {
      direction: "column",

      row: {growX: true},
      label: {},

      vec: {
        format: "Vec",
        numAxes: 2,
        axes: "xyzw",
      }
    };
    this.fillStyle(props.style);  

    this.value = props.value || new Vec(...new Array(this.style.vec.numAxes).fill(0));

    for (let i = 0; i < this.style.vec.numAxes; i++) {

    }
    return;
    for (let i = 0; i < this.children.length; i++) {
      let c = this.children[i];

      let rowChildren = [c];
      
      if (props.hasLabels && c.displayName) {
        rowChildren.unshift(new UIBase({
          style: {growX: true},
        }));

        rowChildren.unshift(new UIText({
          text: c.displayName,

          style: this.style.label,
        }));
      }

      this.children[i] = new UISettingCollectionRow({
        style: this.style.row,

        children: rowChildren,
      });

      let name = c.name;
      if (name && c.value != undefined) {
        if (this.value[name] != undefined) c.setValue(this.value[name]);
        else this.value[name] = c.value;
  
        c.on("input", value => {
          this.value[name] = value;
          this.fire("input", this.value);
        });
        c.on("change", value => {
          this.value[name] = value;
          this.fire("change", this.value);
        });
      }
    }
  }

  render() {
    super.render();
    
    for (let i in this.elements) {
      let elem = this.elements[i];      
      nde.renderer.setAll(this.style.text);
      nde.renderer.text(this.template[i].name || i, new Vec(this.pos.x, elem.pos.y));

      elem.render();
    }
  }
}
/*

class UISettingCollectionRow extends UIBase {
  render() {
    if (this.children.length == 3) this.children[0].hovered = this.children[2].hovered;
    
    super.render();
  }
}*/