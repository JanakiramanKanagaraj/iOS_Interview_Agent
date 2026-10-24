import {activeLearningNotes} from '../web/learning-state.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {updateSpeechSegments,normalizeAnswer} from '../web/speech-turn.mjs';
import {sessionOutline} from '../web/session-plan.mjs';
import {remainingSeconds} from '../web/session-state.mjs';
function room(){
 const nodes=new Map(),timers=new Map();let id=0;
 const element=()=>({value:'',textContent:'',classList:{add(){},remove(){}},style:{setProperty(){}},replaceChildren(){},append(){},scrollIntoView(){},files:[]});
 const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};get('minutes').value='15';get('turnMode').value='manual';
 class Recognition{start(){}abort(){}}
 const ctx=vm.createContext({document:{getElementById:get,createElement:element,querySelector:element},window:{SpeechRecognition:Recognition,addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},setTimeout(fn,delay){timers.set(++id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},setInterval(){return ++id;},clearInterval(){},Date,JSON,Number,String,Array,Boolean,updateSpeechSegments,normalizeAnswer,remainingSeconds,sessionOutline,activeLearningNotes,fetch:async()=>({json:async()=>({provider:'local',configured:true,model:'test'})})});
 const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,ctx);
 vm.runInContext("state='live';busy=false;muted=false;let submitted=[];submit=text=>submitted.push(text);listen();",ctx);
 const result=text=>Object.assign([{transcript:text}],{isFinal:true});
 return {ctx,get,timers,emit(text){ctx.event={resultIndex:0,results:[result(text)]};vm.runInContext('recognition.onresult(event)',ctx);}};
}
test('manual listening preserves a full answer across recognition restarts and thinking pauses',()=>{
 const r=room();r.emit('I use an actor');assert.equal(r.timers.size,0);
 vm.runInContext('recognition.onend();listen();',r.ctx);r.emit('to isolate mutable state');
 assert.equal(r.get('partial').textContent,'I use an actor to isolate mutable state');
 assert.equal(vm.runInContext('submitted.length',r.ctx),0);
 vm.runInContext('flushVoice()',r.ctx);assert.equal(vm.runInContext('submitted[0]',r.ctx),'I use an actor to isolate mutable state');
});
test('automatic mode waits eight seconds and keeps its deadline across browser restarts',()=>{
 const r=room();r.get('turnMode').value='automatic';r.emit('My answer');assert.ok([...r.timers.values()].some(t=>t.delay===8000));
 vm.runInContext('recognition.onend();listen();',r.ctx);assert.ok([...r.timers.values()].some(t=>t.delay>700&&t.delay<=8000));
 assert.equal(vm.runInContext('submitted.length',r.ctx),0);
});
