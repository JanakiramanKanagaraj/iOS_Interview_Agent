// Show the latest tentative interpretation for each concept, not an obsolete
// gap already revisited in a later answer. This does not certify correctness.
export function activeLearningNotes(entries=[]){
 const latest=new Map();for(const e of entries){if(!e||typeof e.concept!=='string')continue;latest.set(e.topic+':'+e.concept.toLowerCase().trim(),e);}
 return [...latest.values()].filter(e=>e.gap&&(e.status!=='sufficient'||e.assisted)).slice(-6);
}
