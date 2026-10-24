import test from 'node:test';
import assert from 'node:assert/strict';
import {dialogueIntent,conversationStyle,reviewContext,teachingReference} from '../server/dialogue.mjs';
import {nextStep,turnMessages} from '../server/interview-flow.mjs';
import {validateContext} from '../server/interviewer.mjs';
import {handleLocal} from '../server/local.mjs';
const ctx=history=>validateContext({minutes:30,jd:'SwiftUI and Swift concurrency',history});
test('feedback, rapid-fire and uncertainty are conversation controls',()=>{
 assert.equal(dialogueIntent('Can I get feedback on my mistakes?'),'feedback');
 assert.equal(dialogueIntent('I cannot remember that old project'),'help');
 assert.equal(dialogueIntent('Let us go for SwiftUI rapid fire questions'),'rapid-fire');
 assert.equal(dialogueIntent('The error feedback is stored in a label'),'answer');assert.equal(dialogueIntent('Stop rapid fire'),'normal');
});
test('rapid fire persists while answers remain actual candidate evidence',()=>{
 const history=[{role:'user',text:'Let us go for SwiftUI rapid fire questions'},{role:'assistant',text:'Who owns the model?',topic:'swiftui'},{role:'user',text:'The parent.'}];
 assert.equal(conversationStyle(history),'rapid-fire');assert.equal(nextStep(ctx(history)).answerCount,1);assert.match(turnMessages(ctx(history),nextStep(ctx(history)))[0].content,/ONE short precise question/);
 assert.equal(nextStep(ctx(history.slice(0,1))).topic.id,'swiftui');
 history.push({role:'user',text:'Let us do a deep dive now'});assert.equal(conversationStyle(history),'conversational');
});
test('uncertainty keeps the concept and supplies relevant teaching facts',()=>{
 const c=ctx([{role:'assistant',text:'Would you use StateObject or ObservedObject for a model you own?',topic:'swiftui'},{role:'user',text:'I am not sure'}]);const step=nextStep(c);
 assert.equal(step.phase,'teach');assert.equal(step.topic.id,'swiftui');assert.match(step.teaching,/not.*faster|Neither.*faster/);assert.match(turnMessages(c,step)[0].content,/simpler retry/);
 assert.match(teachingReference('Does body evaluation trigger onAppear?'),/does not necessarily/);
});
test('requesting feedback in chat reviews the answers, not the request itself',async()=>{
 let content;const req=new Request('http://127.0.0.1:8769/api/chat',{method:'POST',headers:{Origin:'http://127.0.0.1:8769'},body:JSON.stringify({history:[{role:'assistant',text:'What owns this model?'},{role:'user',text:'The parent owns it.'},{role:'user',text:'Can I get feedback on my mistakes?'}]})});
 const res=await handleLocal(req,{},async(_u,o)=>{content=JSON.parse(o.body);return new Response(JSON.stringify({message:{content:'Focus on explaining model ownership clearly.\n\n## Corrections\nOnly observed answers are assessed.'}}));});
 const d=await res.json();assert.equal(d.interview.phase,'feedback');assert.equal(d.reviewScope.totalAnswers,1);assert.equal(d.reply,'Focus on explaining model ownership clearly.');const evidence=JSON.parse(content.messages[1].content);assert.equal(evidence.answers.length,1);assert.equal(evidence.answers[0].answer,'The parent owns it.');
});
test('long feedback context is bounded and explicitly reports partial coverage',()=>{
 const history=Array.from({length:80},(_,i)=>({role:i%2?'user':'assistant',text:(i%2?'My actual implementation uses isolated state. ':'Explain isolated state? ').repeat(50)}));
 const evidence=reviewContext(ctx(history),'x'.repeat(30000));assert.ok(JSON.stringify(evidence).length<13000);assert.ok(evidence.reviewedAnswerCount<evidence.totalAnswerCount);assert.match(evidence.scopeNote,/subset/);assert.equal(evidence.codeTruncated,true);
});

