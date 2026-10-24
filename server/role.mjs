export function targetRole(c){return c.technology?.trim()||(/android|kotlin/i.test(c.jd)&&!/\bios\b|swift/i.test(c.jd)?'Android / Kotlin':/react|frontend|front.end/i.test(c.jd)&&!/\bios\b|swift/i.test(c.jd)?'Web frontend':'iOS / Swift');}
export function adaptTopic(topic,role){
 if(/\bios\b|swift|tvos/i.test(role))return topic;
 const neutral=text=>text.replace(/SwiftUI/g,'the UI framework for this role').replace(/UIKit/g,'the platform UI framework').replace(/\biOS\b/g,'application').replace(/\bSwift\b/g,'your chosen language').replace(/AVPlayer/g,'the platform media player');
 return {...topic,label:neutral(topic.label),questions:topic.questions.map(neutral)};
}
