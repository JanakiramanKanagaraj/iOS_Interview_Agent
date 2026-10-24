import {handleLocal} from '../server/local.mjs';
const history=[];const model=process.argv[2]||'qwen3:1.7b';
const answers=['I have nine years of iOS experience across streaming and social applications. Recently I worked on the Raftr feed using SwiftUI and async await.','On Raftr I owned pagination and refresh. Refresh could race with a page request, so I coordinated state in the view model and dropped old responses using a generation identifier.','I chose generation checks because cancellation is cooperative. I used a fake client to return requests in reverse order and checked that the old page never overwrote refreshed content.'];
for(let i=0;i<4;i++){
 const req=new Request('http://127.0.0.1:8769/api/chat',{method:'POST',headers:{origin:'http://127.0.0.1:8769'},body:JSON.stringify({resume:'Raftr: SwiftUI feeds and Swift concurrency. DAZN: AVPlayer streaming.',jd:'Senior iOS, Swift concurrency, SwiftUI, XCTest, DSA and mobile system design.',history})});
 const started=Date.now();const res=await handleLocal(req,{OLLAMA_MODEL:model});const d=await res.json();console.log(JSON.stringify({model,seconds:Math.round((Date.now()-started)/100)/10,status:res.status,reply:d.reply,interview:d.interview}));if(!res.ok)process.exit(1);
 history.push({role:'assistant',text:d.reply,topic:d.interview.topic,phase:d.interview.phase});if(i<3)history.push({role:'user',text:answers[i]});
}
