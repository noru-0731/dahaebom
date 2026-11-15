// 가게·메뉴 질문 3화면 → AI 첫 메뉴 초안 3개 → 계산기 채점 → 고른 안을 보드에 펼치기
(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v==null||isNaN(v)?'–':Math.round(v).toLocaleString('ko-KR');
const SK='dh_survey';
let places=[];
const CHOICES={업종:['한식당','분식점','주점·이자카야','카페·디저트','양식당','중식당','일식당','기타'],메뉴역할:['메인 메뉴','안주','사이드 메뉴','디저트','음료'],
  대상고객:['20대','30대','40대','50대 이상','전 연령'],이용상황:['점심 식사','저녁 모임','혼밥','가족 외식','간식·카페','배달 식사'],제공시간:['5분 이내','10분 이내','15분 이내','20분 이내','20분 이상']};
// 화면 3개. need: 꼭 답해야 하는 항목
const STEPS=[
  {title:'우리 가게',hint:'업종에 맞춰 추천 메뉴와 예측 범위가 바뀌고, 지역은 서울 실시간 상권 자료로 이어집니다.',need:['업종'],groups:[{k:'업종',label:'업종 (여러 개 선택 가능)'},{type:'area',label:'가게 지역(상권)'}]},
  {title:'만들 메뉴',hint:'메뉴 역할은 꼭 골라 주세요. 손님은 고르지 않아도 됩니다.',need:['메뉴역할'],groups:[{k:'메뉴역할',label:'메뉴 역할 (여러 개 선택 가능)'},{k:'대상고객',label:'주 손님 (선택 · 여러 개)'},{k:'이용상황',label:'이용 상황 (선택 · 여러 개)'}]},
  {title:'목표',hint:'1인분 기준입니다. 초안 카드에서 목표를 지켰는지 표시합니다.',need:[],groups:[{type:'money'},{k:'제공시간',label:'제공 시간 (선택)'},{type:'ings'}]},
];
const GIC={업종:'biz',메뉴역할:'role',대상고객:'customer',이용상황:'channel',제공시간:'servetime'};
const STEP_COMPAT=Object.keys(CHOICES).map(k=>({k,choices:CHOICES[k]})); // 상단 바 호환용
let d={},i=0,root=null,ingOpen=false;
// 여러 개 고를 수 있는 항목(업종, 메뉴 역할, 손님). 예전처럼 한 값으로 저장된 것도 배열로 읽는다
const MULTI=new Set(['업종','메뉴역할','대상고객','이용상황']);
const arr=v=>Array.isArray(v)?v.filter(Boolean):(v?[v]:[]);
function load(){try{return JSON.parse(localStorage.getItem(SK))||null}catch(e){return null}}
function save(v){try{localStorage.setItem(SK,JSON.stringify(v))}catch(e){}}
window.DH_SURVEY=load();

// ---------- 창 ----------
function open(){
  if(root)return;const cw=$('#chatWin');if(cw&&!cw.hidden)$('#chatClose').click();
  const prev=load()||{};d={...prev,꼭쓸재료:[...(prev.꼭쓸재료||[])],뺄재료:[...(prev.뺄재료||[])]};
  if(!d.목표판매가)d.목표판매가=+String($('#price').value).replace(/,/g,'')||9000;
  if(!d.목표재료비)d.목표재료비=Math.round(d.목표판매가*.3/100)*100;
  if(d.지역코드===undefined)d.지역코드=$('#areaSel').value||'POI014';
  root=document.createElement('div');root.className='sv';root.innerHTML='<div class="svbox" role="dialog" aria-modal="true"></div>';document.body.appendChild(root);
  document.body.style.overflow='hidden';i=0;ingOpen=!!(d.꼭쓸재료.length||d.뺄재료.length);render();
}
function close(){root&&root.remove();root=null;document.body.style.overflow=''}
// 지역 찾기: 서울 82곳에서 이름·분류·초성으로 찾는다
const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const cho=t=>[...t].map(c=>{const k=c.charCodeAt(0)-0xAC00;return k>=0&&k<11172?CHO[Math.floor(k/588)]:c}).join('');
function pickLabel(){const p=places.find(x=>x[0]===d.지역코드);return d.지역코드===''?'<b>상권 없이 진행</b>':p?`<span>선택한 지역</span><b>${esc(p[1])}</b><small>${esc(p[2])}</small>`:'<span>아직 고르지 않음</span>'}
function areaHits(q){q=q.replace(/\s/g,'');if(!q)return [];const jamo=/^[ㄱ-ㅎ]+$/.test(q);
  return places.filter(([cd,nm,cat])=>{const n=nm.replace(/\s/g,'');return jamo?cho(n).includes(q):n.includes(q)||cat.includes(q)}).sort((a,b)=>(a[1].indexOf(q)<0?99:a[1].indexOf(q))-(b[1].indexOf(q)<0?99:b[1].indexOf(q))).slice(0,10)}
function bindArea(box){const inp=box.querySelector('.svsearch');if(!inp)return;const res=box.querySelector('.svres'),pick=box.querySelector('.svpick');
  const fill=()=>{const h=areaHits(inp.value);res.innerHTML=(inp.value.trim()?(h.length?h.map(([cd,nm,cat])=>`<button class="svpl${d.지역코드===cd?' on':''}" data-cd="${cd}">${esc(nm)}<small>${esc(cat)}</small></button>`).join(''):'<p class="svnone">찾는 지역이 없습니다. 82곳 안에서만 찾을 수 있어요.</p>'):'')+`<button class="svpl none${d.지역코드===''?' on':''}" data-cd="">목록에 없음 (상권 없이 진행)</button>`;
    res.querySelectorAll('[data-cd]').forEach(b=>b.onclick=()=>{d.지역코드=b.dataset.cd;pick.innerHTML=pickLabel();inp.value='';fill()})};
  inp.oninput=fill;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const b=res.querySelector('[data-cd]:not(.none)');if(b)b.click()}};fill()}
