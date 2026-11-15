// 그래프 해석, 어울림 점수, 메뉴 예측, 창업 수치, 제안 · 경고, 프롬프트
const ENG=(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const PROTEIN={meat:1,sea:1,egg:1};

// 완성 접시에서 거꾸로 따라가며 재료와 조리 순서를 모은다
function parse(G){
  const plate=G.nodes.find(n=>n.type==='plate');if(!plate)return null;
  const byId={};G.nodes.forEach(n=>byId[n.id]=n);
  const inEdges=id=>G.edges.filter(e=>e.to===id);
  const active=new Set([plate.id]);
  const acts={},items=[],seen=new Set();
  const actInfo=n=>{if(acts[n.id])return acts[n.id];const A=ACT[n.key];let temp=A.dTemp,time=A.dTime,tS=false,mS=false;
    inEdges(n.id).forEach(e=>{const p=byId[e.from];if(!p||p.type!=='param')return;if(e.port==='temp'){temp=p.val;tS=true;active.add(p.id)}if(e.port==='time'){time=p.val;mS=true;active.add(p.id)}});
    // 요리 행위 노드에서 바로 조절한 온도·시간(수치 노드가 없을 때)
    if(!tS&&n.temp!=null&&A.temp){temp=n.temp;tS=true}if(!mS&&n.time!=null&&A.time){time=n.time;mS=true}
    return acts[n.id]={nid:n.id,key:n.key,temp,time,tempSet:tS,timeSet:mS}};
  // 깊이 우선으로 재료까지 내려간다. path는 재료 → 접시 순서의 요리 행위 노드 목록
  function walk(nid,pathFromPlate,guard){
    inEdges(nid).filter(e=>e.port==='in').forEach(e=>{const s=byId[e.from];if(!s||guard.has(s.id))return;
      if(s.type==='ing'){active.add(s.id);if(seen.has(s.id))return;seen.add(s.id);items.push({nid:s.id,id:s.key,g:s.g,path:[...pathFromPlate].reverse()})}
      else if(s.type==='act'){active.add(s.id);actInfo(s);const g2=new Set(guard);g2.add(s.id);walk(s.id,[...pathFromPlate,s.id],g2)}});
  }
  walk(plate.id,[],new Set([plate.id]));
  let salt=null,spicy=null;
  inEdges(plate.id).forEach(e=>{const p=byId[e.from];if(!p||p.type!=='param')return;if(e.port==='salt'){salt=p.val;active.add(p.id)}if(e.port==='spicy'){spicy=p.val;active.add(p.id)}});
  const plateActs=inEdges(plate.id).filter(e=>e.port==='in'&&byId[e.from]&&byId[e.from].type==='act').map(e=>e.from);
  return {items,acts,salt,spicy,active,plateActs};
}

function pairVal(a,b){
  if(a===b)return {v:.6,src:'same'};
  // 물은 맛을 묽게 할 뿐 다른 재료와 궁합을 따지지 않는다
  if(a==='water'||b==='water')return {v:0,src:'none'};
  const p=PAIR[_pk(a,b)];if(p)return p;
  const x=ING[a].culture,y=ING[b].culture,dot=x[0]*y[0]+x[1]*y[1]+x[2]*y[2],n=Math.hypot(...x)*Math.hypot(...y);
  return {v:-.6+1.1*(n?dot/n:0),src:'culture'};
}
function mainAct(R){ // 재료가 가장 많이 거친 마지막 요리 행위
  const cnt={};R.items.forEach(it=>{const k=it.path.length?R.acts[it.path[it.path.length-1]].key:'raw';cnt[k]=(cnt[k]||0)+it.g});
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0]||'raw';
}
function itemActs(R,it){return it.path.length?it.path.map(n=>R.acts[n]):[{key:'raw',temp:null,time:0}]}
const LIQ={anchovy:1,milk:1,cream:1,water:1};
const isHeated=(R,i)=>itemActs(R,i).some(a=>ACT[a.key].heat&&(a.temp??0)>=70);
// 농도 → 0~1 맛 세기(구간 직선). 소금 1%가 0.5, 설탕 6%가 0.45, 식초 3%가 0.55
const SALT_C=[[0,0],[.3,.1],[.6,.3],[1,.5],[1.5,.7],[2,.85],[3,1]];
const SUGAR_C=[[0,0],[1,.08],[3,.25],[6,.45],[10,.65],[15,.82],[25,1]];
const SOUR_C=[[0,0],[.5,.12],[1.5,.3],[3,.55],[6,.85],[10,1]];
function curve(x,C){if(x<=C[0][0])return C[0][1];for(let k=1;k<C.length;k++)if(x<=C[k][0]){const [x0,y0]=C[k-1],[x1,y1]=C[k];return y0+(y1-y0)*(x-x0)/(x1-x0)}return C[C.length-1][1]}
// 볶기·굽기·튀기기에서 적정 온도·시간을 넘은 정도(0이면 넘지 않음)
const DRY={stirfry:1,grill:1,fry:1};
function burnOver(a){const A=ACT[a.key];if(!DRY[a.key]||!A.temp||!A.time)return 0;const t=a.temp??A.dTemp,m=a.time??A.dTime;
  return Math.max(0,(t-A.temp[1])/40)+Math.max(0,(m-A.time[1])/A.time[1])}
