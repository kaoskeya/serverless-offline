const chai = require('chai');
const expect = chai.expect;
const endpoint = process.env.npm_config_endpoint||'ws://localhost:3003';
const timeout = process.env.npm_config_timeout?parseInt(process.env.npm_config_timeout):1000;
const WebSocketTester=require('../support/WebSocketTester');

describe('serverless', ()=>{
  describe('with WebSocket support', ()=>{
    let clients=[]; let req=null; let cred=null;
    const createWebSocket=async (options)=>{
      const ws=new WebSocketTester();
      let url=endpoint; let wsOptions=null;
      if (options.qs) url=`${endpoint}?${options.qs}`;
      if (options.headers) wsOptions={headers:options.headers};
      const hasCreatedWs=await ws.open(url, wsOptions);
      if (!hasCreatedWs) {
        try { ws.terminate(); } catch(err) {};
        return;
      }
      clients.push(ws);
      return ws;
    };
    
    beforeEach(()=>{
      clients=[];
    });
    afterEach(async ()=>{
      await Promise.all(clients.map(async (ws, i)=>{
        const n=ws.countUnrecived();

        if (n>0) {
          console.log(`unreceived:[i=${i}]`);
          (await ws.receive(n)).forEach(m=>console.log(m));
        }
        expect(n).to.equal(0);
        ws.close();
      }));
      clients=[];
    });
    
    it('should open a WebSocket with auth allow', async ()=>{
      const ws=await createWebSocket({headers:{Auth:'allow'}});
      expect(ws).not.to.be.undefined;
      const now=Date.now();
      ws.send(JSON.stringify({action:'echo', message:`${now}`}));
      expect(await ws.receive1()).to.equal(`${now}`);
    }).timeout(timeout);

    // it('should not open a WebSocket with auth deny', async ()=>{
    //   const ws=await createWebSocket({headers:{Auth:'deny'}});
    //   expect(ws).not.to.be.undefined;
    //   await ws.waitForClose();
    // }).timeout(timeout);

    
    
  });
});