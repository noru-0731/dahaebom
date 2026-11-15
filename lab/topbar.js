// 상단 바: 왼쪽 레시피 탭(AI 추천 · 일반 레시피 · 실험 레시피), 오른쪽 우리 가게 버튼(업종 · 지역 · 손님 · 가격 · 제공 시간).
// 우리 가게 값(설문)이 바뀌면 일반·실험 레시피 추천을 다시 계산한다. 고른 레시피는 다시 열 때도 보드에 펼친다.
(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v==null||isNaN(v)?'–':Math.round(v).toLocaleString('ko-KR');
const CUR='dh_cur',DR='dh_drafts';
const TAB={ai:'AI 추천',std:'일반',lab:'실험'};const TABL={ai:'AI 추천',std:'일반 레시피',lab:'실험 레시피'};
const CATKO={kor:'한식',west:'양식',asia:'중식·일식',dessert:'디저트'};
const MIN={'5분 이내':5,'10분 이내':10,'15분 이내':15,'20분 이내':20,'20분 이상':null};
// 업종별로 먼저 볼 요리 문화와 많이 파는 메뉴
const BIZ={'한식당':{cats:['kor'],hit:['kimchi','doenjang','jeyuk','bulgogi','bibim']},'분식점':{cats:['kor'],hit:['tteok','kfried','omelet','bibim']},
  '주점·이자카야':{cats:['kor','asia','west'],hit:['jeyuk','omelet','tempura','bulgogi','tteok','mapo']},'양식당':{cats:['west'],hit:['pasta','cream','steak']},
  '중식당':{cats:['asia'],hit:['mapo','curry','tempura']},'일식당':{cats:['asia'],hit:['tempura','curry','omelet']},'카페·디저트':{cats:['dessert'],hit:['pancake','crepe','pudding','mousse','hotchoco']},'기타':{cats:[],hit:[]}};
const ROLE={'안주':['jeyuk','omelet','tempura','bulgogi','tteok','mapo','gbsteak'],'사이드 메뉴':['omelet','tempura','bibim','tteok'],'메인 메뉴':['kimchi','doenjang','jeyuk','bulgogi','bibim','kfried','pasta','cream','steak','curry','mapo'],'디저트':['pancake','crepe','pudding','mousse','tteokgui'],'음료':['hotchoco']};
const get=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const pf=()=>window.DH_SURVEY||null;
const arr=v=>Array.isArray(v)?v.filter(Boolean):(v?[v]:[]);
// 고른 업종들을 합친 기준(요리 문화·단골 메뉴), 고른 메뉴 역할들의 메뉴
const bizOf=p=>{const bs=arr(p?.업종).map(x=>BIZ[x]).filter(Boolean);if(!bs.length)return null;return {cats:[...new Set(bs.flatMap(b=>b.cats))],hit:[...new Set(bs.flatMap(b=>b.hit))]}};
const roleOf=p=>{const rs=arr(p?.메뉴역할).map(x=>ROLE[x]).filter(Boolean);return rs.length?[...new Set(rs.flat())]:null};
let cur=null,open=null,cache=null,rtab=null;

// ---------- 추천 계산 ----------
function judge(it,v){const p=pf(),tags=[];let fit=v.E.score*.5;
  const names=it.X.ings.map(r=>ING[r[0]].ko);
  if(p&&(p.뺄재료||[]).some(k=>names.includes(k)))return null;
  if(p){const b=bizOf(p);if(b&&!arr(p.업종).every(x=>BIZ[x]&&BIZ[x].cats.length))b.cats=[];
    if(b&&b.cats.length){if(b.cats.includes(it.X.cat)){fit+=25;tags.push({t:CATKO[it.X.cat],ok:1})}else fit-=20}
    if(b&&it.key&&b.hit.includes(it.key)){fit+=12;tags.push({t:arr(p.업종).join('·')+' 단골 메뉴',ok:1})}
    const r=roleOf(p);if(r&&it.key&&r.includes(it.key)){fit+=8;tags.push({t:arr(p.메뉴역할).filter(x=>(ROLE[x]||[]).includes(it.key)).join('·'),ok:1})}
    (p.꼭쓸재료||[]).forEach(k=>{if(names.includes(k)){fit+=10;tags.push({t:k+' 포함',ok:1})}});
    if(p.목표재료비){const ok=v.B.cost<=p.목표재료비;fit+=ok?6:-15;tags.push({t:`재료비 ${fmt(v.B.cost)}원`,ok})}
    const m=MIN[p.제공시간];if(m){const ok=v.B.time<=m;fit+=ok?6:-15;tags.push({t:`조리 ${v.B.time}분`,ok})}}
  return {fit,tags}}
function std(){const out=[];Object.entries(EXAMPLES).forEach(([k,X])=>{if(X.kind!=='std')return;const it={id:k,key:k,tab:'std',name:X.ko,X,sub:CATKO[X.cat]};const v=LAB_API.evalX(X);if(!v)return;const j=judge(it,v);if(!j)return;out.push({...it,v,...j})});
  out.sort((a,b)=>b.fit-a.fit);const p=pf(),b=p&&bizOf(p);if(b&&!arr(p.업종).every(x=>BIZ[x]&&BIZ[x].cats.length))b.cats=[];out.forEach((it,k)=>{it.rec=!!p&&k<3;it.other=!!(b&&b.cats.length&&!b.cats.includes(it.X.cat))});return out}
// 추천 레시피에 재료 하나를 더해 다른 메뉴가 되는 조합을 찾는다(재료·요리 행위·수치 합계 6개 이하 유지)
function twist(base,used=new Set()){const p=pf(),X=base.X,have=new Set(X.ings.map(r=>r[0])),ex=new Set(p?.뺄재료||[]),must=new Set(p?.꼭쓸재료||[]);
  const cnt={};X.ings.forEach(r=>{cnt[r[2]]=(cnt[r[2]]||0)+1});const tgt=+Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0][0];
  const baseName=base.v.P.novel?null:base.v.P.best.d.ko;let best=null;
  Object.values(ING).forEach(I=>{if(have.has(I.id)||used.has(I.id)||ex.has(I.ko)||['batter','grain'].includes(I.shape)||['broth','noodle','dough','rice'].includes(I.prop)||['sugar','vinegar','milk'].includes(I.id))return;
    const ings=X.ings.map(r=>[...r]);ings.push([I.id,Math.max(5,Math.round(I.g*.5/5)*5),tgt]);
    const n=()=>ings.length+X.acts.length+X.acts.reduce((s,a)=>s+(a[2]!=null)+(a[3]!=null),0);
    while(n()>6){const c=ings.slice(1,-1).filter(r=>!must.has(ING[r[0]].ko)).sort((a,b)=>a[1]-b[1])[0];if(!c)return;ings.splice(ings.indexOf(c),1)}
    const Y={...X,ko:`${I.ko} ${X.ko}`,kind:'lab',ings};const v=LAB_API.evalX(Y);if(!v||v.E.score<84||v.E.risks.length)return;
    const base3=X.ings.map(r=>ING[r[0]].culture).reduce((a,c)=>a.map((x,i)=>x+c[i]/X.ings.length),[0,0,0]),cy=I.culture,dist=Math.hypot(base3[0]-cy[0],base3[1]-cy[1],base3[2]-cy[2]);
    const changed=v.P.novel||v.P.best.d.ko!==baseName;if(!changed&&dist<.45)return;
    const s=v.E.score+dist*25+(changed?6:0);if(!best||s>best.s)best={s,Y,v,I}});
  if(!best)return null;
  return {id:'tw_'+base.id+'_'+best.I.id,tab:'lab',name:best.Y.ko,X:best.Y,v:best.v,sub:'계산기 실험',desc:`${base.name}에 ${best.I.ko}을(를) 더한 조합. ${best.v.P.novel?'기존 메뉴와 거리가 먼 새 조합입니다':best.v.P.best.d.ko===baseName?'다른 요리 문화의 재료로 '+baseName+'의 맛을 바꿉니다':best.v.P.best.d.ko+'에 가까워집니다'}`,tags:[{t:'기본 '+base.name,ok:1}]}}
