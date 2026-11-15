// 팔레트, 예시 불러오기, 결과 패널, 조리 애니메이션
(()=>{
const $=s=>document.querySelector(s);
const fmt=(v,d=0)=>v==null||isNaN(v)?'–':Number(v).toLocaleString('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:0});
let R=null,E=null,P=null,scope='all',servings=1,price=9000,progress=1,curEx='kimchi',palCat='rec',palTab='ing',q='';
function setT(v){window.LAB_T=v;document.querySelectorAll('.cookb .vt').forEach(e=>e.textContent=v)}
// 아이콘: 메뉴·설정(img/ui), 음식(img/dish, 일반 레시피 20종)
const UIC=(n,c='uic')=>`<img class="${c}" src="img/ui/${n}.png" alt="">`;
const BIZ_IC={'한식당':['biz-kor'],'분식점':['biz-snack'],'일식당':['biz-japan'],'주점·이자카야':['v-pub','v-izakaya'],'카페·디저트':['v-cafe','v-dessert'],'양식당':['biz-west'],'중식당':['biz-china'],'기타':['biz']};
const bizIc=v=>BIZ_IC[v]?`<span class="bics">${BIZ_IC[v].map(n=>UIC(n,'bic')).join('')}</span>`:'';
const DISH_IC={};Object.entries(EXAMPLES).forEach(([k,X])=>{if(X.kind==='std')DISH_IC[X.ko]='img/dish/'+k+'.svg'});
const dishIc=(ko,c='dic')=>DISH_IC[ko]?`<img class="${c}" src="${DISH_IC[ko]}" alt="">`:'';
Object.assign(window,{UIC,bizIc,dishIc,DISH_IC});
function toast(t,html){const el=$('#toast');if(html)el.innerHTML=t;else el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1800)}

// ---------- 예시 ----------
function buildExample(key){return buildFrom(EXAMPLES[key])}
function buildFrom(X){let id=0;const nodes=[],edges=[];const nid=()=>'n'+(++id),eid=()=>'e'+(++id);
  const plate={id:nid(),type:'plate',x:860,y:200};nodes.push(plate);
  const actN=X.acts.map(a=>{const n={id:nid(),type:'act',key:a[0],x:0,y:0};nodes.push(n);return n});
  X.acts.forEach((a,i)=>{edges.push({id:eid(),from:actN[i].id,to:a[1]<0?plate.id:actN[a[1]].id,port:'in'});
    if(a[2]!=null&&ACT[a[0]].temp){const p={id:nid(),type:'param',set:true,key:'temp',val:a[2],x:0,y:0};nodes.push(p);edges.push({id:eid(),from:p.id,to:actN[i].id,port:'temp'})}
    if(a[3]!=null&&ACT[a[0]].time){const p={id:nid(),type:'param',set:true,key:'time',val:a[3],x:0,y:0};nodes.push(p);edges.push({id:eid(),from:p.id,to:actN[i].id,port:'time'})}});
  X.ings.forEach(r=>{const n={id:nid(),type:'ing',key:r[0],g:r[1],x:0,y:0};nodes.push(n);edges.push({id:eid(),from:n.id,to:r[2]<0?plate.id:actN[r[2]].id,port:'in'})});
  if(X.salt!=null){const p={id:nid(),type:'param',set:true,key:'salt',val:X.salt,x:0,y:0};nodes.push(p);edges.push({id:eid(),from:p.id,to:plate.id,port:'salt'})}
  if(X.spicy!=null){const p={id:nid(),type:'param',set:true,key:'spicy',val:X.spicy,x:0,y:0};nodes.push(p);edges.push({id:eid(),from:p.id,to:plate.id,port:'spicy'})}
  return {nodes,edges}}
function loadEx(key){curEx=key;hidQuiet=1;nameQuiet=1;customName=null;$('#exSel').value=key;GRAPH.load(buildExample(key));GRAPH.layout();}
// 설문·AI 초안에서 쓰는 도구: 보드에 올리지 않고 채점하기, 보드에 올리기
window.LAB_API={
  evalX(X,pr){const G=buildFrom(X),r=ENG.parse(G);if(!r||!r.items.length)return null;const p=predictS(r),e=applyBiz(ENG.evaluate(r),p),b=ENG.business(r,p,pr??price,servings);return {R:r,E:e,P:p,B:b}},
  loadX(X,name){let o=$('#exSel').querySelector('option[value="ai"]');if(!o){o=document.createElement('option');o.value='ai';$('#exSel').prepend(o)}o.textContent=name;$('#exSel').value='ai';curEx='ai';window.LAB_AIX=X;hidQuiet=1;nameQuiet=1;customName=null;GRAPH.load(buildFrom(X));GRAPH.layout()},
  loadEx(k){loadEx(k)},
  setServings(v){servings=+v||1;$('#serv').value=String(servings);update(GRAPH.get())},
  setPrice(v){price=v;$('#price').value=v;update(GRAPH.get())},
  setScope(v){scope=v;$('#scope').value=v;update(GRAPH.get())},
  refreshPalette(){renderPalette()}
};

// ---------- 팔레트 ----------
const CAT_ICON={pro:'🥩',veg:'🥬',carb:'🍚',sauce:'🧂',dairy:'🧀'};
const ACT_ICON={raw:'🔪',mix:'🥗',boil:'♨️',simmer:'🍲',steam:'🫕',stirfry:'🍳',grill:'🔥',fry:'🍤'};
const PAR_ICON={temp:'🌡️',time:'⏱️',salt:'🧂',spicy:'🌶️'};
// 지금 보드 재료와의 평균 궁합(양이 많을수록 가중). 보드가 비면 null
function palScore(key){if(!R||!R.items.length)return null;let s=0,w=0;R.items.forEach(i=>{if(i.id===key)return;const ww=Math.sqrt(i.g);s+=ENG.pairVal(key,i.id).v*ww;w+=ww});return w?s/w:null}
const CAT_SHORT={pro:'고기·해산물',veg:'채소',carb:'밥·면',sauce:'양념',dairy:'유제품'};
function renderPalette(){
  $('#palTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===palTab));
  const box=$('#palBody');let h='';
  const ex=window.DH_SURVEY?.뺄재료||[],on=new Set(R?R.items.map(i=>i.id):[]);
  if(palTab==='ing'){
    const hasBoard=on.size>0,pc=palCat==='rec'&&!hasBoard?'pro':palCat;
    h+=`<div class="pcats">${hasBoard?`<button class="${pc==='rec'&&!q?'on':''}" data-c="rec">✦ 잘 맞는 재료</button>`:''}${Object.keys(CATS).map(k=>`<button class="${k===pc&&!q?'on':''}" data-c="${k}"><i class="cdot" style="background:${({pro:'#e5484d',veg:'#2f9e58',carb:'#d99a00',sauce:'#8b5cf6',dairy:'#0ea5e9'})[k]}"></i>${CAT_SHORT[k]}</button>`).join('')}</div>`;
    let list;
    if(q)list=Object.values(ING).filter(I=>I.ko.includes(q)||I.en.includes(q.toLowerCase()));
    else if(pc==='rec')list=Object.values(ING).filter(I=>!on.has(I.id)&&!ex.includes(I.ko)&&I.id!=='sugar').map(I=>({I,v:palScore(I.id)})).sort((a,b)=>b.v-a.v).slice(0,12).map(x=>x.I);
    if(pc==='rec'&&!q)HID.recs.forEach(h=>{if(!list.includes(ING[h.id]))list.push(ING[h.id])});
    else list=Object.values(ING).filter(I=>I.cat===pc);
    h+=`<p class="psub">${q?`'${q}' 찾기 결과 · ${list.length}종`:pc==='rec'?'지금 보드 재료와 궁합이 좋은 순':`${CATS[pc]} · ${list.length}종`}${hasBoard&&pc!=='rec'?' · <span class="pkey"><i class="g"></i>잘 맞음 <i class="b"></i>충돌</span>':''}</p>`;
    h+=`<div class="pgrid${pc==='rec'&&!q?' one':''}">${list.map(I=>{const v=palScore(I.id),x=ex.includes(I.ko),o=on.has(I.id),cls=v==null||o?'':v>=.35?' good':v<=-.3?' bad':'';
      const tip=`${I.ko} · 기본 ${I.g}g${v!=null&&!o?` · 지금 보드와 궁합 ${v>0?'+':''}${v.toFixed(2)}`:''}${x?' · 설문에서 뺄 재료':''}${o?' · 보드에 있음':''}`;
      return `<button class="pi pg${cls}${x?' ex':''}${o?' on':''}" draggable="true" data-t="ing" data-k="${I.id}" title="${tip}"><img class="ii" src="img/ing/${I.id}.png" alt="" loading="lazy"><span>${I.ko}</span>${(()=>{const h=!o&&HID.recs.find(x=>x.id===I.id);if(!h)return '';return `<em class="phid" data-htip="${HID.dish.ko}에 ${I.ko} · 숨은 궁합 추천&#10;${hidWhy(h)}&#10;잘 안 쓰지만 자료로는 잘 맞는 재료라 메뉴 차별점이 됩니다">${HID_ICON}숨은</em>`})()}${pc==='rec'&&!q&&v!=null?`<b>${v>0?'+':''}${v.toFixed(1)}</b>`:o?'<b>✓</b>':''}</button>`}).join('')||'<p class="psub">찾는 재료가 없습니다</p>'}</div>`;
    h+=`<p class="psub">누르면 보드에 추가, 끌어 놓으면 그 자리에 놓입니다.</p>`;
  }else if(palTab==='act'){
    h+=`<div class="pcol">${ACT_RAW.map(r=>{const A=ACT[r[0]];return `<button class="pi pc" draggable="true" data-t="act" data-k="${A.id}" title="끌어 놓거나 눌러 보드에 넣기"><img class="ic" src="img/act/${A.id}.png" alt=""><span class="pn">${A.ko}</span><small>${A.temp?`${A.temp[0]}–${A.temp[1]}°C`:'불 없음'}${A.time?` · ${A.time[0]}–${A.time[1]}분`:''}</small></button>`}).join('')}</div>
      <p class="psub">요리 행위를 고른 채 재료를 넣으면 그 행위에 바로 이어집니다. 온도·시간은 기본값으로 시작합니다.</p>`;
  }else{
    h+=`<div class="pcol">${Object.entries(PARAMS).map(([k,P])=>`<button class="pi pc" draggable="true" data-t="param" data-k="${k}" title="끌어 놓거나 눌러 보드에 넣기"><img class="ic" src="img/act/${k}.png" alt=""><span class="pn">${P.ko}</span><small>${P.min}–${P.max}${P.unit} · ${P.to==='act'?'요리 행위에':'완성 접시에'}</small></button>`).join('')}</div>
      <p class="psub">온도·시간은 요리 행위에, 염도·매운맛은 완성 접시에 연결합니다. 기본값과 다르게 할 때만 넣으면 보드가 단순해집니다.</p>`
  }
  box.innerHTML=h;
  box.querySelectorAll('.pcats button').forEach(b=>b.onclick=()=>{palCat=b.dataset.c;q='';$('#gq').value='';renderPalette()});
  box.querySelectorAll('.pi').forEach(b=>{b.onclick=()=>{GRAPH.addNode(b.dataset.t,b.dataset.k);};b.ondragstart=e=>e.dataTransfer.setData('text/plain',b.dataset.t+':'+b.dataset.k)});
}
function bindBoardDrop(){const bd=$('#board');
  bd.addEventListener('dragover',e=>{e.preventDefault();bd.classList.add('over')});bd.addEventListener('dragleave',()=>bd.classList.remove('over'));
  bd.addEventListener('drop',e=>{e.preventDefault();bd.classList.remove('over');const [t,k]=e.dataTransfer.getData('text/plain').split(':');if(!t||!k)return;
    const c=bd.querySelector('.gcanvas').getBoundingClientRect(),s=GRAPH.scale;GRAPH.addNode(t,k,{pos:{x:Math.max(0,(e.clientX-c.left)/s-80),y:Math.max(0,(e.clientY-c.top)/s-20)}})})}

// ---------- 계산과 결과 ----------
function colorOf(key){if(!R||!R.items.some(i=>i.id===key))return null;let s=0,w=0;R.items.forEach(i=>{if(i.id===key)return;const v=ENG.pairVal(key,i.id).v,ww=Math.sqrt(i.g);s+=v*ww;w+=ww});return w?s/w:null}
function predictS(r){const p=ENG.predict(r,'all');p.scopeUsed='all';return p}
// 업종 적합: 예측 메뉴 상위 3개의 확률 중 가게 업종의 요리 문화에 드는 비율. 맞지 않는 만큼 최대 15점 감점
const BIZCAT={'한식당':['kor'],'분식점':['kor'],'일식당':['asia'],'양식당':['west'],'중식당':['asia'],'카페·디저트':['dessert'],'주점·이자카야':['kor','asia','west']};
const CULT={kor:'한식',west:'양식',asia:'중식·일식',dessert:'디저트'};
function applyBiz(e,p){e.base=e.score;e.biz=null;const bz=(a=>Array.isArray(a)?a:(a?[a]:[]))(window.DH_SURVEY?.업종),known=bz.filter(x=>BIZCAT[x]);if(!known.length||known.length<bz.length||!p||!p.top.length)return e;const biz=bz.join('·'),cats=[...new Set(known.flatMap(x=>BIZCAT[x]))];
  const tot=p.top.reduce((a,o)=>a+o.p,0)||1,fit=p.top.reduce((a,o)=>a+(cats.includes(o.d.cat)?o.p:0),0)/tot,pen=Math.round(6*(1-fit)*10)/10;
  e.biz={biz,fit,pen,cat:CULT[p.top[0].d.cat]};e.score=Math.max(60,e.score-pen);return e}
// 쌍 근거 문구와 학습표 꼬리표(숨은 조합, 대체 재료, 요즘 흐름)
function pairSrc(p){return p.src==='hand'?'직접 적은 값':p.src==='learned'?`레시피 학습 · 한국어 ${fmt(p.ko)}건 · 영어 ${fmt(p.en)}건`:p.src==='recipe'?`레시피 ${fmt(p.n)}건`:'요리 문화 추정'}
// 숨은 궁합: 지금 메뉴(예측 1위)에는 잘 넣지 않지만 보드 재료와 자료상 잘 맞는 재료.
// 뻔한 조합을 거르려고 양념, 밥, 메뉴 40종 중 10종 이상에 들어가는 기본 재료, 같은 성질 재료(고기→다른 고기 같은 대체)는 뺀다.
// 조건: 보드 재료와 평균 궁합 0.3 이상, 가장 잘 맞는 짝이 학습표 상위 20% 안, 국내 레시피에서 같이 쓰는 비율이 평균 30% 이하
const HID_CNT=(()=>{const c={};DISHES.forEach(D=>[...D.core,...D.opt].forEach(i=>c[i]=(c[i]||0)+1));return c})();
let hidOpenUser=true,hidQuiet=0,hidPrev=new Set(),hidAt={},HID={dish:null,found:[],recs:[]};
function hidEval(id,others,D){const I=ING[id];if(!I||I.cat==='sauce'||id==='rice'||(HID_CNT[id]||0)>=10||typeof LEARN==='undefined')return null;
  if(D&&(D.core.includes(id)||D.opt.includes(id)))return null;
  if(D&&D.cat==='dessert'&&!['dairy','carb'].includes(I.cat))return null;
  if(!others.length||others.some(b=>ING[b].prop===I.prop))return null;
  const aff=others.reduce((s,b)=>s+ENG.pairVal(id,b).v,0)/others.length;
  // 짝은 양념과 기본 재료(대파·양파·마늘 등)를 뺀 주재료에서, 궁합이 높으면서 같이 덜 쓰는 쌍으로 고른다
  const Ls=others.filter(b=>(ING[b].cat!=='sauce'||(D&&D.core.includes(b)))&&(HID_CNT[b]||0)<10).map(b=>({b,L:LEARN[_pk(id,b)]})).filter(p=>p.L&&p.L.fresh!=null&&p.L.fit!=null);if(!Ls.length)return null;
  const nov=Ls.reduce((s,p)=>s+p.L.fresh,0)/Ls.length,best=Ls.reduce((m,p)=>p.L.fit*p.L.fresh>m.L.fit*m.L.fresh?p:m);
  if(aff<.3||nov<.7||best.L.fit<.8||best.L.fresh<.7)return null;
  return {id,best:best.b,fit:best.L.fit,co:1-best.L.fresh,aff,s:aff*nov*(1-(HID_CNT[id]||0)/25)}}
function hidState(){if(!R||!E||!P)return {dish:null,found:[],recs:[]};const D=P.novel?P.top[0].d:P.best.d,on=[...new Set(R.items.map(i=>i.id))];
  const found=on.map(id=>hidEval(id,on.filter(b=>b!==id),D)).filter(Boolean).sort((a,b)=>b.s-a.s);
  // 추천 재료는 실제로 넣어 본 점수 변화를 계산해(기본 양, 절반, 4분의 1 중 나은 쪽) 5점 넘게 깎는 것은 뺀다
  const main=R.plateActs.length?R.plateActs.map(n=>({n,c:R.items.filter(i=>i.path[i.path.length-1]===n).length})).sort((a,b)=>b.c-a.c)[0].n:null;
  const mainPath=main?(R.items.find(i=>i.path[i.path.length-1]===main)?.path||[main]):[],base=ENG.evaluate(R).score;
  const tryAdd=h=>{const g0=ING[h.id].g,gs=[g0,Math.max(5,Math.round(g0/2/5)*5),Math.max(5,Math.round(g0/4/5)*5)];let b=null;gs.forEach(g=>{const e=ENG.evaluate({...R,items:[...R.items,{nid:'tmp',id:h.id,g,path:mainPath}]});if(e&&(!b||e.score>b.sc))b={g,sc:e.score}});return b?{...h,g:b.g,d:b.sc-base}:null};
  const recs=Object.keys(ING).filter(id=>!on.includes(id)&&!(window.DH_SURVEY?.뺄재료||[]).includes(ING[id].ko)).map(id=>hidEval(id,on,D)).filter(Boolean).sort((a,b)=>b.s-a.s).slice(0,6).map(tryAdd).filter(h=>h&&h.d>=-5).slice(0,3);
  return {dish:D,found,recs}}
const pct=x=>Math.max(1,Math.round(x*100));
const josa=(w,a,b)=>{const c=w.charCodeAt(w.length-1)-0xAC00;return w+(c>=0&&c<11172&&c%28?b:a)};
function hidWhy(h){return `${josa(ING[h.best].ko,'와','과')} 궁합 상위 ${pct(1-h.fit)}% · 국내 레시피에서 같이 쓰는 비율 ${pct(h.co)}%`}
const HID_ICON='<img class="hidi" src="img/hidden.svg" alt="">';
function hidCard(){const {dish,found,recs}=HID,keys=found.map(h=>h.id),fresh=keys.filter(k=>!hidPrev.has(k));
  if(!hidQuiet&&fresh.length){const h=found.find(x=>x.id===fresh[0]);toast(`${HID_ICON}숨은 궁합 발견: ${dish.ko}에 ${ING[h.id].ko}`,true)}
  const now=performance.now();if(!hidQuiet)fresh.forEach(k=>hidAt[k]=now);const recent=keys.filter(k=>now-(hidAt[k]||-1e9)<1500);hidPrev=new Set(keys);hidQuiet=0;
  if(!found.length&&!recs.length)return '';const rc=recs.slice(0,found.length?1:2);
  const say=found.length?`${dish.ko}에는 잘 안 넣는 ${josa(found.map(h=>ING[h.id].ko).join('·'),'를','을')} 찾으셨어요. 자료로는 잘 맞는 조합이라 메뉴 차별점이 됩니다.`:`${dish.ko}에 잘 안 넣지만, 자료로는 잘 맞는 재료예요. 넣어서 점수를 확인해 보세요.`;
  const opn=recent.length>0||hidOpenUser;
  return `<details class="rcard hidc${recent.length?' new':''}"${opn?' open':''}><summary><h3><span>${HID_ICON}숨은 궁합</span><small>${dish.ko} 기준 · ${found.length?'찾음 '+found.length:'추천 '+rc.length}</small></h3></summary>
    <div class="hsay"><img src="img/mascot-face.webp" alt=""><p>${say}</p></div>
    ${found.map(h=>`<div class="hp hfound${recent.includes(h.id)?' nw':''}"><b><i class="hk">찾음</i><img src="img/ing/${h.id}.png" alt="">${ING[h.id].ko} × <img src="img/ing/${h.best}.png" alt="">${ING[h.best].ko}</b><small>${hidWhy(h)}</small></div>`).join('')}
    ${rc.map(h=>`<div class="hp hrec"><b><i class="hk">추천</i><img src="img/ing/${h.id}.png" alt="">${ING[h.id].ko}<em class="hd${h.d>=.5?' up':''}">${h.g}g 넣으면 ${h.d>=.5?'+'+Math.round(h.d):h.d<=-.5?'−'+Math.round(-h.d):'±0'}점</em><button class="hadd" data-hadd="${h.id}" data-g="${h.g}">+ 넣어 보기</button></b><small>${hidWhy(h)}</small></div>`).join('')}</details>`}
function pairTags(p){const L=typeof LEARN!=='undefined'&&LEARN[_pk(p.a,p.b)];if(!L)return [];const t=[];
  if(HID.found.some(h=>(h.id===p.a&&h.best===p.b)||(h.id===p.b&&h.best===p.a)))t.push(['숨은 궁합','hid']);if(L.alike!=null&&L.fit!=null&&L.alike-L.fit>=.15)t.push(['대체 재료','alt']);
  if(L.trend>=.15)t.push(['요즘 늘어남','up']);else if(L.trend<=-.15)t.push(['요즘 줄어듦','down']);return t}
// 재료 노드 비중: 1인분 전체 무게 기준이라 모든 재료를 더하면 100%. 양 경고가 난 재료는 주황색
const LIQ_IDS={anchovy:1,milk:1,cream:1,water:1};
function shareMap(){if(!R||!E)return {};const its=R.items.filter(i=>i.g>0),tot=its.reduce((s,i)=>s+i.g,0)||1,m={};
  const raw=its.map(i=>i.g/tot*100),fl=raw.map(Math.floor);let rest=100-fl.reduce((s,v)=>s+v,0);
  raw.map((v,k)=>[v-fl[k],k]).sort((a,b)=>b[0]-a[0]).forEach(([,k])=>{if(rest>0){fl[k]++;rest--}});
  its.forEach((i,k)=>{m[i.nid]={sh:i.g/tot,pct:fl[k],warn:E.risks.some(r=>r.kind==='amount'&&r.text.startsWith(ING[i.id].ko+' ')),liq:!!LIQ_IDS[i.id]}});return m}
function renderSteps(G){const el=$('#bSteps');if(!el)return;const ids=new Set(G.nodes.filter(n=>n.type==='ing').map(n=>n.id));
  const done=[ids.size>0,G.edges.some(e=>ids.has(e.from)),!!E],cur=done.indexOf(false),L=['재료 놓기','요리 행위에 잇기','완성 접시에서 결과 보기'];
  el.classList.toggle('all',cur<0);el.innerHTML=L.map((t,k)=>`<span class="${done[k]?'ok':k===cur?'cur':''}">${done[k]?'✓':k+1} ${t}</span>`).join('<i>→</i>')}
// 보드를 레시피에서 바꾸면 위쪽 레시피 이름(상단 버튼, 보드 제목)을 지금 조합의 요리 이름으로 바꾼다. PDF 보고서 제목도 같은 이름을 쓴다
let baseSig=null,baseName=null;
const boardSig=()=>R?JSON.stringify([R.items.map(i=>[i.id,i.g]).sort(),Object.values(R.acts).map(a=>[a.key,a.temp,a.time]).sort()]):'';
function dishName(){return E&&P?(P.novel?P.name:P.best.d.ko):null}
// 사장님이 보드 제목에서 직접 고친 메뉴 이름이 있으면 그것이 먼저다(다른 레시피를 불러오면 지운다)
let customName=null;
window.LAB_TITLE=()=>{if(customName)return customName;const cur=window.RECIPES?.current?.();return baseSig!==null&&boardSig()!==baseSig?dishName():(cur?.name||dishName())};
function plateInfo(){if(!E||!P)return null;const t=window.LAB_TITLE()||dishName(),tm=ENG.business(R,P,price,servings).time,nv=novaInfo();
  const sub=nv?`${nv.base} ${nv.sim}% 유사`:'';
  return {name:t,time:tm,sub,nova:nv,icon:dishIc(window.DISH_IC?.[t]?t:(P.novel?null:dishName()),'pdi')}}
// 새 가능성: 기존 메뉴 1위와 닮은 정도(계산기 유사도)의 나머지를 새 메뉴가 될 가능성으로 보고, 이름을 짓는다.
// 이름은 계산 결과의 성공·실패와 그 사연(덜 익음, 탐, 짬, 묽음, 한 재료 과다, 어색한 조합, 존재감 없는 재료)을 그대로 드러내는 재미있는 실제 말투로 짓는다.
const NOVA={};let novaTimer=null,novaSig='';
const NOVA_ACT={stirfry:'볶음',simmer:'찌개',fry:'튀김',grill:'구이',boil:'삶음',steam:'찜',mix:'무침',raw:'한 접시'};
// 존재감 판단에서 빼는 재료: 원래 조금만 넣는 양념·향신 채소
const NOVA_SMALL={garlic:1,scallion:1,chili:1,basil:1,gochugaru:1};
function novaVerdict(){
  const byKo=t=>Object.values(ING).filter(I=>t.startsWith(I.ko)).sort((a,b)=>b.ko.length-a.ko.length)[0]?.id,tags=[];
  (E.risks||[]).forEach(r=>{const id=byKo(r.text);
    if(r.kind==='raw'||r.kind==='cold')tags.push({t:'덜 익음',ing:id,w:3});
    else if(r.kind==='burn')tags.push({t:'탐',w:3});
    else if(r.kind==='salt')tags.push({t:/짬/.test(r.text)?'짬':'싱거움',w:2});
    else if(r.kind==='pair'){const m=r.text.split(':')[0].split(' + ');tags.push({t:'어색한 조합',a:m[0],b:m[1],w:2})}
    else if(r.kind==='amount'&&/묽음/.test(r.text))tags.push({t:'묽음',w:2});
    else if(r.kind==='amount'&&id)tags.push({t:'너무 많음',ing:id,w:2});});
  const tot=R.items.reduce((s,i)=>s+i.g,0)||1;
  R.items.forEach(i=>{if(i.g>0&&ING[i.id].cat!=='sauce'&&!LIQ_IDS[i.id]&&!NOVA_SMALL[i.id]&&i.g/tot<.02)tags.push({t:'존재감 없음',ing:i.id,w:2})});
  tags.sort((a,b)=>b.w-a.w);const fail=tags.length>0||E.score<80;
  return {kind:fail?'실패':'성공',tags:tags.slice(0,2)};
}
function novaFallback(sig){
  const v=novaVerdict(),x=v.tags[0],main=[...R.items].filter(i=>ING[i.id].cat!=='sauce'&&!LIQ_IDS[i.id]).sort((a,b)=>b.g-a.g)[0]||R.items[0];
  const sim=P.top[0]?P.top[0].s:0,dish=sim>=.5?P.top[0].d.ko:`${ING[main.id].ko} ${NOVA_ACT[ENG.mainAct(R)]||'요리'}`,ko=id=>id?ING[id].ko:ING[main.id].ko;
  // 성공이면 기존 메뉴와 많이 닮았을 때(80% 이상)는 정석, 덜 닮았을 때는 의외의 발견으로 부른다
  if(!x)return v.kind==='성공'?(sim>=.8?`교과서대로 만든 ${dish}`:`의외로 잘 어울리는 ${dish}`):`조금 아쉬운 ${dish}`;
  return {'덜 익음':`만들다 만 ${dish}`,'탐':`불 조절 실패한 ${dish}`,'짬':`물 한 컵 부르는 ${dish}`,'싱거움':`간을 깜빡한 ${dish}`,'묽음':`물 탄 ${dish}`,
    '너무 많음':`${josa(ko(x.ing),'가','이')} 주인공이 된 ${dish}`,'존재감 없음':`${josa(ko(x.ing),'가','이')} 들어간지도 모르는 ${dish}`,
    '어색한 조합':`${josa(x.a||'','와','과')} ${x.b||''}의 어색한 만남`}[x.t]||`조금 아쉬운 ${dish}`;
}
function novaInfo(){if(!E||!P||!P.top.length)return null;const sim=Math.max(0,Math.min(100,Math.round(P.top[0].s*100))),sig=boardSig();if(!NOVA[sig])scheduleNova(sig);
  const v=novaVerdict();return {sim,base:P.top[0].d.ko,p:100-sim,name:NOVA[sig]||null,verdict:v.kind,why:v.tags[0]?.t||''}}
function scheduleNova(sig){if(novaSig===sig)return;novaSig=sig;clearTimeout(novaTimer);novaTimer=setTimeout(async()=>{if(boardSig()!==sig||!E||!P)return;
  const v=novaVerdict(),combo={재료:R.items.map(i=>({이름:ING[i.id].ko,g:i.g})),조리:Object.values(R.acts).map(a=>({행위:ACT[a.key].ko,온도:a.temp??null,시간:a.time??null})),가까운메뉴:P.top[0]?.d.ko,유사도:Math.round(P.top[0].s*100),
    판정:v.kind,사연:v.tags.map(x=>({사연:x.t,재료:x.ing?ING[x.ing].ko:undefined,재료1:x.a,재료2:x.b})),점수:Math.round(E.score),예시이름:novaFallback(sig)};
  try{const r=await fetch('api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'name',combo})}),j=await r.json();NOVA[sig]=r.ok&&j.name?j.name:novaFallback(sig)}catch(e){NOVA[sig]=novaFallback(sig)}
  if(boardSig()===sig)refreshNames()},1200)}
window.LAB_NOVA=()=>novaInfo();
// 보드 제목의 메뉴 이름을 누르면 바로 고칠 수 있다. 엔터나 다른 곳을 누르면 저장, 비우면 자동 이름으로 돌아간다
document.addEventListener('click',e=>{const b=e.target.closest('#curRec b, #curRec .rnedit');if(!b||document.querySelector('#curRec input'))return;
  const box=$('#curRec'),cur=window.LAB_TITLE()||'';const inp=document.createElement('input');inp.className='rninput';inp.value=cur;inp.maxLength=30;inp.setAttribute('aria-label','메뉴 이름');
  const old=box.querySelector('b');old.replaceWith(inp);box.classList.add('editing');inp.focus();inp.select();
  let fin=false;const done=ok=>{if(fin||!inp.isConnected)return;fin=true;const v=inp.value.trim();if(ok){customName=v&&v!==dishName()?v:(v?v:null)}const nb=document.createElement('b');inp.replaceWith(nb);box.classList.remove('editing');refreshNames();if(ok&&customName)toast(`메뉴 이름을 '${customName}'(으)로 바꿨습니다`)};
  inp.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();done(true)}if(ev.key==='Escape')done(false)};inp.onblur=()=>done(true)});
window.LAB_REFRESH_NAMES=()=>refreshNames();
window.RN_PEN='<button class="rnedit" type="button" title="메뉴 이름 고치기" aria-label="메뉴 이름 고치기"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg></button>';
function refreshNames(){syncName();GRAPH.setPlate(plateInfo());const cp=$('#plateCap');if(cp&&E)cp.textContent=window.LAB_TITLE()||''}
function syncName(){if(nameQuiet){nameQuiet=0;baseSig=boardSig()}const t=window.LAB_TITLE();if(!t)return;
  const rn=document.querySelector('#recBtn .rn');if(rn)rn.textContent=t;const cb=document.querySelector('#curRec b');if(cb){cb.textContent=t;cb.title='눌러서 메뉴 이름 고치기';if(!document.querySelector('#curRec .rnedit'))cb.insertAdjacentHTML('afterend',window.RN_PEN)}
  const ci=document.querySelector('#curRec .cdi'),src=window.DISH_IC?.[t];if(ci&&src)ci.src=src}
let nameQuiet=0;
function update(G,why){
  if(why==='select')return;
  if(cookStop){cookStop();cookStop=null}
  R=ENG.parse(G);GRAPH.setActive(R?R.active:new Set());
  E=R&&R.items.length?ENG.evaluate(R):null;P=E?predictS(R):null;if(E)applyBiz(E,P);HID=hidState();GRAPH.setShares(shareMap());renderSteps(G);syncName();GRAPH.setPlate(plateInfo());
  GRAPH.drawWires();renderResult();
  if(palTab==='ing'&&!q)renderPalette();
}
const bar=(v,c)=>`<span class="bar"><i style="width:${Math.max(0,Math.min(100,v))}%;background:${c}"></i></span>`;
// 맛 프로필: 8각형 레이더(20 단위 눈금, 최소 10으로 표시) + 아래 2×4 값 표. 가장 강한 두 맛을 강조한다
function tasteCard(t){const N=t.length,cx=150,cy=118,R0=86,ang=k=>-Math.PI/2+k*2*Math.PI/N,pt=(k,r)=>[cx+Math.cos(ang(k))*r,cy+Math.sin(ang(k))*r];
  // 맛 값(0–100)을 50–100 점수로 옮겨 보여 준다(50 + 값÷2). 바깥 고리는 100, 50은 반지름 절반 위치다.
  const v=t.map(x=>Math.round(50+Math.max(0,Math.min(1,x))*50)),top=[...v.keys()].sort((a,b)=>v[b]-v[a]).slice(0,2);
  const M=100,rad=x=>R0*Math.min(x,M)/M,st=[50,62.5,75,87.5,100];
  const ring=x=>[...Array(N).keys()].map(k=>pt(k,rad(x)).map(n=>n.toFixed(1)).join(',')).join(' ');
  let g=st.map(x=>`<polygon points="${ring(x)}" class="rg${x===M?' out':''}"/>`).join('');
  g+=[...Array(N).keys()].map(k=>{const [x0,y0]=pt(k,rad(50)),[x,y]=pt(k,R0);return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="ax"/>`}).join('');
  const poly=v.map((x,k)=>pt(k,rad(x)).map(n=>n.toFixed(1)).join(',')).join(' ');
  g+=[50,75,100].map(x=>`<text x="${cx+3}" y="${(cy-rad(x)+3).toFixed(1)}" class="rt">${x}</text>`).join('');
  g+=`<polygon points="${poly}" class="tp"/>`+v.map((x,k)=>{const [px,py]=pt(k,rad(x));return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${top.includes(k)?4:2.6}" class="dt${top.includes(k)?' hi':''}"/>`}).join('');
  g+=v.map((x,k)=>{const [lx,ly]=pt(k,R0+20),a=Math.cos(ang(k));return `<text x="${lx.toFixed(1)}" y="${(ly+4).toFixed(1)}" text-anchor="${Math.abs(a)<.3?'middle':a>0?'start':'end'}" class="tl${top.includes(k)?' hi':''}">${TASTE_AXES[k]} <tspan class="tn">${x}</tspan></text>`}).join('');
    return `<div class="rcard"><h3><span class="h3t">맛 프로필<i class="info" data-htip="완성 접시의 맛 여덟 가지를 50–100 점수로 보여 줍니다&#10;맛이 전혀 없으면 50, 가장 강하면 100이고, 바깥 고리가 100입니다&#10;강한 맛: ${top.map(k=>TASTE_AXES[k]).join('·')}">i</i></span></h3><svg class="radar" viewBox="0 0 300 236" role="img" aria-label="맛 프로필 레이더">${g}</svg></div>`}
function renderResult(){
  const out=$('#res');
  if(!E){setT('');const ff=$('#fairy');if(ff){ff.innerHTML='';ff.classList.remove('open')}out.innerHTML=`<div class="rcard"><h3>결과</h3><p class="hint">재료를 요리 행위에, 마지막 요리 행위를 완성 접시에 연결하면 결과가 나옵니다.</p></div><div class="rcard plate"><h3>접시 그림 <small id="plateCap"></small></h3><canvas id="plateCv" width="640" height="440"></canvas></div>`;PLATE.draw($('#plateCv'),null);return}
  const B=ENG.business(R,P,price,servings),S=ENG.suggest(R,P.novel?[]:P.best.d.core),sc=Math.round(E.score);
  setT(B.time+'분');
  const GR=46,GC=2*Math.PI*GR,gfr=.9*Math.max(0,Math.min(1,sc/100));
  let h=`<div class="rcard scard"><h3>어울림 점수</h3><div class="shead"><div class="sgauge" title="어울림 점수 ${sc}점 (100점 만점)"><svg viewBox="0 0 112 112" aria-hidden="true"><circle cx="56" cy="56" r="${GR}" class="sgt"/><circle cx="56" cy="56" r="${GR}" class="sga" stroke="#10b5a3" stroke-dasharray="${(GC*gfr).toFixed(1)} ${GC.toFixed(1)}" transform="rotate(-90 56 56)"/></svg><div class="score"><b style="color:#0d8a7c">${sc}</b><span>/100</span></div></div>
    <div class="sbars">${[['재료 궁합','pair','#1d5ff2','재료끼리 얼마나 잘 어울리는지'],['맛 균형','taste','#f0960f','맛이 한쪽으로 쏠리지 않고 고른지'],['조리법 적합','method','#7b61ff','재료마다 맞는 조리법인지']].map(([n,k,c,d])=>{const v=Math.round(E.parts[k]);return `<div class="sb" title="${n}: ${d}"><span class="sbn">${n}</span><b style="color:${c}">${v}</b><span class="sbr"><i style="width:${Math.max(3,v)}%;background:${c}"></i></span></div>`}).join('')}</div></div>
    ${E.parts.pen>0||E.biz?`<div class="schips">${E.parts.pen>0?`<span class="sc ng" title="${E.risks.map(r=>r.text).join(' / ')}">위험 감점 −${Math.max(1,Math.round(E.parts.pen*.4))}</span>`:''}${E.biz?`<span class="sc ${E.biz.pen>=1?'ng':'ok'}" title="${E.biz.pen>=1?`${E.biz.cat} 메뉴에 가까워 ${E.biz.biz}에는 덜 맞습니다`:'우리 가게 업종에 맞는 메뉴입니다'}">${UIC('biz','sci')}${E.biz.biz} ${E.biz.pen>=1?'덜 맞음 −'+Math.round(E.biz.pen):'잘 맞음 ✓'}</span>`:''}</div>`:''}</div></div><div class="rcard plate"><h3>접시 그림 <small id="plateCap"></small></h3><canvas id="plateCv" width="640" height="440"></canvas></div>`;
  // 숨은 궁합(기본 펼침, 사용자가 접으면 접힌 채 유지)
  h+=hidCard();
  // 맛 프로필
  h+=tasteCard(E.taste);
  // 창업 참고
  const rate=B.rate,rc=rate==null?'':rate<=.3?'ok':rate<=.38?'warn':'bad';
  h+=`<div class="rcard"><h3>창업 참고 <small>단가·판매가는 데모용 가정값</small></h3><table class="t">
    <tr><td>${UIC('cost','tic')}1인분 재료 원가</td><td class="r">${fmt(B.cost)}원</td></tr>
    ${servings>1?`<tr><td>${servings}인분 합계</td><td class="r">${fmt(B.costAll)}원</td></tr>`:''}
    <tr><td>${UIC('costrate','tic')}원가율 (목표 ${fmt(price)}원)</td><td class="r"><span class="rate ${rc}">${rate==null?'–':fmt(rate*100,1)+'%'}</span></td></tr>
    <tr><td>${UIC('servetime','tic')}조리 시간</td><td class="r">${B.time}분</td></tr>
    <tr><td>난이도</td><td class="r">${B.diffKo} (${B.diff})</td></tr>
    <tr><td>${UIC('price','tic')}비교 판매가</td><td class="r">${B.ref?fmt(B.ref)+'원 ('+P.best.d.ko+')':'–'}</td></tr></table></div>`;
  renderFairy(S);
  // 재료 궁합 근거
  const pp=[...E.pairs].sort((a,b)=>a.v-b.v);
  const INFO=t=>`<i class="info" data-htip="${t}">i</i>`;
  h+=`<div class="rcard"><h3><span class="h3t">재료 궁합 근거${INFO('재료 두 개가 얼마나 잘 어울리는지 −1~+1로 보여 줍니다&#10;파랑은 잘 맞는 쌍, 주황은 서로 충돌하는 쌍입니다&#10;가장 잘 맞는 쌍과 가장 덜 맞는 쌍을 3개씩 골랐습니다')}</span></h3><div class="pairs">${[...pp.slice(0,3),...pp.slice(-3).reverse()].filter((v,i,a)=>a.indexOf(v)===i).map(p=>{const tg=pairTags(p);return `<div class="pp"><span>${ING[p.a].ko} + ${ING[p.b].ko}${tg.map(([x,c])=>` <i class="ptag ${c}">${x}</i>`).join('')}</span><em style="color:${p.v>=0?'#1d5ff2':'#e07a10'}">${p.v>0?'+':''}${p.v.toFixed(2)}</em>${INFO(`${ING[p.a].ko} + ${ING[p.b].ko} · ${p.v>0?'+':''}${p.v.toFixed(2)}&#10;근거: ${pairSrc(p)}`)}</div>`}).join('')}</div></div>`;
  out.innerHTML=h;
  out.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>applyAdd(b.dataset.add));{const dh=out.querySelector('details.hidc');if(dh)dh.addEventListener('toggle',()=>{hidOpenUser=dh.open})}
  out.querySelectorAll('[data-hadd]').forEach(b=>b.onclick=()=>applyAdd(b.dataset.hadd,+b.dataset.g));
  out.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{GRAPH.removeNode(b.dataset.rm);toast('재료를 뺐습니다')});
  drawPlate();
  window.dispatchEvent(new Event('lab:update'));
}
// AI 요약·챗봇에 넘길 요약 자료(점수는 이 계산기가 낸 값 그대로)
// 보고서(PDF)에 넘길 지금 화면 상태
window.LAB_STATE=()=>E?{R,E,P,B:ENG.business(R,P,price,servings),S:ENG.suggest(R,P.novel?[]:P.best.d.core),HID,price,servings,survey:window.DH_SURVEY||null,area:window.LAB_AREA||null,areaName:$('#areaSel').selectedOptions[0]?.textContent||''}:null;
window.LAB_CTX=()=>{if(!E)return null;const B=ENG.business(R,P,price,servings),S=ENG.suggest(R,P.novel?[]:P.best.d.core);const r1=v=>Math.round(v*10)/10;
  return {재료:R.items.map(i=>({이름:ING[i.id].ko,g:i.g,조리:i.path.map(p=>ACT[R.acts[p].key].ko).join('→')||'날것'})),
    요리행위:Object.values(R.acts).map(a=>({행위:ACT[a.key].ko,온도:a.temp??null,시간분:a.time??null})),
    염도:R.salt??null,매운맛목표:R.spicy??null,
    어울림점수:Math.round(E.score),업종적합:E.biz?{업종:E.biz.biz,적합률:Math.round(E.biz.fit*100),감점:E.biz.pen,가까운요리문화:E.biz.cat}:null,세부:{재료궁합:r1(E.parts.pair),맛균형:r1(E.parts.taste),조리법적합:r1(E.parts.method),수치적합:E.parts.param==null?'기본값(평가 안 함)':r1(E.parts.param),위험감점:r1(E.parts.pen)},
    예측메뉴:P.novel?{새조합:P.name,가까운메뉴:P.top.slice(0,3).map(o=>o.d.ko)}:P.top.slice(0,3).map(o=>({메뉴:o.d.ko,확률:Math.round(o.p*100)})),
    맛:Object.fromEntries(E.taste.map((v,k)=>[TASTE_AXES[k],Math.round(v*100)])),
    위험:E.risks.map(r=>r.text),조리법불일치:E.methodBad.map(m=>ING[m.id].ko+'-'+ACT[m.act].ko),
    궁합근거:[...E.pairs].sort((a,b)=>b.v-a.v).filter((v,i,a)=>i<3||i>=a.length-3).map(p=>({조합:ING[p.a].ko+'+'+ING[p.b].ko,값:r1(p.v),근거:pairSrc(p)+(pairTags(p).length?' · '+pairTags(p).map(x=>x[0]).join(', '):'')})),
    넣으면오르는재료:S.add.map(a=>ING[a.id].ko+' +'+r1(a.d)),빼면오르는재료:S.remove.map(a=>ING[a.id].ko+' +'+r1(a.d)),
    설문:window.DH_SURVEY||null,
    창업:{인분:servings,일인분원가:Math.round(B.cost),목표판매가:price,원가율:B.rate==null?null:r1(B.rate*100),조리시간분:B.time,난이도:B.diffKo,비교판매가:B.ref||null,업종범위:scope}}};
// 개선 제안: 보드 오른쪽 아래의 다해봄 셰프 요정이 말풍선으로 알려 준다
let fairySig='',fairyClosed='';
function renderFairy(S){const f=$('#fairy');if(!f)return;
  const items=[...E.risks.map(r=>({k:'warn',t:r.text})),...E.methodBad.map(m=>({k:'soft',t:`${josa(ING[m.id].ko,'를','을')} ${ACT[m.act].ko}: 조리법이 잘 맞지 않아요`}))];
  const dd=d=>d>=1?'+'+Math.round(d):'+'+d.toFixed(1),n=items.length+S.add.length+S.remove.length,sig=JSON.stringify([items.map(x=>x.t),S.add.map(a=>a.id),S.remove.map(a=>a.id)]);
  const lead=items.length?'사장님, 이 부분은 꼭 확인해 주세요!':n?'이렇게 바꾸면 점수가 올라가요.':'지금 조합은 바로 고칠 곳이 없어요. 좋아요!';
  const open=sig!==fairySig?(items.length>0):f.classList.contains('open')&&fairyClosed!==sig;
  f.innerHTML=`<div class="fbub" role="status"><button class="fx" aria-label="닫기">×</button><b class="fttl">다해봄 셰프의 한마디</b><p class="flead">${lead}</p>
    ${items.length?`<ul class="fwarn">${items.map(x=>`<li class="${x.k}">${x.t}</li>`).join('')}</ul>`:''}
    ${S.add.length?`<p class="fsl">넣으면 점수가 오르는 재료</p><div class="fchips">${S.add.map(a=>`<button data-fadd="${a.id}"><img src="img/ing/${a.id}.png" alt="">${ING[a.id].ko} <b>${dd(a.d)}</b></button>`).join('')}</div>`:''}
    ${S.remove.length?`<p class="fsl">빼면 점수가 오르는 재료</p><div class="fchips">${S.remove.map(a=>`<button data-frm="${a.nid}"><img src="img/ing/${a.id}.png" alt="">− ${ING[a.id].ko} <b>${dd(a.d)}</b></button>`).join('')}</div>`:''}</div>
    <button class="fbody" aria-label="개선 제안 보기" title="눌러서 열고 닫기 · 끌어서 옮기기 · 두 번 누르면 제자리"><span class="wing l"></span><span class="wing r"></span><img src="img/fairy.webp" alt="다해봄 셰프">${n?`<i class="fcnt${items.length?' w':''}">${n}</i>`:''}<span class="spk s1">✦</span><span class="spk s2">✦</span></button>`;
  f.classList.toggle('open',open);fairyPlace();if(sig!==fairySig&&n){f.classList.remove('fpopc');void f.offsetWidth;f.classList.add('fpopc')}fairySig=sig;
  f.querySelector('.fbody').onclick=()=>{if(fairyDragged){fairyDragged=false;return}const o=!f.classList.contains('open');f.classList.toggle('open',o);fairyClosed=o?'':sig;fairyPlace()};
  f.querySelector('.fx').onclick=()=>{f.classList.remove('open');fairyClosed=sig};
  f.querySelectorAll('[data-fadd]').forEach(b=>b.onclick=()=>applyAdd(b.dataset.fadd));
  f.querySelectorAll('[data-frm]').forEach(b=>b.onclick=()=>{GRAPH.removeNode(b.dataset.frm);toast('재료를 뺐습니다')});
}
// 요정 옮기기: 셰프를 끌면 보드 안 어디로든 옮겨지고 위치를 기억한다. 말풍선은 요정 위치에 따라 위·아래, 왼쪽·오른쪽으로 펼친다
let fairyDragged=false;
function fairyLoad(){try{return JSON.parse(localStorage.getItem('dh_fairy'))}catch(e){return null}}
function fairyPlace(){const f=$('#fairy'),w=f&&f.parentElement;if(!f||!w)return;const p=fairyLoad(),W=w.clientWidth,H=w.clientHeight,S=74;
  if(p){const x=Math.max(8,Math.min(W-S-8,p.x*W)),y=Math.max(8,Math.min(H-S-8,p.y*H));f.style.left=x+'px';f.style.top=y+'px';f.style.right='auto';f.style.bottom='auto';
    const left=x+S/2<W/2,below=y<Math.min(320,H/2);f.classList.toggle('fl',left);f.classList.toggle('fb',below);
    // 말풍선이 요정 위·아래로 펼쳐지도록 요정 상자 기준점을 옮긴다
    f.style.transform=`translate(${left?0:-(f.offsetWidth-S)}px,${below?0:-(f.offsetHeight-S)}px)`}
  else{f.style.left=f.style.top=f.style.transform='';f.style.right=f.style.bottom='';f.classList.remove('fl','fb')}}
(()=>{const f=$('#fairy');if(!f)return;let st=null;
  f.addEventListener('pointerdown',e=>{const b=e.target.closest('.fbody');if(!b)return;const w=f.parentElement.getBoundingClientRect(),r=b.getBoundingClientRect();st={sx:e.clientX,sy:e.clientY,ox:r.left-w.left,oy:r.top-w.top,moved:false,id:e.pointerId};e.stopPropagation();e.preventDefault()});
  addEventListener('pointermove',e=>{if(!st)return;const dx=e.clientX-st.sx,dy=e.clientY-st.sy;if(!st.moved&&Math.hypot(dx,dy)<5)return;st.moved=true;f.classList.add('dragging');
    const w=f.parentElement;try{localStorage.setItem('dh_fairy',JSON.stringify({x:(st.ox+dx)/w.clientWidth,y:(st.oy+dy)/w.clientHeight}))}catch(err){}fairyPlace()});
  const up=()=>{if(!st)return;if(st.moved)fairyDragged=true;st=null;f.classList.remove('dragging')};
  addEventListener('pointerup',up);addEventListener('pointercancel',up);
  f.addEventListener('dblclick',e=>{if(!e.target.closest('.fbody'))return;try{localStorage.removeItem('dh_fairy')}catch(err){}fairyPlace()});
  addEventListener('resize',fairyPlace);
  // 챗봇을 열면 요정 말풍선을 접는다
  document.querySelector('#chatFab')?.addEventListener('click',()=>{if(f.classList.contains('open')){f.classList.remove('open');fairyClosed=fairySig}})})();
function applyAdd(id,g){
  const G=GRAPH.get(),plate=G.nodes.find(n=>n.type==='plate');
  const main=R.plateActs.length?R.plateActs.map(n=>({n,c:R.items.filter(i=>i.path[i.path.length-1]===n).length})).sort((a,b)=>b.c-a.c)[0].n:null;
  const target=main?(R.items.find(i=>i.path[i.path.length-1]===main)?.path[0]||main):plate.id;
  toast(`${josa(ING[id].ko,'를','을')} 넣었습니다`);const n=GRAPH.addNode('ing',id,g?{g}:{});GRAPH.connect(n.id,target,'in');
}
function drawPlate(){if(cookStop)return;PLATE.draw($('#plateCv'),R,E,P);const cp=$('#plateCap');if(cp)cp.textContent=E?((window.LAB_TITLE&&LAB_TITLE())||(P.novel?P.name:P.best.d.ko))+(progress<1?` · 조리 중 ${Math.round(progress*100)}%`:''):''}

// ---------- 조리 애니메이션 ----------
let cookStop=null;
// 조리 버튼 상태: 평소 '조리 과정 보기', 재생 중 '조리 중 m/T분'(누르면 멈춤)
function cookUI(m,T){document.querySelectorAll('.cookb').forEach(b=>{const l=b.querySelector('.cbl');b.classList.toggle('playing',m!=null);if(l)l.textContent=m==null?'조리 과정 보기':`조리 중 ${m}/${T}분`})}
function cook(){if(!E){toast('완성 접시까지 연결해 주세요');return}
  if(cookStop){cookStop();cookStop=null;cookUI(null);document.querySelector('.rcard.cooking')?.classList.remove('cooking');drawPlate();return}
  const tb=document.querySelector('#resTabs [data-p=res]');if(tb&&!tb.classList.contains('on'))tb.click();
  const cv=$('#plateCv'),card=cv.closest('.rcard');card.scrollIntoView({block:'nearest',behavior:'smooth'});card.classList.add('cooking');
  const T=ENG.business(R,P,price,servings).time;
  const nm=(window.LAB_TITLE&&LAB_TITLE())||(P.novel?P.name:P.best.d.ko),sc0=Math.round(E.score);cookUI(0,T);
  cookStop=PLATE.cook(cv,R,E,P,{onTime:m=>{setT(m+'분');cookUI(m,T)},onDone:()=>{cookStop=null;card.classList.remove('cooking');setT(T+'분');cookUI(null);drawPlate();
    const fl=document.createElement('div');fl.className='doneflash';fl.textContent=`완성 · ${nm} ${sc0}점`;card.appendChild(fl);setTimeout(()=>fl.remove(),2200);
    // 조리가 끝나면 결과 보고서(PDF) 버튼을 접시 그림 아래에 띄운다
    card.querySelector('.rptbtn')?.remove();const rb=document.createElement('button');rb.className='rptbtn';rb.innerHTML='<img src="img/ui/recipe-std.png" alt="">결과 보기 · PDF 받기';rb.onclick=()=>window.REPORT&&REPORT.download(rb);card.appendChild(rb)}});
}
// ---------- 시작 ----------
GRAPH.init($('#board'),update,colorOf);
$('#exSel').innerHTML=Object.entries(EXAMPLES).map(([k,v])=>`<option value="${k}">${v.ko}</option>`).join('');
$('#exSel').onchange=e=>{if(e.target.value==='ai'){$('#reset').click();return}loadEx(e.target.value)};
$('#scope').onchange=e=>{scope=e.target.value;update(GRAPH.get())};
$('#serv').onchange=e=>{servings=+e.target.value;update(GRAPH.get())};
$('#price').oninput=e=>{price=+String(e.target.value).replace(/,/g,'')||0;update(GRAPH.get())};
addEventListener('lab:cook',cook);
$('#reset').onclick=()=>{if(curEx==='ai'&&window.LAB_AIX){GRAPH.load(buildFrom(window.LAB_AIX));GRAPH.layout()}else loadEx(curEx);toast('예시를 처음 상태로 돌렸습니다')};
$('#clearB').onclick=()=>{GRAPH.clear();toast('보드를 비웠습니다. 팔레트에서 재료와 요리 행위를 넣어 보세요')};
$('#layoutB').onclick=()=>GRAPH.layout();
$('#zIn').onclick=()=>GRAPH.setZoom(GRAPH.scale+.1);$('#zOut').onclick=()=>GRAPH.setZoom(GRAPH.scale-.1);$('#zFit').onclick=()=>GRAPH.autoZoom(true);
GRAPH.onZoom(s=>{const z=$('#zPct');if(z)z.textContent=Math.round(s*100)+'%'});
$('#palTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{palTab=b.dataset.t;renderPalette()});
$('#gq').oninput=e=>{q=e.target.value.trim();palTab='ing';renderPalette()};
$('#gq').onkeydown=e=>{if(e.key==='Enter'){const f=$('#palBody .pi');if(f){GRAPH.addNode('ing',f.dataset.k);e.target.value='';q='';renderPalette()}}};
addEventListener('resize',()=>GRAPH.fit());
// ---------- 칸 폭 · 보드 크기 ----------
const LK='mp_lab_layout2';let LY={};try{LY=JSON.parse(localStorage.getItem(LK))||{}}catch(e){}
LY.pc=false;LY.rc=false; // 처음 열 때는 양옆 칸을 모두 펼친다
const saveLY=()=>{try{localStorage.setItem(LK,JSON.stringify(LY))}catch(e){}};
const M=$('.main');
function applyLY(){if(LY.pw)M.style.setProperty('--pw',LY.pw+'px');if(LY.rw)M.style.setProperty('--rw',LY.rw+'px');M.classList.toggle('pc',!!LY.pc);M.classList.toggle('rc',!!LY.rc);if(LY.bh)$('#board').style.height=LY.bh+'px';
  if(LY.pc)M.style.removeProperty('--pw');if(LY.rc)M.style.removeProperty('--rw');requestAnimationFrame(()=>GRAPH.fit())}
function fold(which,on){LY[which+'c']=on;saveLY();applyLY();if(!on){if(which==='p'&&LY.pw)M.style.setProperty('--pw',LY.pw+'px');if(which==='r'&&LY.rw)M.style.setProperty('--rw',LY.rw+'px')}}
document.querySelectorAll('[data-fold]').forEach(b=>b.onclick=()=>fold(b.dataset.fold,true));
document.querySelectorAll('[data-unfold]').forEach(b=>b.onclick=()=>fold(b.dataset.unfold,false));
document.querySelectorAll('.split').forEach(sp=>{
  sp.addEventListener('dblclick',()=>fold(sp.dataset.s,!LY[sp.dataset.s+'c']));
  sp.addEventListener('pointerdown',e=>{e.preventDefault();const w=sp.dataset.s,col=w==='p'?$('#palCol'):$('#resCol'),start=e.clientX,w0=LY[w+'c']?34:col.getBoundingClientRect().width;sp.classList.add('drag');
    if(LY[w+'c']){LY[w+'c']=false;M.classList.remove(w+'c')}
    const mv=ev=>{const d=(ev.clientX-start)*(w==='p'?1:-1),v=Math.round(Math.max(150,Math.min(w==='p'?380:560,w0+d)));LY[w+'w']=v;M.style.setProperty('--'+w+'w',v+'px');GRAPH.fit()};
    const up=()=>{sp.classList.remove('drag');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);saveLY()};
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up)})});
(()=>{const h=$('#bResize');h.addEventListener('pointerdown',e=>{e.preventDefault();const b=$('#board'),y0=e.clientY,h0=b.getBoundingClientRect().height;h.classList.add('drag');
  const mv=ev=>{const v=Math.round(Math.max(360,Math.min(1600,h0+ev.clientY-y0)));b.style.height=v+'px';LY.bh=v;GRAPH.fit()};
  const up=()=>{h.classList.remove('drag');document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);saveLY()};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up)});
  h.addEventListener('dblclick',()=>{$('#board').style.height='';delete LY.bh;saveLY();GRAPH.fit()})})();
