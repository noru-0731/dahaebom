// 노드 편집기: 추가 · 삭제 · 연결 · 끌기 · 자동 정렬
const GRAPH=(()=>{
let G={nodes:[],edges:[]},board,canvas,svg,sizer,scale=1,onChange=()=>{},sel=null,seq=1,activeSet=new Set(),colorOf=()=>null;
const SINGLE={temp:1,time:1,salt:1,spicy:1};
const $n=id=>G.nodes.find(n=>n.id===id);
function init(el,cb,colorFn){board=el;onChange=cb;colorOf=colorFn||colorOf;
  board.innerHTML='<div class="gsizer"><div class="gcanvas"><svg class="gwires"></svg></div></div>';sizer=board.querySelector('.gsizer');canvas=board.querySelector('.gcanvas');svg=board.querySelector('.gwires');
  canvas.addEventListener('pointerdown',e=>{if(e.target===canvas||e.target===svg){select(null)}});
  document.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&sel&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){removeNode(sel);e.preventDefault()}});
}
function nid(){return 'n'+(seq++)}
function load(g){G=JSON.parse(JSON.stringify(g));fitMode=false;seq=1+Math.max(0,...G.nodes.map(n=>+n.id.slice(1)||0),...G.edges.map(e=>+String(e.id).slice(1)||0));sel=null;render();changed()}
const NW=n=>n.type==='plate'?Math.max(236,(typeof canvas!=='undefined'&&canvas&&canvas.querySelector(`.gnode[data-id="${n.id}"]`)?.offsetWidth)||236):n.type==='act'?180:n.type==='param'?150:200,NH=n=>n.type==='ing'?80:n.type==='param'?66:n.type==='plate'?150:(ACT[n.key].temp?112:ACT[n.key].time?88:62);
let fitMode=false,zoomLock=false,offX=0,offY=0;const zoomCb=[],PAD=24;
function bbox(){if(!G.nodes.length)return {x0:0,y0:0,x1:400,y1:300};return {x0:Math.min(...G.nodes.map(n=>n.x)),y0:Math.min(...G.nodes.map(n=>n.y)),x1:Math.max(...G.nodes.map(n=>n.x+NW(n))),y1:Math.max(...G.nodes.map(n=>n.y+NH(n)))}}
function setZoom(s,ax,ay){if(!sizer)return;const W=board.clientWidth,H=board.clientHeight;ax=ax??W/2;ay=ay??H/2;
  const cx=(board.scrollLeft+ax-offX)/scale,cy=(board.scrollTop+ay-offY)/scale;zoomLock=true;scale=Math.max(.4,Math.min(1.6,s));fit();
  board.scrollLeft=cx*scale+offX-ax;board.scrollTop=cy*scale+offY-ay}
function autoZoom(f){zoomLock=false;fitMode=!!f;fit();board.scrollLeft=0;board.scrollTop=0}
function fit(){if(!sizer)return;const W=board.clientWidth-2,H=board.clientHeight-2,B=bbox();
  const cw=B.x1-B.x0+PAD*2,ch=B.y1-B.y0+PAD*2;
  // 기본은 100%(넘칠 때만 들어오는 만큼 줄임), '보드에 맞춤'을 누르면 보드 크기에 꽉 맞춘다
  if(!zoomLock)scale=Math.max(.45,Math.min(fitMode?1.1:1,W/cw,H/ch));zoomCb.forEach(f=>f(scale));
  const sw=cw*scale,sh=ch*scale;offX=(sw<W?(W-sw)/2:0)-(B.x0-PAD)*scale;offY=(sh<H?(H-sh)/2:0)-(B.y0-PAD)*scale;
  canvas.style.transform=`scale(${scale})`;canvas.style.transformOrigin='0 0';canvas.style.left=offX+'px';canvas.style.top=offY+'px';
  canvas.style.width=(B.x1+PAD)+'px';canvas.style.height=(B.y1+PAD)+'px';
  sizer.style.width=Math.max(W,sw)+'px';sizer.style.height=Math.max(H,sh)+'px';drawWires()}
