// 접시 그림(캔버스). 같은 입력이면 항상 같은 탑뷰 그림이 나온다.
// draw: 완성 접시 한 장. cook: 조리 순서대로 도구가 바뀌며 익어 가는 장면을 재생한다.
const PLATE=(()=>{
function rng(seed){let s=0;for(const c of seed)s=(s*31+c.charCodeAt(0))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*Math.max(0,Math.min(1,t))));
const lt=(c,t)=>mix(c,[255,255,255],t),dk=(c,t)=>mix(c,[0,0,0],t);
const css=(c,a=1)=>a>=1?`rgb(${c.join(',')})`:`rgba(${c.join(',')},${a})`;
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const SAUCE={gochujang:[178,36,26],gochugaru:[196,44,26],kimchi:[206,64,40],doenjang:[132,88,46],soy:[84,50,30],curry:[210,150,36],tomato:[196,54,40],milk:[248,244,234],cream:[250,242,226],anchovy:[226,206,160],chocolate:[86,50,30],cheese:[240,196,84],sesameoil:[200,146,50]};
// 조각에 곱하는 양념은 국물 색과 분리해 진한 색을 쓴다.
const COAT={...SAUCE,gochujang:[150,30,20],soy:[70,40,25],doenjang:[120,80,40],curry:[200,140,30]};
const COOKED={pork:'#D7AE94',beef:'#7E4C37',chicken:'#EBD5B2',bacon:'#A8402F',egg:'#FFD24A',squid:'#F7EEE4',clam:'#E9D7BD'};
const BOWL_ACT={raw:'board',mix:'mixbowl',boil:'pot',simmer:'pot',steam:'steamer',stirfry:'pan',grill:'grillpan',fry:'fryer'};
const ACT_LABEL={raw:'손질',mix:'무치기',boil:'삶기',simmer:'끓이기',steam:'찌기',stirfry:'볶기',grill:'굽기',fry:'튀기기'};

// ---------- 바탕(나무 상판) ----------
let bgCache=null;
function background(W,H){
  if(bgCache&&bgCache.width===W&&bgCache.height===H)return bgCache;
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=rng('wood');
  const base=g.createLinearGradient(0,0,W,H);base.addColorStop(0,'#cfa477');base.addColorStop(1,'#b0814f');g.fillStyle=base;g.fillRect(0,0,W,H);
  for(let k=0;k<26;k++){const y=r()*H,amp=4+r()*10,ph=r()*6;g.strokeStyle=`rgba(${r()<.5?'90,52,24':'240,205,160'},${.05+r()*.08})`;g.lineWidth=1+r()*3;g.beginPath();
    for(let x=0;x<=W;x+=12){const yy=y+Math.sin(x/90+ph)*amp+Math.sin(x/23+ph*2)*1.5;x?g.lineTo(x,yy):g.moveTo(x,yy)}g.stroke()}
  for(let k=0;k<5;k++){g.strokeStyle='rgba(60,32,14,.18)';g.lineWidth=1.5;const y=(k+.5)*H/5+r()*8;g.beginPath();g.moveTo(0,y);g.lineTo(W,y+r()*4-2);g.stroke()}
  const light=g.createRadialGradient(W*.25,H*.15,10,W*.3,H*.3,W*.9);light.addColorStop(0,'rgba(255,248,230,.32)');light.addColorStop(1,'rgba(255,248,230,0)');g.fillStyle=light;g.fillRect(0,0,W,H);
  const vig=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,W*.75);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(30,15,5,.45)');g.fillStyle=vig;g.fillRect(0,0,W,H);
  return bgCache=c;
}

// ---------- 그릇·조리 도구 ----------
function ell(g,x,y,rx,ry){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2)}
function shadow(g,x,y,rx,ry,K){g.save();g.filter=`blur(${10*K}px)`;g.fillStyle='rgba(30,15,5,.45)';ell(g,x+8*K,y+12*K,rx*1.02,ry*1.02);g.fill();g.restore()}
// 그릇을 그리고 내용물을 담는 안쪽 원의 반지름을 돌려준다
function vessel(g,type,cx,cy,rx,ry,K){
  const rim=(c1,c2,c3,w,inner)=>{let gr=g.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry);gr.addColorStop(0,c1);gr.addColorStop(.5,c2);gr.addColorStop(1,c3);g.fillStyle=gr;ell(g,cx,cy,rx,ry);g.fill();
    const ix=rx-w,iy=ry-w*ry/rx;gr=g.createRadialGradient(cx-ix*.2,cy-iy*.35,ix*.1,cx,cy,ix);gr.addColorStop(0,inner[0]);gr.addColorStop(1,inner[1]);g.fillStyle=gr;ell(g,cx,cy,ix,iy);g.fill();return [ix,iy]};
  const spec=(a=.5)=>{g.save();g.strokeStyle=`rgba(255,255,255,${a})`;g.lineWidth=3*K;g.lineCap='round';g.beginPath();g.ellipse(cx,cy,rx-3*K,ry-3*K,0,Math.PI*1.05,Math.PI*1.45);g.stroke();g.restore()};
  let ix,iy,deep=true;
  shadow(g,cx,cy,rx,ry,K);
  switch(type){
    case 'ttuk':{ // 받침 위 뚝배기
      g.fillStyle='#2b211c';ell(g,cx+2*K,cy+6*K,rx*1.12,ry*1.12);g.fill();
      [ix,iy]=rim('#5b4232','#3a2a21','#1e1511',rx*.13,['#3d2c22','#140e0b']);spec(.35);break}
    case 'bowl':case 'noodle':[ix,iy]=rim('#ffffff','#eeebe6','#cfc9c0',rx*.12,['#f6f3ee','#d8d2c8']);spec(.8);break;
    case 'salad':[ix,iy]=rim('#f6f0e4','#e7dfcf','#c9bfac',rx*.08,['#f3ede1','#ddd3c1']);spec(.6);deep=false;break;
    case 'plate':case 'fryplate':{[ix,iy]=rim('#ffffff','#f1eee9','#d6d0c6',rx*.2,['#fbfaf7','#ebe7e0']);spec(.8);deep=false;
      if(type==='fryplate'){g.save();g.fillStyle='#f4eedf';g.beginPath();g.moveTo(cx-ix*.85,cy-iy*.2);g.lineTo(cx+ix*.55,cy-iy*.92);g.lineTo(cx+ix*.92,cy+iy*.35);g.lineTo(cx-ix*.5,cy+iy*.9);g.closePath();g.fill();
        g.strokeStyle='rgba(150,120,80,.18)';g.lineWidth=K;for(let k=0;k<5;k++){g.beginPath();g.moveTo(cx-ix*.6+k*ix*.25,cy-iy*.6);g.lineTo(cx-ix*.8+k*ix*.3,cy+iy*.6);g.stroke()}g.restore()}
      break}
    case 'pan':case 'grillpan':{ // 손잡이 달린 팬
      g.save();const hg=g.createLinearGradient(cx+rx*.8,0,cx+rx*1.55,0);hg.addColorStop(0,'#2a2b2e');hg.addColorStop(1,'#111');g.fillStyle=hg;g.beginPath();g.roundRect(cx+rx*.85,cy-ry*.1,rx*.75,ry*.2,6*K);g.fill();g.restore();
      [ix,iy]=rim('#6b6e74','#3c3e43','#1c1d20',rx*.07,['#3a3b3f','#18191b']);spec(.45);deep=false;
      if(type==='grillpan'){g.save();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=4*K;for(let k=-4;k<=4;k++){g.beginPath();g.moveTo(cx+k*ix*.22-ix*.3,cy-iy*.9);g.lineTo(cx+k*ix*.22+ix*.3,cy+iy*.9);g.stroke()}g.restore()}
      break}
    case 'pot':case 'fryer':{ // 양손잡이 냄비
      g.fillStyle='#9a9ea6';[[-1],[1]].forEach(([s])=>{g.beginPath();g.roundRect(cx+s*rx*.98-(s>0?0:rx*.16),cy-ry*.12,rx*.16,ry*.24,5*K);g.fill()});
      [ix,iy]=rim('#eef0f3','#b9bec6','#7e848d',rx*.07,['#9aa0a8','#5f646b']);spec(.7);break}
    case 'steamer':{[ix,iy]=rim('#d9b77a','#c49a58','#9c7438',rx*.1,['#e8d3a6','#cdb07a']);
      g.save();g.strokeStyle='rgba(120,85,40,.35)';g.lineWidth=2*K;for(let k=-5;k<=5;k++){g.beginPath();g.moveTo(cx+k*ix*.17,cy-iy*.95);g.lineTo(cx+k*ix*.17,cy+iy*.95);g.stroke()}g.restore();deep=false;break}
    case 'mixbowl':[ix,iy]=rim('#f4f6f8','#c3c8cf','#8a9099',rx*.06,['#d7dbe0','#a7adb5']);spec(.8);break;
    case 'board':{[ix,iy]=rim('#e6c48f','#d4af78','#bd945b',rx*.08,['#e6c48f','#c99e62']);deep=false;break}
    default:[ix,iy]=rim('#fff','#eee','#ccc',rx*.1,['#f7f7f7','#ddd']);
  }
  return {ix,iy,deep};
}

// ---------- 재료 조각 ----------
function blob(g,r,rx,ry,n=9){const pts=[];for(let k=0;k<n;k++){const a=k/n*Math.PI*2,f=.82+r()*.3;pts.push([Math.cos(a)*rx*f,Math.sin(a)*ry*f])}
  g.beginPath();pts.forEach((p,k)=>{const q=pts[(k+1)%n],m=[(p[0]+q[0])/2,(p[1]+q[1])/2];k?g.quadraticCurveTo(p[0],p[1],m[0],m[1]):g.moveTo(m[0],m[1])});const p0=pts[0],m0=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2];g.quadraticCurveTo(p0[0],p0[1],m0[0],m0[1]);g.closePath()}
