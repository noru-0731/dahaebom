// 조합 분석 결과 PDF: 지금 보드의 계산 결과를 A4 한 쪽 보고서로 그려 PDF로 내려받는다.
// html2canvas로 화면 밖에 그린 보고서를 그림으로 찍고 jsPDF로 A4에 붙인다(필요할 때만 불러온다).
(()=>{
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
let libP=null;
const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
const libs=()=>libP||(libP=Promise.all(LIBS.map(load)));
const fmt=n=>Math.round(n).toLocaleString('ko-KR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const josa=(w,a,b)=>{const c=w.charCodeAt(w.length-1)-0xAC00;return w+(c>=0&&c<11172&&c%28?b:a)};
const BLUE='#1d5ff2',MINT='#10b5a3',INK='#1f2733';
const ACT_IMG={raw:'raw',mix:'mix',boil:'boil',simmer:'simmer',steam:'steam',stirfry:'stirfry',grill:'grill',fry:'fry'};

function donut(p){const r=62,c=2*Math.PI*r,on=c*Math.min(100,p)/100;
  return `<svg viewBox="0 0 160 160" width="132" height="132"><circle cx="80" cy="80" r="${r}" fill="none" stroke="#e8edf3" stroke-width="22"/><circle cx="80" cy="80" r="${r}" fill="none" stroke="${p>38?'#e5484d':MINT}" stroke-width="22" stroke-dasharray="${on.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 80 80)"/><text x="80" y="74" text-anchor="middle" font-size="12" fill="#5b616b" font-weight="600">원가율</text><text x="80" y="98" text-anchor="middle" font-size="24" font-weight="800" fill="${INK}">${p.toFixed(1)}%</text></svg>`}
function radar(t){const N=8,cx=140,cy=96,R=62,v=t.map(x=>Math.round(50+Math.max(0,Math.min(1,x))*50)),M=100;
  const rad=x=>R*Math.min(x,M)/M,pt=(k,r)=>[cx+Math.cos(-Math.PI/2+k*2*Math.PI/N)*r,cy+Math.sin(-Math.PI/2+k*2*Math.PI/N)*r];const top=[...v.keys()].sort((a,b)=>v[b]-v[a]).slice(0,2);
  let g='';for(const f of [50,62.5,75,87.5,100])g+=`<polygon points="${[...Array(N).keys()].map(k=>pt(k,rad(f)).map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#e3e7ee"/>`;
  for(let k=0;k<N;k++){const [x0,y0]=pt(k,rad(50)),[x,y]=pt(k,R);g+=`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#eef1f5"/>`}
  g+=`<polygon points="${v.map((x,k)=>pt(k,rad(x)).map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="rgba(29,95,242,.13)" stroke="${BLUE}" stroke-width="2"/>`;
  for(let k=0;k<N;k++){const [x,y]=pt(k,R+16),c=Math.cos(-Math.PI/2+k*2*Math.PI/N),an=Math.abs(c)<.3?'middle':c>0?'start':'end',hi=top.includes(k);
    g+=`<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="${an}" font-size="11" font-weight="${hi?800:600}" fill="${hi?BLUE:'#5b616b'}">${TASTE_AXES[k]} ${v[k]}</text>`}
  return {svg:`<svg viewBox="0 0 280 190" width="100%" height="214">${g}</svg>`,top:top.map(k=>TASTE_AXES[k])}}

// 보드에서 조리 순서 문장 만들기: 재료에서 먼 요리 행위부터 차례로
const VERB={raw:'썹니다',mix:'무칩니다',boil:'삶습니다',simmer:'끓입니다',steam:'찝니다',stirfry:'볶습니다',grill:'굽습니다',fry:'튀깁니다'};
function steps(R){const acts=Object.values(R.acts),depth=a=>Math.max(0,...R.items.filter(i=>i.path.includes(a.nid)).map(i=>i.path.length-i.path.indexOf(a.nid)));
  const out=[['재료 준비',R.items.map(i=>`${ING[i.id].ko} ${i.g}g`).join(', ')+'을 준비합니다.']];
  acts.sort((a,b)=>depth(b)-depth(a)).forEach(a=>{const A=ACT[a.key],its=R.items.filter(i=>i.path[0]===a.nid).map(i=>ING[i.id].ko),prev=R.items.some(i=>i.path.indexOf(a.nid)>0);
    const what=its.length?josa(its.join('·'),'를','을'):'';const cond=A.temp?`${a.temp}°C에서 `:'';const tm=A.time?`${a.time}분 `:'';
    out.push([A.ko.split(' · ')[0],`${prev?'앞 단계 재료'+(its.length?'에 '+what+' 더해':'를'):what} ${cond}${tm}${VERB[a.key]||'조리합니다'}.`.replace(/\s+/g,' ').trim()])});
  out.push(['완성','그릇에 담아 마무리합니다.']);return out.length>5?[...out.slice(0,4),out[out.length-1]]:out}

function html(st){const {R,E,P,B,S,HID,price,servings,survey,area,areaName}=st;
  const name=(window.LAB_TITLE&&LAB_TITLE())||(P.novel?P.name:P.best.d.ko),sc=Math.round(E.score),rate=(B.rate||0)*100,biz=(survey?.업종||[]).join?.('·')||survey?.업종||'';
  const sub=[biz,areaName&&area?areaName:'',`목표 판매가 ${fmt(price)}원`,servings>1?`${servings}인분`:'1인분 기준'].filter(Boolean).join(' · ');
  const photo=(()=>{try{return document.querySelector('#plateCv').toDataURL('image/jpeg',.9)}catch(e){return ''}})();
  const dish=window.DISH_IC?.[name];const rd=radar(E.taste);
  const ings=R.items.map(i=>`<tr><td><img src="img/ing/${i.id}.png">${ING[i.id].ko}</td><td class="r">${i.g}g</td><td class="r">${fmt(ING[i.id].price*i.g/100)}원</td></tr>`).join('');
  const acts=Object.values(R.acts).map(a=>{const A=ACT[a.key];return `<span class="act"><img src="img/act/${ACT_IMG[a.key]}.png">${A.ko}${A.temp?` ${a.temp}°C`:''}${A.time?` · ${a.time}분`:''}</span>`}).join('');
  const stp=steps(R).map(([t,x],k)=>`<li><b>${String(k+1).padStart(2,'0')}</b><div><h4>${esc(t)}</h4><p>${esc(x)}</p></div></li>`).join('');
  const bars=[['재료 궁합',E.parts.pair,BLUE],['맛 균형',E.parts.taste,'#f0960f'],['조리법 적합',E.parts.method,'#7b61ff']].map(([n,v,c])=>`<div class="rbar"><span>${n}</span><div class="rtrk"><i style="width:${Math.round(v)}%;background:${c}"></i></div><b style="color:${c}">${Math.round(v)}</b></div>`).join('');
  const pred=P.top.slice(0,3).map((o,k)=>`<div class="rpd"><span>${o.d.ko}</span><div class="rtrk"><i style="width:${Math.max(2,Math.round(o.p*100))}%;background:${k?'#c7d2e4':BLUE}"></i></div><b>${Math.round(o.p*100)}%</b></div>`).join('');
  const pairs=[...E.pairs].sort((a,b)=>b.v-a.v).slice(0,3).map(p=>`${ING[p.a].ko}+${ING[p.b].ko} ${p.v>0?'+':''}${p.v.toFixed(2)}`).join(', ');
  // 셰프의 한마디: 위험 → 숨은 궁합 → 넣거나 빼면 오르는 재료 → 원가
  const tips=[];
  E.risks.slice(0,1).forEach(r=>tips.push(['위험 확인','img/ui/servetime.png',r.text]));
  const h=HID&&(HID.found[0]||HID.recs[0]);
  if(h)tips.push([`숨은 궁합 · ${ING[h.id].ko}${h.g?` ${h.g}g`:''}`,'img/hidden.svg',`${name}에 잘 안 넣지만 ${ING[h.best].ko}와 궁합 상위 ${Math.max(1,Math.round((1-h.fit)*100))}%, 국내 레시피에서 같이 쓰는 비율 ${Math.max(1,Math.round(h.co*100))}%. 메뉴 차별점이 됩니다.`]);
  if(S.add[0])tips.push([`넣어 보기 · ${ING[S.add[0].id].ko}`,'img/ing/'+S.add[0].id+'.png',`${josa(ING[S.add[0].id].ko,'를','을')} 넣으면 점수가 +${S.add[0].d.toFixed(1)}점 오릅니다.`]);
  else if(S.remove[0])tips.push([`줄여 보기 · ${ING[S.remove[0].id].ko}`,'img/ing/'+S.remove[0].id+'.png',`${josa(ING[S.remove[0].id].ko,'를','을')} 빼거나 줄이면 점수가 +${S.remove[0].d.toFixed(1)}점 오릅니다.`]);
  tips.push(['원가',`img/ui/cost.png`,rate<=30?`원가율 ${rate.toFixed(1)}%로 목표 30% 안입니다. 판매가 ${fmt(price)}원 기준 재료비 ${fmt(B.cost)}원입니다.`:`원가율 ${rate.toFixed(1)}%로 30%를 넘습니다. 판매가를 올리거나 비싼 재료를 줄여 보세요.`]);
  const say=E.risks.length?'사장님, 이 부분은 꼭 확인해 주세요.':sc>=92?`사장님, 잘 어울리는 ${josa(name,'예요','이에요')}. 이렇게 바꿔 보면 어때요?`:'사장님, 조금만 바꾸면 더 좋아져요.';
  let areaRow='';if(area){const age=[...area.age].sort((a,b)=>b.v-a.v),tm=area.time||'',ts=tm.length>=13?`${tm.slice(0,4)}.${tm.slice(4,6)}.${tm.slice(6,8)} ${tm.slice(9,11)}:${tm.slice(11,13)}`:'';const kor=(area.biz||[]).find(b=>b.mid==='한식');
    areaRow=`<div class="area"><img src="img/ui/district.png"><div><b>${esc(area.area)}</b><em>혼잡 ${esc(area.level)}</em></div><i class="sep"></i><div><b>${age[0].a}대 ${age[0].v}% · ${age[1].a}대 ${age[1].v}%</b><em>결제 고객 연령 상위</em></div><i class="sep"></i><div><b>여성 ${area.female}%</b><em>결제 고객 성별</em></div>${kor?`<i class="sep"></i><div><b>한식 ${fmt(kor.shops)}곳</b><em>음식 업종 가맹점</em></div>`:''}<i class="sep"></i><div><em>서울 실시간 상권</em><b style="font-size:12px">${ts} 기준</b></div></div>`}
  const d=new Date(),today=`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  return `<div class="rp">
<div class="hd"><img class="logo" src="img/logo-white.png"><h1>${esc(name)} 조합 분석 결과</h1><p>${esc(sub)}</p>${photo?`<img class="dish" src="${photo}">`:''}</div>
<div class="wrap">
<div class="kpi"><div class="k main"><img class="face" src="img/chef2-face.webp"><div><b>${sc}<small>/100</small></b><span>어울림 점수 · ${ENG.grade(sc)}</span></div></div>
<div class="k"><img src="img/ui/cost.png"><div><b>${fmt(B.cost)}원</b><span>1인분 재료비</span></div></div>
<div class="k"><img src="img/ui/costrate.png"><div><b>${rate.toFixed(1)}%</b><span>원가율</span></div></div>
<div class="k"><img src="img/ui/servetime.png"><div><b>${B.time}분</b><span>조리 시간 · ${B.diffKo}</span></div></div></div>
<div class="grid"><div class="card"><h3><img src="img/ui/recipe-std.png">레시피 보드<small>재료 ${R.items.length} · 요리 행위 ${Object.keys(R.acts).length}</small></h3><table>${ings}</table><div class="acts">${acts}</div>
<h3 style="margin-top:10px"><img src="img/act/time.png">조리 순서</h3><ol>${stp}</ol></div>
<div><div class="card"><h3><img src="img/ui/ai-rec.png">조합 평가</h3>${bars}</div>
<div class="card" style="margin-top:10px"><h3><img src="img/act/spicy.png">맛 프로필<small>강한 맛 ${rd.top.join('·')}</small></h3>${rd.svg}</div></div></div>
<div class="two"><div class="card"><h3><img src="img/ui/costrate.png">판매가 중 재료비</h3><div class="don">${donut(rate)}<div class="leg"><div><i style="background:${rate>38?'#e5484d':MINT}"></i><span>재료비<b>${fmt(B.cost)}원</b></span></div><div><i style="background:#e8edf3"></i><span>나머지<b>${fmt(Math.max(0,price-B.cost))}원</b></span></div></div></div></div>
<div class="card"><h3>${dish?`<img src="${dish}">`:'<img src="img/ui/recipe-std.png">'}예측 메뉴<small>메뉴 ${DISHES.length}종 중</small></h3>${pred}${(()=>{const nv=window.LAB_NOVA&&LAB_NOVA();return nv?`<div class="nova"><p class="old"><i>기존</i>${esc(nv.base)} ${nv.sim}% 유사</p><p class="new"><i>✦ 새 가능성 ${nv.p}%</i>${nv.name?esc(nv.name):''}</p></div>`:''})()}<p class="pairs">잘 맞는 재료 쌍: ${esc(pairs)}</p></div></div>
<div class="chef"><img class="c" src="img/chef2.webp"><div><p class="say">${esc(say)}</p><div class="tips">${tips.slice(0,2).map(([t,ic,x])=>`<div class="tip"><h5><img src="${ic}">${esc(t)}</h5>${esc(x)}</div>`).join('')}</div></div></div>
${areaRow}
</div>
<div class="ft"><img src="img/logo-white.png"><span>메뉴 궁합 실험실 · dahaebom.vercel.app · ${today}</span></div></div>`}

const CSS=`.rp{position:relative;width:794px;height:1123px;font-family:Pretendard,sans-serif;color:${INK};background:#f4f6fa;overflow:hidden;line-height:1.4;word-break:keep-all}
.rp *{box-sizing:border-box;margin:0;padding:0}
.rp .hd{position:relative;height:150px;background:linear-gradient(120deg,${BLUE} 0%,#2f6ff0 45%,${MINT} 100%);color:#fff;padding:20px 30px;overflow:hidden}
.rp .hd .logo{height:26px}.rp .hd h1{font-size:27px;font-weight:800;margin-top:10px;letter-spacing:-.5px}.rp .hd p{font-size:13px;opacity:.92;margin-top:6px}
.rp .hd .dish{position:absolute;right:-30px;top:-40px;width:250px;height:250px;border-radius:50%;object-fit:cover;border:6px solid rgba(255,255,255,.35)}
.rp .wrap{padding:0 22px}
.rp .kpi{display:grid;grid-template-columns:1.25fr 1fr 1fr 1fr;gap:10px;margin-top:-18px;position:relative}
.rp .k{background:#fff;border-radius:14px;padding:11px 14px;border:1px solid #e3e8ef;display:flex;align-items:center;gap:10px}
.rp .k img{width:34px;height:34px}.rp .k b{display:block;font-size:22px;font-weight:800}.rp .k span{font-size:11.5px;color:#5b616b}
.rp .k.main{background:${BLUE};color:#fff;border-color:${BLUE}}.rp .k.main span{color:#dbe6ff}.rp .k.main b{font-size:30px}.rp .k.main small{font-size:13px;font-weight:600;opacity:.85}.rp .k .face{width:46px;height:46px;border-radius:50%;border:2px solid #fff}
.rp .grid{display:grid;grid-template-columns:1.08fr 1fr;gap:10px;margin-top:10px}
.rp .card{background:#fff;border-radius:14px;padding:11px 15px;border:1px solid #e3e8ef}
.rp .card h3{font-size:14.5px;font-weight:800;display:flex;align-items:center;gap:7px;margin-bottom:9px}.rp .card h3 img{width:22px;height:22px}.rp .card h3 small{margin-left:auto;font-size:11px;font-weight:600;color:#8a919c}
.rp table{width:100%;border-collapse:collapse;font-size:12.5px}.rp td{padding:3px 0;border-bottom:1px solid #f0f2f6}.rp td img{width:20px;height:20px;vertical-align:-5px;margin-right:6px}.rp td.r{text-align:right}.rp tr:last-child td{border-bottom:0}
.rp .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.rp .act{display:inline-flex;align-items:center;gap:6px;background:#eef3ff;color:${BLUE};font-weight:700;font-size:12px;border-radius:999px;padding:4px 10px}.rp .act img{width:18px;height:18px}
.rp ol{list-style:none;margin-top:6px}.rp ol li{display:flex;gap:10px;padding:5px 0;border-top:1px dashed #e6e9ef}.rp ol li b{flex:none;width:26px;height:26px;border-radius:50%;background:${MINT};color:#fff;font-size:11.5px;display:flex;align-items:center;justify-content:center}
.rp ol h4{font-size:12.5px;font-weight:800}.rp ol p{font-size:11.5px;color:#4b5058;margin-top:1px;line-height:1.45}
.rp .rbar,.rp .rpd{display:grid;grid-template-columns:70px 1fr 38px;align-items:center;gap:8px;font-size:12px;margin:7px 0}.rp .rtrk{height:9px;background:#eef1f5;border-radius:5px;overflow:hidden}.rp .rtrk i{display:block;height:100%;border-radius:5px}.rp .rbar b,.rp .rpd b{text-align:right;font-weight:800}
.rp .two{display:grid;grid-template-columns:.9fr 1.1fr;gap:10px;margin-top:10px}
.rp .don{display:flex;align-items:center;gap:12px}.rp .leg div{display:flex;align-items:center;gap:7px;font-size:12px;margin:6px 0}.rp .leg i{width:11px;height:11px;border-radius:3px;display:inline-block}.rp .leg b{display:block;font-size:14px}
.rp .nova{display:grid;gap:5px;margin-top:8px;font-size:12px;line-height:1.4}.rp .nova p{border-radius:8px;padding:5px 9px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}.rp .nova i{font-style:normal;font-size:10.5px;font-weight:800;border-radius:6px;padding:1px 6px}
.rp .nova .old{background:#eef3fb;color:#3d5a8c}.rp .nova .old i{background:#d9e4f6;color:#2f4f86}.rp .nova .new{background:#fbf7ee;border:1px solid #efe5d2;color:#0d8a7c;font-weight:800}.rp .nova .new i{background:#10b5a3;color:#fff}
.rp .pairs{font-size:11.5px;color:#4b5058;margin-top:8px;line-height:1.5}
.rp .chef{display:grid;grid-template-columns:104px 1fr;gap:10px;align-items:center;margin-top:10px;background:#fff;border-radius:14px;padding:6px 16px 6px 8px;border:1.5px solid #c9efe8}
.rp .chef img.c{width:104px}.rp .say{font-size:13px;font-weight:800;color:#0d8a7c;margin-bottom:6px}.rp .tips{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rp .tip{background:#f6fbfa;border-radius:10px;padding:8px 10px;font-size:11.5px;line-height:1.45}.rp .tip h5{font-size:12px;font-weight:800;margin-bottom:2px;display:flex;align-items:center;gap:5px}.rp .tip h5 img{width:18px;height:18px}
.rp .area{display:flex;align-items:center;gap:14px;margin-top:10px;background:#fff;border-radius:14px;padding:11px 16px;font-size:12px;border:1px solid #e3e8ef}.rp .area img{width:24px;height:24px}.rp .area b{font-size:13.5px;display:block}.rp .area .sep{width:1px;height:26px;background:#e6e9ef}.rp .area em{font-style:normal;color:#5b616b;display:block;font-size:11px}
.rp .ft{position:absolute;left:0;right:0;bottom:0;height:34px;background:${INK};color:#c9d1dc;font-size:11px;display:flex;align-items:center;justify-content:space-between;padding:0 24px}.rp .ft img{height:15px}`;

async function download(btn){const st=window.LAB_STATE&&window.LAB_STATE();if(!st){alert('완성 접시까지 연결해 주세요');return}
  const lb=btn&&btn.innerHTML;if(btn){btn.disabled=true;btn.innerHTML='보고서 만드는 중…'}
  try{
    // 상권 자료가 아직 없으면 지금 고른 지역으로 한 번 받는다
    if(!st.area){const cd=document.querySelector('#areaSel')?.value;if(cd){try{const r=await fetch('api/sangwon?area='+cd);if(r.ok)st.area=await r.json()}catch(e){}}}
    await libs();
    const box=document.createElement('div');box.style.cssText='position:fixed;left:-12000px;top:0;z-index:-1';box.innerHTML=`<style>${CSS}</style>`+html(st);document.body.appendChild(box);
    await Promise.all([...box.querySelectorAll('img')].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));await document.fonts?.ready;
    const cv=await window.html2canvas(box.querySelector('.rp'),{scale:2,useCORS:true,backgroundColor:'#f4f6fa',logging:false});box.remove();
    const pdf=new window.jspdf.jsPDF({orientation:'p',unit:'mm',format:'a4'});pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297);
    const P=st.P,name=(window.LAB_TITLE&&LAB_TITLE())||(P.novel?P.name:P.best.d.ko);pdf.save(`다해봄_${name}_조합분석.pdf`);
  }catch(e){console.error(e);alert('PDF를 만들지 못했습니다. 잠시 뒤 다시 눌러 주세요.')}
  finally{if(btn){btn.disabled=false;btn.innerHTML=lb}}}
window.REPORT={download,html,CSS};
})();
