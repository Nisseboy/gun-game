class Spawner extends Component {
  constructor(props = {}) {
    super();

    this.lootTable = props.lootTable || "all";
    this.amount = props.amount || 1;
    
    this.clientOnly = true;
  }

  start() {  
    let inventory = this.getComponent(Inventory);
    let parent = this.ob.parent;

    for (let i = 0; i < this.amount; i++) {
      let ob = lootTables[this.lootTable].pick();

      if (!inventory && i == 0) ob.id = this.ob.id;
      ob.transform.pos.from(this.transform.pos);
      ob.transform.dir = this.transform.dir;

      ob = createEntity(ob, parent);

      if (inventory) {        
        inventory.pickup(ob);
      }
    }

    if (inventory) this.ob.removeComponent(this);
    else this.ob.remove();
  }

  from(data) {
    super.from(data);

    this.lootTable = data.lootTable;    
    this.amount = data.amount;    

    return this;
  }
}