function shade(g,col,s){const gr=g.createLinearGradient(-s,-s,s,s);gr.addColorStop(0,css(lt(col,.28)));gr.addColorStop(.5,css(col));gr.addColorStop(1,css(dk(col,.28)));return gr}
function hilite(g,s,a=.35){g.fillStyle=`rgba(255,255,255,${a})`;g.beginPath();g.ellipse(-s*.35,-s*.3,s*.35,s*.14,-.5,0,Math.PI*2);g.fill()}
function piece(g,pc,col,st,K){
  const I=pc.I,s=pc.s*K,r=rng(pc.key);g.save();g.translate(pc.x,pc.y);g.rotate(pc.rot);
  g.shadowColor='rgba(40,20,5,.35)';g.shadowBlur=4*K;g.shadowOffsetX=1.5*K;g.shadowOffsetY=2.5*K;
  const fill=()=>{g.fillStyle=shade(g,col,s);g.fill()};
  switch(I.shape){
    case 'slice':
      if(I.prop==='meat'){blob(g,r,s*1.85,s*.62,11);fill();g.shadowColor='transparent';g.strokeStyle=css(dk(col,.3),.6);g.lineWidth=1.1*K;g.stroke();
        if(st.raw>.3){g.strokeStyle=`rgba(255,246,236,${.55*st.raw})`;g.lineWidth=1.3*K;for(let k=0;k<3;k++){g.beginPath();g.moveTo(-s*1.1,-s*.4+k*s*.35);g.bezierCurveTo(-s*.3,-s*.7+k*s*.4,s*.3,k*s*.3,s*1.1,-s*.2+k*s*.3);g.stroke()}}
        if(st.char>0){g.strokeStyle=`rgba(40,20,10,${.6*st.char})`;g.lineWidth=2.5*K;for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(-s+k*s*.6,-s*.6);g.lineTo(-s*.4+k*s*.6,s*.6);g.stroke()}}
        hilite(g,s,.25)}
      else if(I.id==='onion'){g.shadowColor='transparent';g.lineWidth=2.2*K;g.strokeStyle=css(lt(col,.1),.9);for(let k=0;k<2;k++){g.beginPath();g.arc(0,0,s*(1-k*.3),.2,Math.PI*1.1);g.stroke()}}
      else{g.beginPath();g.arc(0,0,s*.8,0,Math.PI*2);g.fillStyle=css(dk(col,.15));g.fill();g.shadowColor='transparent';g.beginPath();g.arc(0,0,s*.65,0,Math.PI*2);g.fillStyle=css(lt(col,.55));g.fill();
        g.fillStyle=css(lt(col,.25),.8);for(let k=0;k<5;k++){const a=k/5*Math.PI*2;g.beginPath();g.ellipse(Math.cos(a)*s*.3,Math.sin(a)*s*.3,s*.07,s*.12,a,0,Math.PI*2);g.fill()}}
      break;
    case 'chunk':
      if(I.id==='mushroom'){g.beginPath();g.ellipse(0,0,s,s*.7,0,Math.PI,0);g.lineTo(s*.3,s*.5);g.lineTo(-s*.3,s*.5);g.closePath();fill();g.shadowColor='transparent';g.strokeStyle=css(lt(col,.35),.7);g.lineWidth=K;for(let k=-3;k<=3;k++){g.beginPath();g.moveTo(k*s*.12,-s*.05);g.lineTo(k*s*.25,-s*.6);g.stroke()}}
      else if(I.id==='tomato'){g.beginPath();g.moveTo(0,-s);g.quadraticCurveTo(s*1.2,0,0,s);g.quadraticCurveTo(-s*.4,0,0,-s);fill();g.shadowColor='transparent';g.fillStyle=css([250,220,120],.8);for(let k=0;k<4;k++){g.beginPath();g.ellipse(s*.25,-s*.5+k*s*.32,s*.08,s*.05,0,0,Math.PI*2);g.fill()}}
      else{blob(g,r,s,s*.85,7);fill();g.shadowColor='transparent';if(st.char>0){g.strokeStyle=`rgba(40,20,10,${.5*st.char})`;g.lineWidth=2*K;g.beginPath();g.moveTo(-s*.6,-s*.3);g.lineTo(s*.5,s*.3);g.stroke()}hilite(g,s,.3)}
      break;
    case 'strip':g.beginPath();for(let x=-s*1.6;x<=s*1.6;x+=s*.2)g.lineTo(x,Math.sin(x/s*3)*s*.12-s*.3);for(let x=s*1.6;x>=-s*1.6;x-=s*.2)g.lineTo(x,Math.sin(x/s*3)*s*.12+s*.3);g.closePath();fill();g.shadowColor='transparent';
      g.strokeStyle='rgba(255,240,225,.6)';g.lineWidth=2*K;g.beginPath();for(let x=-s*1.5;x<=s*1.5;x+=s*.2)g.lineTo(x,Math.sin(x/s*3)*s*.12);g.stroke();break;
    case 'egg':
      if(st.boiled>.4&&!st.fried){g.beginPath();g.ellipse(0,0,s*1.2,s*.9,0,0,Math.PI*2);g.fillStyle=shade(g,[250,248,240],s);g.fill();g.shadowColor='transparent';const yg=g.createRadialGradient(-s*.1,-s*.1,1,0,0,s*.55);yg.addColorStop(0,'#ffe27a');yg.addColorStop(1,'#f0a818');g.fillStyle=yg;g.beginPath();g.arc(0,0,s*.55,0,Math.PI*2);g.fill()}
      else{blob(g,r,s*2.1,s*1.7,10);g.fillStyle=shade(g,st.heat>.2?[252,250,244]:[245,240,225],s*2);g.fill();if(st.brown>.1){g.strokeStyle=css([190,140,70],.7*st.brown);g.lineWidth=3*K;g.stroke()}g.shadowColor='transparent';
        const yg=g.createRadialGradient(-s*.2,-s*.2,1,0,0,s*.75);yg.addColorStop(0,'#ffe58a');yg.addColorStop(.7,'#ffbf1f');yg.addColorStop(1,'#e8930c');g.fillStyle=yg;g.beginPath();g.arc(s*.1,0,s*.72,0,Math.PI*2);g.fill();hilite(g,s*.7,.6)}
      break;
    case 'cube':
      if(I.id==='butter'&&st.heat>.3){g.shadowColor='transparent';g.fillStyle=css([248,214,96],.55);blob(g,r,s*1.4,s*1.1);g.fill();break}
      {const a=s*.85;g.fillStyle=shade(g,col,s);g.beginPath();g.roundRect(-a,-a,a*2,a*2,2*K);g.fill();g.shadowColor='transparent';g.strokeStyle=css(dk(col,.2),.5);g.lineWidth=K;g.stroke();
        if(st.brown>.15){g.fillStyle=css([196,140,70],.5*st.brown);g.fill()}hilite(g,a,.3)}
      break;
    case 'curl':g.lineCap='round';g.lineWidth=s*.75;g.strokeStyle=shade(g,col,s);g.beginPath();g.arc(0,0,s*.8,.3,Math.PI*1.55);g.stroke();g.shadowColor='transparent';
      g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=K;for(let k=0;k<5;k++){const a=.5+k*.22;g.beginPath();g.moveTo(Math.cos(a)*s*.45,Math.sin(a)*s*.45);g.lineTo(Math.cos(a)*s*1.15,Math.sin(a)*s*1.15);g.stroke()}
      g.fillStyle=css(dk(col,.1));g.beginPath();g.moveTo(Math.cos(.3)*s*.8,Math.sin(.3)*s*.8);g.lineTo(s*1.3,s*.15);g.lineTo(s*1.15,s*.65);g.closePath();g.fill();break;
    case 'ring':g.lineWidth=s*.4;g.strokeStyle=shade(g,col,s);g.beginPath();g.ellipse(0,0,s,s*.78,0,0,Math.PI*2);g.stroke();g.shadowColor='transparent';g.strokeStyle='rgba(120,80,60,.25)';g.lineWidth=K;g.beginPath();g.ellipse(0,0,s*.8,s*.6,0,0,Math.PI*2);g.stroke();break;
    case 'shell':g.beginPath();g.moveTo(0,s*.6);g.arc(0,s*.6,s*1.2,Math.PI*1.12,Math.PI*1.88);g.closePath();fill();g.shadowColor='transparent';g.strokeStyle=css(dk(col,.3),.5);g.lineWidth=K;
      for(let k=1;k<8;k++){const a=Math.PI*(1.12+k*.095);g.beginPath();g.moveTo(0,s*.6);g.lineTo(Math.cos(a)*s*1.2,s*.6+Math.sin(a)*s*1.2);g.stroke()}break;
    case 'leaf':{const wilt=st.heat;const sx=s*(1.5-.35*wilt),sy=s*(.85-.2*wilt);
      g.beginPath();g.moveTo(-sx,0);g.bezierCurveTo(-sx*.4,-sy*1.4,sx*.6,-sy*1.1,sx,0);g.bezierCurveTo(sx*.5,sy*1.2,-sx*.5,sy*1.1,-sx,0);
      if(I.id==='kimchi'){g.fillStyle=shade(g,[240,232,205],s);g.fill();g.shadowColor='transparent';g.fillStyle=css([205,48,28],.75);g.fill();g.fillStyle=css([150,20,10],.6);for(let k=0;k<6;k++)g.fillRect((r()-.5)*sx*1.4,(r()-.5)*sy,1.8*K,1.4*K)}
      else{g.fillStyle=shade(g,dk(col,.15*wilt),s);g.fill();g.shadowColor='transparent'}
      g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=1.2*K;g.beginPath();g.moveTo(-sx*.9,0);g.quadraticCurveTo(0,-sy*.2,sx*.9,0);g.stroke();break}
    case 'strand':
      if(I.prop==='allium'){g.shadowColor='transparent';for(let k=0;k<3;k++){const x=(k-1)*s*.7,y=(r()-.5)*s*.6;g.fillStyle=css(dk(col,.1));g.beginPath();g.ellipse(x,y,s*.38,s*.3,0,0,Math.PI*2);g.fill();g.fillStyle=css(lt(col,.55));g.beginPath();g.ellipse(x,y,s*.2,s*.15,0,0,Math.PI*2);g.fill()}}
      else{g.shadowColor='transparent';g.lineCap='round';g.strokeStyle=css(col);g.lineWidth=1.6*K;g.beginPath();g.moveTo(-s*1.4,0);g.bezierCurveTo(-s*.5,-s,s*.5,s,s*1.4,-s*.2);g.stroke();g.fillStyle=css(lt([230,210,90],.2));g.beginPath();g.ellipse(-s*1.45,0,s*.25,s*.18,0,0,Math.PI*2);g.fill()}
      break;
    case 'dot':g.shadowColor='transparent';
      if(I.id==='gochugaru'){g.fillStyle=css(col,.85);for(let k=0;k<7;k++){g.save();g.translate((r()-.5)*s*1.6,(r()-.5)*s*1.2);g.rotate(r()*3);g.fillRect(-1.3*K,-.8*K,2.6*K,1.6*K);g.restore()}}
      else if(I.id==='chili'){g.lineWidth=s*.22;g.strokeStyle=css(col);g.beginPath();g.arc(0,0,s*.38,0,Math.PI*2);g.stroke();g.fillStyle='rgba(250,240,200,.9)';for(let k=0;k<3;k++){g.beginPath();g.arc((r()-.5)*s*.3,(r()-.5)*s*.3,.9*K,0,Math.PI*2);g.fill()}}
      else if(I.id==='sugar'){}
      else{g.fillStyle=shade(g,dk(col,.04*st.brown),s);g.beginPath();g.ellipse(0,0,s*.45,s*.32,0,0,Math.PI*2);g.fill();g.strokeStyle=css(dk(col,.25),.5);g.lineWidth=.8*K;g.stroke()}
      break;
    case 'stick':
      if(I.id==='tteok'){const gr=g.createLinearGradient(0,-s*.4,0,s*.4);gr.addColorStop(0,css(lt(col,.3)));gr.addColorStop(.5,css(col));gr.addColorStop(1,css(dk(col,.18)));g.fillStyle=gr;g.beginPath();g.roundRect(-s*1.3,-s*.4,s*2.6,s*.8,s*.4);g.fill();g.shadowColor='transparent';hilite(g,s,.5)}
      else{g.fillStyle=shade(g,col,s);g.beginPath();g.roundRect(-s*1.2,-s*.25,s*2.4,s*.5,s*.1);g.fill()}break;
    case 'shred':g.shadowColor='transparent';
      if(st.heat>.3){g.fillStyle=css([246,200,80],.85);blob(g,r,s*1.6,s*1.2);g.fill();g.fillStyle=css([200,130,50],.5*st.brown);for(let k=0;k<4;k++){g.beginPath();g.arc((r()-.5)*s*2,(r()-.5)*s*1.4,s*.2,0,Math.PI*2);g.fill()}}
      else{g.strokeStyle=css(col);g.lineWidth=1.8*K;g.lineCap='round';for(let k=0;k<4;k++){g.beginPath();g.moveTo((r()-.5)*s*2,(r()-.5)*s);g.lineTo((r()-.5)*s*2,(r()-.5)*s);g.stroke()}}break;
    default:g.beginPath();g.arc(0,0,s*.7,0,Math.PI*2);fill();
  }
  // 튀김옷
  if(st.fried>.05&&!['dot','strand','shred'].includes(I.shape)){g.shadowColor='transparent';const fc=mix([236,200,120],[196,128,48],st.fried);g.fillStyle=css(fc,.85*Math.min(1,st.fried*1.4));blob(g,r,s*1.6,s*1.15,12);g.fill();
    g.fillStyle=css(lt(fc,.3),.6);for(let k=0;k<8;k++){g.beginPath();g.arc((r()-.5)*s*2.2,(r()-.5)*s*1.5,s*.12,0,Math.PI*2);g.fill()}}
  if(st.burn>0){g.fillStyle=`rgba(25,15,10,${.55*st.burn})`;blob(g,r,s*1.1,s*.8);g.fill()}
  g.restore();
}

