import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleResume(request,env,extract=extractResume){
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Same-origin request required.'},403);
 try{
  const form=await request.formData();const file=form.get('resume');
  if(!file||typeof file.arrayBuffer!=='function')return json({error:'Choose a resume file.'},400);
  const ext=file.name.split('.').pop().toLowerCase();if(!['pdf','docx','txt'].includes(ext))return json({error:'Use a PDF, DOCX or UTF-8 TXT resume.'},400);
  if(!file.size||file.size>5*1024*1024)return json({error:'Upload a nonempty file no larger than 5 MB.'},400);
  const result=await extract(Buffer.from(await file.arrayBuffer()),ext,env.PDF_PYTHON||'python3');
  if(result.error)return json({error:result.error},422);
  return json({...result,name:file.name});
 }catch{return json({error:'Could not read this upload. Try another file or paste the text.'},400);}
}
export function extractResume(bytes,ext,python){return new Promise(resolve=>{
 const child=spawn(python,[fileURLToPath(new URL('./extract_resume.py',import.meta.url)),ext],{stdio:['pipe','pipe','ignore']});let output='';let done=false;
 const finish=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v);};
 const timer=setTimeout(()=>{child.kill();finish({error:'Document extraction timed out. Try a simpler file or paste the text.'});},25000);
 child.stdout.on('data',chunk=>{output+=chunk;if(output.length>200000){child.kill();finish({error:'The extracted document is too large.'});}});
 child.on('error',()=>finish({error:'The document parser is unavailable. Paste resume text or configure PDF_PYTHON.'}));child.stdin.on('error',()=>{});
 child.on('close',()=>{try{finish(JSON.parse(output));}catch{finish({error:'Document extraction failed. Use an unencrypted PDF, DOCX or TXT.'});}});child.stdin.end(bytes);
});}
