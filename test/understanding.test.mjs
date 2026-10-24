import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConversation,parseDecision,checkedMemory,decisionMessages} from '../server/understanding.mjs';
import {validateContext} from '../server/interviewer.mjs';
import {handleLocal} from '../server/local.mjs';
const context=(answer='The parent owns it.')=>validateContext({minutes:30,jd:'SwiftUI concurrency',history:[{role:'assistant',text:'Who owns the existing model passed into the child?',topic:'swiftui'},{role:'user',text:answer}]});
const decision=(c,overrides={})=>({action:'probe',targetTopic:'swiftui',status:'partial',evidenceQuote:c.history.at(-1).text,concept:'ownership',gap:'Explain observation in the child.',reply:'Which wrapper would the child use to observe that existing model?',...overrides});
test('tracked topics stay active regardless of answer length until an explicit semantic decision',()=>{
 const c=context('It is owned by the parent because the parent creates it. '.repeat(10));const step=prepareConversation(c);assert.equal(step.topic.id,'swiftui');assert.equal(step.phase,'follow-up');
 const d=parseDecision(JSON.stringify(decision(c,{status:'sufficient',evidenceQuote:'owned by the parent',action:'advance',targetTopic:step.nextTopic.id,reply:'Implement a function that removes duplicate identifiers while preserving order. Which data structure would you use?'})),c,step);
 assert.equal(d.action,'advance');assert.equal(d.step.topic.id,step.nextTopic.id);assert.equal(d.memory.entries[0].verified,false);
});
test('a short correct answer can advance without meeting a word-count threshold',()=>{
 const c=context('ObservedObject.'),step=prepareConversation(c);const d=decision(c,{status:'sufficient',action:'advance',targetTopic:step.nextTopic.id,reply:'Implement ordered deduplication of identifiers. How would you approach this coding exercise?'});
 assert.equal(parseDecision(JSON.stringify(d),c,step).action,'advance');
});
test('an invented answer quote cannot become a learning note',()=>{
 const c=context(),step=prepareConversation(c);assert.throws(()=>parseDecision(JSON.stringify(decision(c,{evidenceQuote:'I implemented a cache.'})),c,step),/exact answer evidence/);
});
test('uncertainty cannot be silently treated as readiness for the next topic',()=>{
 const c=context(),step=prepareConversation(c);assert.throws(()=>parseDecision(JSON.stringify(decision(c,{status:'unclear',action:'advance',targetTopic:step.nextTopic.id})),c,step),/resolve uncertainty/);
});
test('memory is revalidated against the actual transcript and bounded',()=>{
 const c=context(),step=prepareConversation(c);const good=parseDecision(JSON.stringify(decision(c)),c,step).memory.entries[0];
 const memory=checkedMemory({version:1,entries:[good,{...good,evidenceQuote:'An invented statement'}]},c.history);assert.equal(memory.entries.length,1);assert.equal(memory.entries[0].verified,false);
 const next=prepareConversation({...c,learningMemory:memory});assert.match(JSON.stringify(decisionMessages(c,next)),/Explain observation in the child/);
});
test('a retry after teaching is marked assisted, never verified mastery',()=>{
 const c=context('ObservedObject.');c.history[0].phase='teach';const parsed=parseDecision(JSON.stringify(decision(c)),c,prepareConversation(c));assert.equal(parsed.memory.entries[0].assisted,true);assert.equal(parsed.memory.entries[0].verified,false);
});
test('invalid structured decisions are retried and fallback cannot save fabricated learning notes',async()=>{
 const c=context();let calls=0;const req=new Request('http://127.0.0.1:8769/api/chat',{method:'POST',headers:{Origin:'http://127.0.0.1:8769'},body:JSON.stringify(c)});
 const res=await handleLocal(req,{},async(_url,o)=>{calls++;assert.equal(JSON.parse(o.body).format.type,'object');return new Response(JSON.stringify({message:{content:JSON.stringify(decision(c,{evidenceQuote:'fabricated'}))}}));});
 const d=await res.json();assert.equal(calls,2);assert.equal(d.interview.source,'guided-fallback');assert.equal(d.learningMemory.entries.length,0);
});