// ---------- 사진·메타데이터 캐시 ----------
// 메타데이터를 기다리는 첫 화면에서도 같은 단위로 배치한다.
const DEFAULT_META={
  ing:{pork:[25,7],beef:[20,7],chicken:[25,4],bacon:[12,9],egg:[50,9],tofu:[15,2.5],shrimp:[15,6],squid:[15,5],clam:[10,4],kimchi:[15,5],onion:[8,5],scallion:[3,4],garlic:[3,1.8],chili:[2,1.5],potato:[15,2.5],carrot:[6,4],cabbage:[8,5],zucchini:[8,4],mushroom:[6,4],tomato:[20,4],spinach:[5,6],sprout:[6,6],cucumber:[8,3.5],lettuce:[8,9],basil:[.5,3],tteok:[20,6],butter:[10,2.5],cheese:[10,4],chocolate:[8,2.5],gochugaru:[3,3],rice:[210,10],pasta:[100,12],ramen:[110,11],somyeon:[100,11],dangmyeon:[60,11]},
  vessel:{ttuk:15,noodle:18,bowl:18,plate:22,pan:24,fryplate:20,salad:20,board:28,mixbowl:24,pot:22,steamer:22,grillpan:24,fryer:22},
  states:['raw','boiled','cooked','fried','charred']
};
let meta=DEFAULT_META,manifest={},assetVersion=0,loading=null,lastDraw=null,assetsReady=false;const failed=new Set();
const images=new Map(),fallbacks=new Map(),blends=new Map(),surfaces=new Map(),backdrops=new Map(),photoBodies=new WeakMap(),playing=new WeakMap(),oilPhotos=new WeakMap();
const scriptURL=typeof document!=='undefined'&&document.currentScript&&document.currentScript.src;
const assetBase=scriptURL?new URL('../img/plate/',scriptURL).href:'img/plate/';
const canvas=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const boundedSet=(map,key,value,max=160)=>{if(map.size>=max)map.delete(map.keys().next().value);map.set(key,value);return value};
function cover(g,img,x,y,w,h){const s=Math.max(w/img.width,h/img.height),sw=w/s,sh=h/s;g.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h)}
// 투명한 여백을 잘라 긴 변을 실제 크기로 환산한다.
function trim(c){
  const g=c.getContext('2d',{willReadFrequently:true}),d=g.getImageData(0,0,c.width,c.height).data;
  let x0=c.width,y0=c.height,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  if(x1<0)return c;const out=canvas(x1-x0+1,y1-y0+1);out.getContext('2d').drawImage(c,x0,y0,out.width,out.height,0,0,out.width,out.height);return out;
}
// 투명 도구 사진의 손잡이를 제외한 원형 본체 중심과 반지름을 찾는다.
function photoBody(c){
  const W=c.width,H=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,W,H).data,dist=new Float32Array(W*H),diag=Math.SQRT2;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;dist[i]=d[i*4+3]>20?Math.min(x+1,y+1,W-x,H-y):0}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!dist[i])continue;if(x)dist[i]=Math.min(dist[i],dist[i-1]+1);if(y)dist[i]=Math.min(dist[i],dist[i-W]+1);if(x&&y)dist[i]=Math.min(dist[i],dist[i-W-1]+diag);if(x+1<W&&y)dist[i]=Math.min(dist[i],dist[i-W+1]+diag)}
  let best={x:W/2,y:H/2,r:0};
  for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(!dist[i])continue;if(x+1<W)dist[i]=Math.min(dist[i],dist[i+1]+1);if(y+1<H)dist[i]=Math.min(dist[i],dist[i+W]+1);if(x+1<W&&y+1<H)dist[i]=Math.min(dist[i],dist[i+W+1]+diag);if(x&&y+1<H)dist[i]=Math.min(dist[i],dist[i+W-1]+diag);if(dist[i]>best.r)best={x:x+.5,y:y+.5,r:dist[i]}}
  return best.r>Math.min(W,H)*.2?best:{x:W/2,y:H/2,r:Math.min(W,H)/2};
}
async function loadPhoto(file,limit,cut,body){
  if(typeof file!=='string'||!file||images.has(file))return;
  const img=new Image();
  try{
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=assetBase+file});
    const s=Math.min(1,limit/Math.max(img.naturalWidth,img.naturalHeight));
    let c=canvas(Math.max(1,Math.round(img.naturalWidth*s)),Math.max(1,Math.round(img.naturalHeight*s)));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);if(cut)c=trim(c);images.set(file,c);photoFile.set(c,file);if(body)photoBodies.set(c,photoBody(c));
  }catch(_){failed.add(file);/* 없는 사진은 해당 상태의 손그림으로 대체한다. */}
}
function ensureAssets(){
  if(loading)return loading;
  const json=name=>fetch(assetBase+name).then(r=>r.ok?r.json():null).catch(()=>null);
  loading=Promise.all([json('meta.json'),json('manifest.json')]).then(async([m,list])=>{
    if(m)meta={...DEFAULT_META,...m,ing:{...DEFAULT_META.ing,...m.ing},vessel:{...DEFAULT_META.vessel,...m.vessel}};
    manifest=list||{};const jobs=new Map();
    const add=(file,limit,cut,body=false)=>{if(typeof file==='string')jobs.set(file,{limit,cut,body})};
    Object.values(manifest.ing||{}).forEach(states=>Object.values(states||{}).forEach(files=>{if(Array.isArray(files))files.forEach(f=>add(f,256,true))}));
    ['vessel','tool'].forEach(group=>Object.values(manifest[group]||{}).forEach(f=>add(f,768,true,true)));
    Object.values(manifest.texture||{}).forEach(f=>add(f,512,false));add(manifest.table,1280,false);
    // 메뉴 완성 사진(조리 재생 마지막에 쓴다)
    Object.values(manifest.dish||{}).forEach(f=>add(f,960,false));
    // 동시에 디코딩하는 사진 수를 제한해 메모리가 몰리지 않게 한다.
    const run=async list=>{let next=0;await Promise.all(Array.from({length:Math.min(4,list.length)},async()=>{while(next<list.length){const [file,o]=list[next++];await loadPhoto(file,o.limit,o.cut,o.body)}}))};
    const redraw=()=>{if(lastDraw){const active=playing.get(lastDraw[0]);if(active)active.warm?.();else draw(...lastDraw)}};
    // 1단계: 지금 보드에 쓰는 재료 사진과 그릇·도구·질감·식탁(모형 그림에 필요한 것)을 먼저 받아 곧바로 다시 그린다
    const dishFiles=new Set(Object.values(manifest.dish||{})),R0=lastDraw?.[1],need=new Set();
    (R0?.items||[]).forEach(it=>Object.values(manifest.ing?.[it.id]||{}).forEach(fs=>Array.isArray(fs)&&fs.forEach(f=>need.add(f))));
    const isBase=f=>f===manifest.table||Object.values(manifest.vessel||{}).includes(f)||Object.values(manifest.tool||{}).includes(f)||Object.values(manifest.texture||{}).includes(f);
    await run([...jobs].filter(([f])=>need.has(f)||isBase(f)));
    assetVersion++;bgCache=null;blends.clear();surfaces.clear();backdrops.clear();redraw();
    // 2단계: 나머지 재료 사진, 3단계: 완성 사진(조리 재생 끝에 쓴다)
    await run([...jobs].filter(([f])=>!need.has(f)&&!isBase(f)&&!dishFiles.has(f)));
    assetVersion++;bgCache=null;blends.clear();surfaces.clear();backdrops.clear();assetsReady=true;redraw();
    await run([...jobs].filter(([f])=>dishFiles.has(f)));
  }).catch(()=>{/* 파일 접근이 막힌 환경에서도 손그림 화면을 유지한다. */assetsReady=true;if(lastDraw)draw(...lastDraw)});
  return loading;
}
function table(g,W,H){const img=images.get(manifest.table);if(img)cover(g,img,0,0,W,H);else g.drawImage(background(W,H),0,0)}
const unitFor=id=>{const v=meta.ing[id];return Array.isArray(v)&&v[0]>0&&v[1]>0?v:[10,3]};
const isMound=I=>I.shape==='grain'||I.prop==='noodle';