$('#board').addEventListener('wheel',e=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();const r=$('#board').getBoundingClientRect();GRAPH.setZoom(GRAPH.scale*(e.deltaY<0?1.08:1/1.08),e.clientX-r.left,e.clientY-r.top)},{passive:false});
applyLY();
renderPalette();bindBoardDrop();
const ex=new URLSearchParams(location.search).get('ex');loadEx(EXAMPLES[ex]?ex:'kimchi');
})();

// 재료 하나의 맛 8가지 작은 레이더(노드 이름·맛 칩에 마우스를 올릴 때)
function ingRadar(I){const N=8,cx=70,cy=62,R0=40,ang=k=>-Math.PI/2+k*2*Math.PI/N,pt=(k,r)=>[cx+Math.cos(ang(k))*r,cy+Math.sin(ang(k))*r].map(v=>v.toFixed(1)).join(',');
  const v=I.taste.map(x=>Math.round(x*100)),ring=f=>[...Array(N).keys()].map(k=>pt(k,R0*f)).join(' ');
  const lab=v.map((x,k)=>{const [lx,ly]=pt(k,R0+13).split(',').map(Number),a=Math.cos(ang(k));return `<text x="${lx}" y="${ly+3}" text-anchor="${Math.abs(a)<.3?'middle':a>0?'start':'end'}" fill="${x>=15?'#ffd58a':'#b9b2a6'}" font-size="9">${TASTE_AXES[k]} ${x}</text>`}).join('');
  return `<b>${I.ko} · 재료 자체의 맛</b><svg viewBox="-28 0 196 126" width="236" height="152">${[.5,1].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="rgba(255,255,255,.25)"/>`).join('')}<polygon points="${v.map((x,k)=>pt(k,R0*Math.max(.04,x/100))).join(' ')}" fill="rgba(255,213,138,.35)" stroke="#ffd58a" stroke-width="1.5"/>${lab}</svg><span>양을 바꿔도 그대로이고, 완성 접시 맛은 결과 칸 맛 프로필에서 봅니다</span>`}
// 숨은 궁합 배지 도움말(마우스를 올리면 근거를 보여 준다)
(()=>{const tip=document.createElement('div');tip.id='htip';document.body.appendChild(tip);
  document.addEventListener('mouseover',e=>{const t=e.target.closest('[data-htip],[data-ting]');if(!t||document.querySelector('.gnode.drag')){tip.classList.remove('on');return}
    tip.innerHTML=t.dataset.ting?ingRadar(ING[t.dataset.ting]):t.dataset.htip.split('\n').map((x,i)=>i?`<span>${x}</span>`:`<b>${x}</b>`).join('');const r=t.getBoundingClientRect();
    tip.classList.add('on');const w=tip.offsetWidth;tip.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';tip.style.top=(r.bottom+8)+'px'})})();