function drafts(){return get(DR)}
function aiItems(){const d=drafts();return d?d.items.map(x=>{const v=LAB_API.evalX(x.X);return {id:'ai'+x.idx,tab:x.idx<2?'ai':'lab',name:x.name,X:x.X,v,sub:x.idx<2?x.label:'AI 실험',desc:x.concept}}):[]}
function aiStale(){const d=drafts(),p=pf();if(!d||!p)return false;const a=JSON.stringify(SURVEY.forAI(p)),b=JSON.stringify(SURVEY.forAI(d.survey));return a!==b}
function compute(){const s=std(),ai=aiItems();const tw=[];const seen=new Set();const used=new Set();s.filter(x=>!x.other).slice(0,4).forEach(b=>{const t=twist(b,used);if(t&&!seen.has(t.name)){seen.add(t.name);used.add(t.X.ings.find(r=>!b.X.ings.some(q=>q[0]===r[0]))[0]);tw.push(t)}});
  const labStatic=Object.entries(EXAMPLES).filter(([k,X])=>X.kind==='lab').map(([k,X])=>{const it={id:k,key:k,tab:'lab',name:X.ko,X,sub:'예시 실험'};const v=LAB_API.evalX(X);return v?{...it,v}:null}).filter(Boolean)
    .filter(it=>!(pf()?.뺄재료||[]).some(k=>it.X.ings.some(r=>ING[r[0]].ko===k)));
  cache={ai:ai.filter(x=>x.tab==='ai'),std:s,lab:[...ai.filter(x=>x.tab==='lab'),...tw.slice(0,3),...labStatic]};return cache}