function get(){return G}
function changed(){onChange(G)}
function setActive(s){activeSet=s;G.nodes.forEach(n=>{const el=canvas.querySelector(`[data-id="${n.id}"]`);if(el)el.classList.toggle('off',!s.has(n.id))});drawWires()}

// ---------- 노드 그리기 ----------
// 요리 행위 노드의 온도·시간 조절칸(온도 5°C, 시간 1분씩)
const astep=k=>`<span class="astep" data-k="${k}"><button class="as" data-d="-1" aria-label="줄이기">−</button><input type="number" min="${PARAMS[k].min}" max="${PARAMS[k].max}" step="${k==='temp'?5:1}"><span class="au">${PARAMS[k].unit}</span><button class="as" data-d="1" aria-label="늘리기">+</button></span>`;
// 완성 접시 노드에 적는 완성 요리 이름: {name, sub, icon}
let plateInfo=null;function setPlate(p){plateInfo=p;applyPlate()}
function applyPlate(){const el=canvas&&canvas.querySelector('.gnode.t-plate .pdish');if(!el)return;const p=plateInfo;
  el.innerHTML=p?`<span class="pdt"><b class="pdtn">${p.icon||''}<span class="pdtx">${p.name}</span>${p.time!=null?`<em class="pdtm">조리 ${p.time}분</em>`:''}</b>${p.sub?`<small class="pd-old"><i>기존</i>${p.sub}</small>`:''}${p.nova?`<span class="pd-new" title="기존 메뉴와 닮지 않은 만큼을 새 메뉴가 될 가능성으로 보고, 이름은 AI가 지었습니다"><span class="pdn-row"><i class="pdn-p">✦ 새 가능성 ${p.nova.p}%</i>${p.nova.verdict?`<i class="pd-vd ${p.nova.verdict==='성공'?'ok':'ng'}">${p.nova.verdict}${p.nova.why?' · '+p.nova.why:''}</i>`:''}</span><b class="pdn-name ${p.nova.verdict==='성공'?'ok':p.nova.verdict?'ng':''}">${p.nova.name?p.nova.name:'이름 짓는 중…'}</b></span>`:''}</span>`:'<span class="pdt"><small>요리 행위나 재료를 연결하면 완성 요리 이름이 나옵니다</small></span>'}
