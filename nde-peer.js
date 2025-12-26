let updateInterval = 1000/10;
let maxPlayers = 12;
let url = "";

let client;
let server = undefined;


let peer = new Peer();


function initClient() {
  let id = document.location.search.split("?id=")[1];

  if (id == "host") {
    server = new Server();
    client = new ClientHost();
    return;
  }

  if (id) {
    client = new Client(id);
  } 

  if (settings.autoConnect) {
    checkDevServer();
  }

  setInterval(() => {
    if (settings.autoConnect) checkDevServer();
  }, 1000);
}
function connectToServer(id) {  
  let split = id.split("=");
  if (split.length != 1) id = split[1];
  
  document.location.search = "?id=" + id;
}



function checkDevServer() {
  let id = localStorage.getItem("peerjs-dev");
  if (!id || id == "undefined" || (client && id == client.serverId)) return;
  
  setTimeout(()=>{
    connectToServer(localStorage.getItem("peerjs-dev"));
  }, 300);
}
function setDevServer(id) {
  localStorage.setItem("peerjs-dev", id);
}




class NetworkingBase {
  constructor() {
    this.e = new EventHandler();
  }

  init() {}
  send() {}

  on(...args) {return this.e.on(...args)}
  off(...args) {return this.e.off(...args)}
  fire(...args) {return this.e.fire(...args)}

  handleRequest() {}
}





class ClientBase extends NetworkingBase {
  constructor() {
    super();

    this.serverId = undefined;

    this.pending = [];

    setInterval(() => {
      if (this.pending.length == 0) return;

      this.send("mult", this.pending);
      this.pending.length = 0;
    }, updateInterval);

    
    this.on("mult", (requests) => {      
      for (let i = 0; i < requests.length; i++) {
        let r = requests[i];
        
        this.fire(...r);
      }
    });
    this.on("alert", msg => {
      alert(msg);
    });
  }

  send(channel, data) {}

  sendLater(channel, ...data) {
    for (let i = 0; i < this.pending.length; i++) {
      let p = this.pending[i];
      if (p[0] == channel && p[1] == data[0]) {
        this.pending[i] = [channel, ...data];
        return;
      }
    }
    this.pending.push([channel, ...data]);
  }

  handleRequest(channel, ...data) {        
    this.fire(channel, ...data);
  }
}


class ClientHost extends ClientBase {
  constructor() {
    super();

    this.serverId = peer.id;
    this.id = 0;

    this.init();
  }

  send(channel, ...data) {
    server.handleRequest(this.id, channel, ...data);
  }
}

class Client extends ClientBase {
  constructor(id) {
    super();

    this.serverId = id;
  
    this.id = Math.floor(Math.random() * 10000);
    
    if (peer.open) this.connect();
    peer.on("open", () => {
      this.connect();
    })
  }

  connect() {
    this.host = peer.connect(this.serverId, {metadata: this.id});
      
    this.host.on("open", () => {     
      this.host.on("data", data => {
        
        this.handleRequest(data);
      });

      this.init();
    });

    this.host.on("close", () => {
      connectToServer("");
    });
  }

  send(channel, ...data) {
    this.host.send(JSON.stringify([channel, data]));
  }

  handleRequest(data) { 
    data = JSON.parse(data);
    super.handleRequest(data[0], ...data[1])
  }
}


class ServerBase extends NetworkingBase {
  constructor() {
    super();

    this.connections = {};
    this.pending = {};

    this.lastUpdateTime = 0;
    this.lastUpdateDuration = 0;

    if (peer.open) {
      this.init();
    } else {
      peer.on("open", () => {this.init()});
    }

    setInterval(() => {
      let t = performance.now();
      this.lastUpdateDuration = t - this.lastUpdateTime;
      this.lastUpdateTime = t;

      this.update(this.lastUpdateDuration / 1000);

      for (let id in this.pending) {
        this.send(id, "mult", this.pending[id]);
      }
      this.pending = {};
    }, updateInterval);
  }

  init() {
    this.id = peer.id;
    setDevServer(this.id);

    peer.on("connection", conn => {
      if (Object.keys(this.connections).length + 1 >= maxPlayers) {
        conn.on("open", () => {
          conn.send(JSON.stringify(["alert", ["Server full, try reloading or another server"]]));       
        }); 
        return;
      }

      let id = conn.metadata;
      console.log(id + ": " + "connected");

      this.connections[id] = conn;
      
      if (conn.open) {
        this.fire("connection", id, conn);
      } else {
        conn.on("open", () => {
          this.fire("connection", id, conn);
        })
      }

      conn.on("close", () => {
        delete this.connections[id];
        this.fire("disconnection", id, conn);
        console.log(id + ": " + "disconnected");
      })

      conn.on("data", data => {
        
        data = JSON.parse(data);
        this.handleRequest(id, data[0], ...data[1]);
      });
    });

    this.on("mult", (senderId, requests) => {
      for (let i = 0; i < requests.length; i++) {
        let r = requests[i];
        
        this.fire(r[0], senderId, ...r.splice(1, 1000));
      }
    });
  }

  update(dt) {}

  send(id, channel, ...data) {    
    if (id == 0) {
      client.handleRequest(channel, ...data);
      return;
    }

    this.connections[id].send(JSON.stringify([channel, data]));
  }
  sendLater(id, channel, ...data) {
    if (!this.pending[id]) this.pending[id] = [];

    this.pending[id].push([channel, ...data]);
  }
  sendOthers(id, channel, ...data) {    
    for (let i in this.connections) {      
      if (i == id) continue;
      
      this.send(i, channel, ...data);      
    }
    if (id != 0) this.send(0, channel, ...data);
  }
  sendOthersLater(id, channel, ...data) {
    for (let i in this.connections) {      
      if (i == id) continue;
      
      this.sendLater(i, channel, ...data);      
    }

    if (id != 0) this.sendLater(0, channel, ...data);
  }
  sendAll(channel, ...data) {
    this.sendOthers(undefined, channel, ...data);
  }
  sendAllLater(channel, ...data) {
    this.sendOthersLater(undefined, channel, ...data);
  }

  handleRequest(id, channel, ...data) {
    this.fire(channel, id, ...data);
  }
}