function group(g){
  if(g.k)return `<p class="svsub">${UIC(GIC[g.k]||'biz','sic2')}${g.label}</p>${chips(CHOICES[g.k],g.k)}`;
  if(g.type==='area')return `<p class="svsub">${UIC('area','sic2')}${g.label}</p><div class="svarea"><div class="svpick">${pickLabel()}</div><input class="svsearch" type="search" placeholder="동네나 역 이름으로 찾기 (예: 홍대, 성수, ㄱㄴ)" autocomplete="off"><div class="svres"></div></div>`;
  if(g.type==='money')return `<div class="svmoney"><label>${UIC('price','sic2')}목표 판매가(원)<input type="number" min="1000" step="500" data-n="목표판매가" value="${d.목표판매가}"></label><label>${UIC('cost','sic2')}목표 재료비(원)<input type="number" min="100" step="100" data-n="목표재료비" value="${d.목표재료비}"></label></div><p class="svhelp" id="svRate"></p>`;
  if(g.type==='ings'){const n=d.꼭쓸재료.length+d.뺄재료.length;
    if(!ingOpen)return `<button class="svmore" data-ingopen>+ 꼭 쓸 재료 · 뺄 재료 정하기 (선택${n?' · '+n+'개 정함':''})</button>`;
    return `<p class="svsub">꼭 쓸 재료 · 뺄 재료 (선택) <small>한 번 누르면 꼭 쓸 재료, 두 번 누르면 뺄 재료, 세 번 누르면 해제</small></p><div class="svlegend"><span class="m">꼭 쓸 재료 ${d.꼭쓸재료.length}</span><span class="x">뺄 재료 ${d.뺄재료.length}</span></div><div class="svings">${Object.keys(CATS).map(c=>`<div class="svgrid">${Object.values(ING).filter(I=>I.cat===c).map(I=>{const m=d.꼭쓸재료.includes(I.ko),x=d.뺄재료.includes(I.ko);return `<button class="svi${m?' m':x?' x':''}" data-ing="${I.ko}"><img src="img/ing/${I.id}.png" alt="">${I.ko}${m?' ✓':x?' ✕':''}</button>`}).join('')}</div>`).join('')}</div>`}
  return '';
}
function render(){
  const box=root.querySelector('.svbox'),st=STEPS[i],n=i+1,last=n===STEPS.length;
  box.classList.remove('wide');
  box.innerHTML=`<button class="svx" aria-label="닫기">×</button><div class="svtop"><span>AI 메뉴 초안 · 질문 ${STEPS.length}개</span><span>${n} / ${STEPS.length}</span></div><div class="svbar"><i style="width:${n/STEPS.length*100}%"></i></div>
    <h2>${st.title}</h2><p class="svp">${st.hint}</p><div class="svbody">${st.groups.map(group).join('')}</div><p class="sverr" id="svErr"></p>
    <div class="svbtns">${i?'<button class="svghost" data-act="prev">이전</button>':'<button class="svghost" data-act="skip">예시로 먼저 둘러보기</button>'}<span></span><button class="svgo" data-act="next">${last?'AI 초안 만들기':'다음'}</button></div>`;
  bind();rate();
}
function chips(list,k){const on=v=>MULTI.has(k)?arr(d[k]).includes(v):d[k]===v;return `<div class="svchoices">${list.map(v=>`<button class="svc${on(v)?' on':''}" data-k="${k}" data-v="${esc(v)}">${k==='업종'?bizIc(v):''}${on(v)&&MULTI.has(k)?'✓ ':''}${esc(v)}</button>`).join('')}</div>`}
function rate(){const el=root&&root.querySelector('#svRate');if(el){const p=+d.목표판매가,c=+d.목표재료비;el.textContent=p>0&&c>0?`목표 원가율 ${(c/p*100).toFixed(1)}% · 보통 외식업은 30% 안팎을 목표로 잡습니다.`:''}}
function bind(){const box=root.querySelector('.svbox');
  box.querySelector('.svx').onclick=()=>{close();if(!load()){try{localStorage.setItem('dh_survey_skip','1')}catch(e){}}if(window.TOUR&&!TOUR.seen())TOUR.start()};
  box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k,need=STEPS[i].need.includes(k);const v=b.dataset.v;if(MULTI.has(k)){const a=arr(d[k]);d[k]=a.includes(v)?a.filter(x=>x!==v):[...a,v]}else d[k]=(!need&&d[k]===v)?undefined:v;const sc=box.scrollTop;render();root.querySelector('.svbox').scrollTop=sc});
  box.querySelectorAll('[data-n]').forEach(inp=>inp.oninput=()=>{d[inp.dataset.n]=+inp.value;rate()});
  box.querySelectorAll('[data-f]').forEach(sel=>sel.onchange=()=>{d[sel.dataset.f]=sel.value});bindArea(box);
  const mo=box.querySelector('[data-ingopen]');if(mo)mo.onclick=()=>{ingOpen=true;render()};
  box.querySelectorAll('[data-ing]').forEach(b=>b.onclick=()=>{const k=b.dataset.ing,m=d.꼭쓸재료,x=d.뺄재료;
    if(m.includes(k)){d.꼭쓸재료=m.filter(v=>v!==k);x.push(k)}else if(x.includes(k)){d.뺄재료=x.filter(v=>v!==k)}else m.push(k);const sc=box.querySelector('.svings').scrollTop,bs=box.scrollTop;render();root.querySelector('.svings').scrollTop=sc;root.querySelector('.svbox').scrollTop=bs});
  box.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act;
    if(a==='skip'){close();try{localStorage.setItem('dh_survey_skip','1')}catch(e){}if(window.TOUR&&!TOUR.seen())TOUR.start();return}
    if(a==='prev'){i--;render();return}
    if(!valid())return;
    if(i<STEPS.length-1){i++;render()}else finish()});
}
function valid(){const st=STEPS[i],err=root.querySelector('#svErr');
  const miss=st.need.filter(k=>!arr(d[k]).length);if(miss.length){err.textContent=`${miss.join(', ')}을(를) 골라 주세요.`;return false}
  if(st.groups.some(g=>g.type==='money')&&!(d.목표판매가>0&&d.목표재료비>0&&d.목표재료비<d.목표판매가)){err.textContent='판매가보다 낮은 재료비 목표를 넣어 주세요.';return false}
  return true}