// 단백질 재료가 70°C 이상에서 거쳐야 하는 최소 시간(분)
const MINCOOK={meat:4,sea:2,egg:2};

// 점수 눈금 맞추기: 계산값(raw)을 0–100 눈금에 고르게 펴는 구간 직선.
// 기준점은 무작위 조합 3,000개의 중앙값(→50)과 일반 레시피 20종의 중앙값(→88)이다.
const CAL=[[0,0],[54,50],[88,88],[100,100]];
function calib(x){for(let k=1;k<CAL.length;k++)if(x<=CAL[k][0]){const [x0,y0]=CAL[k-1],[x1,y1]=CAL[k];return y0+(x-x0)/(x1-x0)*(y1-y0)}return 100}
function evaluate(R){
  const items=R.items.filter(it=>it.g>0);
  if(!items.length)return null;
  const tot=items.reduce((s,i)=>s+i.g,0),sw=i=>Math.sqrt(i.g);
  // 1. 재료 궁합
  let ps=0,pw=0;const pairs=[];
  for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){const A=items[a],B=items[b];if(A.id==='water'||B.id==='water')continue;const pv=pairVal(A.id,B.id),w=A.g*B.g;ps+=pv.v*w;pw+=w;pairs.push({a:A.id,b:B.id,v:pv.v,src:pv.src,n:pv.n,en:pv.en,ko:pv.ko})}
  const pairAvg=pw?ps/pw:.4,sPair=clamp((pairAvg+1)/2*100,0,100);
  // 2. 맛 프로필과 균형
  // 짠맛·단맛·신맛·매운맛은 농도(재료 함량 × g ÷ 전체 g)로 계산해 국물·우유가 묽게 만든다.
  // 감칠맛·기름짐·향·쓴맛은 재료 맛의 평균(√g 가중)이고, 국물·우유는 건더기 양까지만 센다.
  const mA=mainAct(R);
  let na=0,su=0,ac=0,sp=0;
  items.forEach(i=>{const c=CONC[i.id]||[0,0,0],h=isHeated(R,i);
    na+=c[0]*i.g;su+=c[1]*(h&&HEAT_SWEET[i.id]||1)*i.g;ac+=c[2]*i.g;
    sp+=((SPICY[i.id]||0)+(SPICY_RAW[i.id]||0)*(h?.2:1))*i.g});
  const saltPct=na/tot,sugarPct=su/tot,sourPct=ac/tot*100;
  const solidG=items.filter(i=>!LIQ[i.id]).reduce((s,i)=>s+i.g,0),liqG=tot-solidG,lf=solidG>0&&liqG>solidG?solidG/liqG:1;
  const ew=i=>Math.sqrt(LIQ[i.id]?i.g*lf:i.g);
  const wsum=items.reduce((s,i)=>s+ew(i),0),taste=[0,0,0,0,0,0,0,0];
  items.forEach(i=>ING[i.id].taste.forEach((v,k)=>taste[k]+=v*ew(i)/wsum));
  taste[0]=curve(sugarPct,SUGAR_C);taste[1]=curve(R.salt!=null?R.salt:saltPct,SALT_C);taste[2]=curve(sourPct,SOUR_C);taste[6]=sp/tot*8;
  // 조리 변환: 요리 행위마다 그 행위를 거친 재료 비율만큼, 온도·시간에 따라 맛을 더한다
  Object.entries(R.acts).forEach(([nid,a])=>{const A=ACT[a.key];if(!A.heat)return;
    const sh=items.filter(i=>i.path.includes(nid)).reduce((s,i)=>s+i.g,0)/tot;if(!sh)return;
    const t=a.temp??A.dTemp,m=a.time??A.dTime,brown=clamp((t-140)/80,0,1)*clamp(m/(A.time?A.time[0]+2:5),0,1);
    if(a.key==='stirfry'||a.key==='grill'){taste[4]+=.1*brown*sh;taste[5]+=.08*sh;taste[7]+=.08*brown*sh}
    if(a.key==='fry'){taste[5]+=.3*sh*(1+clamp((165-t)/40,0,.6));taste[4]+=.05*sh;taste[7]+=.05*brown*sh}
    if(a.key==='simmer')taste[4]+=.06*sh*clamp(m/20,.25,1.5);
    const over=burnOver(a);if(over>0)taste[3]+=.35*clamp(over,0,1.5)*sh});
  for(let k=0;k<8;k++)taste[k]=clamp(taste[k],0,1);
  const umami=clamp(taste[4]/.35,0,1),salty=taste[1]<.3?1-(.3-taste[1])*3:taste[1]>.65?1-(taste[1]-.65)*3:1;
  const srt=[...taste].sort((a,b)=>b-a),dom=1-clamp((srt[0]-srt[1]-.25)*2,0,1),div=clamp(taste.filter(v=>v>.15).length/4,0,1);
  const sTaste=100*(.3*umami+.25*clamp(salty,0,1)+.25*dom+.2*div);
  // 3. 조리법 적합
  let ms=0,mw=0;const methodBad=[];
  items.forEach(i=>{const acts=itemActs(R,i),pr=ING[i.id].prop;const v=acts.reduce((s,a)=>s+SUIT[pr][ACT[a.key].idx],0)/acts.length;ms+=v*sw(i);mw+=sw(i);if(v<-.4)methodBad.push({id:i.id,act:acts[acts.length-1].key,v})});
  const sMethod=clamp((ms/mw+1)/2*100,0,100);
  // 4. 수치 적합
  const fits=[];const actList=Object.values(R.acts);
  actList.forEach(a=>{const A=ACT[a.key];if(!a.tempSet&&!a.timeSet){fits.push(75);return}const f=[];
    // 적정 온도보다 높을 때(탐)를 낮을 때(덜 익음·눅눅함)보다 두 배 이상 크게 깎는다
    if(A.temp&&a.tempSet){const [lo,hi]=A.temp,d=a.temp<lo?(lo-a.temp)*1.2:a.temp>hi?(a.temp-hi)*2.5:0;f.push(clamp(100-d,0,100))}
    if(A.time&&a.timeSet){const [lo,hi]=A.time,d=a.time<lo?lo-a.time:a.time>hi?a.time-hi:0;f.push(clamp(100-d/hi*120,0,100))}
    fits.push(f.length?f.reduce((s,v)=>s+v,0)/f.length:75)});
  let saltRange=null;
  if(R.salt!=null){saltRange=['simmer','boil'].includes(mA)?[.8,1.4]:[1,1.8];const d=R.salt<saltRange[0]?saltRange[0]-R.salt:R.salt>saltRange[1]?R.salt-saltRange[1]:0;fits.push(clamp(100-d*150,0,100))}
  let spicyLv=null;if(R.spicy!=null){spicyLv=Math.round(taste[6]*5);fits.push(clamp(100-Math.abs(spicyLv-R.spicy)*25,0,100))}
  const sParam=fits.length?fits.reduce((s,v)=>s+v,0)/fits.length:75;
  // 5. 위험 감점
  const risks=[];
  actList.forEach(a=>{const A=ACT[a.key];if(!A.heat)return;
    // 탄 맛: 온도가 적정 상한 +20°C를 넘거나, 온도·시간이 함께 상한을 넘거나, 오래 튀기거나 고온에서 너무 오래 익힐 때
    const hiT=A.temp&&a.temp>A.temp[1],hiM=A.time&&a.time>A.time[1];
    if((a.key==='fry'&&a.time>12)||(A.temp&&a.temp>A.temp[1]+20)||(hiT&&hiM)||(a.temp>=160&&A.time&&a.time>A.time[1]*1.6))risks.push({kind:'burn',pen:Math.min(20,10+burnOver(a)*5),text:`${A.ko} ${a.temp??'–'}°C · ${a.time}분: 탄 맛 위험`})});
  items.forEach(i=>{const pr=ING[i.id].prop;if(!PROTEIN[pr])return;const hot=itemActs(R,i).filter(a=>ACT[a.key].heat&&(a.temp??0)>=70),mins=hot.reduce((s,a)=>s+(a.time||0),0);
    if(!hot.length)risks.push({kind:'raw',pen:8,text:`${ING[i.id].ko}: 70°C 이상 가열을 거치지 않음(익힘 부족 위험)`});
    else if(mins<MINCOOK[pr])risks.push({kind:'raw',pen:6,text:`${ING[i.id].ko}: 70°C 이상 가열 ${mins}분으로 짧음(${MINCOOK[pr]}분 이상, 익힘 부족 위험)`})});
  pairs.forEach(p=>{if(p.v<-.5)risks.push({kind:'pair',pen:(Math.abs(p.v)-.5)*25,text:`${ING[p.a].ko} + ${ING[p.b].ko}: 강한 충돌(${p.v.toFixed(2)})`})});
  actList.forEach(a=>{const A=ACT[a.key];if(A.heat&&A.temp&&a.temp<60)risks.push({kind:'cold',pen:8,text:`${A.ko} ${a.temp}°C: 가열 온도가 너무 낮음`})});
  // 양 비율: 국물·우유처럼 액체로 쓰는 재료를 뺀 고형 재료 기준
  const solid=items.filter(i=>!LIQ[i.id]),sTot=solid.reduce((s,i)=>s+i.g,0);
  // 디저트(고기·해산물·짠 양념 없이 단 재료가 들어간 조합)는 설탕·초콜릿·우유 기준을 디저트에 맞춘다
  const SWEETS=['sugar','chocolate','milk','cream','butter','flour','egg','tteok','cheese'],DESSERT=items.every(i=>SWEETS.includes(i.id)||ING[i.id].prop==='dairy')&&items.some(i=>['sugar','chocolate'].includes(i.id)||(i.id==='butter'&&items.some(j=>j.id==='tteok')));
  const LIM=id=>(DESSERT?{sugar:.3,chocolate:.95,butter:.2,cheese:.6}:{gochugaru:.04,curry:.06,sugar:.06,vinegar:.06,soy:.08,sesameoil:.04,oliveoil:.08,butter:.1,gochujang:.12,doenjang:.12,basil:.06,garlic:.08,chili:.06,scallion:.15,chocolate:.3,cheese:.25})[id];
  solid.forEach(i=>{const sh=i.g/sTot,lim=LIM(i.id);if(lim&&sh>lim){risks.push({kind:'amount',pen:Math.min(20,(sh-lim)/lim*6),text:`${ING[i.id].ko} ${i.g}g: 고형 재료의 ${Math.round(sh*100)}%(적정 ${Math.round(lim*100)}% 이하)`})}
    else if(!lim&&solid.length>1){const cap=DESSERT?.88:['rice','noodle','dough'].includes(ING[i.id].prop)?.7:.6;if(sh>cap)risks.push({kind:'amount',pen:Math.min(20,(sh-cap)/(1-cap)*30),text:`${ING[i.id].ko} ${i.g}g: 고형 재료의 ${Math.round(sh*100)}%로 한 재료가 너무 많음(${Math.round(cap*100)}% 이하)`})}});
  const liq=items.filter(i=>LIQ[i.id]).reduce((s,i)=>s+i.g,0);if(!DESSERT&&liq>0&&sTot>0&&liq/sTot>3)risks.push({kind:'amount',pen:Math.min(15,(liq/sTot-3)*5),text:`국물·우유 ${liq}g이 건더기의 ${(liq/sTot).toFixed(1)}배로 너무 묽음`});
  if(R.salt!=null&&saltRange){const d=R.salt<saltRange[0]?saltRange[0]-R.salt:R.salt>saltRange[1]?R.salt-saltRange[1]:0;if(d>.3)risks.push({kind:'salt',pen:Math.min(25,(d-.3)*20),text:`염도 ${R.salt}%: 적정 ${saltRange[0]}–${saltRange[1]}%보다 ${R.salt>saltRange[1]?'짬':'싱거움'}`})}
  // 염도를 따로 넣지 않았으면 재료 함량으로 계산한 염도가 너무 높을 때만 경고한다(간은 나중에 더할 수 있으므로 싱거움은 보지 않음)
  if(R.salt==null){const sr=['simmer','boil'].includes(mA)?[.8,1.4]:[1,1.8],d=saltPct-sr[1];if(d>.3)risks.push({kind:'salt',pen:Math.min(25,(d-.3)*20),text:`재료로 계산한 염도 약 ${saltPct.toFixed(1)}%: 적정 ${sr[0]}–${sr[1]}%보다 짬`})}
  if(tot>1500)risks.push({kind:'amount',pen:Math.min(15,(tot-1500)/100),text:`1인분 ${tot}g: 1,500g을 넘음`});
  if(tot<80)risks.push({kind:'amount',pen:5,text:`1인분 ${tot}g: 너무 적음`});
  const pen=risks.reduce((s,r)=>s+r.pen,0);
  // 디저트는 감칠맛·짠맛 대신 단맛이 알맞은지와 짠맛이 낮은지로 맛 균형을 본다
  const sTasteF=DESSERT?100*(.35*clamp(taste[0]<.35?taste[0]/.35:taste[0]>.8?1-(taste[0]-.8)*3:1,0,1)+.15*clamp(taste[1]<=.35?1:1-(taste[1]-.35)*3,0,1)+.25*dom+.25*div):sTaste;
  // 수치를 하나도 넣지 않았으면(모두 기본값) 수치 적합은 평가하지 않고 나머지 세 항목 비중을 키운다
  const pSet=actList.some(a=>a.tempSet||a.timeSet)||R.salt!=null||R.spicy!=null;
  const raw=clamp((pSet?.35*sPair+.2*sTasteF+.25*sMethod+.2*sParam:(.35*sPair+.2*sTasteF+.25*sMethod)/.8)-pen,0,100);
  // 화면 점수는 60–100 눈금(맞춘 값 0→60, 100→100)
  const score=60+.4*calib(raw);
  return {score,raw,parts:{pair:sPair,taste:sTasteF,method:sMethod,param:pSet?sParam:null,pen},taste,pairs,risks,methodBad,mainAct:mA,saltRange,spicyLv,tot,conc:{salt:saltPct,sugar:sugarPct,sour:sourPct}};
}

