import {handleLocal} from './local.mjs';
import {validateContext,sessionConfig,reviewInstructions} from './interviewer.mjs';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleAPI(request,env,fetcher=fetch) {
 if(env.INTERVIEW_PROVIDER!=='openai')return handleLocal(request,env,fetcher);
 const path=new URL(request.url).pathname;
 if(path==='/api/health'&&request.method==='GET')return json({configured:Boolean(env.OPENAI_API_KEY),mode:'realtime',realtimeModel:env.OPENAI_REALTIME_MODEL||'gpt-realtime-2.1'});
 if(!['/api/session','/api/review'].includes(path))return json({error:'Not found.'},404);
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Same-origin request required.'},403);
 if(!env.OPENAI_API_KEY)return json({error:'Add OPENAI_API_KEY to your private configuration file, save it, and try again. Never enter the key in the chat or website.'},503);
 try {
  const raw=await request.text();if(raw.length>400000)return json({error:'Request is too large.'},413);
  const body=JSON.parse(raw);const context=validateContext(body);
  const headers={Authorization:`Bearer ${env.OPENAI_API_KEY}`};let upstream;
  if(path==='/api/session'){
   if(typeof body.sdp!=='string'||!body.sdp.startsWith('v=0')||body.sdp.length>64000)return json({error:'Invalid voice connection offer.'},400);
   const form=new FormData();form.set('sdp',body.sdp);form.set('session',JSON.stringify(sessionConfig(context,env.OPENAI_REALTIME_MODEL||'gpt-realtime-2.1')));
   upstream=await fetcher('https://api.openai.com/v1/realtime/calls',{method:'POST',headers,body:form,signal:AbortSignal.timeout(30000)});
   if(upstream.ok)return new Response(await upstream.text(),{headers:{'Content-Type':'application/sdp','Cache-Control':'no-store'}});
  } else {
   if(typeof body.code!=='string'||body.code.length>30000)return json({error:'Code must be text of at most 30,000 characters.'},400);
   if(!context.history.some(t=>t.role==='user'&&t.text.trim()))return json({error:'There are no candidate answers to review yet.'},400);
   upstream=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_REVIEW_MODEL||'gpt-4.1',store:false,instructions:reviewInstructions,input:JSON.stringify({...context,code:body.code}),max_output_tokens:3500}),signal:AbortSignal.timeout(90000)});
   if(upstream.ok){const data=await upstream.json();const text=(data.output||[]).flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');if(!text)return json({error:'The provider returned no review. Your transcript is still saved; try again.'},502);return json({review:text});}
  }
  // Inspect only known error codes; never forward provider bodies or request data.
  let quota=false;try{const details=await upstream.json();quota=details.error?.code==='insufficient_quota';}catch{}
  return json({error:upstream.status===401?'The API key was not accepted. Check your private configuration.':upstream.status===429?(quota?'Your API project has insufficient quota. Add API credits or resolve its billing limit, then reconnect.':'The API rate limit was reached. Wait briefly and check your project limits before retrying.'):upstream.status===403?'Your API project does not have access to this model.':`The AI service could not complete the request (HTTP ${upstream.status}). Your transcript is kept.`},upstream.status===429?429:502);
 }catch(e){return json({error:e instanceof SyntaxError?'Invalid JSON request.':e.name==='TimeoutError'?'The AI service timed out. Retry when ready.':e.message?.startsWith('Invalid')||e.message?.includes('must be')||e.message?.startsWith('Choose')||e.message==='Unsupported voice.'?e.message:'Could not reach the AI service. Check the connection and try again.'},400);}
}