// ---------- 장면 준비와 계산기 연결 ----------
function sauceColor(items,palette=SAUCE){let w=0,c=[0,0,0];items.forEach(i=>{const s=palette[i.id];if(!s)return;const k=i.g*(i.id==='anchovy'?.12:1);w+=k;c=c.map((v,j)=>v+s[j]*k)});return w?c.map(v=>Math.round(v/w)):null}
function build(R,E,P){
  const seed=R.items.map(i=>i.id+i.g).sort().join(','),rand=rng(seed),lvl={};
  R.items.forEach(it=>it.path.forEach((a,k)=>{lvl[a]=Math.max(lvl[a]||0,k)}));
  const order=[],seen=new Set(),visiting=new Set();
  // 합류하는 행위는 모든 앞 행위가 끝난 다음에 재생한다.
  function visit(nid){if(seen.has(nid)||visiting.has(nid)||!R.acts[nid])return;visiting.add(nid);
    R.items.forEach(it=>{const k=it.path.indexOf(nid);if(k>0)visit(it.path[k-1])});visiting.delete(nid);seen.add(nid);order.push(nid)}
  Object.keys(R.acts).sort((a,b)=>(lvl[a]??0)-(lvl[b]??0)).forEach(visit);
  const curryRice=R.items.some(i=>i.id==='rice'&&i.g>0)&&R.items.some(i=>i.id==='curry'&&i.g>0&&i.path.some(nid=>['simmer','boil'].includes(R.acts[nid]?.key)&&(R.acts[nid].temp??100)>=70));
  const final=curryRice?'plate':(!P||P.novel?ENG.BOWL_BY_ACT[E.mainAct]:P.best?.d?.bowl)||'plate',pieces=[];
  R.items.filter(it=>it.g>0).forEach(it=>{const I=ING[it.id];if(!I||['liquid','paste','batter'].includes(I.shape)||I.id==='sugar')return;
    const [unitG,cm]=unitFor(it.id),mound=isMound(I),n=mound?1:cl(Math.round(it.g/unitG),1,28);
    for(let k=0;k<n;k++)pieces.push({it,I,key:(it.nid??it.id)+':'+k,variant:k,rot:mound?0:rand()*Math.PI*2,ph:rand()*6,cm:cm*(mound?Math.sqrt(it.g/unitG):1),mound});
  });
  pieces.sort((a,b)=>b.cm-a.cm);
  return {order,final,pieces,rice:R.items.find(it=>it.g>0&&ING[it.id].shape==='grain'),seed,version:assetVersion,layouts:new Map()};
}
// 완성 그림과 재생이 함께 쓰는 시간 함수. t=1과 완료 집합은 같은 분을 돌려준다.
function elapsedAt(nid,R,done,cur,t){
  const a=R.acts[nid];if(!a)return 0;
  return Math.max(0,a.time??ACT[a.key].dTime??0)*(done?.has(nid)?1:nid===cur?cl(t??0):0);
}
function heatState(it,R,doneSet,cur,t){
  let weights={raw:1,boiled:0,cooked:0,fried:0,charred:0},brown=0,charred=0,minutes=0,lowOil=0;
  const min=ENG.MINCOOK[ING[it.id].prop]||2;
  it.path.forEach(nid=>{
    const a=R.acts[nid];if(!a)return;
    const A=ACT[a.key],T=a.temp??A.dTemp??0,m=elapsedAt(nid,R,doneSet,cur,t);
    if(!A.heat||T<70||m<=0)return;
    minutes+=m;
    let amount=cl(m/min);const target={raw:0,boiled:0,cooked:0,fried:0,charred:0};
    if(['boil','simmer','steam'].includes(a.key))target.boiled=1;
    else if(['stirfry','grill'].includes(a.key)){
      const b=cl((T-140)/80)*cl(m/(A.time?A.time[0]+2:5));
      brown=Math.max(brown,b);target.cooked=b;target.boiled=1-b;
    }else if(a.key==='fry'){
      // 낮은 온도에서도 2분 이상이면 튀김옷 사진을 70% 이상 쓴다.
      const crisp=Math.max(cl((T-100)/60),.7*cl(m/2));
      target.fried=crisp;target[weights.boiled>weights.raw?'boiled':'raw']=1-crisp;
      amount=Math.max(amount,cl(m/2));lowOil=Math.max(lowOil,cl((160-T)/40));
    }else return;
    Object.keys(weights).forEach(k=>{weights[k]=weights[k]*(1-amount)+target[k]*amount});
    if(['stirfry','grill','fry'].includes(a.key)){
      const over=ENG.burnOver({...a,time:m}),overTime=A.time&&m>A.time[1],overHeat=A.temp&&T>A.temp[1]+20;
      // 시간 초과는 해당 시점부터 반영한다. 190도 초과 튀김도 같은 과열량을 쓴다.
      if(overTime||overHeat||(a.key==='fry'&&T>190))charred=Math.max(charred,cl(over)*cl(m/2));
    }
  });
  const carry=brown*.35;if(weights.cooked<carry){const take=Math.min(weights.boiled,carry-weights.cooked);weights.boiled-=take;weights.cooked+=take}
  Object.keys(weights).forEach(k=>{weights[k]*=1-charred});weights.charred=charred;
  return {...weights,weights,brown,heat:1-weights.raw,char:charred,burn:charred,lowOil,minutes};
}
const LIQUID_IDS=['anchovy','milk','cream','water'];
const SEASON_IDS=['gochujang','soy','doenjang','curry','gochugaru'];
function processLevel(it,R,o,keys){
  if(!R)return 0;let level=0;
  it.path.forEach(nid=>{const a=R.acts[nid];if(!a||!keys.includes(a.key))return;
    if(ACT[a.key].heat&&(a.temp??ACT[a.key].dTemp??0)<70)return;
    level=Math.max(level,cl(elapsedAt(nid,R,o.done,o.act?.nid,o.t)/.6))});return level;
}
function meltLevel(it,items,R,o){
  if(!['chocolate','butter','cheese'].includes(it.id)||!R)return 0;
  const wet=items.filter(i=>LIQUID_IDS.includes(i.id)&&i.g>0);let level=0;
  it.path.forEach(nid=>{const a=R.acts[nid];if(!a||!['boil','simmer'].includes(a.key)||!wet.some(i=>i.path.includes(nid)))return;
    if((a.temp??ACT[a.key].dTemp??0)>=70)level=Math.max(level,cl(elapsedAt(nid,R,o.done,o.act?.nid,o.t)/.6))});return level;
}
function soupModel(items,E,R,o={}){
  const grams=id=>items.filter(i=>i.id===id).reduce((s,i)=>s+i.g,0),melts=new Map();
  // 이전 단계에서 우러난 색은 유지하고 새로 들어온 재료만 현재 단계 비율로 우린다.
  const colorLevel=it=>{
    if(!o.act||!it.path.includes(o.act.nid))return 1;
    if(it.path.some(nid=>o.done?.has(nid)&&['mix','stirfry','grill','fry','boil','simmer'].includes(R.acts[nid]?.key)))return 1;
    const total=Math.max(0,o.act.time??ACT[o.act.key].dTime??0);
    return total?cl(elapsedAt(o.act.nid,R,o.done,o.act.nid,o.t)/total):cl(o.t??0);
  };
  const colored=id=>items.filter(i=>i.id===id).reduce((s,i)=>s+i.g*colorLevel(i),0);
  // 토마토는 볶거나 끓인 누적 시간이 5분이면 절반을 소스로 풀어 준다.
  const tomatoes=new Map();
  items.filter(i=>i.id==='tomato').forEach(it=>{
    const minutes=it.path.reduce((sum,nid)=>{const a=R.acts[nid];return sum+(a&&['stirfry','simmer','boil'].includes(a.key)&&(a.temp??ACT[a.key].dTemp??0)>=70?elapsedAt(nid,R,o.done,o.act?.nid,o.t):0)},0);
    tomatoes.set(it.nid,minutes>=5?.5:0);
  });
  const tomatoG=items.filter(i=>i.id==='tomato').reduce((sum,it)=>sum+it.g*(tomatoes.get(it.nid)||0),0);
  items.forEach(it=>melts.set(it.nid,meltLevel(it,items,R,o)));
  // 졸아듦과 물 버리기는 액체 재료의 실제 경로에만 적용한다.
  let liquidG=0;
  items.filter(i=>LIQUID_IDS.includes(i.id)).forEach(it=>{let f=1;
    it.path.forEach(nid=>{const a=R?.acts[nid];if(!a||(a.temp??ACT[a.key].dTemp??0)<70)return;
      const m=elapsedAt(nid,R,o.done,o.act?.nid,o.t),total=Math.max(0,a.time??ACT[a.key].dTime??0);
      if(a.key==='simmer'&&ACT[a.key].time)f*=1-cl((m-ACT[a.key].time[1])/ACT[a.key].time[1],0,.35);
      if(a.key==='boil'&&total>0)f*=m>=total?0:1-cl((m/total-.8)/.2);
    });liquidG+=it.g*f;
  });
  const solidG=items.filter(i=>!LIQUID_IDS.includes(i.id)).reduce((s,i)=>s+i.g,0);
  // 삶기에는 임시 물을 넣고 마지막 오분의 일 구간에서 전부 뺀다.
  if(o.act?.key==='boil'&&!items.some(i=>LIQUID_IDS.includes(i.id))&&(o.act.temp??100)>=70){const progress=o.done?.has(o.act.nid)?1:cl(o.t??0);liquidG=progress>=1?0:solidG*.8*(1-cl((progress-.8)/.2))}
  const dissolved=id=>items.filter(i=>i.id===id).reduce((s,i)=>s+i.g*(R?(melts.get(i.nid)||0):1),0);
  const colorWeights={red:colored('kimchi')*.5+colored('gochugaru')*4+colored('gochujang')*2,doenjang:colored('doenjang')*2,curry:colored('curry')*2,chocolate:dissolved('chocolate')*3,cream:grams('milk')+grams('cream')+dissolved('butter')+dissolved('cheese')};
  const weighted=Object.values(colorWeights).reduce((a,b)=>a+b,0),strength=liquidG?cl(weighted/liquidG/.35):0;
  let kind=Object.keys(colorWeights).reduce((a,b)=>colorWeights[b]>colorWeights[a]?b:a,'red');if(!weighted)kind='clear';
  // 초콜릿은 우유보다 양이 작아도 초콜릿 질감을 선택하고 농도로 크림과 섞는다.
  // 우유 250g에 초콜릿 40g이면 녹인 초콜릿이 아니라 우유 섞인 갈색 음료가 되도록, 초콜릿 비중(가중 g ÷ 액체 g)을 1.0 기준으로 섞는다.
  const chocolateMix=liquidG?cl(Math.sqrt(colorWeights.chocolate/liquidG)):0;
  if(colorWeights.chocolate>0)kind='chocolate';
  const dairy=colorWeights.cream>0,base=dairy?SAUCE.cream:SAUCE.anchovy,tint=soupColor(kind);
  const col=kind==='chocolate'?mix(base,tint,chocolateMix):mix(SAUCE.anchovy,tint,strength);
  const ratio=liquidG/Math.max(1,solidG),area=liquidG?.96*cl(ratio/.5):0;
  const coats=items.filter(i=>SEASON_IDS.includes(i.id)).map(it=>({it,level:processLevel(it,R,o,['mix','stirfry','grill','fry','boil','simmer'])}));
  const bodyG=items.filter(i=>!LIQUID_IDS.includes(i.id)&&!SEASON_IDS.includes(i.id)&&i.id!=='sugar').reduce((s,i)=>s+i.g,0);
  const seasonG=coats.reduce((s,c)=>s+c.it.g*c.level,0),coatColor=sauceColor(coats.map(c=>({...c.it,g:c.it.g*c.level})),COAT)||SAUCE.gochujang;
  const dominant=coats.slice().sort((a,b)=>b.it.g*b.level-a.it.g*a.level)[0]?.it.id;
  const curry=items.filter(i=>i.id==='curry').reduce((s,i)=>Math.max(s,processLevel(i,R,o,['boil','simmer'])),0);
  // 국물 없이 장류를 끓이면(떡볶이처럼) 졸아든 양념 소스가 그릇 바닥에 고인다
  const pasteStew=liquidG?0:items.filter(i=>['gochujang','doenjang','soy'].includes(i.id)).reduce((s,i)=>Math.max(s,processLevel(i,R,o,['boil','simmer'])),0);
  const dollops=items.filter(i=>i.id==='gochujang').map(it=>({it,amount:1-processLevel(it,R,o,['mix','boil','simmer','stirfry','grill','fry'])})).filter(x=>x.amount>0);
  return {liquidG,solidG,kind,strength,tint,col,dairy,chocolateMix,melts,tomatoes,tomatoG,boiling:o.act?.key==='boil',soyLevel:grams('soy')?colored('soy')/grams('soy'):0,coats,coatColor,coatStrength:liquidG?0:cl(seasonG/Math.max(1,bodyG)*6,0,.45),sauceKind:dominant==='curry'?'curry':dominant==='soy'||dominant==='doenjang'?'doenjang':'red',soy:dominant==='soy',curry,pasteStew,dollops,area,submerge:liquidG?cl(.25+ratio*.55,0,.9):0,oil:cl(E?.taste?.[5]||0),glaze:cl(((E?.taste?.[0]||0)+(E?.taste?.[1]||0))/2)};
}