function nodeHTML(n){
  if(n.type==='ing'){const I=ING[n.key];return `<div class="nh"><img class="ni" src="img/ing/${I.id}.png" alt="" draggable="false"><b data-ting="${I.id}">${I.ko}</b><button class="nx" title="삭제">×</button></div>
    <div class="nb ingb"><span class="gstep"><button class="gs" data-d="-10" aria-label="10g 줄이기">−</button><input type="number" min="5" max="2000" step="5" value="${n.g}" aria-label="양(g)"><span class="gu">g</span><button class="gs" data-d="10" aria-label="10g 늘리기">+</button></span><span class="shr" title="1인분 재료 중 이 재료의 비중"><span class="trk"><i></i></span><em></em></span><span class="tch" data-ting="${I.id}">${topTaste(I)}</span></div>
    <span class="port out" data-port="out"></span>`}
  if(n.type==='act'){const A=ACT[n.key];return `<div class="nh act"><img class="ni" src="img/act/${A.id}.png" alt="" draggable="false"><b>${A.ko}</b><button class="nx" title="삭제">×</button></div>
    ${A.temp?`<div class="row arow"><span class="port in sm" data-port="temp"></span><span class="rl">온도</span>${astep('temp')}</div>`:''}
    ${A.time?`<div class="row arow"><span class="port in sm" data-port="time"></span><span class="rl">시간</span>${astep('time')}</div>`:''}
    <div class="row"><span class="port in" data-port="in"></span><span class="rl">재료 · 앞 단계</span></div>
    <span class="port out" data-port="out"></span>`}
  if(n.type==='param'){const P=PARAMS[n.key];return `<div class="nh par"><img class="ni" src="img/act/${n.key}.png" alt="" draggable="false"><b>${P.ko}</b><button class="nx" title="삭제">×</button></div>
    <div class="nb"><input type="range" min="${P.min}" max="${P.max}" step="${P.step}" value="${n.val}"><span class="pv">${n.val}${P.unit}</span></div>
    <span class="port out" data-port="out"></span>`}
  return `<div class="nh plate"><b>완성 접시</b><button class="cookb" title="조리 순서대로 재생합니다. 재생 중에 누르면 멈춥니다"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg><span class="cbl">조리 과정 보기</span></button></div>
    <div class="row prow"><span class="port in" data-port="in"></span><span class="port in sm hidep" data-port="salt"></span><span class="port in sm hidep" data-port="spicy"></span><span class="pdish"></span></div>`;
}
function render(){
  canvas.querySelectorAll('.gnode').forEach(e=>e.remove());
  G.nodes.forEach(n=>{const el=document.createElement('div');el.className=`gnode t-${n.type}${sel===n.id?' sel':''}`;el.dataset.id=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';el.innerHTML=nodeHTML(n);canvas.appendChild(el);bindNode(el,n)});
  refreshLabels();applyShares();applyPlate();fit();
}
function refreshLabels(){
  G.nodes.forEach(n=>{const el=canvas.querySelector(`[data-id="${n.id}"]`);if(!el)return;
    if(n.type==='act'){const A=ACT[n.key];['temp','time'].forEach(k=>{const e2=el.querySelector(`.astep[data-k="${k}"]`);if(!e2)return;const ed=G.edges.find(x=>x.to===n.id&&x.port===k),p=ed&&$n(ed.from);
      const v=p?p.val:n[k]??(k==='temp'?A.dTemp:A.dTime),inp=e2.querySelector('input');if(inp&&document.activeElement!==inp)inp.value=v;e2.classList.toggle('linked',!!p);e2.title=p?'이어진 수치 노드 값을 바꿉니다':''})}});
}
// 재료에서 가장 강한 맛 두 개(0.15 이상)를 짧은 이름으로
const TSHORT=['단','짠','신','쓴','감칠','기름','매운','향'];
function topTaste(I){const t=I.taste.map((v,k)=>[v,k]).filter(x=>x[0]>=.15).sort((a,b)=>b[0]-a[0]).slice(0,2);return t.length?t.map(x=>TSHORT[x[1]]).join('·'):'담백'}
// 재료 노드의 비중 막대: {노드 id: {sh 0–1, warn}}
let shares={};function setShares(m){shares=m||{};applyShares()}
function applyShares(){const m=shares;canvas.querySelectorAll('.gnode').forEach(el=>{const s=m[el.dataset.id],b=el.querySelector('.shr');if(!b)return;b.classList.toggle('none',!s);if(!s)return;
  b.querySelector('i').style.width=Math.max(4,Math.round(s.sh*100))+'%';b.querySelector('em').textContent=(s.pct??Math.round(s.sh*100))+'%';b.classList.toggle('warn',!!s.warn);b.title=s.warn?'1인분 전체 무게 중 비중 · 한 재료가 너무 많음':'1인분 전체 무게 중 비중(모두 더하면 100%)'})}
function bindNode(el,n){
  el.querySelector('.nx')?.addEventListener('click',e=>{e.stopPropagation();removeNode(n.id)});
  const cb=el.querySelector('.cookb');if(cb){cb.addEventListener('pointerdown',e=>e.stopPropagation());cb.addEventListener('click',e=>{e.stopPropagation();dispatchEvent(new Event('lab:cook'))})}
  const gi=el.querySelector('.gstep input');if(gi){gi.addEventListener('input',()=>{const v=Math.max(5,Math.min(2000,+gi.value||0));n.g=v;drawWires();changed()});gi.addEventListener('pointerdown',e=>e.stopPropagation());
    el.querySelectorAll('.gs').forEach(b=>{b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('click',e=>{e.stopPropagation();const d=+b.dataset.d,v=Math.max(5,Math.min(2000,(Math.round(n.g/5)*5)+d));n.g=v;gi.value=v;drawWires();changed()})})}
  // 요리 행위 온도·시간: 이어진 수치 노드가 있으면 그 값을, 없으면 이 노드의 값을 바꾼다
  el.querySelectorAll('.astep').forEach(st=>{const k=st.dataset.k,P=PARAMS[k],inp=st.querySelector('input'),stp=k==='temp'?5:1;
    const setv=v=>{v=Math.max(P.min,Math.min(P.max,Math.round(v/stp)*stp));const ed=G.edges.find(x=>x.to===n.id&&x.port===k),p=ed&&$n(ed.from);
      if(p){p.val=v;p.set=true;const pe=canvas.querySelector(`[data-id="${p.id}"]`);if(pe){const r=pe.querySelector('input[type=range]');if(r)r.value=v;const pv=pe.querySelector('.pv');if(pv)pv.textContent=v+P.unit}}else n[k]=v;
      inp.value=v;refreshLabels();changed()};
    st.addEventListener('pointerdown',e=>e.stopPropagation());
    st.querySelectorAll('.as').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setv((+inp.value||0)+(+b.dataset.d)*stp)}));
    inp.addEventListener('change',()=>setv(+inp.value||0))});
  const rg=el.querySelector('input[type=range]');if(rg){rg.addEventListener('input',()=>{n.val=+rg.value;n.set=true;el.querySelector('.pv').textContent=n.val+PARAMS[n.key].unit;refreshLabels();changed()});rg.addEventListener('pointerdown',e=>e.stopPropagation())}
  el.addEventListener('pointerdown',e=>{
    const port=e.target.closest('.port');
    if(port){e.stopPropagation();e.preventDefault();startWire(n,port.dataset.port,e);return}
    if(e.target.closest('input,button'))return;
    e.preventDefault();const sx=e.clientX,sy=e.clientY,ox=n.x,oy=n.y;let moved=false;
    const mv=ev=>{const dx=(ev.clientX-sx)/scale,dy=(ev.clientY-sy)/scale;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;n.x=Math.max(0,ox+dx);n.y=Math.max(0,oy+dy);el.style.left=n.x+'px';el.style.top=n.y+'px';drawWires()};
    const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);if(!moved)select(n.id)};
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);
  });
}
function select(id){sel=id;canvas.querySelectorAll('.gnode').forEach(e=>e.classList.toggle('sel',e.dataset.id===id));onChange(G,'select')}

