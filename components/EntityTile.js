class EntityTile extends Entity {
  constructor(props = {}) {
    super(props);
  }

  start() {
    
  }

  remove() {    
    let g = world.getComponent(Grid);
    g.removeEntityTile(this.transform.pos);
    g.updateLights(this.transform.pos, 1)
  }

  from(data) {
    super.from(data);
    
    return this;
  }
}