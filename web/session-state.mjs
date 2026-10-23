export function applyTranscript(turns,event){
 const user=event.type==='conversation.item.input_audio_transcription.completed';
 const assistant=event.type==='response.output_audio_transcript.done';
 if(!user&&!assistant)return turns;
 if(typeof event.transcript!=='string'||!event.transcript.trim())return turns;
 const id=event.item_id||event.response_id;
 if(id&&turns.some(t=>t.id===id))return turns;
 return [...turns,{id:id||crypto.randomUUID(),role:user?'user':'assistant',text:event.transcript,at:new Date().toISOString()}];
}
export function remainingSeconds(remaining,deadline,state,now=Date.now()){
 return state==='live'?Math.max(0,Math.ceil((deadline-now)/1000)):remaining;
}
