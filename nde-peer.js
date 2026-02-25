let updateInterval = 1000/10;
let maxPlayers = 12;

let server = undefined;
let serverId = document.location.search.split("?id=")[1];
let client = undefined;
let id = getClientId();

let peerIdPrefix = "pre-";
let peerId = Math.floor(Math.random() * 100000);

let peer = new Peer(peerIdPrefix + peerId, {debug:1});


function initClient() {
  if (serverId) {    
    if (serverId[0] == "_") {
      if (serverId == "_host") {
        client = new ClientHost();
        server = new Server(peerId);
        id = 0;
      }

      return;
    }

    client = new Client(serverId);
  } 

  if (settings.autoConnect) {
    checkDevServer();
  }

  setInterval(() => {
    if (settings.autoConnect) checkDevServer();
  }, 500);
  
  return;
}
function connectToServer(id) {  
  let split = id.split("=");
  if (split.length != 1) id = split[1];
  
  document.location.search = "?id=" + id;
}



function getClientId() {
  let id = localStorage.getItem("client-id");
  if (id) return parseInt(id);
  id = Math.floor(Math.random() * 1000000);
  localStorage.setItem("client-id", id);
  return id;
}
function checkDevServer() {
  let id = localStorage.getItem("peerjs-dev");  
  if (!id || id == "undefined" || (client && id == client.hostId)) return;
  
  connectToServer(localStorage.getItem("peerjs-dev"));
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
    this.on("kick", msg => {
      client = undefined;

      this.host.close();

      alert(msg);
    });
    this.on("alert", msg => {
      alert(msg);
    });
  }

  send(channel, ...data) {}

  sendOthers(channel, ...data) {this.sendOthers(channel, ...data)}
  sendAll(channel, ...data) {
    this.fire(channel, ...data);
    this.send(channel, ...data);
  }

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

    this.init();
  }

  send(channel, ...data) {
    server.handleRequest(0, channel, ...data);
  }
}

class Client extends ClientBase {
  constructor(id) {
    super();

    this.hostId = id;
    
    if (peer.open) this.connect();
    peer.on("open", () => {
      this.connect();
    })
  }

  connect() {        
    this.host = peer.connect(peerIdPrefix + this.hostId, {metadata: "" + id});
    
    this.host.on("open", () => {      
      this.host.on("data", data => {
        this.handleRequest(data);
      });

      this.init();
    });
    peer.on("error", () => {      
      client = undefined;
      alert(this.hostId + " not found");
    });

    this.host.on("close", () => {
      if (!settings.autoConnect) connectToServer("");
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
  constructor(id) {
    super();

    this.id = id;

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
    setDevServer(this.id);

    peer.on("connection", conn => {      
      let id = conn.metadata;

      if (Object.keys(this.connections).length + 1 >= maxPlayers) {
        conn.on("open", () => {
          conn.send(JSON.stringify(["kick", ["Server full, try reloading or another server"]]));       
        }); 
        return;
      }
      if (this.connections[id]) {
        conn.on("open", () => {
          conn.send(JSON.stringify(["kick", ["Server already contains your ID"]]));       
        }); 
        return;
      }

      
      if (conn.open) {
        console.log(id + ": " + "connected");
        this.connections[id] = conn;
        this.fire("connection", id, conn);
      } else {
        conn.on("open", () => {
          console.log(id + ": " + "connected");
          this.connections[id] = conn;
          this.fire("connection", id, conn);
        })
      }

      conn.peerConnection.onconnectionstatechange = (e) => {
        if (conn.peerConnection.connectionState == "disconnected") {
          delete this.connections[id];
          this.fire("disconnection", id, conn);
          console.log(id + ": " + "disconnected");
        }
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