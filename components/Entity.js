let entities = [];

class Entity extends Component {
  constructor(props = {}) {
    super();

    this.hp = props.hp || 100;
  }

  start() {
    entities.push(this);

    this.ob.entity = this;
  }
  remove() {
    let index = entities.indexOf(this);
    if (index == -1) return;

    entities.splice(index, 1);
  }

  from(data) {
    super.from(data);

    this.hp = data.hp;
    
    return this;
  }

  strip() {
    delete this.ob.entity;

    super.strip();
  }
}


function raycastEntities(pos, dirVec) {
  let closestD = Infinity;
  let e, x, y;


  for (let j = 0; j < entities.length; j++) {
    let entity = entities[j];

    let res = raycastEntity(pos, dirVec, entity);
    if (res && res.d < closestD) {
      closestD = res.d;
      e = entity.ob;
      x = res.x;
      y = res.y;
    }
  }

  if (e) return {entity: e, d: closestD, x, y};
}
function raycastEntity(pos, dirVec, entity) {
  const radius = Math.max(entity.transform.size.x, entity.transform.size.y) / 2 * 0.9;

  const m = pos._subV(entity.transform.pos);
  const b = m.dot(dirVec);
  const c = m.dot(m) - radius * radius;

  if (c > 0 && b > 0) return;

  const discriminant = b * b - c;

  if (discriminant < 0) return;

  let t = -b - Math.sqrt(discriminant);
  if (t < 0) {
    return
  }

  return {
    d: t,
    x: pos.x + dirVec.x * t,
    y: pos.y + dirVec.y * t,
  };
}