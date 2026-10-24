import {nextStep,openingQuestion,turnMessages,validateReply,fallbackQuestion,repeatRequest,plannedQuestion,cleanInterviewReply} from './interview-flow.mjs';
import {validateContext,reviewInstructions} from './interviewer.mjs';
const base='http://127.0.0.1:11434';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleLocal(request,env,fetcher=fetch){
 const url=new URL(request.url);const model=env.OLLAMA_MODEL||'qwen3:4b-instruct-2507-q4_K_M';
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
  if(!reviewing){
   const step=nextStep(c);step.followupFocus=plannedQuestion(c,step);const meta={topic:step.topic.id,label:step.topic.label,phase:step.phase,answerCount:step.answerCount,askedCount:step.asked.length};
   const done=(reply,extra={})=>{const diagnostics={...meta,...extra};console.info(JSON.stringify({event:'interview_turn',...diagnostics}));return json({reply,provider:'local',interview:diagnostics});};
   if(!c.history.length)return done(openingQuestion(c,step),{source:'opening'});
   if(repeatRequest(c.history.at(-1)?.text||'')&&step.lastQuestion)return done(step.lastQuestion,{source:'requested-repeat'});

   let rejected='';
   for(let attempt=0;attempt<2;attempt++){
    const messages=turnMessages(c,step,rejected);
    const r=await fetcher(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:false,think:false,keep_alive:'15m',options:{temperature:.35+attempt*.15,num_predict:step.phase==='teach'?500:200,num_ctx:4096,num_gpu:0}}),signal:AbortSignal.timeout(120000)});
    if(!r.ok)return json({error:r.status===404?`The local model ${model} is not installed.`:'The local model could not complete this request. Your transcript is kept.'},502);
    const d=await r.json();let text=d.message?.content?.trim()||'';if(c.mode==='interview'&&step.phase!=='teach')text=cleanInterviewReply(text);
    const questionEnd=text.indexOf('?');if(questionEnd>=0&&step.phase!=='teach')text=text.slice(0,questionEnd+1);
    rejected=validateReply(text,step);
    if(!rejected)return done(text,{source:'generated',attempts:attempt+1,promptCharacters:JSON.stringify(messages).length});
    console.info(JSON.stringify({event:'question_rejected',...meta,reason:rejected,attempt:attempt+1}));
   }
   return done(plannedQuestion(c,step),{source:'guided-fallback',reason:rejected});
  }
  const r=await fetcher(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:reviewInstructions+' /no_think'},{role:'user',content:JSON.stringify({...c,code:body.code||''})}],stream:false,think:false,keep_alive:'15m',options:{temperature:.35,num_predict:1800,num_ctx:4096,num_gpu:0}}),signal:AbortSignal.timeout(240000)});
  if(!r.ok)return json({error:'The local model could not complete the review. Your transcript is kept.'},502);
  const d=await r.json();const text=d.message?.content?.trim();if(!text)return json({error:'The local model returned no review. Try again.'},502);return json({review:text,provider:'local'});
 }catch(e){return json({error:e.name==='TimeoutError'?'The local model timed out. Try a smaller model or a shorter session context.':e instanceof SyntaxError?'Invalid JSON request.':e.message?.includes('must be')||e.message?.startsWith('Invalid')||e.message?.startsWith('Choose')?e.message:'Could not reach Ollama. Start the local model service and retry.'},400);}
}