// ---------- 연결 ----------
function reaches(from,to){ // from에서 출력 방향으로 to에 닿는지(순환 검사)
  const st=[from],seen=new Set();while(st.length){const c=st.pop();if(c===to)return true;if(seen.has(c))continue;seen.add(c);G.edges.filter(e=>e.from===c).forEach(e=>st.push(e.to))}return false}
function canConnect(s,t,port){
  if(!s||!t||s.id===t.id)return false;
  if(s.type==='ing')return port==='in'&&(t.type==='act'||t.type==='plate');
  if(s.type==='act')return port==='in'&&(t.type==='plate'||(t.type==='act'&&!reaches(t.id,s.id)));
  if(s.type==='param'){if(PARAMS[s.key].to==='act')return t.type==='act'&&port===s.key&&!!ACT[t.key][s.key];return t.type==='plate'&&port===s.key}
  return false;
}
function defaultPort(s,t){if(s.type==='param')return s.key;return 'in'}
function connect(sid,tid,port){
  const s=$n(sid),t=$n(tid);port=port||defaultPort(s,t);if(!canConnect(s,t,port))return false;
  if(G.edges.some(e=>e.from===sid&&e.to===tid&&e.port===port))return false;
  if(SINGLE[port])G.edges=G.edges.filter(e=>!(e.to===tid&&e.port===port));
  if(s.type==='act')G.edges=G.edges.filter(e=>!(e.from===sid&&e.port==='in')); // 요리 행위의 출력은 하나
  // 아직 손대지 않은 온도·시간 노드는 이어 붙인 요리 행위의 기본값으로 맞춘다(팔레트 기본 180°C·10분이 끓이기에 붙어 점수가 깎이지 않게)
  if(s.type==='param'&&t.type==='act'&&!s.set){const A=ACT[t.key],dv=port==='temp'?(t.temp??A.dTemp):port==='time'?(t.time??A.dTime):null;if(dv!=null&&s.val!==dv){s.val=dv;const el=canvas.querySelector(`[data-id="${s.id}"]`);if(el){const rg=el.querySelector('input[type=range]');if(rg)rg.value=dv;const pv=el.querySelector('.pv');if(pv)pv.textContent=dv+PARAMS[s.key].unit}}}
  G.edges.push({id:'e'+(seq++),from:sid,to:tid,port});refreshLabels();drawWires();changed();return true;
}
function startWire(n,port,e){
  let src=n;
  if(port!=='out'){ // 입력 쪽 점을 끌면 선을 떼어 다시 꽂는다
    const ed=[...G.edges].reverse().find(x=>x.to===n.id&&x.port===port);if(!ed)return;
    G.edges=G.edges.filter(x=>x!==ed);src=$n(ed.from);refreshLabels();drawWires();changed();
  }
  const tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('class','wtmp');svg.appendChild(tmp);
  const p0=portPos(src.id,'out');
  // 붙을 수 있는 입력점 목록(수치 노드는 같은 이름의 점에만 붙는다)
  const targets=[];G.nodes.forEach(t=>{if(t.id===src.id)return;const el=canvas.querySelector(`[data-id="${t.id}"]`);if(!el)return;
    el.querySelectorAll('.port.in').forEach(pe=>{const port=pe.dataset.port;if(canConnect(src,t,port))targets.push({t,port,pe,el,pos:portPos(t.id,port)})})});
  canvas.classList.add('wiring');targets.forEach(x=>x.pe.classList.add('can'));
  let snap=null;
  const setSnap=s2=>{if(snap===s2)return;if(snap){snap.pe.classList.remove('snap');snap.el.classList.remove('snapnode')}snap=s2;if(snap){snap.pe.classList.add('snap');snap.el.classList.add('snapnode')}};
  const mv=ev=>{const r=canvas.getBoundingClientRect();const x=(ev.clientX-r.left)/scale,y=(ev.clientY-r.top)/scale;
    const hov=document.elementFromPoint(ev.clientX,ev.clientY),nd=hov&&hov.closest('.gnode');let best=null,bd=56/scale;
    targets.forEach(c=>{let dd=Math.hypot(c.pos.x-x,c.pos.y-y);if(nd&&nd===c.el)dd*=.35;if(dd<bd){bd=dd;best=c}});
    if(!best&&nd){best=targets.find(c=>c.el===nd)||null}
    setSnap(best);const q=snap?snap.pos:{x,y};tmp.setAttribute('d',curve(p0.x,p0.y,q.x,q.y))};
  const up=ev=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);tmp.remove();canvas.classList.remove('wiring');targets.forEach(x=>x.pe.classList.remove('can'));
    const s2=snap;setSnap(null);
    if(s2){connect(src.id,s2.t.id,s2.port);return}
    const el=document.elementFromPoint(ev.clientX,ev.clientY);const nd=el&&el.closest('.gnode');
    if(nd&&nd.dataset.id!==src.id)flash(nd)};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);mv(e);
}
function flash(el){el.classList.add('bad');setTimeout(()=>el.classList.remove('bad'),500)}
function portPos(id,port){const el=canvas.querySelector(`[data-id="${id}"]`);if(!el)return {x:0,y:0};const p=el.querySelector(`.port[data-port="${port}"]`)||el;const r=p.getBoundingClientRect(),c=canvas.getBoundingClientRect();return {x:(r.left-c.left+r.width/2)/scale,y:(r.top-c.top+r.height/2)/scale}}
function curve(x1,y1,x2,y2){const d=Math.max(40,Math.abs(x2-x1)*.5);return `M${x1},${y1} C${x1+d},${y1} ${x2-d},${y2} ${x2},${y2}`}
const CAT_COL={pro:'#e5484d',veg:'#2f9e58',carb:'#d99a00',sauce:'#8b5cf6',dairy:'#0ea5e9'};
function drawWires(){
  if(!svg)return;const r=canvas.getBoundingClientRect();svg.setAttribute('width',canvas.scrollWidth);svg.setAttribute('height',canvas.scrollHeight);
  let s='';G.edges.forEach(e=>{const a=portPos(e.from,'out'),b=portPos(e.to,e.port),src=$n(e.from);const on=activeSet.has(e.from)&&activeSet.has(e.to);
    let col='#8a94a6',w=2.5,dash='';
    if(src.type==='ing'){const c=colorOf(src.key);col=CAT_COL[ING[src.key].cat]||'#9aa3ad';w=Math.min(8,1.5+src.g/45);if(c!=null&&c<=-.3)dash='7 5'}
    if(src.type==='param'){col='#7aa0f0';w=1.5;dash='4 3'}
    if(!on){col='#c4c9d0';dash='5 4';w=Math.min(w,2)}
    s+=`<path class="w" data-e="${e.id}" d="${curve(a.x,a.y,b.x,b.y)}" stroke="${col}" stroke-width="${w}" ${dash?`stroke-dasharray="${dash}"`:''}/><path class="whit" data-e="${e.id}" d="${curve(a.x,a.y,b.x,b.y)}"/>`});
  svg.innerHTML=s;svg.querySelectorAll('.whit').forEach(p=>p.addEventListener('click',()=>{G.edges=G.edges.filter(e=>e.id!==p.dataset.e);refreshLabels();drawWires();changed()}));
}