const lists=()=>cache||compute();
function find(id){const c=lists();for(const t of ['ai','std','lab']){const it=c[t].find(x=>x.id===id);if(it)return it}return null}

// ---------- 보드에 펼치기 ----------
function select(id,quiet){const it=find(id);if(!it)return false;
  if(it.key)LAB_API.loadEx(it.key);else LAB_API.loadX(it.X,it.name);
  cur={id,tab:it.tab,name:it.name};put(CUR,cur);mark();close();window.LAB_REFRESH_NAMES?.();
  if(!quiet){const t=$('#toast');if(t){t.textContent=`${TABL[it.tab]} '${it.name}'을(를) 보드에 펼쳤습니다`;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),1800)}}
  return true}

// ---------- 그리기 ----------
const ICON={ai:UIC('ai-rec'),std:UIC('recipe-std'),lab:UIC('recipe-lab'),biz:UIC('biz'),area:UIC('area'),role:UIC('role'),guest:UIC('customer'),money:UIC('price'),time:UIC('servetime')};
const KIC={ai:'ai-rec',std:'recipe-std',lab:'recipe-lab'};
function mark(){const c=lists(),p=pf();
  const rb=$('#recBtn');if(rb){const k=cur?cur.tab:'std';const ri=rb.querySelector('.sic');if(ri&&ri.tagName==='IMG')ri.src='img/ui/'+KIC[k]+'.png';rb.querySelector('.kind').className='kind '+k;rb.querySelector('.kind').textContent=TAB[k];rb.querySelector('.rn').textContent=(window.LAB_TITLE&&LAB_TITLE())||(cur?cur.name:'레시피 고르기');rb.querySelector('.stale').hidden=!aiStale();rb.title=`레시피 고르기 · 지금 ${cur?TAB[k]+' '+cur.name:''}`}
  const n=$('#curRec');if(n)n.innerHTML=cur?`<em class="k-${cur.tab}">${TABL[cur.tab]}</em>${(()=>{const t=(window.LAB_TITLE&&LAB_TITLE())||cur.name;return dishIc(t,'cdi')+`<b>${esc(t)}</b>`+(window.RN_PEN||'')})()}`:'';
  const area=$('#areaSel').selectedOptions[0]?.textContent;
  const v={biz:arr(p?.업종).join('·'),area:p?.지역코드===''?'상권 없음':(area&&$('#areaSel').value?area:p?.지역),guest:[...arr(p?.대상고객),...arr(p?.이용상황)].join(' · ')||null,
    money:`${fmt(+$('#price').value)}원${p?.목표재료비?' / 재료 '+fmt(p.목표재료비):''}${+$('#serv').value>1?' · '+$('#serv').value+'인분':''}`,time:p?.제공시간};
  const ph={biz:'업종 고르기',area:'지역 고르기',guest:'손님 고르기',money:'',time:'제공 시간'};
  const done=[arr(p?.업종).length,p?.지역코드!==undefined||$('#areaSel').value,arr(p?.메뉴역할).length,p?.목표재료비,p?.제공시간].filter(Boolean).length;
  const sum=[v.biz||'업종 미정',v.area,`${fmt(+$('#price').value)}원`].filter(Boolean).join(' · ');
  document.querySelectorAll('#shopBar .pill').forEach(el=>{el.querySelector('.tx').textContent=sum;el.querySelector('.badge').textContent=done<5?done+'/5':'';el.classList.toggle('empty',!arr(p?.업종).length);
    el.title='우리 가게: '+[v.biz,v.area,v.guest,v.money,v.time].filter(Boolean).join(' · ')});
}
function tagHTML(tags){return tags&&tags.length?`<span class="ptags">${tags.map(g=>`<i class="${g.ok?'ok':'no'}">${g.ok?'':'! '}${esc(g.t)}</i>`).join('')}</span>`:''}
function item(it){const sc=it.v?Math.round(it.v.E.score):null,gc=sc==null?'':ENG.gcol(sc);
  return `<button class="rpi${cur&&cur.id===it.id?' on':''}${it.other?' dim':''}" data-id="${it.id}" title="${esc(`재료 ${it.X.ings.length} · 조리 ${it.X.acts.length}${it.v?` · ${it.v.B.time}분 · 재료비 ${fmt(it.v.B.cost)}원`:''}${it.desc?' · '+it.desc:''}`)}">${(()=>{const ko=it.key?EXAMPLES[it.key]?.ko:it.v&&!it.v.P.novel?it.v.P.best.d.ko:null;return dishIc(ko,'rpic')||`<span class="rpic none">${UIC(KIC[it.tab]||'recipe-std','')}</span>`})()}<span class="rpn">${it.rec?'<b class="rec">추천</b>':''}<span class="rpt">${esc(it.name)}</span>${it.sub?`<small>${esc(it.sub)}</small>`:''}</span>${sc!=null?`<b class="rps" style="color:${gc}">${sc}</b>`:''}</button>`}