test('session depth follows the selected duration and does not overload the trial',async()=>{
 const {sessionOutline}=await import('../web/session-plan.mjs');
 assert.deepEqual(sessionOutline(15).map(s=>s.id),['introduction','project','fundamentals']);
 assert.ok(sessionOutline(30).some(s=>s.id==='coding'));
 assert.ok(sessionOutline(45).some(s=>s.id==='coding2'));
 assert.ok(sessionOutline(60).some(s=>s.id==='rapid'));
 for(const id of ['coding','dsa','design'])assert.ok(sessionOutline(90).some(s=>s.id===id));
});
test('a configurable target role keeps generated prompts and fallback language relevant',()=>{
 const c=validateContext({minutes:30,technology:'Android / Kotlin',jd:'Kotlin concurrency and Compose UI',history:[{role:'assistant',text:'What is your approach to concurrency?',topic:'concurrency'},{role:'user',text:'I use coroutines.'}]});
 const step=nextStep(c);assert.equal(step.role,'Android / Kotlin');assert.doesNotMatch(step.topic.questions.join(' '),/Swift|UIKit|\biOS\b/);assert.match(turnMessages(c,step)[0].content,/Android \/ Kotlin/);
});

test('teaching retries check the explained concept rather than jumping to a harder topic',()=>{
 const c=ctx([{role:'assistant',text:'Would this model use StateObject or ObservedObject?',topic:'swiftui'},{role:'user',text:'I am not sure'}]);const step=nextStep(c);assert.match(step.teachingQuestion,/child/);
});
test('previous feedback is bounded practice context, not new answer evidence',()=>{
 const c=validateContext({minutes:30,previousReview:'Practise model ownership.',history:[{role:'assistant',text:'Who owns this model?',topic:'swiftui'},{role:'user',text:'The parent.'}]});const step=nextStep(c);assert.match(turnMessages(c,step)[0].content,/Practise model ownership/);assert.match(turnMessages(c,step)[0].content,/not evidence of current ability/);assert.equal(reviewContext(c).totalAnswerCount,1);
});

test('a known invalid Swift review is replaced with limited evidence-based feedback',async()=>{
 const {reviewIssue,referenceReview,spokenReview}=await import('../server/dialogue.mjs');assert.match(reviewIssue('Use @ObservableObject here'),/invalid/);
 const text=referenceReview({answers:[{question:'Which wrapper creates and owns this ObservableObject?',answer:'ObservedObject because updates are faster.'},{question:'What differs between struct and class?',answer:'Struct is value and class is reference.'}],reviewedAnswerCount:2,totalAnswerCount:2,code:''});
 assert.match(text,/@StateObject/);assert.doesNotMatch(text,/@ObservableObject/);assert.match(text,/correctly distinguished/);assert.match(text,/limited/);assert.match(text,/Not assessed/);
 assert.equal(spokenReview('**Spoken Summary (60 words or less):**\nYour main gap is ownership.\n\n## Detail'),'Your main gap is ownership.');
});

test('the chat review endpoint exposes a checked fallback when the model invents a wrapper',async()=>{
 const req=new Request('http://127.0.0.1:8769/api/chat',{method:'POST',headers:{Origin:'http://127.0.0.1:8769'},body:JSON.stringify({history:[{role:'assistant',text:'Which wrapper owns this ObservableObject?'},{role:'user',text:'ObservedObject because it is faster.'},{role:'user',text:'Please give feedback.'}]})});
 const res=await handleLocal(req,{},async()=>new Response(JSON.stringify({message:{content:'Use @ObservableObject to own the model.'}})));const d=await res.json();assert.equal(d.reviewSource,'reference-fallback');assert.match(d.review,/@StateObject/);assert.doesNotMatch(d.review,/@ObservableObject/);assert.equal(d.reviewScope.totalAnswers,1);
});
