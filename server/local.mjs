import {prepareConversation,schemaForStep,decisionMessages,parseDecision,guidedFallback,referenceProbe} from './understanding.mjs';
import {dialogueIntent,reviewContext,teachingReference,reviewIssue,referenceReview,spokenReview} from './dialogue.mjs';
import {openingQuestion,repeatRequest,plannedQuestion} from './interview-flow.mjs';
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
  const raw=await request.text();if(raw.length>400000)return json({error:'Request is too large.'},413);const body=JSON.parse(raw);const c=validateContext({...body,voice:'marin'});const inlineFeedback=url.pathname==='/api/chat'&&dialogueIntent(c.history.at(-1)?.text)==='feedback';const reviewing=url.pathname==='/api/review'||inlineFeedback;const evidence=reviewing?reviewContext(c,typeof body.code==='string'?body.code:''):null;
  if(reviewing&&!evidence.totalAnswerCount)return json({error:'There are no candidate answers to review yet.'},400);
  if(body.code!==undefined&&(typeof body.code!=='string'||body.code.length>30000))return json({error:'Code must be text of at most 30,000 characters.'},400);
  if(!reviewing){
   const step=prepareConversation(c);let learningMemory=step.memory;step.followupFocus=plannedQuestion(c,step);const meta={topic:step.topic.id,label:step.topic.label,phase:step.phase,style:step.style,answerCount:step.answerCount,askedCount:step.asked.length};
   const done=(reply,extra={})=>{const diagnostics={...meta,...extra};console.info(JSON.stringify({event:'interview_turn',...diagnostics}));return json({reply,provider:'local',interview:diagnostics,learningMemory});};
   if(!c.history.length)return done(openingQuestion(c,step),{source:'opening'});
   if(repeatRequest(c.history.at(-1)?.text||'')&&step.lastQuestion)return done(step.lastQuestion,{source:'requested-repeat'});
   const reference=referenceProbe(c,step);if(reference){learningMemory=reference.memory;return done(reference.reply,{source:'reference-probe',action:'probe',assessment:'sufficient'});}
   if(step.phase==='teach'&&step.teaching&&step.teachingQuestion){const lesson=step.teaching.split(/(?<=[.!?])\s+/).slice(0,3).join(' ');return done(lesson+' '+step.teachingQuestion,{source:'reference-teaching',action:'teach',assessment:'not_assessed'});}

   let rejected='';
   for(let attempt=0;attempt<2;attempt++){
    const messages=decisionMessages(c,step,rejected);
    const r=await fetcher(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,format:schemaForStep(step),stream:false,think:false,keep_alive:'15m',options:{temperature:.35+attempt*.15,num_predict:700,num_ctx:4096,num_gpu:0}}),signal:AbortSignal.any([request.signal,AbortSignal.timeout(120000)])});
    if(!r.ok)return json({error:r.status===404?`The local model ${model} is not installed.`:'The local model could not complete this request. Your transcript is kept.'},502);
    const d=await r.json();let text=d.message?.content?.trim()||'';
    try{
     const decision=parseDecision(text,c,step);text=decision.reply;
     learningMemory=decision.memory;Object.assign(meta,{topic:decision.step.topic.id,label:decision.step.topic.label,phase:decision.step.phase,action:decision.action,assessment:decision.status});
     return done(text,{source:'generated',attempts:attempt+1,promptCharacters:JSON.stringify(messages).length});
    }catch(e){rejected=e.message;}
    console.info(JSON.stringify({event:'question_rejected',...meta,reason:rejected,attempt:attempt+1}));
   }
   return done((step.phase==='teach'&&step.teaching?step.teaching+' ':'')+(guidedFallback(step,c)||plannedQuestion(c,step)),{source:'guided-fallback',reason:rejected});
  }
  const r=await fetcher(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'system',content:reviewInstructions+' Speak directly to the user as you. Do not include a Spoken Summary heading. Do not include a code block unless submitted code needs discussion; prefer a short conceptual example. Begin with a plain-language spoken summary of at most 60 words, then detailed Markdown feedback. Explicitly state the reviewed subset when context is partial. Do not claim to assess omitted answers. Use the following concept references only when relevant, not as evidence that the user made a mistake: '+evidence.answers.map(p=>teachingReference(p.question)).filter(Boolean).join(' ')+' /no_think'},{role:'user',content:JSON.stringify(evidence)}],stream:false,think:false,keep_alive:'15m',options:{temperature:.35,num_predict:1800,num_ctx:4096,num_gpu:0}}),signal:AbortSignal.any([request.signal,AbortSignal.timeout(240000)])});
  if(!r.ok)return json({error:'The local model could not complete the review. Your transcript is kept.'},502);
  const d=await r.json();let text=d.message?.content?.trim();if(!text)return json({error:'The local model returned no review. Try again.'},502);const issue=reviewIssue(text);if(issue)text=referenceReview(evidence);const summary=spokenReview(text);if(!issue)text+='\n\nReview scope: '+evidence.reviewedAnswerCount+' of '+evidence.totalAnswerCount+' substantive answers. '+evidence.scopeNote+(evidence.codeTruncated?' Submitted code was shortened for review.':'');return json({review:text,reply:summary,provider:'local',reviewSource:issue?'reference-fallback':'generated',reviewScope:{reviewedAnswers:evidence.reviewedAnswerCount,totalAnswers:evidence.totalAnswerCount,codeTruncated:evidence.codeTruncated},...(inlineFeedback?{interview:{topic:'feedback',label:'Your interview feedback',phase:'feedback',source:'transcript-review'}}:{})});
 }catch(e){return json({error:e.name==='TimeoutError'?'The local model timed out. Try a smaller model or a shorter session context.':e instanceof SyntaxError?'Invalid JSON request.':e.message?.includes('must be')||e.message?.startsWith('Invalid')||e.message?.startsWith('Choose')?e.message:'Could not reach Ollama. Start the local model service and retry.'},400);}
}
