// Web Speech results are cumulative and may re-emit the same final index.
export function updateSpeechSegments(segments,event){
 const next=segments.slice();
 for(let i=event.resultIndex;i<event.results.length;i++)next[i]={text:event.results[i][0].transcript,final:Boolean(event.results[i].isFinal)};
 next.length=event.results.length;
 return {segments:next,final:next.filter(s=>s?.final).map(s=>s.text).join(' '),interim:next.filter(s=>s&&!s.final).map(s=>s.text).join(' ')};
}
export const normalizeAnswer=text=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
