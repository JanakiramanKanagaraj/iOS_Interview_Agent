// Conversational controls are not evidence of a candidate's technical ability.
export function dialogueIntent(text=''){
 const t=text.toLowerCase().trim();
 if(/\b(?:review|assess|evaluate) (?:my|the|our) (?:answers|performance|interview|session)\b/.test(t))return 'feedback';
 if(/^(?:feedback|review)(?: please| now)?[.!?]*$/.test(t)||/\b(?:(?:get|give|share|provide|want|need|like|see|hear|have)\b.{0,35}\bfeedback|my mistakes|mistakes (?:i|have)|how did i (?:do|perform)|what (?:should|can|do) i (?:improve|correct))\b/.test(t))return 'feedback';
 if(/\b(?:deep dive|in depth|normal interview|stop rapid[ -]?fire)\b/.test(t))return 'normal';
 if(/\b(?:rapid[ -]?fire|quick[ -]?fire)\b/.test(t))return 'rapid-fire';

 if(/\b(?:not sure|don'?t know|do not know|cannot remember|can'?t remember|couldn'?t (?:remember|recall)|teach me|explain (?:this|that))\b/.test(t))return 'help';
 if(/(?:let'?s|can we|switch|move|go for|ask me|questions? (?:on|about))/.test(t)&&/swiftui|uikit|concurrency|network|unit test|playback|system design|\bdsa\b/.test(t))return 'topic';
 return 'answer';
}
export function conversationStyle(history){
 const last=history.filter(t=>t.role==='user'&&['rapid-fire','normal'].includes(dialogueIntent(t.text))).at(-1);
 return last&&dialogueIntent(last.text)==='rapid-fire'?'rapid-fire':'conversational';
}
export function requestedTopic(text){
 const t=text.toLowerCase();
 return /swiftui|uikit/.test(t)?'swiftui':/concurrency|actors?/.test(t)?'concurrency':/unit test|testing/.test(t)?'testing':/playback|avplayer/.test(t)?'streaming':/network|rest api/.test(t)?'networking':/system design/.test(t)?'design':/\bdsa\b|algorithm/.test(t)?'dsa':null;
}
// Bounded, curated teaching references. These are facts, never an assessment of
// whether the user demonstrated them. They supplement the small local model.
export function teachingReference(question){
 if(/state\s*object|observed\s*object|model.*own|owns.*model/i.test(question))return 'For an ObservableObject: a view that creates and owns the model uses @StateObject; its instance persists for that view identity. A child receiving that existing model uses @ObservedObject. Neither wrapper makes published updates faster. @Binding provides read/write access to a particular value owned elsewhere. These rules do not describe the newer @Observable model pattern.';
 if(/on\s*appear|body.*evaluat|view.*lifecycle/i.test(question))return 'SwiftUI body describes view content and may be evaluated repeatedly. Another body evaluation does not necessarily invoke onAppear. onAppear is an appearance callback, may happen more than once and is not an app-launch-only event. Avoid claiming a universal callback sequence across all view structures.';
 if(/\b20[034]\b|status code|no (?:response )?body|no content/i.test(question))return 'HTTP 204 means successful completion with no response content. Do not attempt to decode JSON from that empty body. 203 is Non-Authoritative Information, not the status specifically defined as No Content. Business behavior depends on the API contract; empty successful content alone is not a failure.';
 return '';
}
export const substantiveAnswer=text=>dialogueIntent(text)==='answer'&&!/^(?:please )?(?:repeat|say that again|hint|give me .*hint|move on|next (?:question|topic))|already (?:answered|covered)/i.test(text.trim());
export function answeredPairs(history){
 return history.flatMap((t,i)=>t.role==='user'&&substantiveAnswer(t.text)?[{question:history.slice(0,i).filter(p=>p.role==='assistant').at(-1)?.text||'',answer:t.text}]:[]);
}
export function reviewContext(c,code=''){
 // Preserve references separately and bound the prompt, rather than silently
 // letting the model truncate a long session. Report the subset reviewed.
 const pairs=answeredPairs(c.history),selected=[];let size=0;
 for(const pair of [...pairs].reverse()){
  const item={question:pair.question.slice(0,500),answer:pair.answer.slice(0,1000),answerTruncated:pair.answer.length>1000};
  const n=JSON.stringify(item).length;if(size+n>4500)break;selected.unshift(item);size+=n;
 }
 return {technology:c.technology,mode:c.mode,minutes:c.minutes,profile:c.profile.slice(0,300),resume:c.resume.slice(0,600),jd:c.jd.slice(0,600),answers:selected,reviewedAnswerCount:selected.length,totalAnswerCount:pairs.length,code:code.slice(0,2000),codeTruncated:code.length>2000,scopeNote:selected.length<pairs.length?'Only the most recent bounded answer subset is included; do not assess omitted answers.':'All substantive answer entries are included; answerTruncated flags any shortened answers. Do not assess omitted portions.'};
}

export function teachingRetry(question){
 if(/state\s*object|observed\s*object|model.*own|owns.*model/i.test(question))return /child|passed|receiv/i.test(question)?'Which wrapper would the parent use when it creates and owns the model?':'Which wrapper would a child use for a model already owned by its parent?';
 if(/on\s*appear|body.*evaluat|view.*lifecycle/i.test(question))return 'Can body be evaluated again without onAppear running again?';
 if(/\b20[034]\b|status code|no (?:response )?body|no content/i.test(question))return 'Would you try to decode JSON from an empty 204 response?';
 return '';
}

export function reviewIssue(text){
 if(/@ObservableObject\b/.test(text))return 'invalid ObservableObject property-wrapper name';
 if(/once per view instance/i.test(text))return 'confuses view values with view identity';
 if(/(?:score|rating)\s*[:=]?\s*\d+\s*(?:\/\s*10|%)/i.test(text))return 'unsupported numerical assessment';
 return '';
}
export function referenceReview(evidence){
 const strengths=[],corrections=[],tasks=[];
 for(const {question,answer} of evidence.answers){
  const q=question.toLowerCase(),a=answer.toLowerCase();
  if(/struct/.test(a)&&/value/.test(a)&&/class/.test(a)&&/reference/.test(a)&&! /\bnot\b|isn.t/.test(a))strengths.push('You correctly distinguished structs as value types and classes as reference types.');
  if(/state\s*object|observed\s*object|observableobject/i.test(q)&&(/observed\s*object/i.test(a)&&/creat|own/i.test(q)&&!/child|receiv|passed/i.test(q)||/fast|instant|quick/i.test(a))){
   corrections.push('Model ownership: update speed does not determine which wrapper to choose. For an ObservableObject, a view that creates and owns it uses @StateObject; a child receiving that existing instance uses @ObservedObject. StateObject preserves the instance for the same view identity. Neither wrapper makes updates faster.');tasks.push('Explain a parent-owned ObservableObject and the wrapper used by its child view.');
  }
  if(/no (?:response )?body|no content|status code/.test(q)&&/\b203\b/.test(a)){
   corrections.push('HTTP status: your answer gave 203. The status specifically defined as successful completion with no response content is 204. Do not decode JSON from its empty body. Confirm the number if speech recognition may have misheard it.');tasks.push('Explain and test how a network client handles an empty successful 204 response.');
  }
  if(/body|onappear/.test(q)&&/which.*first/.test(q)&&/on\s*appear/.test(a)){
   corrections.push('SwiftUI lifecycle: body describes view content; onAppear is an appearance callback. Another body evaluation does not necessarily trigger onAppear. Both can run more than once; avoid relying on a universal callback order.');tasks.push('Explain one case where body is reevaluated without another appearance event.');
  }
 }
 return ['This review uses a limited set of checked concept references because the generated review failed a quality check.',`Review scope: ${evidence.reviewedAnswerCount} of ${evidence.totalAnswerCount} substantive answers. Shortened portions and unassessed topics are not graded.`, '## Observed strengths',...[...new Set(strengths)].map(t=>'- '+t),...(!strengths.length?['No additional strengths were verified by this limited fallback.']:[]),'## Corrections',...[...new Set(corrections)].map(t=>'- '+t),...(!corrections.length?['No further correction could be verified by this fallback. This does not establish that every answer was correct.']:[]),'## Next practice',...[...new Set(tasks)].slice(0,3).map(t=>'- '+t),...(!tasks.length?['- Revisit one answer and explain the decision, an alternative and how you would test it.']:[]),...(evidence.code?['Submitted code was not assessed by this fallback and was not executed.']:[]),'## Not assessed','Topics without substantive answers, and any omitted answer portions, remain unassessed.'].join('\n\n');
}
export function spokenReview(text){
 const clean=text.replace(/^\s*\*{0,2}Spoken Summary[^\n]*\n/i,'').trim();
 const first=clean.split(/\n\s*\n/)[0].replace(/[*#`]/g,'').trim();
 return first&&first.split(/\s+/).length<=70?first:'Your feedback is ready below, with observed strengths, corrections and up to three practice priorities.';
}