// ---------- 설문 반영과 AI 초안 ----------
const SCOPE={'한식당':'kor','분식점':'kor','양식당':'west','중식당':'asia','일식당':'asia','카페·디저트':'dessert'};
const MIN={'5분 이내':5,'10분 이내':10,'15분 이내':15,'20분 이내':20,'20분 이상':null};
let area=null;
// 설문 값을 저장하고 메인 화면(업종 범위, 판매가, 인분, 상권, 팔레트, 상단 탭)에 적용한다
function apply(v,quiet){
  v={...v};if(v.지역코드!==undefined)v.지역=v.지역코드?(places.find(p=>p[0]===v.지역코드)||[])[1]||v.지역:'목록에 없음';
  save(v);window.DH_SURVEY=v;
  {const sc=[...new Set(arr(v.업종).map(x=>SCOPE[x]||'all'))];LAB_API.setScope(sc.length===1?sc[0]:'all')}if(v.목표판매가)LAB_API.setPrice(v.목표판매가);if(v.인분)LAB_API.setServings(v.인분);
  if(v.지역코드&&$('#areaSel').value!==v.지역코드){$('#areaSel').value=v.지역코드;$('#areaSel').dispatchEvent(new Event('change'))}
  LAB_API.refreshPalette();if(!quiet)dispatchEvent(new Event('dh:survey'));return v;
}
async function finish(){d=apply(d);draft()}
function surveyForAI(){const {지역코드,인분,...rest}=d;return rest}
async function draft(){
  const box=root.querySelector('.svbox');
  const tags=[arr(d.업종).join('·'),d.지역,arr(d.메뉴역할).join('·'),[...arr(d.대상고객),...arr(d.이용상황)].join(' · '),`판매가 ${fmt(d.목표판매가)}원 · 재료비 ${fmt(d.목표재료비)}원`,d.제공시간,(d.꼭쓸재료||[]).length?'꼭 쓸 재료 '+d.꼭쓸재료.join(', '):'',(d.뺄재료||[]).length?'뺄 재료 '+d.뺄재료.join(', '):''].filter(Boolean);
  box.classList.add('wide');
  box.innerHTML=`<button class="svx" aria-label="닫기">×</button><span class="svtag">AI 메뉴 초안</span><h2>우리 가게 첫 메뉴 초안을 만들고 있습니다</h2>
    <div class="svtags">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
    <div class="svload"><div class="spin"></div><p id="svLoadTxt">상권 자료를 읽는 중입니다</p><small>보통 20~30초 걸립니다. AI가 재료·양·온도·순서를 정하면 계산기가 바로 채점합니다.</small></div>`;
  box.querySelector('.svx').onclick=close;
  const msgs=['상권 자료를 읽는 중입니다','재료 48종에서 고르는 중입니다','재료비와 제공 시간 목표에 맞추는 중입니다','조리 순서와 온도를 정하는 중입니다','세 가지 방향으로 다듬는 중입니다'];let mi=0;
  const tm=setInterval(()=>{const el=root&&root.querySelector('#svLoadTxt');if(el)el.textContent=msgs[++mi%msgs.length]},4500);
  try{
    area=null;if(d.지역코드){try{const r=await fetch('api/sangwon?area='+d.지역코드);if(r.ok)area=await r.json()}catch(e){}}
    const r=await fetch('api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'draft',survey:surveyForAI(),area})});
    const j=await r.json().catch(()=>({}));clearInterval(tm);
    if(!r.ok)throw new Error(j.error==='nokey'?'AI 키가 서버에 아직 등록되지 않았습니다.':(j.error||'오류 '+r.status));
    if(!root)return;cards((j.recipes||[]).map(clean).filter(Boolean));
  }catch(e){clearInterval(tm);if(!root)return;
    root.querySelector('.svload').innerHTML=`<p>${esc(e.message||e)}</p><div class="svbtns"><button class="svghost" data-r="ex">예시로 시작하기</button><span></span><button class="svgo" data-r="again">다시 만들기</button></div>`;
    root.querySelector('[data-r=ex]').onclick=()=>{close();if(window.TOUR&&!TOUR.seen())TOUR.start()};root.querySelector('[data-r=again]').onclick=draft}
}
// AI가 낸 레시피를 실험실 틀로 바꾸고 범위를 지킨다
function clean(rc){
  const acts=(rc.acts||[]).filter(a=>ACT[a.key]).slice(0,4);
  const A=acts.map((a,k)=>{const R=ACT[a.key],cl=(v,r,dv)=>{if(!r||!v)return null;const x=Math.max(r[0],Math.min(r[1],Math.round(v)));return x===dv?null:x};
    let to=Number.isInteger(a.to)&&a.to>k&&a.to<acts.length?a.to:-1;return [a.key,to,cl(a.temp,R.temp,R.dTemp),cl(a.time,R.time,R.dTime)]});
  const ex=new Set(d.뺄재료||[]);
  const seen=new Set();const I=(rc.ings||[]).filter(x=>ING[x.id]&&!ex.has(ING[x.id].ko)&&!seen.has(x.id)&&seen.add(x.id)).slice(0,10)
    .map(x=>[x.id,Math.max(1,Math.min(2000,Math.round(x.g)||ING[x.id].g)),x.to===-1?-1:Number.isInteger(x.to)&&x.to>=0&&x.to<A.length?x.to:(A.length?A.length-1:-1)]);
  if(!I.length)return null;
  // 보드가 한눈에 보이도록 재료·요리 행위·수치 노드를 합쳐 6개 이하로: 수치를 기본값으로 돌리고, 그래도 넘치면 적은 재료부터 뺀다
  const count=()=>I.length+A.length+A.reduce((n,a)=>n+(a[2]!=null)+(a[3]!=null),0);
  const must=new Set(d.꼭쓸재료||[]);
  for(let k=A.length-1;k>=0&&count()>6;k--){if(A[k][3]!=null&&count()>6)A[k][3]=null;if(A[k][2]!=null&&count()>6)A[k][2]=null}
  while(count()>6&&I.length>2){const cand=I.filter(x=>!must.has(ING[x[0]].ko)).sort((a,b)=>a[1]-b[1])[0];if(!cand)break;I.splice(I.indexOf(cand),1)}
  const X={ko:rc.name,ings:I,acts:A};
  const missing=(d.꼭쓸재료||[]).filter(k=>!I.some(x=>ING[x[0]].ko===k));
  return {X,name:rc.name||'이름 없는 초안',concept:rc.concept||'',fit:rc.fit||'',missing};
}
function cards(list){
  const box=root.querySelector('.svbox');if(!list.length){box.querySelector('.svload').innerHTML='<p>쓸 수 있는 초안이 나오지 않았습니다. 다시 만들어 주세요.</p>';return}
  const goalT=MIN[d.제공시간],lbl=['1안 · 익숙한 메뉴','2안 · 상권 맞춤','3안 · 새로운 조합'];
  const scored=list.map(c=>({...c,v:LAB_API.evalX(c.X,d.목표판매가)}));
  window.RECIPES&&RECIPES.saveDrafts(scored.map((c,k)=>({idx:k,name:c.name,X:c.X,concept:c.concept,fit:c.fit,label:lbl[k]||''})),surveyForAI());
  box.innerHTML=`<button class="svx" aria-label="닫기">×</button><span class="svtag">AI 메뉴 초안</span><h2>첫 메뉴 초안 ${scored.length}개를 만들었습니다</h2>
    <p class="svp">AI가 제안한 재료와 조리 순서를 계산기가 채점했습니다. 하나를 고르면 레시피 보드에 펼쳐지고, 바로 고쳐 볼 수 있습니다.</p>
    <div class="svcards">${scored.map((c,k)=>{const v=c.v;if(!v)return '';const sc=Math.round(v.E.score),B=v.B,gc=ENG.gcol(sc);
      const costOk=B.cost<=d.목표재료비,timeOk=goalT==null||B.time<=goalT;
      return `<article class="svcard"><span class="svlbl">${lbl[k]||(k+1)+'안'}</span><h3>${esc(c.name)}</h3>
        <div class="svscore"><b style="color:${gc}">${sc}</b><span>/100 어울림</span><em>${v.P.novel?'새 조합 · '+esc(v.P.name):esc(v.P.best.d.ko)+' '+Math.round(v.P.top[0].p*100)+'%'}</em></div>
        <ul class="svm"><li class="${costOk?'ok':'no'}">재료비 ${fmt(B.cost)}원 <small>목표 ${fmt(d.목표재료비)}원 ${costOk?'안':'초과'}</small></li>
          <li class="${B.rate!=null&&B.rate<=.35?'ok':'no'}">원가율 ${B.rate==null?'–':(B.rate*100).toFixed(1)+'%'} <small>판매가 ${fmt(d.목표판매가)}원</small></li>
          <li class="${timeOk?'ok':'no'}">조리 ${B.time}분 <small>목표 ${esc(d.제공시간)}</small></li></ul>
        <p class="svings2">${c.X.ings.map(x=>`${ING[x[0]].ko} ${x[1]}g`).join(' · ')}</p>
        <p class="svcon">${esc(c.concept)}</p><p class="svfit">${esc(c.fit)}</p>
        ${c.missing.length?`<p class="svwarn">꼭 쓸 재료 ${esc(c.missing.join(', '))}이(가) 빠졌습니다</p>`:''}
        ${v.E.risks.length?`<p class="svwarn">${esc(v.E.risks[0].text)}</p>`:''}
        <button class="svgo" data-pick="${k}">이 안으로 시작</button></article>`}).join('')}</div>
    <div class="svbtns"><button class="svghost" data-r="again">다시 만들기</button><span></span><button class="svghost" data-r="redo">설문 고치기</button></div>`;
  box.querySelector('.svx').onclick=close;
  box.querySelector('[data-r=again]').onclick=draft;box.querySelector('[data-r=redo]').onclick=()=>{box.classList.remove('wide');i=0;render()};
  box.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const k=+b.dataset.pick;close();RECIPES.select(k<2?'ai'+k:'ai2');
    scrollTo({top:0,behavior:'smooth'});if(window.TOUR&&!TOUR.seen())setTimeout(()=>TOUR.start(),900)});
}

