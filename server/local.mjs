import {validateContext,interviewInstructions,reviewInstructions} from './interviewer.mjs';
const base='http://127.0.0.1:11434';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleLocal(request,env,fetcher=fetch){
 const url=new URL(request.url);const model=env.OLLAMA_MODEL||'qwen3:1.7b';
 if(url.pathname==='/api/health'&&request.method==='GET'){
  try{const r=await fetcher(base+'/api/tags',{signal:AbortSignal.timeout(2500)});if(!r.ok)throw new Error();const d=await r.json();const configured=(d.models||[]).some(m=>m.name===model);return json({provider:'local',configured,model,paidAPI:false,message:configured?'Local AI ready':`Download ${model} in Ollama first.`});}catch{return json({provider:'local',configured:false,model,paidAPI:false,message:'Start Ollama locally to enable the interviewer.'});}
 }
 if(!['/api/chat','/api/review','/api/session'].includes(url.pathname))return json({error:'Not found.'},404);
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(request.headers.get('origin')!==url.origin)return json({error:'Same-origin request required.'},403);
 if(url.pathname==='/api/session')return json({error:'The free version uses local AI and browser speech. Paid voice sessions are disabled.'},410);
 try{
  const raw=await request.text();if(raw.length>400000)return json({error:'Request is too large.'},413);const body=JSON.parse(raw);const c=validateContext({...body,voice:'marin'});const reviewing=url.pathname==='/api/review';
  if(reviewing&&!c.history.some(t=>t.role==='user'&&t.text.trim()))return json({error:'There are no candidate answers to review yet.'},400);
  if(body.code!==undefined&&(typeof body.code!=='string'||body.code.length>30000))return json({error:'Code must be text of at most 30,000 characters.'},400);
  const context=interviewInstructions({...c,history:[]})+'\nYou are ONLY the interviewer. Never claim that you built features or worked on the candidate’s projects. Do not invent a project for the candidate. Give only the next spoken reply, without stage directions or Markdown. Ask one question, never a list. Do not write an answer for the candidate. /no_think';
  const messages=reviewing?[{role:'system',content:reviewInstructions+' /no_think'},{role:'user',content:JSON.stringify({...c,code:body.code||''})}]:[{role:'system',content:context},...c.history.map(t=>({role:t.role,content:t.text}))];
  // A bounded greeting avoids inventing interviewer or candidate experience. All subsequent replies are generated from the actual conversation.
  if(!reviewing&&!c.history.length)return json({reply:'Hi, I’m Samantha, your interview mentor. Could you walk me through a recent iOS feature you owned and the main technical challenge you faced?',provider:'local'});
  const r=await fetcher(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:false,think:false,keep_alive:'15m',options:{temperature:.5,num_predict:reviewing?1800:250,num_ctx:4096,num_gpu:0}}),signal:AbortSignal.timeout(reviewing?240000:120000)});
  if(!r.ok)return json({error:r.status===404?`The local model ${model} is not installed.`:'The local model could not complete this request. Your transcript is kept.'},502);
  const d=await r.json();const text=d.message?.content?.trim();if(!text)return json({error:'The local model returned no answer. Try again.'},502);const questionEnd=text.indexOf('?');const teaching=/teach|explain|hint/i.test(c.history.at(-1)?.text||'');const reply=c.mode==='interview'&&!teaching&&questionEnd>=0?text.slice(0,questionEnd+1):text;return json(reviewing?{review:text,provider:'local'}:{reply,provider:'local'});
 }catch(e){return json({error:e.name==='TimeoutError'?'The local model timed out. Try a smaller model or a shorter session context.':e instanceof SyntaxError?'Invalid JSON request.':e.message?.includes('must be')||e.message?.startsWith('Invalid')||e.message?.startsWith('Choose')?e.message:'Could not reach Ollama. Start the local model service and retry.'},400);}
}
