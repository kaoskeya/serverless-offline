const WebSocket = require('ws');

class WebSocketTester {
  constructor() {
    this.messages=[]; this.receivers=[]; this.waitingForClose=[]; this.hasClosed=false;
  }

  notifyWaitingForClose() {
    this.waitingForClose.forEach(resolve=>resolve());
    this.waitingForClose=[]; 
  }

  open(url, options) {
    if (null!=this.ws) return;
    const ws=this.ws=new WebSocket(url, options);
    ws.on('message', (message)=>{
      // console.log('Received: '+message);
      if (0<this.receivers.length) this.receivers.shift()(message);
      else this.messages.push(message);
    });
    
    return new Promise((resolve, reject)=> {
      ws.on('open', ()=>{
        resolve(true);
      });
      ws.on('unexpected-response', ()=>{
        this.hasClosed=true;
        this.notifyWaitingForClose();
        resolve(false);
      });
      ws.on('close', ()=>{
        this.notifyWaitingForClose();
        this.hasClosed=true;
      });
    });
  }

  send(data) {
    this.ws.send(data);
  }

  receive1() {
    return new Promise((resolve/*, reject*/)=>{
      if (0<this.messages.length) resolve(this.messages.shift());
      else this.receivers.push(resolve);
    });
  }

  receive(n) {
    return new Promise((resolve/*, reject*/)=>{
      const messages=[];
      for (let i=0; i<n; i+=1) {
        this.receive1().then((message)=>{
          messages[i]=message;
          if (i===n-1) resolve(messages);
        });
      }
    });
  }

  skip() {
    if (0<this.messages.length) this.messages.shift();
    else this.receivers.push(()=>{});
  }

  countUnrecived() {
    return this.messages.length;
  }

  close() {
    this.hasClosed=true;
    if (null!=this.ws) this.ws.close();
  }

  terminate() {
    this.hasClosed=true;
    if (null!=this.ws) this.ws.terminate();
  }
  
  waitForClose() {
    return new Promise((resolve/*, reject*/)=>{
      if (this.hasClosed) resolve();
      else this.waitingForClose.push(resolve);
    });
  }
};

module.exports=WebSocketTester;