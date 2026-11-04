// 휘블록스 사이트 + 새싹 모험기 멀티플레이 서버
// 실행: npm install  →  npm start   (주소: http://localhost:3000)
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000,ROOT=path.join(__dirname,'public');
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,path.normalize(p).replace(/^(\.\.[\/\\])+/,''));
  if(!f.startsWith(ROOT))return res.writeHead(403).end();fs.readFile(f,(e,d)=>{if(e){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('없는 페이지예요')}res.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream','cache-control':'no-cache'});res.end(d)})});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:16*1024});
const clients=new Map();let nid=1;
function send(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o))}
function all(o,except){const s=JSON.stringify(o);for(const [ws] of clients)if(ws!==except&&ws.readyState===1)ws.send(s)}
wss.on('connection',ws=>{const id='p'+(nid++).toString(36)+Math.random().toString(36).slice(2,6);const c={id,p:{},n:0,t:Date.now()};clients.set(ws,c);
  send(ws,{t:'hi',id});for(const [,o] of clients)if(o.id!==id&&Object.keys(o.p).length)send(ws,{t:'p',id:o.id,p:o.p});
  ws.on('message',raw=>{const now=Date.now();if(now-c.t>1000){c.t=now;c.n=0}if(++c.n>40)return;let m;try{m=JSON.parse(raw)}catch(e){return}
    if(m&&m.t==='p'&&m.p&&typeof m.p==='object'&&!Array.isArray(m.p)){c.p=m.p;all({t:'p',id,p:m.p},ws)}});
  ws.on('close',()=>{clients.delete(ws);all({t:'bye',id})});ws.on('error',()=>{})});
setInterval(()=>{for(const [ws] of clients){if(ws.isAlive===false){ws.terminate();continue}ws.isAlive=false;ws.ping()}},30000);
wss.on('connection',ws=>{ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true)});
server.listen(PORT,()=>console.log(`휘블록스 서버 실행 중 → http://localhost:${PORT}  (접속자 0명)`));
setInterval(()=>console.log('접속자',clients.size,'명'),60000);
