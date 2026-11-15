// 결과 칸의 AI 요약 탭(상권 한 줄 포함), 떠 있는 사장님 챗봇
(()=>{
const $=s=>document.querySelector(s);
const fmt=v=>v==null?'–':Number(v).toLocaleString('ko-KR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const man=v=>v==null?'–':(v>=1e8?(v/1e8).toFixed(1).replace(/\.0$/,'')+'억':Math.round(v/1e4).toLocaleString('ko-KR')+'만');
const AK='mp_area';let areaCode='POI014',area=null,places=[];try{areaCode=localStorage.getItem(AK)||areaCode}catch(e){}
let chat=[],sumBusy=false,chatBusy=false,lastSumKey='',tab='res';

// ---------- 상권 ----------
async function loadPlaces(){
  try{places=await (await fetch('data/places82.json')).json()}catch(e){places=[]}
  const groups={};places.forEach(([cd,nm,cat])=>(groups[cat]=groups[cat]||[]).push([cd,nm]));
  $('#areaSel').innerHTML=`<option value="">선택 안 함</option>`+Object.entries(groups).map(([g,l])=>`<optgroup label="${g}">${l.map(([cd,nm])=>`<option value="${cd}">${nm}</option>`).join('')}</optgroup>`).join('');
  const sv=window.DH_SURVEY?.지역코드;if(sv!==undefined)areaCode=sv;
  $('#areaSel').value=areaCode;await loadArea();firstDone();
}
// 첫 상권을 받기 전에는 요약·챗봇이 기다리도록 처음 약속을 열어 둔다
let firstDone;let areaP=new Promise(r=>firstDone=r);
function loadArea(){areaP=loadArea0();return areaP}
async function areaReady(){let p;do{p=areaP;await p}while(p!==areaP)}
async function loadArea0(){
  area=null;window.LAB_AREA=null;renderArea();markStale();if(!areaCode)return;
  try{const r=await fetch('api/sangwon?area='+areaCode),j=await r.json();if(!r.ok)throw new Error(j.error||r.status);area=j;window.LAB_AREA=j;renderArea();markStale()}catch(e){renderArea(String(e.message||e))}
}
// AI 요약 탭 위에 상권을 한 줄로: 지역 · 혼잡 · 가장 많은 결제 연령 · 여성 비율 · 음식 가맹점
function renderArea(err){const box=$('#aiArea');if(!box)return;box.classList.add('hasic');
  if(!areaCode){box.innerHTML='<span>상권 없음 · 우리 가게에서 지역을 고르면 AI가 함께 봅니다</span>';return}
  if(err){box.innerHTML=`<span>상권 자료를 받지 못함</span>`;return}
  if(!area){box.innerHTML='<span>상권 받는 중…</span>';return}
  const A=area,lv={'한산한':'#10b5a3','보통':'#1d5ff2','바쁜':'#f59e0b','분주한':'#e5484d'},top=[...A.age].sort((a,b)=>(b.v||0)-(a.v||0))[0],food=A.biz.filter(b=>b.big==='음식·음료').reduce((n,b)=>n+(b.shops||0),0);
  box.innerHTML=`<span>📍 ${esc(A.area)}</span><span class="lv" style="background:${lv[A.level]||'#6b7079'}">${esc(A.level||'–')}</span>${top?`<span>${top.a===60?'60대+':top.a+'대'} ${top.v}%</span>`:''}${A.female!=null?`<span>여성 ${A.female}%</span>`:''}${food?`<span>음식 가맹점 ${fmt(food)}</span>`:''}`;
  box.title='서울 열린데이터광장 실시간 상권현황(신한카드 내국인 결제 기준)';
}

// ---------- AI 공통 ----------
const ctxKey=()=>JSON.stringify([window.LAB_CTX&&window.LAB_CTX(),areaCode]);
function markStale(){const k=ctxKey(),stale=!!lastSumKey&&k!==lastSumKey;const ss=$('#sumState');if(ss)ss.innerHTML=stale?'<p class="aistale">보드나 가게 정보가 바뀌었습니다. ↻ 다시를 누르면 새로 정리합니다.</p>':'';$('#resTabs [data-p=ai]').classList.toggle('dot',stale&&tab!=='ai')}
async function ask(body,onText){
  const r=await fetch('api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(r.status===503){const j=await r.json().catch(()=>({}));throw new Error(j.error==='nokey'?'AI 키가 서버에 아직 등록되지 않았습니다.':(j.error||'서버 설정 문제'))}
  if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||('오류 '+r.status))}
  const rd=r.body.getReader(),dec=new TextDecoder();let all='';
  for(;;){const {done,value}=await rd.read();if(done)break;all+=dec.decode(value,{stream:true});onText(all)}
  return all;
}

// ---------- AI 요약 ----------
let lastSum='';
function kindOf(line,k,n){if(k===0)return ['top','한눈에'];if(k===n-1&&n>2)return ['do','바로 해 볼 것'];
  const hc=/원가|재료비|판매가|마진/.test(line),ha=/상권|손님|고객|결제|연령|20대|30대|40대|50대|여성|남성/.test(line);if(hc&&ha)return ['cost','원가·상권'];if(hc)return ['cost','원가'];if(/상권|손님|고객|결제|연령|20대|30대|40대|50대|여성|남성/.test(line))return ['area','상권·손님'];return ['why','이유']}
function renderSum(text,done){const out=$('#sumOut');const lines=String(text).split('\n').map(x=>x.replace(/^\s*[·•\-\*]\s*/,'').trim()).filter(Boolean);
  const SK=['한눈에','이유','원가','상권·손님','바로 해 볼 것'],sk=from=>SK.slice(from).map(lb=>`<div class="ai-item sk"><span class="ai-lbl">${lb}</span><div class="aiskel"></div></div>`).join('');
  if(!lines.length){out.innerHTML=`<p class="aiwait"><span class="aidots"><i></i><i></i><i></i></span>지금 조합을 읽는 중이에요</p>${sk(0)}`;return}
  out.innerHTML=lines.map((l,k)=>{const [c,lb]=kindOf(l,k,done?lines.length:lines.length+1);return `<div class="ai-item k-${c}"><span class="ai-lbl">${lb}</span><p>${esc(l)}</p></div>`}).join('')+(done?'':sk(lines.length))}
function emptySum(msg){$('#sumOut').innerHTML=`<div class="aiempty">${msg||'지금 보드와 우리 가게 정보를 다섯 줄로 정리합니다.<br>점수, 이유, 원가, 상권 손님, 바로 해 볼 수정 하나.'}<br><button class="btn" data-sum>요약하기</button></div>`;const b=$('#sumOut [data-sum]');if(b)b.onclick=summarize}
function ctxLine(){const c=window.LAB_CTX&&window.LAB_CTX(),n=document.querySelector('#curRec')?.textContent||'',p=window.DH_SURVEY;$('#aiCtx').textContent=[c?`${c.어울림점수}점`:'',n.replace(/^(AI 추천|일반 레시피|실험 레시피)/,''),(Array.isArray(p?.업종)?p.업종.join('·'):p?.업종)].filter(Boolean).join(' · ')}
async function summarize(){
  if(sumBusy)return;const ctx=window.LAB_CTX&&window.LAB_CTX();ctxLine();
  if(!ctx){emptySum('완성 접시까지 연결하면 요약할 수 있습니다.');return}
  sumBusy=true;$('#sumBtn').disabled=true;renderSum('',false);
  try{await areaReady();lastSum=await ask({mode:'summary',ctx,area},t=>renderSum(t,false));renderSum(lastSum,true);lastSumKey=ctxKey();markStale()}
  catch(e){emptySum(esc(e.message))}
  sumBusy=false;$('#sumBtn').disabled=false;
}

// ---------- 챗봇 ----------
function renderChat(){const box=$('#chatLog');
  box.innerHTML=chat.length?chat.map(m=>m.role==='assistant'?`<div class="mrow"><img class="mav" src="img/mascot-face.webp" alt=""><div class="msg assistant${m.err?' err':''}"></div></div>`:`<div class="msg user"></div>`).join('')
    :'<p class="hint">보드를 고치면서 바로 물어보세요. 지금 보드의 조합과 상단에서 고른 지역을 보고 답합니다.</p><div class="chello"><img src="img/mascot.webp" alt="다해봄 셰프"><b>안녕하세요, 사장님! 👋</b><p>메뉴 아이디어와 원가 고민,<br>다해봄이 함께 살펴볼게요.</p></div>';
  box.querySelectorAll('.msg').forEach((el,i)=>el.textContent=chat[i].content||'…');box.scrollTop=box.scrollHeight}
async function send(text){
  text=String(text||'').trim();if(!text||chatBusy)return;
  const ctx=window.LAB_CTX&&window.LAB_CTX();
  chat.push({role:'user',content:text},{role:'assistant',content:''});$('#chatIn').value='';renderChat();
  chatBusy=true;$('#chatSend').disabled=true;const cur=chat[chat.length-1],el=[...$('#chatLog').querySelectorAll('.msg')].pop();
  try{await areaReady();await ask({mode:'chat',ctx,area,messages:chat.slice(0,-1).filter(m=>!m.err&&m.content)},t=>{cur.content=t;el.textContent=t;$('#chatLog').scrollTop=1e9})}
  catch(e){cur.content=e.message;cur.err=1;el.textContent=e.message;el.classList.add('err')}
  chatBusy=false;$('#chatSend').disabled=false;
}

// ---------- 시작 ----------
$('#areaSel').onchange=e=>{if(!e.target.options.length)return; // 목록을 받기 전 변경은 무시(빈 값으로 덮지 않게)
  areaCode=e.target.value;try{localStorage.setItem(AK,areaCode)}catch(_){}loadArea()};
$('#sumCopy').onclick=()=>{if(!lastSum)return;try{navigator.clipboard.writeText(lastSum)}catch(e){}const t=$('#toast');if(t){t.textContent='요약을 복사했습니다';t.classList.add('on');setTimeout(()=>t.classList.remove('on'),1500)}};
addEventListener('lab:update',ctxLine);addEventListener('dh:survey',ctxLine);
$('#sumBtn').onclick=summarize;
$('#chatSend').onclick=()=>send($('#chatIn').value);
$('#chatIn').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send(e.target.value)}};
$('#chatClear').onclick=()=>{chat=[];renderChat()};
document.querySelectorAll('#chatChips button').forEach(b=>b.onclick=()=>send(b.textContent));
addEventListener('lab:update',markStale);
// 결과 칸 탭
function setTab(p){tab=p;document.querySelectorAll('#resTabs button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  document.querySelectorAll('.rpane').forEach(el=>el.classList.toggle('on',el.dataset.p===p));
  if(p==='ai'){$('#resTabs [data-p=ai]').classList.remove('dot');if(!lastSumKey&&!sumBusy&&window.LAB_CTX&&window.LAB_CTX())summarize()}}
document.querySelectorAll('#resTabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.p));
// 떠 있는 챗봇 창
function openChat(on){$('#chatWin').hidden=!on;$('#chatFab').classList.toggle('open',on);$('#chatFab').setAttribute('aria-expanded',on);if(on){$('#chatLog').scrollTop=1e9;$('#chatIn').focus()}}
$('#chatFab').onclick=()=>openChat(true);$('#chatClose').onclick=()=>openChat(false);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#chatWin').hidden)openChat(false)});
renderChat();loadPlaces();emptySum();ctxLine();
})();