function predict(R,scope){
  const S=new Set(R.items.map(i=>i.id)),actSet=new Set(Object.values(R.acts).map(a=>a.key));if(R.items.some(i=>!i.path.length))actSet.add('raw');
  // 재료가 들어간 양만큼 일치로 센다: 전체의 4%(양념·마늘·고추·파·바질은 1%)에 못 미치면 그 비율만큼만 인정
  const gAll=R.items.reduce((s,i)=>s+(i.g||0),0)||1,gOf={};R.items.forEach(i=>gOf[i.id]=(gOf[i.id]||0)+(i.g||0));
  const SMALL={basil:1,garlic:1,chili:1,scallion:1},hitW=x=>gOf[x]?Math.min(1,gOf[x]/gAll/(ING[x].prop==='seasoning'||SMALL[x]?.01:.04)):0;
  const list=DISHES.filter(d=>!scope||scope==='all'||d.cat===scope).map(d=>{
    const coreHit=d.core.reduce((s,x)=>s+hitW(x),0),optHit=Math.min(4,d.opt.reduce((s,x)=>s+hitW(x),0));
    const full=2*d.core.length+Math.min(4,d.opt.length),ingM=(2*coreHit+optHit)/full,methM=d.acts.some(a=>actSet.has(a))?1:0;
    const extra=[...S].filter(x=>!d.core.includes(x)&&!d.opt.includes(x)).length,miss=d.core.length-coreHit;
    let s=.72*ingM+.28*methM-.1*extra-.12*miss;if(coreHit<.5)s*=.25;return {d,s}}).sort((a,b)=>b.s-a.s);
  if(!list.length)return {top:[],novel:true};
  const k=10,ex=list.map(o=>Math.exp(o.s*k)),Z=ex.reduce((a,b)=>a+b,0);
  const top=list.slice(0,3).map((o,i)=>({...o,p:ex[i]/Z}));
  const novel=top[0].s<.38;
  let name=null;if(novel){const big=[...R.items].sort((a,b)=>b.g-a.g).slice(0,2).map(i=>ING[i.id].ko);name=`${big.join(' ')} ${ACT_SHORT[mainAct(R)]}`}
  return {top,novel,name,best:top[0]};
}