// ---------- 추가 · 삭제 ----------
function freeSpot(type){const col={param:30,ing:30,act:330,plate:860}[type]||30;let y=20;const near=G.nodes.filter(n=>Math.abs(n.x-col)<120);while(near.some(n=>Math.abs(n.y-y)<70))y+=74;return {x:col,y}}
function addNode(type,key,opt={}){
  const n={id:nid(),type,key,...freeSpot(type)};
  if(type==='ing')n.g=opt.g||ING[key].g;if(type==='param')n.val=PARAMS[key].def;
  Object.assign(n,opt.pos||{});G.nodes.push(n);render();
  const plate=G.nodes.find(x=>x.type==='plate'),acts=G.nodes.filter(x=>x.type==='act'&&x.id!==n.id),selN=sel&&$n(sel);
  if(type==='ing'){const target=selN&&selN.type==='act'?selN:acts.length===1?acts[0]:null;if(target)connect(n.id,target.id,'in')}
  if(type==='act'){if(selN&&selN.type==='act'){const out=G.edges.find(e=>e.from===selN.id&&e.port==='in');connect(selN.id,n.id,'in');if(out)connect(n.id,out.to,'in');else if(plate)connect(n.id,plate.id,'in')}
    else if(plate&&!G.edges.some(e=>e.to===plate.id&&e.port==='in'))connect(n.id,plate.id,'in')}
  if(type==='param'){let tg=null;if(PARAMS[key].to==='plate')tg=plate;
    else if(selN&&selN.type==='act'&&ACT[selN.key][key])tg=selN;
    else{const c=G.nodes.filter(x=>x.type==='act'&&ACT[x.key][key]&&!G.edges.some(e=>e.to===x.id&&e.port===key));tg=c.length?c.sort((a,b)=>a.x-b.x)[0]:null}
    if(tg&&connect(n.id,tg.id,key)&&!opt.pos){n.x=Math.max(0,tg.x-210);n.y=Math.max(0,tg.y-(key==='time'||key==='spicy'?0:104));render()}}
  if(type==='act')select(n.id);
  changed();return n;
}
function removeNode(id){const n=$n(id);if(!n||n.type==='plate')return;G.nodes=G.nodes.filter(x=>x.id!==id);G.edges=G.edges.filter(e=>e.from!==id&&e.to!==id);if(sel===id)sel=null;render();changed()}
function clear(){const p=G.nodes.find(n=>n.type==='plate')||{id:nid(),type:'plate'};p.x=860;p.y=200;G={nodes:[p],edges:[]};sel=null;render();changed()}
function layout(){
  // 플레이그라운드처럼 재료 → 요리 행위 층 → 완성 접시로 펼치고, 수치 노드는 대상 노드 바로 앞 통로의 위쪽 띠에 둔다
  const plate=G.nodes.find(n=>n.type==='plate');if(!plate)return;
  const depth={};const dfs=(id,d)=>{G.edges.filter(e=>e.to===id&&e.port==='in').forEach(e=>{const s=$n(e.from);if(s&&s.type==='act'&&!(depth[s.id]>=d+1)){depth[s.id]=d+1;dfs(s.id,d+1)}})};dfs(plate.id,0);
  const acts=G.nodes.filter(n=>n.type==='act'&&depth[n.id]),maxD=Math.max(0,...acts.map(a=>depth[a.id]));
  const layer=n=>n.type==='plate'?maxD+1:maxD-depth[n.id]+1;
  const paramsOf=id=>G.edges.filter(e=>e.to===id&&$n(e.from)?.type==='param').map(e=>$n(e.from));
  const targets=[...acts,plate].sort((a,b)=>layer(a)-layer(b));
  const L=maxD+1,lane=[0],X=[20];
  for(let k=1;k<=L;k++){const has=targets.some(t=>layer(t)===k&&paramsOf(t.id).length);lane[k]=has?240:70;X[k]=X[k-1]+(k===1?200:180)+lane[k]}
  // 위쪽 띠: 통로마다 수치 노드를 위에서부터 쌓는다
  const placed=new Set();let bandRows=0;
  for(let k=1;k<=L;k++){let row=0;targets.filter(t=>layer(t)===k).forEach(t=>paramsOf(t.id).forEach(p=>{p.x=X[k]-lane[k]+20;p.y=20+row*96;row++;placed.add(p.id)}));bandRows=Math.max(bandRows,row)}
  const top=20+(bandRows?bandRows*96+40:0);
  // 재료 묶음: 같은 대상으로 가는 재료끼리, 앞 층 대상부터 위에서 아래로
  const firstTarget=n=>{const e=G.edges.find(x=>x.from===n.id&&x.port==='in');return e&&$n(e.to)};
  const ings=G.nodes.filter(n=>n.type==='ing'),center={},colBottom={};let cur=top;
  const inPortY=n=>n.y+NH(n)-16;
  targets.forEach(t=>{const g=ings.filter(i=>firstTarget(i)===t);const k=layer(t);
    const gTop=cur;g.forEach((i,j)=>{i.x=X[0];i.y=gTop+j*94;placed.add(i.id)});
    const ys=g.map(i=>i.y+40);G.edges.filter(e=>e.to===t.id&&e.port==='in'&&$n(e.from)?.type==='act').forEach(e=>{const s=$n(e.from);if(center[s.id]!=null)ys.push(center[s.id])});
    const cy=ys.length?ys.reduce((a,b)=>a+b,0)/ys.length:gTop+40;
    t.x=X[k];t.y=Math.max(top,cy-(NH(t)-16),colBottom[k]||0);center[t.id]=inPortY(t)-NH(t)/2+16+NH(t)/2-16;center[t.id]=t.y+NH(t)/2;colBottom[k]=t.y+NH(t)+24;placed.add(t.id);
    cur=Math.max(gTop+g.length*94,t.y+NH(t)-gTop>0?t.y+NH(t)+8:cur)+18});
  // 연결 안 된 노드는 맨 아래 줄
  let x=20,y=Math.max(cur,...Object.values(colBottom))+30;
  G.nodes.filter(n=>!placed.has(n.id)).forEach(n=>{n.x=x;n.y=y;x+=NW(n)+20;if(x>X[L]){x=20;y+=130}});
  zoomLock=false;render();fit();board.scrollLeft=0;board.scrollTop=0;
}
return {init,load,get,addNode,removeNode,clear,layout,fit,setZoom,autoZoom,onZoom:f=>zoomCb.push(f),setActive,setShares,setPlate,drawWires,select,get selected(){return sel},get scale(){return scale},connect};
})();
