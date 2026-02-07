class Spawner extends Component {
  constructor(props = {}) {
    super();

    this.lootTable = props.lootTable;
    this.spawnOb = props.ob;
    
    this.clientOnly = true;
  }

  start() {
    let ob;
    if (this.lootTable) {
      ob = lootTables[this.lootTable].pick().copy();
    } else {
      ob = createItem({itemType: this.spawnOb});
    }

    let parent = this.ob.parent;
    this.ob.remove();
    
    ob = ob.copy();
    ob.id = this.ob.id;
    ob.transform.pos.from(this.transform.pos);
    ob.transform.dir = this.transform.dir;

    createEntity(ob, parent);
  }

  from(data) {
    super.from(data);

    this.spawnOb = data.spawnOb;
    this.lootTable = data.lootTable;    

    return this;
  }
}