function shopLine(){const p=pf(),ar=$('#areaSel').value?$('#areaSel').selectedOptions[0]?.textContent:null;return p?`${esc(arr(p.업종).join('·')||'업종 미정')} · ${esc(ar||p.지역||'지역 미정')}${arr(p.메뉴역할).length?' · '+esc(arr(p.메뉴역할).join('·')):''}`:'오른쪽 위 우리 가게 버튼이나 질문 3개로 가게를 정하면 추천이 바뀝니다'}
function recPanel(tab){const c=lists(),items=c[tab],p=pf();let h='';
  const cnt={ai:c.ai.length,std:p?c.std.filter(x=>!x.other).length:c.std.length,lab:c.lab.length};
  h+=`<div class="ptabs2">${['ai','std','lab'].map(t=>`<button data-rt="${t}" class="${t===tab?'on':''}">${ICON[t]}${TABL[t]}${cnt[t]?`<small>${cnt[t]}</small>`:''}${t==='ai'&&aiStale()?'<span class="dot"></span>':''}</button>`).join('')}</div>`;
  if(tab==='ai'){h+=`<div class="rph"><b>${ICON.ai} AI 추천</b><span>${shopLine()}</span></div>`;
    if(aiStale())h+=`<div class="rpwarn">우리 가게 정보가 AI 추천을 만든 뒤 바뀌었습니다.<button data-redraft>지금 정보로 다시 만들기</button></div>`;
    if(!items.length)h+=`<div class="rpempty"><p>아직 AI 추천이 없습니다. 질문 3개(가게 · 메뉴 · 목표)에 답하면 AI가 메뉴를 만들고 계산기가 채점합니다.</p><button class="rpgo" data-survey>설문하고 AI 추천 받기</button></div>`}
  else if(tab==='std'){h+=`<div class="rph"><b>${ICON.std} 일반 레시피</b><span>${pf()?'우리 가게에 맞는 순서 · ':''}많이 파는 메뉴의 기본 조합 · ${shopLine()}</span></div>`}
  else h+=`<div class="rph"><b>${ICON.lab} 실험 레시피</b><span>${pf()?'우리 가게 추천 메뉴에 재료 하나를 더한 조합과 AI 실험안':'잘 안 쓰는 조합을 시험해 보는 레시피'}</span></div>`;
  let otherShown=false;
  h+=items.map(it=>{let pre='';if(it.other&&!otherShown){otherShown=true;pre='<p class="rpsep">다른 업종 메뉴</p>'}return pre+item(it)}).join('');
  if(tab==='ai'&&items.length)h+=`<div class="rpf"><button data-survey>설문 고치기</button><button data-redraft>AI 추천 다시 만들기</button></div>`;
  return h}