test('formatting differences resolve to a real source span but altered claims do not',async()=>{
 const {locateEvidence}=await import('../server/understanding.mjs');assert.equal(locateEvidence('@ObservedObject','I use observed object.'),'observed object');assert.equal(locateEvidence('I never cancel','I cancel the task.'),null);
});
test('newer tentative observations supersede old notes without treating assisted retries as mastery',async()=>{
 const {activeLearningNotes}=await import('../web/learning-state.mjs');const entry={topic:'swiftui',concept:'ownership',status:'partial',gap:'Explain ownership'};
 assert.equal(activeLearningNotes([entry,{...entry,status:'sufficient',assisted:false}]).length,0);assert.equal(activeLearningNotes([entry,{...entry,status:'sufficient',assisted:true}]).length,1);
});

test('the structured planner bounds its context and discloses shortened answers',()=>{
 const c=context('A long answer about state. '.repeat(200));c.resume='SwiftUI state. '.repeat(700);c.jd='SwiftUI concurrency. '.repeat(700);c.profile='background '.repeat(1000);const step=prepareConversation(c);const messages=decisionMessages(c,step);assert.ok(JSON.stringify(messages).length<11500);assert.equal(JSON.parse(messages[1].content).answerTruncated,true);
});

test('schema-constrained quotes are selected from actual answer spans, not invented by the model',async()=>{
 const {schemaForStep}=await import('../server/understanding.mjs');const step=prepareConversation(context('ObservedObject because updates are faster.'));const schema=schemaForStep(step);assert.ok(schema.properties.evidenceQuote.enum.includes('ObservedObject because updates are faster.'));assert.ok(!schema.properties.evidenceQuote.enum.includes('I implemented a cache.'));
});
test('asking for help records a practice need without grading it as an incorrect answer',()=>{
 const c=context('I am not sure. Please teach me.');const step=prepareConversation(c);assert.equal(step.memory.entries[0].status,'not_assessed');assert.equal(step.memory.entries[0].assisted,true);assert.equal(step.memory.entries[0].verified,false);
});

test('a sufficient answer can select a planned next topic even when the action label says probe',()=>{
 const c=context('ObservedObject.'),step=prepareConversation(c);const d=decision(c,{action:'probe',status:'sufficient',targetTopic:step.nextTopic.id,reply:'Implement a function that removes duplicate identifiers. How would you approach this coding exercise?'});assert.equal(parseDecision(JSON.stringify(d),c,step).action,'advance');
});
test('a fallback follows the answered ownership scenario instead of asking ownership again',async()=>{
 const {guidedFallback}=await import('../server/understanding.mjs');const c=context('ObservedObject.');assert.match(guidedFallback(prepareConversation(c),c),/binding to one value/);
});

test('short correct wrapper choices receive a deeper reference follow-up, not an invented correction',async()=>{
 const {referenceProbe}=await import('../server/understanding.mjs');const c=context('ObservedObject.');c.history[0].text='A parent owns an ObservableObject and passes it into a child. Which wrapper does the child use?';const result=referenceProbe(c,prepareConversation(c));assert.match(result.reply,/binding to one value/);assert.equal(result.memory.entries[0].verified,false);
});

test('cancelling a turn aborts the local model request rather than starting retries',async()=>{
 const controller=new AbortController();const c=context();let calls=0;const req=new Request('http://127.0.0.1:8769/api/chat',{signal:controller.signal,method:'POST',headers:{Origin:'http://127.0.0.1:8769'},body:JSON.stringify(c)});
 const pending=handleLocal(req,{},async(_u,o)=>{calls++;return new Promise((_resolve,reject)=>o.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));});await new Promise(r=>setTimeout(r,0));controller.abort();await pending;assert.equal(calls,1);
});