// ---------- 시작 ----------
fetch('data/places82.json').then(r=>r.json()).then(j=>{places=j;dispatchEvent(new Event('dh:places'))}).catch(()=>{});
const sb=$('#surveyBtn');if(sb)sb.onclick=open;
// 다시 열 때도 설문의 업종·판매가를 메인 화면에 적용한다
if(window.DH_SURVEY)apply(window.DH_SURVEY,true);
let skip=false;try{skip=!!localStorage.getItem('dh_survey_skip')}catch(e){}
// 시작 화면의 '조합 시작하기'(?survey=1)로 들어오면 늘 설문을 연다. 그 밖에는 처음 한 번만
const qs=new URLSearchParams(location.search);
if(qs.get('survey')){setTimeout(open,500);history.replaceState(null,'',location.pathname)}
else if(!window.DH_SURVEY&&!skip&&!qs.get('ex'))setTimeout(open,700);
// 설문 창 없이 지금 값으로 AI 초안만 다시 만든다
function redraft(){const v=load();if(!v||!arr(v.업종).length||!arr(v.메뉴역할).length){open();return}open();d={...v,꼭쓸재료:[...(v.꼭쓸재료||[])],뺄재료:[...(v.뺄재료||[])]};finish()}
window.SURVEY={open,apply,redraft,CHOICES,arr,MULTI,STEPS:STEP_COMPAT,places:()=>places,forAI:v=>{const {지역코드,인분,...rest}=v||{};return rest}};
})();