// 우리 가게 버튼 편집
function chips(list,key,val){const on=x=>SURVEY.MULTI.has(key)?arr(val).includes(x):val===x;return `<div class="pchips">${list.map(x=>`<button class="${on(x)?'on':''}" data-set="${key}" data-v="${esc(x)}">${key==='업종'?bizIc(x):''}${esc(x)}</button>`).join('')}</div>`}
const step=k=>({choices:SURVEY.CHOICES[k]});
let sdraft=null;
function shopPanel(){const p=sdraft||pf()||{};const g={};SURVEY.places().forEach(([cd,nm,cat])=>(g[cat]=g[cat]||[]).push([cd,nm]));const cv=p.지역코드??$('#areaSel').value;
  const sec=(ic,t,body,note)=>`<div class="psec"><p class="psh"><span>${ic}</span>${t}${note?`<small>${note}</small>`:''}</p>${body}</div>`;
  return `<div class="rph"><b>우리 가게</b><span>고른 뒤 아래 적용하고 닫기를 누르면 추천, 원가율, 업종 적합 점수가 다시 계산됩니다</span></div>`+
    sec(ICON.biz,'업종',chips(SURVEY.CHOICES.업종,'업종',p.업종))+
    sec(ICON.area,'가게 지역',`<select class="psel" data-sel="지역코드"><option value="">목록에 없음 (상권 없이)</option>${Object.entries(g).map(([c,l])=>`<optgroup label="${c}">${l.map(([cd,nm])=>`<option value="${cd}" ${cv===cd?'selected':''}>${nm}</option>`).join('')}</optgroup>`).join('')}</select>`,'서울 실시간 상권')+
    sec(ICON.role,'메뉴 역할',chips(SURVEY.CHOICES.메뉴역할,'메뉴역할',p.메뉴역할))+
    sec(ICON.guest,'주 손님',chips(SURVEY.CHOICES.대상고객,'대상고객',p.대상고객)+chips(SURVEY.CHOICES.이용상황,'이용상황',p.이용상황),'선택')+
    sec(ICON.money,'판매가와 재료비',`<div class="pmoney"><label>목표 판매가(원)<input type="number" step="500" data-num="목표판매가" value="${p.목표판매가||+$('#price').value||9000}"></label><label>목표 재료비(원)<input type="number" step="100" data-num="목표재료비" value="${p.목표재료비||''}" placeholder="예: 2700"></label><label>인분<select data-num="인분">${[1,2,3,4,5,10].map(n=>`<option ${(p.인분||+$('#serv').value)===n?'selected':''}>${n}</option>`).join('')}</select></label></div><p class="psub" id="pRate"></p>`,'')+
    sec(ICON.time,'제공 시간',chips(SURVEY.CHOICES.제공시간,'제공시간',p.제공시간),'선택')+
    `<div class="pfoot"><button class="rpgo" data-moneyok>적용하고 닫기</button><button class="pghost" data-survey>질문 3개로 다시 정하기</button></div><p class="psub pnote">고른 내용은 적용하고 닫기를 누르면 한꺼번에 반영되고, 그 조건의 추천 1위 레시피가 보드에 펼쳐집니다.</p>`}