// ---------- 실제 크기에 맞춘 사진과 손그림 상태 합성 ----------
function moundFallback(I,variant,state){
  const c=canvas(256),g=c.getContext('2d'),r=rng(I.id+variant),col=hex(I.color);
  if(I.shape==='grain'){
    g.fillStyle=css(state==='charred'?[42,28,19]:state==='cooked'?mix(col,[162,104,48],.45):col);ell(g,128,128,112,96);g.fill();
    for(let k=0;k<180;k++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*.95;g.save();g.translate(128+Math.cos(a)*108*rr,128+Math.sin(a)*92*rr);g.rotate(r()*Math.PI);g.fillStyle=css(lt(col,r()*.2),state==='charred'?.12:.85);ell(g,0,0,3,1.5);g.fill();g.restore()}
  }else{
    g.lineCap='round';g.lineJoin='round';g.lineWidth=I.id==='somyeon'?2:4;
    for(let k=0;k<46;k++){const a=r()*Math.PI*2,rr=20+r()*65,ph=r()*6;g.beginPath();for(let j=0;j<48;j++){const th=a+j*.13,rad=rr+Math.sin(j*.22+ph)*9;const x=128+Math.cos(th)*rad,y=128+Math.sin(th)*rad;j?g.lineTo(x,y):g.moveTo(x,y)}g.strokeStyle=css(state==='charred'?[44,27,16]:mix(col,[168,106,44],state==='cooked'?.25:0));g.stroke()}
  }
  return trim(c);
}
function stateSprite(I,state,variant){
  const files=manifest.ing?.[I.id]?.[state],file=Array.isArray(files)&&files.length?files[variant%files.length]:null;
  if(file&&images.has(file))return images.get(file);
  const key=I.id+':'+state+':'+variant%3;if(fallbacks.has(key))return fallbacks.get(key);
  let c;
  if(isMound(I))c=moundFallback(I,variant%3,state);
  else{
    c=canvas(256);const g=c.getContext('2d'),st={raw:state==='raw'?1:0,heat:state==='raw'?0:1,boiled:state==='boiled'?1:0,brown:state==='cooked'?1:0,fried:state==='fried'?1:0,char:state==='charred'?1:0,burn:state==='charred'?1:0};
    let col=hex(I.color);if(COOKED[I.id]&&st.heat)col=hex(COOKED[I.id]);if(st.brown)col=mix(col,[150,92,48],.6);
    piece(g,{I,s:42,x:128,y:128,rot:0,key},col,st,.7);c=trim(c);
  }
  return boundedSet(fallbacks,key,c,512);
}
// 저온 튀김의 색 보정도 원본 사진별로 한 번만 준비한다.
function oilyPhoto(img,lowOil){
  if(!lowOil)return img;let map=oilPhotos.get(img);if(!map){map=new Map();oilPhotos.set(img,map)}
  const q=Math.round(lowOil*8)/8;if(map.has(q))return map.get(q);
  const c=canvas(img.width,img.height),g=c.getContext('2d');g.filter=`brightness(${1+q*.15}) saturate(${1-q*.5}) contrast(${1-q*.22})`;g.drawImage(img,0,0);map.set(q,c);return c;
}
function sprite(pc,st,soup){
  const parts=DEFAULT_META.states.filter(k=>st.weights[k]>.0001).map(k=>[k,stateSprite(pc.I,k,pc.variant),st.weights[k]]);
  const signature=parts.map(([k,,w])=>{const files=manifest.ing?.[pc.I.id]?.[k],n=files?.length||3;return k+':'+pc.variant%n+':'+w}).join(',');
  const key=[assetVersion,pc.I.id,signature,soup.glaze,soup.coatStrength,soup.coatColor?.join(','),soup.sauceKind,soup.soy,soup.pasteStew,soup.col.join(','),soup.submerge,soup.boiling,soup.oil,st.lowOil].join('|');
  if(blends.has(key))return blends.get(key);
  const size=pc.mound?256:128,mid=size/2,edge=size*.875,c=canvas(size),g=c.getContext('2d',{willReadFrequently:true});let bw=0,bh=0;
  g.globalCompositeOperation='lighter';
  parts.forEach(([state,img,w])=>{const f=edge/Math.max(img.width,img.height),iw=img.width*f,ih=img.height*f;bw=Math.max(bw,iw);bh=Math.max(bh,ih);g.globalAlpha=w;g.drawImage(state==='fried'?oilyPhoto(img,st.lowOil):img,mid-iw/2,mid-ih/2,iw,ih)});
  g.globalAlpha=1;
  if(soup.coatStrength){
    // 불투명한 사진 색에만 곱한 뒤 원래 알파를 복원해 투명 가장자리까지 분홍빛이 생기지 않게 한다.
    const original=g.getImageData(0,0,size,size),opaque=g.getImageData(0,0,size,size),shine=canvas(size),sg=shine.getContext('2d');
    for(let i=0;i<opaque.data.length;i+=4){
      const light=cl((Math.min(original.data[i],original.data[i+1],original.data[i+2])-170)/85);
      opaque.data[i+3]=255;
      // 원래 사진의 밝은 반사광만 화면 혼합으로 되살린다.
      for(let j=0;j<3;j++)original.data[i+j]=Math.round(original.data[i+j]*light);
    }
    sg.putImageData(original,0,0);g.putImageData(opaque,0,0);
    // 단색을 곱하면 흰 재료가 분홍으로 뜨므로, 실제 양념 질감 사진(고추장 → red, 간장·된장 → doenjang, 카레 → curry)을 조각 위에 덮는다.
    // 곱하기로 어둡게 물들이고, 질감 사진은 일부만 덮어 재료 사진의 결이 남게 한다.
    // 장류를 끓여 졸인 양념(떡볶이)은 진한 소스가 재료를 두껍게 감싸므로 질감을 더 덮는다.
    const stew=soup.pasteStew||0,sk=soup.sauceKind||'red',tex=images.get(manifest.texture?.[sk]),a=Math.max(Math.min(.7,soup.coatStrength*1.5),.85*stew),cover2=.35+.3*stew;
    g.globalCompositeOperation='multiply';g.globalAlpha=a*.6;g.fillStyle=css(soup.coatColor);g.fillRect(0,0,size,size);
    if(tex){g.globalCompositeOperation='color';g.globalAlpha=a*.5;cover(g,tex,0,0,size,size);g.globalCompositeOperation='source-over';g.globalAlpha=a*cover2;cover(g,tex,0,0,size,size)}
    if(soup.soy){g.globalCompositeOperation='multiply';g.globalAlpha=.35;g.fillStyle='rgb(120,80,50)';g.fillRect(0,0,size,size)}
    g.globalCompositeOperation='screen';g.globalAlpha=.18;g.drawImage(shine,0,0);g.globalAlpha=1;
    const coated=g.getImageData(0,0,size,size);
    for(let i=3;i<coated.data.length;i+=4)coated.data[i]=original.data[i];
    g.putImageData(coated,0,0);
  }
  g.globalCompositeOperation='source-atop';
  if(soup.submerge&&soup.boiling){
    // 삶는 동안 사진은 옅은 물빛만 입혀 물 아래에서도 윤곽이 보이게 한다.
    g.fillStyle=css(soup.col,.16);g.fillRect(0,0,size,size);
  }else if(soup.submerge){
    // 윗면도 살짝 물들이고 아래쪽은 국물에 잠긴 만큼 더 짙게 덮는다.
    g.fillStyle=css(soup.col,.08+.12*soup.strength);g.fillRect(0,0,size,size);
    const gr=g.createLinearGradient(0,mid-bh/2,0,mid+bh/2),line=cl(1-soup.submerge);
    gr.addColorStop(0,css(soup.col,0));gr.addColorStop(line,css(soup.col,.12));gr.addColorStop(Math.min(1,line+.15),css(soup.col,.55));gr.addColorStop(1,css(soup.col,.88));g.fillStyle=gr;g.fillRect(0,0,size,size);
  }
  const gloss=cl(soup.oil+st.lowOil*.65+soup.glaze*.35);
  if(gloss){const r=rng(key+'gloss'),count=Math.round(12*gloss);for(let k=0;k<count;k++){const x=mid+(r()-.5)*bw*.8,y=mid+(r()-.5)*bh*.7;g.fillStyle=css([255,249,225],.15+.32*gloss);ell(g,x,y,(3+r()*8)*gloss*size/256,(1+r()*2)*gloss*size/256);g.fill()}}
  const out=canvas(Math.max(1,Math.ceil(bw)),Math.max(1,Math.ceil(bh)));out.getContext('2d').drawImage(c,mid-bw/2,mid-bh/2,bw,bh,0,0,out.width,out.height);
  return boundedSet(blends,key,out,256);
}
let scratchCtx=null;
function vesselTop(g,type,cx,cy,rx,K,tool=false){
  // 사진 유무에 따라 내경과 원형 개구부가 바뀌지 않게 한다.
  // 사진이 있으면 손그림 그릇은 보이지 않는 캔버스에 그려 치수만 얻는다(전골 팬 사진 위에 손그림 프라이팬 손잡이가 겹치던 문제).
  const file=tool?manifest.tool?.[type]:manifest.vessel?.[type],img=images.get(file),V=vessel(img?(scratchCtx||(scratchCtx=canvas(4).getContext('2d'))):g,type,cx,cy,rx,rx,K);
  if(img){
    const body=photoBodies.get(img)||{x:img.width/2,y:img.height/2,r:Math.min(img.width,img.height)/2},s=rx/body.r;
    g.save();if(type==='board'){ell(g,cx,cy,rx,rx);g.clip()}
    g.drawImage(img,cx-body.x*s,cy-body.y*s,img.width*s,img.height*s);g.restore();
  }
  return {...V,iy:V.ix};
}
function soupSurface(soup,size){
  const key=[assetVersion,size,soup.kind,soup.strength,soup.dairy,soup.chocolateMix,soup.soy,soup.soyLevel,soup.tomatoSauce].join('|');if(surfaces.has(key))return surfaces.get(key);
  const c=canvas(size),g=c.getContext('2d');
  const paint=(kind,alpha=1)=>{g.globalAlpha=alpha;const img=images.get(manifest.texture?.[kind]);if(img)cover(g,img,0,0,size,size);else{g.fillStyle=css(soupColor(kind));g.fillRect(0,0,size,size)}};
  paint('clear');
  if(soup.kind==='chocolate'){
    if(soup.dairy)paint('cream',soup.strength);
    paint('chocolate',soup.chocolateMix);
  }else if(soup.kind!=='clear')paint(soup.kind,soup.strength);
  // 토마토 소스는 붉은 질감의 명암을 유지하면서 토마토 색으로 맞춘다.
  if(soup.tomatoSauce){g.globalAlpha=.65;g.globalCompositeOperation='color';g.fillStyle='rgb(190,50,35)';g.fillRect(0,0,size,size)}
  if(soup.soy){g.globalAlpha=soup.soyLevel??1;g.globalCompositeOperation='multiply';g.fillStyle='rgb(104,71,48)';g.fillRect(0,0,size,size)}
  return boundedSet(surfaces,key,c,96);
}
function soupColor(kind){return {red:SAUCE.gochujang,doenjang:SAUCE.doenjang,cream:SAUCE.cream,curry:SAUCE.curry,chocolate:SAUCE.chocolate}[kind]||SAUCE.anchovy}
function oilDrops(g,cx,cy,radius,oil,K,seed){
  const r=rng(seed+'oil'),n=Math.round(oil*36);
  for(let k=0;k<n;k++){const a=r()*Math.PI*2,d=Math.sqrt(r())*radius*.92,s=(1+r()*4)*K*oil;g.fillStyle=css([234,183,61],.25+.2*oil);ell(g,cx+Math.cos(a)*d,cy+Math.sin(a)*d,s,s);g.fill();g.fillStyle=css([255,255,240],.45*oil);ell(g,cx+Math.cos(a)*d-s*.2,cy+Math.sin(a)*d-s*.2,s*.32,s*.25);g.fill()}
}
// 부드러운 김·연기 덩어리를 미리 그려 매 프레임의 흐림 필터 비용을 없앤다.
const vaporStamps=new Map();
function vaporStamp(burn){
  const key=burn?'smoke':'steam';if(vaporStamps.has(key))return vaporStamps.get(key);
  const c=canvas(96,128),g=c.getContext('2d'),col=burn?[103,86,69]:[255,255,255];
  const gr=g.createRadialGradient(48,64,1,48,64,48);gr.addColorStop(0,css(col,.8));gr.addColorStop(.4,css(col,.5));gr.addColorStop(1,css(col,0));g.fillStyle=gr;g.fillRect(0,0,96,128);vaporStamps.set(key,c);return c;
}
function smoke(g,cx,cy,ix,K,t,burn,steam){
  if(!burn&&!steam)return;g.save();
  const paint=(isBurn,amount)=>{if(!amount)return;const stamp=vaporStamp(isBurn);
    for(let k=0;k<5;k++){const life=(t*.22+k*.19)%1,x=cx+(-.52+k*.26)*ix+Math.sin(t+k*2)*5*K,y=cy-ix*.68-life*ix*.62;
      const w=ix*(.28+life*.18),h=w*1.3;g.globalAlpha=(.15+.15*Math.sin(life*Math.PI))*cl(amount);g.drawImage(stamp,x-w/2,y-h/2,w,h)}};
  paint(false,steam);paint(true,burn);g.restore();
}
function sceneBackdrop(W,H,type,cx,cy,rx,K,isFinal){
  const key=[assetVersion,W,H,type,cx,cy,rx,isFinal].join('|');if(backdrops.has(key))return backdrops.get(key);
  const c=canvas(W,H),g=c.getContext('2d');table(g,W,H);const V=vesselTop(g,type,cx,cy,rx,K,!isFinal);return boundedSet(backdrops,key,{c,ix:V.ix},16);
}
// 큰 조각부터 가장 덜 겹치는 후보를 고른다. 배치는 장면별로 한 번 계산한다.
function layoutPieces(S,pcs,type,ix,pxPerCm,curry){
  const key=[type,ix,curry,pcs.map(pc=>pc.key).join(',')].join('|');if(S.layouts.has(key))return S.layouts.get(key);
  const r=rng(S.seed+key),placed=[],positions=new Map();
  pcs.forEach(pc=>{
    const img=stateSprite(pc.I,'raw',pc.variant),long=pc.cm*pxPerCm,w=long*img.width/Math.max(img.width,img.height),h=long*img.height/Math.max(img.width,img.height);
    const footprint=long/Math.SQRT2,room=Math.max(0,Math.min(ix*.8,ix-footprint-1));let best=null;
    for(let k=0;k<64;k++){
      const angle=(k*.61803398875+r()*.08)*Math.PI*2,d=Math.sqrt((k+.5)/64)*room;
      let x=Math.cos(angle)*d,y=Math.sin(angle)*d;
      if(curry){if(pc.I.shape==='grain'){x=-ix*.38;y=ix*.03}else{x=ix*.3+x*.58;y*=.85}}
      const dist=Math.hypot(x,y);if(dist>room&&dist){x*=room/dist;y*=room/dist}
      const clearance=placed.length?Math.min(...placed.map(p=>Math.hypot(x-p.x,y-p.y)-(footprint+p.footprint)*.72)):-Math.hypot(x,y);
      if(!best||clearance>best.score)best={x,y,footprint,score:clearance};
    }
    placed.push(best);positions.set(pc.key,best);
  });S.layouts.set(key,positions);return positions;
}
function coatingFor(it,soup,R,o){
  // 다른 경로에서 조리한 밥에는 합류 전 양념을 묻히지 않는다.
  const relevant=soup.coats.filter(c=>c.level>0&&it.path.some(nid=>c.it.path.includes(nid)&&elapsedAt(nid,R,o.done,o.act?.nid,o.t)>0));
  const share=relevant.reduce((s,c)=>s+c.it.g*c.level,0),all=soup.coats.reduce((s,c)=>s+c.it.g*c.level,0);
  return {...soup,coatStrength:soup.coatStrength*(all?share/all:0),coatColor:sauceColor(relevant.map(c=>({...c.it,g:c.it.g*c.level})),COAT)||soup.coatColor};
}
// 사진 합성·배치·액면은 재생 전에 준비하고 재생 프레임에서는 준비한 사진을 쓴다.
function prepareScene(cv,R,E,P,S,o){
  if(S.version!==assetVersion)Object.assign(S,build(R,E,P));
  const W=cv.width,H=cv.height,K=W/320,isFinal=!o.act,type=o.vessel,cx=W/2-(isFinal&&o.sideRice?W*.07:0),cy=H/2+4*K,rx=Math.min(W*.34,H*.4);
  const backdrop=sceneBackdrop(W,H,type,cx,cy,rx,K,isFinal),ix=backdrop.ix,pxPerCm=2*ix/(meta.vessel[type]||22);
  const its=o.items.filter(i=>i.g>0),soupItems=its.filter(i=>!(isFinal&&o.sideRice&&ING[i.id].shape==='grain')),soup=soupModel(soupItems,E,R,o),inSet=new Set(its.map(it=>it.nid)),states=new Map();let burn=0,lowOil=0;
  its.forEach(it=>{const st=heatState(it,R,o.done,o.act?.nid,o.t);states.set(it.nid,st);burn=Math.max(burn,st.charred);lowOil=Math.max(lowOil,st.lowOil)});
  // 같은 튀기기 단계에 밀가루가 있으면 달걀도 반죽으로 처리한다.
  const batterEgg=it=>it.id==='egg'&&it.path.some(nid=>R.acts[nid]?.key==='fry'&&(o.done?.has(nid)||o.act?.nid===nid)&&its.some(flour=>flour.id==='flour'&&flour.path.includes(nid)));
  const tomatoCounts=new Map();S.pieces.forEach(pc=>{if(pc.I.id==='tomato')tomatoCounts.set(pc.it.nid,(tomatoCounts.get(pc.it.nid)||0)+1)});
  const curryPlate=soup.curry>0&&!!S.rice&&!o.sideRice,pcs=S.pieces.filter(pc=>inSet.has(pc.it.nid)&&!(isFinal&&o.sideRice&&pc.I.shape==='grain')&&(soup.melts.get(pc.it.nid)||0)<1&&!batterEgg(pc.it)&&(!(soup.tomatoes.get(pc.it.nid)>0)||pc.variant<Math.ceil(tomatoCounts.get(pc.it.nid)/2)));
  const positions=layoutPieces(S,pcs,type,ix,pxPerCm,curryPlate),lr=ix*Math.sqrt(soup.area),entries=[];
  pcs.forEach(pc=>{
    const st=states.get(pc.it.nid),coat=coatingFor(pc.it,soup,R,o),img=sprite(pc,st,{...coat,submerge:0}),pos=positions.get(pc.key),long=pc.cm*pxPerCm*(soup.tomatoes.get(pc.it.nid)>0?Math.sqrt(tomatoCounts.get(pc.it.nid)/(2*Math.ceil(tomatoCounts.get(pc.it.nid)/2))):1),f=long/Math.max(img.width,img.height),w=img.width*f,h=img.height*f;
    entries.push({pc,img,wet:soup.liquidG?sprite(pc,st,coat):img,w,h,...pos,alpha:1-(soup.melts.get(pc.it.nid)||0)});
  });
  const surface=soup.liquidG?soupSurface(soup,Math.max(1,Math.ceil(ix*2))):null;
  let sauce=soup.coatStrength||soup.curry?soupSurface({...soup,kind:soup.curry?'curry':soup.sauceKind,strength:1,chocolateMix:0,dairy:false},Math.max(1,Math.ceil(ix*2))):null;
  // 양념 자국을 먼저 투명한 사진으로 잘라 둬 바깥 경계까지 흐려지게 한다.
  if(sauce&&!curryPlate){
    const mark=canvas(sauce.width),mg=mark.getContext('2d'),half=mark.width/2;
    mg.translate(half,half);blob(mg,rng(S.seed+'sauce'),half*.8,half*.78,18);mg.clip();mg.drawImage(sauce,-half,-half,mark.width,mark.height);sauce=mark;
  }
  const tomatoSauce=soup.tomatoG?soupSurface({...soup,kind:'red',strength:1,chocolateMix:0,dairy:false,soy:false,tomatoSauce:true},Math.max(1,Math.ceil(ix*2))):null;
  let side=null;
  if(isFinal&&o.sideRice){const pc=S.pieces.find(p=>p.I.shape==='grain');if(pc)side={pc,img:sprite(pc,states.get(pc.it.nid),{...soup,submerge:0,coatStrength:0,glaze:0,oil:0})}}
  return {W,H,K,cx,cy,ix,pxPerCm,isFinal,backdrop,soup,lr,entries,burn,lowOil,surface,sauce,tomatoSauce,curryPlate,side};
}
// ---------- 한 장면 그리기 ----------
function scene(cv,R,E,P,S,o,ready){
  const D=ready||prepareScene(cv,R,E,P,S,o),{W,H,K,cx,cy,ix,isFinal,backdrop,soup,lr,entries,burn,surface,sauce,tomatoSauce,curryPlate}=D,g=cv.getContext('2d'),act=o.act,t=o.time||0;
  g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.clearRect(0,0,W,H);g.drawImage(backdrop.c,0,0);
  g.save();ell(g,cx,cy,ix,ix);g.clip();
  if(surface&&!curryPlate){g.save();ell(g,cx,cy,lr,lr);g.clip();g.drawImage(surface,cx-ix,cy-ix,ix*2,ix*2);g.restore()}
  else if(o.vessel==='fryer'){g.fillStyle=css([211,161,66],.5+.3*soup.oil);ell(g,cx,cy,ix,ix);g.fill()}
  if(tomatoSauce){
    // 풀어진 토마토 양에 따라 면 아래와 조각 사이에 소스를 펼친다.
    const radius=ix*cl(Math.sqrt(soup.tomatoG/Math.max(1,soup.solidG)) *1.8,.18,.88);
    g.save();g.translate(cx,cy);blob(g,rng(S.seed+'tomato-sauce'),radius,radius*.9,18);g.clip();g.drawImage(tomatoSauce,-ix,-ix,ix*2,ix*2);g.restore();
  }
  if(sauce){
    g.save();g.translate(cx+(curryPlate?ix*.32:0),cy);
    if(curryPlate){blob(g,rng(S.seed+'sauce'),ix*.65,ix*.91,18);g.clip()}
    else g.filter=`blur(${3*K}px)`;
    g.globalAlpha=curryPlate?soup.curry:Math.max(.22+.65*soup.coatStrength,.92*soup.pasteStew);g.drawImage(sauce,-ix,-ix,ix*2,ix*2);g.restore();
  }
  // 탄 조각 주변 기름에 작은 갈색 얼룩을 두고 테두리 고리는 그리지 않는다.
  if(burn){g.fillStyle=css([109,62,26],.24*burn);entries.slice(0,14).forEach(e=>{ell(g,cx+e.x+e.w*.28,cy+e.y+e.h*.25,Math.max(3*K,e.w*.23),Math.max(2*K,e.h*.14));g.fill()})}
  entries.forEach(e=>{
    const {pc,w,h}=e,enter=o.enter?.has(pc.it.nid)?cl(o.entry??1):1;if(!enter)return;
    const shake=act&&['stirfry','mix'].includes(act.key),swing=shake?Math.sin(t*5+pc.ph):0,x=cx+e.x+swing*1.5*K,y=cy+e.y-swing*K-(1-enter)**2*ix*.8;
    const paint=photo=>{g.save();g.globalAlpha=enter*e.alpha;g.translate(x,y);g.rotate(pc.rot+(shake?swing*.09:0));if(soup.boiling&&photo===e.wet)g.filter=`blur(${.65*K}px)`;g.drawImage(photo,-w/2,-h/2,w,h);g.restore()};
    if(surface&&!curryPlate&&Math.hypot(e.x,e.y)+e.footprint<=lr)paint(e.wet);
    else{paint(e.img);if(surface&&!curryPlate&&Math.hypot(e.x,e.y)-e.footprint<lr){g.save();ell(g,cx,cy,lr,lr);g.clip();paint(e.wet);g.restore()}}
  });
  // 삶기 물은 사진 위에 반투명하게 얹어 물속 재료를 함께 보여 준다.
  if(surface&&soup.boiling&&!curryPlate){g.save();ell(g,cx,cy,lr,lr);g.clip();g.globalAlpha=.24;g.drawImage(surface,cx-ix,cy-ix,ix*2,ix*2);g.restore()}
  // 무치기 전 고추장은 밥 위에 한 덩이로 올린다.
  soup.dollops.forEach(d=>{const entry=o.enter?.has(d.it.nid)?cl(o.entry??1):1,rice=entries.find(e=>e.pc.I.shape==='grain'),x=cx+(rice?.x||0),y=cy+(rice?.y||0),s=ix*cl(Math.sqrt(d.it.g/25)*.18,.09,.3);g.save();g.translate(x,y);g.globalAlpha=d.amount*entry;blob(g,rng(S.seed+d.it.nid),s,s*.72,9);g.fillStyle=css(SAUCE.gochujang);g.fill();hilite(g,s,.3);g.restore()});
  if(surface&&!curryPlate){g.save();ell(g,cx,cy,lr,lr);g.clip();g.fillStyle=css([255,250,230],.02+soup.glaze*.1);ell(g,cx-lr*.25,cy-lr*.3,lr*.45,lr*.12);g.fill();g.restore()}
  // 기름방울은 국물 위에만 띄운다. 마른 접시·종이 위의 노란 점은 장식처럼 보여 그리지 않고, 기름기는 조각 사진의 광택으로만 보인다.
  const actualOil=cl(soup.oil+D.lowOil*.6);if(surface)oilDrops(g,cx,cy,lr,actualOil,K,S.seed);
  if(isFinal&&o.items.some(i=>i.id==='sesameoil')){const r=rng(S.seed+'sesame'),n=Math.round(o.items.filter(i=>i.id==='sesameoil').reduce((s,i)=>s+i.g,0)*3);for(let k=0;k<Math.min(90,n);k++){const a=r()*Math.PI*2,d=Math.sqrt(r())*ix*.8;g.save();g.translate(cx+Math.cos(a)*d,cy+Math.sin(a)*d);g.rotate(r()*3);g.fillStyle='#f3e6c4';ell(g,0,0,1.7*K,.9*K);g.fill();g.restore()}}
  const A=act&&ACT[act.key],T=act?(act.temp??A.dTemp??0):0,elapsed=act?elapsedAt(act.nid,R,o.done,act.nid,o.t):0,dry=act&&['stirfry','grill','fry'].includes(act.key),heat=dry?(T<(A.temp?.[0]??140)?.03:cl(.65+(T-(A.temp?.[0]??140))/Math.max(1,(A.temp?.[1]??230)-(A.temp?.[0]??140))*.35)):cl((T-70)/30);
  // 적정 하한 미만이면 기름 튐이 거의 없고 상한 초과 때부터 연기가 보인다.
  const bubbling=act&&['boil','simmer','fry'].includes(act.key)&&T>=70&&elapsed>0;
  if(bubbling||dry&&elapsed>0){const r=rng(S.seed+'bubble'),amount=cl(heat*(act?.key==='simmer'?cl(elapsed/3):1));for(let k=0;k<Math.round(12*amount);k++){const a=r()*Math.PI*2,d=Math.sqrt(r())*(lr||ix)*.88,life=(t*.7+r())%1;g.strokeStyle=css([255,251,224],(1-life)*.4*amount);g.lineWidth=K;ell(g,cx+Math.cos(a)*d,cy+Math.sin(a)*d,(1+life*4)*K,(1+life*4)*K);g.stroke()}}
  g.restore();
  const hot=act?A.heat&&T>=70:o.hot,steam=hot&&(surface||act?.key==='steam')?(act?.key==='simmer'?cl(elapsed/3):1):0;
  const heatSmoke=dry&&elapsed>0&&A.temp?cl((T-A.temp[1])/40)*cl(elapsed/2):0;
  smoke(g,cx,cy,ix,K,t,Math.max(burn,heatSmoke),steam);
  if(D.side){const {pc,img}=D.side,bx=W*.84,by=H*.74,br=Math.min(W*.11,H*.18),V=vesselTop(g,'bowl',bx,by,br,K),long=pc.cm*(2*V.ix/(meta.vessel.bowl||18)),f=long/Math.max(img.width,img.height);g.save();ell(g,bx,by,V.ix,V.ix);g.clip();g.drawImage(img,bx-img.width*f/2,by-img.height*f/2,img.width*f,img.height*f);g.restore()}
  g.restore();return D;
}
function label(g,W,H,K,txt,sub,frac){
  g.save();g.font=`700 ${11*K}px Pretendard, sans-serif`;const w=g.measureText(txt).width+18*K;g.fillStyle='rgba(15,20,30,.72)';g.beginPath();g.roundRect(8*K,8*K,w,22*K,11*K);g.fill();
  g.fillStyle='#fff';g.textBaseline='middle';g.fillText(txt,17*K,19.5*K);
  if(sub!=null){g.fillStyle='rgba(15,20,30,.55)';g.beginPath();g.roundRect(8*K,H-20*K,W-16*K,12*K,6*K);g.fill();g.fillStyle='#22e3cb';g.beginPath();g.roundRect(8*K,H-20*K,(W-16*K)*cl(frac),12*K,6*K);g.fill();
    g.fillStyle='#fff';g.font=`600 ${8*K}px Pretendard, sans-serif`;g.textAlign='right';g.fillText(sub,W-14*K,H-14*K)}
  g.restore();
}
function finalOpts(R,E,P,S){const type=S.final;const deep=['ttuk','bowl','noodle','pan'].includes(type);
  const sideRice=!!(S.rice&&!S.rice.path.length&&['ttuk','pan'].includes(type));
  return {vessel:type,items:R.items,done:new Set(Object.keys(R.acts)),hot:R.items.some(it=>ENG.isHeated(R,it)),sideRice,deep}}

