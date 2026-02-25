class PlayerStore extends Component {
  constructor() {
    super();
    
    this.clientOnly = true;
    this.active = false;

    this.obs = {};
  }

  store(ob) {
    this.obs[ob.id] = ob.serialize();
  }
  get(id) {
    let data = this.obs[id];
    if (data) {
      console.log(`${id}: From storage`);
      delete this.obs[id];
      return cloneData(data);
    }

    let player = EntityPlayer.copy();
    player.name = id;
    player.id = id;
    player.transform.pos.set(2.5, 2.5);

    return player;
  }


  from(data) {
    super.from(data);

    this.obs = data.obs;
    
    return this;
  }
}