function setVal(patch){const p={...(pf()||{}),...patch};SURVEY.apply(p)}
function openPop(el,html){close();el.classList.add('open');const pop=el.parentElement.querySelector('.pop');pop.innerHTML=html;pop.hidden=false;open=el;
  pop.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select(b.dataset.id));
  pop.querySelectorAll('[data-rt]').forEach(b=>b.onclick=e=>{e.stopPropagation();rtab=b.dataset.rt;openPop(el,recPanel(rtab))});
  pop.querySelectorAll('[data-survey]').forEach(b=>b.onclick=()=>{close();SURVEY.open()});
  pop.querySelectorAll('[data-redraft]').forEach(b=>b.onclick=()=>{close();SURVEY.redraft()});
  pop.querySelectorAll('[data-set]').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.set,cur=(sdraft||{})[k],v=b.dataset.v;keepMoney(pop);if(SURVEY.MULTI.has(k)){const a=arr(cur);const nx=a.includes(v)?a.filter(x=>x!==v):[...a,v];if((k==='업종'||k==='메뉴역할')&&!nx.length)return;sdraft[k]=nx}else sdraft[k]=cur===v?undefined:v;const sc=pop.scrollTop;openPop(el,shopPanel());el.parentElement.querySelector('.pop').scrollTop=sc});
  pop.querySelectorAll('[data-sel]').forEach(s=>s.onchange=()=>{sdraft[s.dataset.sel]=s.value});
  const rate=()=>{const r=pop.querySelector('#pRate');if(!r)return;const pr=+pop.querySelector('[data-num=목표판매가]').value,c=+pop.querySelector('[data-num=목표재료비]').value;r.textContent=pr>0&&c>0?`목표 원가율 ${(c/pr*100).toFixed(1)}%`:''};
  pop.querySelectorAll('[data-num]').forEach(i=>i.oninput=rate);rate();
  const ok=pop.querySelector('[data-moneyok]');if(ok)ok.onclick=()=>{keepMoney(pop);const v=sdraft;sdraft=null;close();SURVEY.apply(v);cache=null;
    // 바뀐 조건으로 추천 1위 레시피를 보드에 펼친다
    const top=lists().std.find(x=>!x.other)||lists().std[0];if(top){select(top.id,true);const t=$('#toast');if(t){t.textContent=`우리 가게 조건을 적용하고 추천 1위 '${top.name}'을(를) 펼쳤습니다`;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)}}};
}
function close(){document.querySelectorAll('#gnbBar .pill.open').forEach(el=>el.classList.remove('open'));document.querySelectorAll('#gnbBar .pop').forEach(p=>p.hidden=true);open=null}
document.querySelectorAll('#recTabs .pill').forEach(el=>el.onclick=e=>{e.stopPropagation();if(open===el){close();return}rtab=cur?cur.tab:'std';openPop(el,recPanel(rtab))});
function keepMoney(pop){const g=n=>pop.querySelector(`[data-num=${n}]`);if(!g('목표판매가'))return;sdraft.목표판매가=+g('목표판매가').value||9000;sdraft.인분=+g('인분').value||1;const c=+g('목표재료비').value;if(c)sdraft.목표재료비=c}
document.querySelectorAll('#shopBar .pill').forEach(el=>el.onclick=e=>{e.stopPropagation();if(open===el){close();return}sdraft={...(pf()||{})};if(sdraft.지역코드===undefined)sdraft.지역코드=$('#areaSel').value;openPop(el,shopPanel())});
document.addEventListener('click',e=>{if(open&&!e.target.closest('#gnbBar'))close()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&open)close()});
addEventListener('dh:survey',()=>{cache=null;mark()});
addEventListener('dh:places',mark);
$('#areaSel').addEventListener('change',()=>setTimeout(mark,0));

// survey.js가 부른다
function saveDrafts(items,survey){put(DR,{at:Date.now(),survey,items});cache=null;mark()}
window.RECIPES={select,saveDrafts,refresh:()=>{cache=null;mark()},current:()=>cur};

// 시작: 주소에 ?ex=가 없으면 마지막에 고른 레시피로
const ex=new URLSearchParams(location.search).get('ex');
const saved=get(CUR);
if(ex&&EXAMPLES[ex])cur={id:ex,tab:EXAMPLES[ex].kind,name:EXAMPLES[ex].ko};
else if(!(saved&&select(saved.id,true)))cur={id:'kimchi',tab:'std',name:EXAMPLES.kimchi.ko};
mark();
})();
