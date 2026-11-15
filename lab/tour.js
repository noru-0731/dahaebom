// 처음 들어오면 화면을 흐리게 덮고 한 곳씩 밝히며 쓰는 법을 보여 주는 안내
(()=>{
const $=s=>document.querySelector(s);
const KEY='dh_tour_v2';
const tofuEl=()=>{const n=GRAPH.get().nodes.find(n=>n.type==='ing'&&n.key==='tofu');return n?document.querySelector(`#board [data-id="${n.id}"]`):null};
const score=()=>{const c=window.LAB_CTX&&window.LAB_CTX();return c?c.어울림점수:null};
const setTab=p=>{const b=document.querySelector(`#resTabs [data-p=${p}]`);if(b&&!b.classList.contains('on'))b.click()};
let tofuBefore=null,tofuG=null;
const STEPS=[
  {title:'메뉴 궁합 실험실 사용법',text:'재료를 잇기만 하면 어떤 메뉴가 될지, 얼마나 어울리는지, 원가가 얼마인지 바로 계산합니다. 여섯 단계로 짧게 보여 드릴게요.'},
  {sel:'#recTabs',title:'1. 레시피 고르기',text:'맨 위 레시피 버튼을 누르면 AI 추천, 일반 레시피, 실험 레시피가 열리고, 고르면 보드에 바로 펼쳐집니다. 보드 제목의 연필 버튼으로 메뉴 이름을 직접 바꿀 수 있고, 바꾼 이름은 완성 접시와 PDF 보고서에도 들어갑니다.'},
  {sel:'#palCol',title:'2. 재료와 요리 행위 놓기',text:'재료와 요리 행위를 누르거나 보드로 끌어 놓습니다. 위쪽 찾기 칸에 재료 이름을 쳐도 되고, ✦ 잘 맞는 재료 칸에는 지금 보드와 궁합이 좋은 순서로 나옵니다.'},
  {sel:'#board',title:'3. 선으로 잇고 양 바꾸기',text:'재료 → 요리 행위 → 완성 접시 순서로 점을 끌어 잇습니다. 재료의 −/+로 양을, 요리 행위의 −/+로 온도·시간을 바꾸면 점수가 바로 다시 계산됩니다. 재료 아래 %는 1인분 전체 무게 중 비중이라 모두 더하면 100%입니다.'},
  {sel:'#res .rcard',before:()=>setTab('res'),title:'4. 결과 보기',text:'어울림 점수와 원가율, 재료 궁합·맛 균형·조리법 적합이 맨 위에 나옵니다. 아래로 내리면 접시 그림, 숨은 궁합, 맛 프로필, 창업 참고, 재료 궁합 근거가 이어집니다.'},
  {sel:()=>document.querySelector('#board .cookb'),title:'5. 조리 과정 보기와 PDF 받기',text:'완성 접시의 조리 과정 보기를 누르면 재료를 넣고 익혀 그릇에 담기까지 재생되고, 끝나면 접시 그림 아래에 결과 보기 · PDF 받기 버튼이 나옵니다. 누르면 점수, 레시피와 조리 순서, 원가, 맛 프로필, 상권까지 담은 A4 한 쪽 보고서가 PDF로 내려받아집니다.'},
  {sel:'#resTabs',before:()=>setTab('res'),title:'6. AI 도움 받기',text:'AI 요약 탭은 지금 조합을 다섯 줄로 정리하고, 보드 오른쪽 아래 셰프 요정은 위험과 고치면 점수가 오르는 재료를 알려 줍니다. 더 궁금한 것은 오른쪽 아래 사장님 챗봇에 물어보세요.'},
  {title:'이제 직접 해 보세요',text:'이 안내는 맨 위 오른쪽 ? 버튼으로 다시 볼 수 있습니다.',end:true},
];
let i=0,root=null,cur=null;
function build(){root=document.createElement('div');root.className='tour';root.innerHTML=`<div class="tz t"></div><div class="tz b"></div><div class="tz l"></div><div class="tz r"></div><div class="thole"></div>
  <div class="ttip" role="dialog" aria-live="polite"><div class="tstep"></div><h3></h3><p></p><div class="tdots"></div><div class="tbtns"><button class="tskip">건너뛰기</button><span></span><button class="tprev">이전</button><button class="tnext">다음</button></div></div>`;
  document.body.appendChild(root);
  root.querySelector('.tskip').onclick=()=>finish();root.querySelector('.tprev').onclick=()=>go(i-1);root.querySelector('.tnext').onclick=()=>STEPS[i].end?finish():go(i+1);
  ['t','b','l','r'].forEach(k=>root.querySelector('.tz.'+k).onclick=()=>{});
}
function target(st){if(!st.sel)return null;const el=typeof st.sel==='function'?st.sel():document.querySelector(st.sel);return el&&el.getClientRects().length?el:null}
function place(){if(!root)return;const st=STEPS[i],el=target(st),tip=root.querySelector('.ttip'),W=innerWidth,H=innerHeight,pad=6;
  let r=el?el.getBoundingClientRect():null;
  if(r){r={l:Math.max(4,r.left-pad),t:Math.max(4,r.top-pad),r:Math.min(W-4,r.right+pad),b:Math.min(H-4,r.bottom+pad)}}
  const z=(k,x,y,w,h)=>Object.assign(root.querySelector('.tz.'+k).style,{left:x+'px',top:y+'px',width:Math.max(0,w)+'px',height:Math.max(0,h)+'px'});
  const hole=root.querySelector('.thole');
  if(!r){z('t',0,0,W,H);z('b',0,0,0,0);z('l',0,0,0,0);z('r',0,0,0,0);hole.style.display='none'}
  else{z('t',0,0,W,r.t);z('b',0,r.b,W,H-r.b);z('l',0,r.t-1,r.l,r.b-r.t+2);z('r',r.r,r.t-1,W-r.r,r.b-r.t+2);Object.assign(hole.style,{display:'block',left:r.l+'px',top:r.t+'px',width:(r.r-r.l)+'px',height:(r.b-r.t)+'px'})}
  const tw=Math.min(340,W-24);tip.style.width=tw+'px';const th=tip.offsetHeight;let x,y;
  if(!r){x=(W-tw)/2;y=(H-th)/2}
  else if(H-r.b>=th+14){y=r.b+10;x=r.l}
  else if(r.t>=th+14){y=r.t-th-10;x=r.l}
  else if(W-r.r>=tw+14){x=r.r+10;y=r.t}
  else if(r.l>=tw+14){x=r.l-tw-10;y=r.t}
  else{x=(W-tw)/2;y=H-th-16}
  tip.style.left=Math.max(12,Math.min(W-tw-12,x))+'px';tip.style.top=Math.max(12,Math.min(H-th-12,y))+'px';
}
function go(n){if(n<0||n>=STEPS.length)return;const prev=STEPS[i];if(cur&&prev.leave)prev.leave();
  let d=n>=i?1:-1;while(STEPS[n]&&STEPS[n].skip&&STEPS[n].skip())n+=d;if(!STEPS[n])return;i=n;const st=STEPS[i];cur=st;
  if(st.before)st.before();if(st.enter)st.enter(st);
  const el=target(st);if(el){const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-20)el.scrollIntoView({block:r.height>innerHeight-120?'start':'center'})}
  const tip=root.querySelector('.ttip');tip.querySelector('.tstep').textContent=st.sel?`${i} / ${STEPS.length-2}`:'';
  tip.querySelector('h3').textContent=st.title;tip.querySelector('p').textContent=st.text;
  tip.querySelector('.tdots').innerHTML=STEPS.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('');
  tip.querySelector('.tprev').style.visibility=i?'visible':'hidden';tip.querySelector('.tnext').textContent=st.end?'시작하기':i?'다음':'둘러보기';
  tip.querySelector('.tskip').style.visibility=st.end?'hidden':'visible';
  requestAnimationFrame(()=>requestAnimationFrame(place));
}
function start(){if(root)return;if($('#chatWin')&&!$('#chatWin').hidden)$('#chatClose').click();$('#fairy')?.classList.remove('open');build();i=0;cur=null;go(0);addEventListener('resize',place);addEventListener('scroll',place,true);addEventListener('keydown',key)}
function finish(){const st=STEPS[i];if(st&&st.leave)st.leave();root&&root.remove();root=null;cur=null;removeEventListener('resize',place);removeEventListener('scroll',place,true);removeEventListener('keydown',key);try{localStorage.setItem(KEY,'1')}catch(e){}scrollTo({top:0})}
function key(e){if(e.key==='Escape')finish();else if(e.key==='ArrowRight')STEPS[i].end?finish():go(i+1);else if(e.key==='ArrowLeft')go(i-1)}
$('#tourBtn').onclick=start;
let seen=false;try{seen=!!localStorage.getItem(KEY)}catch(e){}
let surveyed=false;try{surveyed=!!(localStorage.getItem('dh_survey')||localStorage.getItem('dh_survey_skip'))}catch(e){}
if(!seen&&surveyed)setTimeout(start,900);
window.TOUR={start,seen:()=>{try{return !!localStorage.getItem(KEY)}catch(e){return true}}};
})();