// ---------- 공개 함수 ----------
function paintFinal(cv,R,E,P,S){
  const g=cv.getContext('2d'),W=cv.width,H=cv.height,K=W/320;
  scene(cv,R,E,P,S,{...finalOpts(R,E,P,S),time:0});
  g.save();g.font=`600 ${9*K}px Pretendard, sans-serif`;const nm=BOWL_KO[S.final]||'접시',w=g.measureText(nm).width+12*K;g.fillStyle='rgba(255,255,255,.8)';g.beginPath();g.roundRect(W-w-8*K,H-20*K,w,13*K,6*K);g.fill();g.fillStyle='#4b5058';g.textAlign='right';g.textBaseline='middle';g.fillText(nm,W-14*K,H-13.5*K);g.restore();
}
// ---------- 메뉴 완성 사진 ----------
// 예측 메뉴가 사전 메뉴이고 1위 확률이 60% 이상이면 미리 만든 그 메뉴의 완성 사진을 쓴다. 새 조합은 사진이 없어 합성 그림을 둔다.
const cookedBoards=new WeakMap();
const boardKey=R=>JSON.stringify([R.items.map(i=>[i.id,i.g,i.path]),Object.entries(R.acts).map(([k,a])=>[k,a.key,a.temp,a.time]),R.salt,R.spicy]);
// 보드 재료가 실험 레시피(간장 버터 떡구이 등)와 거의 같으면 그 레시피 사진을 먼저 쓴다. 예측 메뉴(크림 파스타 등)의 사진을 쓰면 김치·고추장이 빠진 사진이 나오기 때문이다.
function exampleFile(R){
  if(!R||typeof EXAMPLES==='undefined')return null;const S=new Set(R.items.filter(i=>i.g>0).map(i=>i.id));let best=null,bj=0;
  Object.values(EXAMPLES).forEach(X=>{const file=manifest.dish?.[X.ko];if(!file)return;const T=new Set(X.ings.map(r=>r[0])),inter=[...S].filter(x=>T.has(x)).length,j=inter/(S.size+T.size-inter||1);if(j>bj){bj=j;best=file}});
  return bj>=.8?best:null;
}
// 보드에 맞는 완성 사진 파일 이름(실험 레시피와 거의 같으면 그 사진, 아니면 예측 1위 메뉴 사진)
function dishFile(P,R){const ex=exampleFile(R);if(ex)return ex;if(!P||P.novel||!P.best||(P.best.p??0)<.6)return null;return manifest.dish?.[P.best.d.ko]||null}
function dishPhoto(P,R){const f=dishFile(P,R);return f?images.get(f)||null:null}
// 합성 그림에서 사진으로 넘어갈 때 김(탄 경우 연기)이 그릇을 덮었다가 걷히며 사진이 드러나게 한다. amount 0~1.
function steamBurst(g,W,H,amount,t,burn){
  if(amount<=0)return;const stamp=vaporStamp(burn),r=rng('burst');g.save();
  for(let k=0;k<18;k++){const a=r()*Math.PI*2,d=Math.sqrt(r())*.42,x=W/2+Math.cos(a)*W*d,y=H/2+Math.sin(a)*H*d-t*H*.12*(1+r()),w=W*(.32+r()*.3)*(.7+.5*amount),h=w*1.25;
    g.globalAlpha=cl(amount*(.55+r()*.35));g.drawImage(stamp,x-w/2,y-h/2,w,h)}
  g.restore();
}
// 완성 사진은 사진 속 그릇(manifest.dishFit: 중심 x·y와 반지름, 사진 높이 비율)을 모형 그림의 그릇 크기·위치(반지름 min(W×0.34,H×0.4))에 맞춰 줄여 그린다.
// 그릇 바깥 나무는 부드럽게 지워 모형 그림의 식탁 위에 놓이게 한다.
const photoFile=new WeakMap(),fitCache=new Map();
function paintPhoto(g,img,W,H,alpha=1){const file=photoFile.get(img),key=[file,W,H,assetVersion].join('|');let c=fitCache.get(key);
  if(!c){const K=W/320,f=manifest.dishFit?.[file]||[.5,.5,.48],rx=Math.min(W*.34,H*.4),cx=W/2,cy=H/2+4*K;
    c=canvas(W,H);const cg=c.getContext('2d');table(cg,W,H);
    const S=rx/(f[2]*img.height),w=img.width*S,h=img.height*S,p=canvas(W,H),pg=p.getContext('2d');pg.drawImage(img,cx-f[0]*w,cy-f[1]*h,w,h);
    pg.globalCompositeOperation='destination-in';const gr=pg.createRadialGradient(cx,cy,rx*1.1,cx,cy,rx*1.36);gr.addColorStop(0,'#000');gr.addColorStop(1,'rgba(0,0,0,0)');pg.fillStyle=gr;pg.fillRect(0,0,W,H);
    cg.drawImage(p,0,0);if(fitCache.size>12)fitCache.clear();fitCache.set(key,c)}
  g.save();g.globalAlpha=alpha;g.drawImage(c,0,0);g.restore()}