function business(R,P,price,servings){
  const cost=R.items.reduce((s,i)=>s+i.g*ING[i.id].price/100,0);
  // 조리 시간 = 접시까지 가장 긴 경로의 시간 합
  let time=0;R.items.forEach(i=>{const t=i.path.reduce((s,n)=>s+(R.acts[n].time||0),0);time=Math.max(time,t)});
  const actsN=Object.keys(R.acts).length,chain=R.items.some(i=>i.path.length>=2)?1:0,fry=Object.values(R.acts).some(a=>a.key==='fry')?1:0,many=R.items.length>=7?1:0;
  const diff=actsN+chain+fry+many;
  const ref=P&&!P.novel?P.best.d.price:null;
  return {cost,costAll:cost*servings,rate:price?cost/price:null,time,diff,diffKo:diff<=2?'쉬움':diff===3?'보통':'어려움',ref};
}

const BOWL_BY_ACT={raw:'salad',mix:'salad',boil:'bowl',simmer:'ttuk',steam:'bowl',stirfry:'plate',grill:'plate',fry:'fryplate'};
function suggest(R,keep){
  keep=new Set(keep||[]);
  const base=evaluate(R);if(!base)return {add:[],remove:[]};
  const S=new Set(R.items.map(i=>i.id));
  const main=R.plateActs.length?R.plateActs.map(n=>({n,c:R.items.filter(i=>i.path[i.path.length-1]===n).length})).sort((a,b)=>b.c-a.c)[0].n:null;
  const mainPath=main?(R.items.find(i=>i.path[i.path.length-1]===main)?.path||[main]):[];
  const add=[];
  Object.keys(ING).forEach(id=>{if(S.has(id))return;const R2={...R,items:[...R.items,{nid:'tmp',id,g:ING[id].g,path:mainPath}]};const e=evaluate(R2);if(e&&e.score-base.score>=.5)add.push({id,d:e.score-base.score})});
  add.sort((a,b)=>b.d-a.d);
  const remove=[];
  if(R.items.length>2)R.items.forEach(it=>{if(keep.has(it.id))return;const R2={...R,items:R.items.filter(x=>x!==it)};const e=evaluate(R2);if(e&&e.score-base.score>=.5)remove.push({nid:it.nid,id:it.id,d:e.score-base.score})});
  remove.sort((a,b)=>b.d-a.d);
  return {add:add.slice(0,4),remove:remove.slice(0,3)};
}
const grade=s=>s>=92?'잘 어울림':s>=86?'무난함':s>=80?'애매함':'충돌';
const gcol=s=>s>=92?'#1d5ff2':s>=86?'#10b5a3':s>=80?'#f59e0b':'#e5484d';
return {parse,evaluate,predict,business,suggest,pairVal,grade,gcol,mainAct,BOWL_BY_ACT,burnOver,isHeated,MINCOOK};
})();
