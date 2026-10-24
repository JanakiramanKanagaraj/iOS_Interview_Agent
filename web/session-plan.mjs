export function sessionOutline(minutes){
 const intro={id:'introduction',label:'Introduction'},project={id:'project',label:'Project ownership'};
 const technical={id:'technical',label:'Role-specific technical discussion'},coding={id:'coding',label:'Coding exercise'},coding2={id:'coding2',label:'Second coding exercise'},rapid={id:'rapid',label:'Rapid-fire and tricky cases'},dsa={id:'dsa',label:'DSA and complexity'},design={id:'design',label:'System design'};
 const sections=minutes===15?[intro,project,{id:'fundamentals',label:'General fundamentals'}]:minutes===30?[intro,project,technical,coding]:minutes===45?[intro,project,technical,coding,coding2]:minutes===60?[intro,project,technical,rapid,dsa,design]:[intro,project,technical,rapid,coding,dsa,design];
 if(minutes===90)sections.push({id:'leadership',label:'Leadership and collaboration'});
 return sections;
}