// 이 보드의 재료 사진과 그릇·식탁이 다 들어왔는지(모형 그림을 손그림 없이 그릴 수 있는지)
function boardReady(R){if(!manifest.table||!images.has(manifest.table))return false;
  return R.items.every(it=>{const st=manifest.ing?.[it.id];if(!st)return true;return Object.values(st).every(fs=>!Array.isArray(fs)||fs.every(f=>images.has(f)||failed.has(f)))})}
function waiting(g,W,H,K,msg){const img=images.get(manifest.table);if(img)cover(g,img,0,0,W,H);else{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#d9c3a3');gr.addColorStop(1,'#b8956b');g.fillStyle=gr;g.fillRect(0,0,W,H)}
  g.save();g.fillStyle='rgba(255,255,255,.88)';g.beginPath();g.ellipse(W/2,H/2,H*.36,H*.36,0,0,Math.PI*2);g.fill();g.fillStyle='#6b7079';g.font=`600 ${11*K}px Pretendard, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(msg+'…',W/2,H/2);g.restore()}
function draw(cv,R,E,P){
  if(!cv)return;lastDraw=[cv,R,E,P];ensureAssets();
  const g=cv.getContext('2d'),W=cv.width,H=cv.height,K=W/320;
  if(!R||!R.items.length||!E){table(g,W,H);g.fillStyle='rgba(255,255,255,.85)';g.font=`600 ${13*K}px Pretendard, sans-serif`;g.save();g.textAlign='center';g.fillText('완성 접시에 연결하면 그림이 나옵니다',W/2,H/2);g.restore();return}
  // 처음 그림은 조리 과정의 3단계(그릇에 담긴 모형 그림)로 보여 준다. 실사 사진은 조리 재생을 끝낸 같은 보드에서만 쓴다.
  const photo=cookedBoards.get(cv)===boardKey(R)?dishPhoto(P,R):null;
  if(photo){g.clearRect(0,0,W,H);paintPhoto(g,photo,W,H);return}
  // 이 보드에 쓸 재료·그릇 사진을 아직 받는 중이면 예전 손그림 대신 준비 중 화면을 둔다
  if(!assetsReady&&!boardReady(R)){waiting(g,W,H,K,'접시 그림을 준비하는 중');return}
  cookedBoards.delete(cv);
  paintFinal(cv,R,E,P,build(R,E,P));
}
// 조리 순서대로 재생한다. 반환한 함수를 부르면 준비 작업과 재생을 모두 멈춘다.
function cook(cv,R,E,P,cb={}){
  if(!cv||!R||!E)return ()=>{};
  const token={},S=build(R,E,P),W=cv.width,H=cv.height,K=W/320,g=cv.getContext('2d');playing.set(cv,token);lastDraw=[cv,R,E,P];
  let cumulative=0,duration=0;
  const stages=S.order.map((nid,index)=>{
    const a=R.acts[nid],items=R.items.filter(it=>it.path.includes(nid)),enter=new Set(items.filter(it=>it.path[0]===nid).map(it=>it.nid)),dur=950+Math.min(1300,(a.time||2)*55);
    const st={nid,a,items,enter,dur,before:cumulative,offset:duration,done:new Set(S.order.slice(0,index)),act:{...a,nid},frames:null};
    cumulative+=Math.max(0,a.time??ACT[a.key].dTime??0);duration+=dur;return st;
  });
  const plateDur=2200,sum=duration+plateDur,minutes=cumulative,steps=64;
  let index=0,stageStart=performance.now(),lastNow=stageStart,raf=0,stopped=false,epoch=0,finalImage=null,snap=null;
  const alive=()=>!stopped&&playing.get(cv)===token;
  const opts=(st,t,entry=1,time=0)=>({vessel:BOWL_ACT[st.a.key]||'pan',items:st.items,done:st.done,act:st.act,t,entry,enter:st.enter,time});
  // 사진 합성은 약 4ms마다 나눠 실행한다. 현재 단계와 다음 단계만 보관한다.
  function prepareStage(n,version){
    const st=stages[n];if(!st||!alive()||version!==epoch)return Promise.resolve(false);if(st.frames)return Promise.resolve(true);if(st.preparing?.version===version)return st.preparing.promise;
    const frames=[];let tick=0;
    const promise=new Promise(resolve=>{
      function chunk(){
        if(!alive()||version!==epoch){resolve(false);return}
        const begin=performance.now();
        do{frames.push(prepareScene(cv,R,E,P,S,opts(st,tick/steps)));tick++}while(tick<=steps&&performance.now()-begin<4);
        if(tick<=steps)setTimeout(chunk,0);else{st.frames=frames;resolve(true)}
      }setTimeout(chunk,0);
    });st.preparing={version,promise};return promise;
  }
  token.warm=()=>{
    if(!alive())return;const version=++epoch;
    if(S.version!==assetVersion)Object.assign(S,build(R,E,P));
    stages.forEach(st=>{st.frames=null;st.preparing=null});vaporStamp(false);vaporStamp(true);
    finalImage=canvas(W,H);paintFinal(finalImage,R,E,P,S);
    prepareStage(index,version).then(ok=>{if(ok&&alive()&&version===epoch)return prepareStage(index+1,version)});
  };
  // 조리 시간은 분 단위 정수로만 보여 준다(소수점 = 초 단위 표시 없음).
  const fmt=m=>String(Math.floor(m+1e-6));
  function frame(now){
    if(!alive())return;const delta=now-lastNow;lastNow=now;
    if(index<stages.length){
      const st=stages[index];
      // 사진 준비 중에는 시계도 멈춰 익힘 상태가 갑자기 바뀌지 않게 한다.
      if(!st.frames){stageStart+=delta;raf=requestAnimationFrame(frame);return}
      const wall=cl((now-stageStart)/st.dur),intro=st.enter.size?.16:0;
      // 투입 동작 중에는 영분이다. 투입 후 진행 t에 실제 조리 분수를 곱한다.
      const t=intro?cl((wall-intro)/(1-intro)):wall,entry=intro?cl(wall/intro):1,tick=Math.min(steps,Math.floor(t*steps));
      scene(cv,R,E,P,S,opts(st,t,entry,now/1000),st.frames[tick]);
      // 마지막 단계의 끝 장면은 이름표를 그리기 전에 저장해, 담기 단계에서 옛 이름표가 비치지 않게 한다.
      if(wall===1&&index===stages.length-1){snap=canvas(W,H);snap.getContext('2d').drawImage(cv,0,0)}
      const elapsed=Math.max(0,st.a.time??ACT[st.a.key].dTime??0)*t,m=st.before+elapsed;
      cb.onTime?.(Math.floor(m+1e-6));
      label(g,W,H,K,`${index+1}/${stages.length} ${ACT_LABEL[st.a.key]}${st.a.temp!=null?' · '+st.a.temp+'°C':''} · ${fmt(elapsed)}분`,`${fmt(m)}분 / 약 ${fmt(minutes)}분`,(st.offset+st.dur*wall)/sum);
      if(wall===1){
        // 다음 단계 전에 t=1을 반드시 한 번 그린다. 완성 그림과 같은 상태 함수의 끝값이다.
        st.frames=null;index++;stageStart=now;
        if(index<stages.length)prepareStage(index,epoch).then(ok=>{if(ok&&alive())return prepareStage(index+1,epoch)});
      }
      raf=requestAnimationFrame(frame);return;
    }
    const t=cl((now-stageStart)/plateDur);g.clearRect(0,0,W,H);g.drawImage(finalImage,0,0);
    if(snap&&t<.35){g.save();g.globalAlpha=1-t/.35;g.drawImage(snap,0,0);g.restore()}
    // 그릇에 담긴 합성 그림 위로 김(탄 경우 연기)이 피어올라 화면을 덮고, 그 아래에서 완성 사진으로 바뀐 뒤 김이 걷힌다.
    const photo=dishPhoto(P,R);
    if(photo){
      if(t>.42)paintPhoto(g,photo,W,H,cl((t-.42)/.12));
      const burnt=(E.risks||[]).some(r=>r.kind==='burn');
      steamBurst(g,W,H,t<.48?cl((t-.15)/.33):cl(1-(t-.52)/.38),t,burnt);
    }
    if(t<1){label(g,W,H,K,'완성 · 그릇에 담기',`${fmt(minutes)}분`,(duration+plateDur*t)/sum);cb.onTime?.(Math.floor(minutes+1e-6));raf=requestAnimationFrame(frame);return}
    playing.delete(cv);if(photo)cookedBoards.set(cv,boardKey(R));draw(cv,R,E,P);cb.onDone?.();
  }
  if(!stages.length){playing.delete(cv);draw(cv,R,E,P);cb.onDone?.();return ()=>{}}
  token.warm();ensureAssets();raf=requestAnimationFrame(frame);
  return ()=>{stopped=true;epoch++;if(playing.get(cv)===token)playing.delete(cv);cancelAnimationFrame(raf)};
}
return {draw,cook};
})();
