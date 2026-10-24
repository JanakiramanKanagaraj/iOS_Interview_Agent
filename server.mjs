import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {handleAPI} from './server/api.mjs';
import {handleResume} from './server/resume.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const configArg=process.argv.find(a=>a.startsWith('--config='));
const configPath=configArg?path.resolve(configArg.slice(9)):path.join(root,'.env');
async function env(){let data='';try{data=await readFile(configPath,'utf8');}catch{}const values={...process.env};for(const line of data.split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)values[m[1]]=m[2].trim().replace(/^(['"])(.*)\1$/,'$2');}return values;}
const port=Number(process.env.PORT||8766);const expectedHost=`127.0.0.1:${port}`;const hits=new Map();
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','microphone=(self), camera=()');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
 if(req.headers.host!==expectedHost){res.writeHead(403);res.end('Use the printed local URL.');return;}
 const url=new URL(req.url,`http://${expectedHost}`);
 try{
  if(url.pathname.startsWith('/api/')){
   if(req.method==='POST'){
    const now=Date.now();const recent=(hits.get(url.pathname)||[]).filter(t=>now-t<60000);if(recent.length>=12){res.writeHead(429,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Please wait a minute before retrying.'}));return;}recent.push(now);hits.set(url.pathname,recent);
   }
   let size=0;const chunks=[];for await(const part of req){size+=part.length;if(size>(url.pathname==='/api/resume'?6*1024*1024:400000)){res.writeHead(413);res.end();return;}chunks.push(part);}
   const cancellation=new AbortController();res.once('close',()=>{if(!res.writableEnded)cancellation.abort();});
   const request=new Request(url,{signal:cancellation.signal,method:req.method,headers:req.headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)});
   const config=await env();const result=url.pathname==='/api/resume'?await handleResume(request,config):await handleAPI(request,config);if(cancellation.signal.aborted)return;res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
  }
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  const names={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/session-state.mjs':'session-state.mjs','/speech-turn.mjs':'speech-turn.mjs','/session-plan.mjs':'session-plan.mjs','/learning-state.mjs':'learning-state.mjs'};const name=names[url.pathname];if(!name){res.writeHead(404);res.end('Not found');return;}
  const data=await readFile(path.join(root,'web',name));res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':'text/javascript','Cache-Control':'no-store'});res.end(data);
 }catch{if(!res.headersSent)res.writeHead(500);res.end('Local server error.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Interview Mentor room: http://${expectedHost}\nPrivate API configuration is read locally on each request. No key is logged.`));
