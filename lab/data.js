// 메뉴 궁합 실험실 자료표
// 맛 8축 순서: 단맛, 짠맛, 신맛, 쓴맛, 감칠맛, 기름짐, 매운맛, 향
const TASTE_AXES=['단맛','짠맛','신맛','쓴맛','감칠맛','기름짐','매운맛','향'];
const CATS={pro:'육류·해산물·달걀',veg:'채소·버섯',carb:'밥·면·곡물',sauce:'양념·소스',dairy:'유제품·기타'};

// [id, 이름, 영문, 분류, 성질, 색, 맛8, 100g 단가(원, 데모용 가정값), 요리문화[한,양,아시아], 기본 g, 그림 모양]
const RAW=[
['pork','돼지고기','pork','pro','meat','#E9A0A0',[0,.1,0,0,.6,.6,0,.2],1500,[1,.6,.8],150,'slice'],
['beef','소고기','beef','pro','meat','#B5474B',[0,.1,0,0,.7,.5,0,.2],3500,[1,1,.7],150,'slice'],
['chicken','닭고기','chicken','pro','meat','#F2C9A0',[0,.1,0,0,.6,.3,0,.1],1000,[1,1,.8],200,'chunk'],
['bacon','베이컨','bacon','pro','meat','#C9524F',[0,.7,0,0,.7,.8,0,.4],2500,[.3,1,.2],50,'strip'],
['egg','달걀','egg','pro','egg','#FFD24A',[0,.1,0,0,.4,.3,0,.1],600,[1,1,1],50,'egg'],
['tofu','두부','tofu','pro','tofu','#F6F1E1',[0,0,0,0,.3,.2,0,.1],400,[1,.1,1],150,'cube'],
['shrimp','새우','shrimp','pro','sea','#F28B6A',[.2,.2,0,0,.7,.1,0,.3],2500,[.8,.8,1],80,'curl'],
['squid','오징어','squid','pro','sea','#F4E3D0',[.1,.2,0,0,.6,.1,0,.3],1800,[1,.3,.7],120,'ring'],
['clam','바지락','clam','pro','sea','#C9B79C',[.1,.4,0,0,.8,0,0,.3],1200,[1,.7,.6],100,'shell'],
['anchovy','멸치육수','anchovy broth','pro','broth','#E8D7A8',[0,.4,0,.1,.8,0,0,.4],100,[1,.1,.4],300,'liquid'],
['kimchi','김치','kimchi','veg','kimchi','#E0452E',[.1,.5,.6,0,.5,0,.5,.6],500,[1,0,.2],150,'leaf'],
['onion','양파','onion','veg','allium','#F3E6C8',[.4,0,0,0,.2,0,.1,.4],250,[1,1,1],60,'slice'],
['scallion','대파','scallion','veg','allium','#6FBF4A',[.1,0,0,0,.1,0,.2,.6],500,[1,.2,1],20,'strand'],
['garlic','마늘','garlic','veg','allium','#F5F0DC',[.1,0,0,.1,.3,0,.4,.9],1000,[1,1,1],10,'dot'],
['chili','청양고추','green chili','veg','chili','#3E9B3A',[0,0,0,0,0,0,1,.4],1500,[1,.4,.7],10,'dot'],
['potato','감자','potato','veg','root','#E8C77A',[.1,0,0,0,.1,0,0,.1],300,[.9,1,.4],120,'cube'],
['carrot','당근','carrot','veg','root','#F08A2E',[.4,0,0,0,0,0,0,.2],350,[.9,.9,.7],40,'stick'],
['cabbage','양배추','cabbage','veg','veg','#C8E39A',[.3,0,0,.1,.1,0,0,.2],200,[1,.6,.7],80,'leaf'],
['zucchini','애호박','zucchini','veg','veg','#B8D86B',[.2,0,0,0,.1,0,0,.1],400,[1,.7,.3],60,'slice'],
['mushroom','버섯','mushroom','veg','veg','#B08A64',[0,0,0,0,.8,0,0,.5],800,[.9,.9,1],50,'chunk'],
['tomato','토마토','tomato','veg','veg','#E5413A',[.4,0,.5,0,.6,0,0,.4],600,[.3,1,.3],150,'chunk'],
['spinach','시금치','spinach','veg','leafy','#2F8F3A',[0,.1,0,.2,.2,0,0,.3],700,[1,.8,.5],60,'leaf'],
['sprout','콩나물','bean sprout','veg','veg','#F2EBB0',[.1,0,0,0,.1,0,0,.2],300,[1,0,.8],80,'strand'],
['cucumber','오이','cucumber','veg','veg','#7FB85A',[.1,0,0,.1,0,0,0,.4],400,[1,.7,.6],80,'slice'],
['lettuce','상추','lettuce','veg','leafy','#7CC459',[0,0,0,.2,0,0,0,.2],900,[.9,1,.3],60,'leaf'],
['basil','바질','basil','veg','leafy','#3C9A40',[0,0,0,.1,0,0,0,1],4000,[0,1,.4],5,'leaf'],
['rice','밥','cooked rice','carb','rice','#FAF7EE',[.3,0,0,0,.1,0,0,.1],250,[1,.3,1],210,'grain'],
['pasta','파스타면','pasta','carb','noodle','#F1D58C',[.1,0,0,0,.1,0,0,.1],500,[.1,1,0],100,'strand'],
['ramen','라면사리','ramen noodles','carb','noodle','#F0C860',[0,.6,0,0,.5,.4,.3,.3],600,[1,0,.9],110,'strand'],
['somyeon','소면','thin wheat noodles','carb','noodle','#F7F1DC',[0,.2,0,0,0,0,0,0],400,[1,0,.6],100,'strand'],
['dangmyeon','당면','glass noodles','carb','noodle','#D9D2C2',[0,0,0,0,0,0,0,0],700,[1,0,.5],60,'strand'],
['tteok','떡','rice cakes','carb','dough','#F7F3EA',[.2,0,0,0,0,0,0,0],500,[1,0,.2],200,'stick'],
['flour','밀가루','flour batter','carb','dough','#F4EFE4',[0,0,0,0,0,0,0,0],150,[.8,1,.6],80,'batter'],
['gochujang','고추장','gochujang','sauce','seasoning','#B7271F',[.5,.7,0,0,.5,0,.7,.4],800,[1,0,.1],30,'paste'],
['doenjang','된장','doenjang','sauce','seasoning','#8A5A2B',[.1,.8,0,.1,.9,0,0,.6],700,[1,0,.5],25,'paste'],
['soy','간장','soy sauce','sauce','seasoning','#4A2A1A',[.1,1,0,0,.8,0,0,.4],400,[1,.2,1],15,'liquid'],
['gochugaru','고춧가루','red pepper flakes','sauce','seasoning','#C8301E',[.1,0,0,0,0,0,1,.5],3000,[1,.1,.3],10,'dot'],
['curry','카레가루','curry powder','sauce','seasoning','#E0A520',[.1,.3,0,.2,.3,.2,.5,1],2000,[.6,.3,1],25,'paste'],
['sesameoil','참기름','sesame oil','sauce','seasoning','#C9932B',[0,0,0,0,.1,1,0,.9],2500,[1,.1,.8],5,'liquid'],
['oliveoil','올리브유','olive oil','sauce','seasoning','#C8C34A',[0,0,0,.2,0,1,.1,.5],1500,[.2,1,.1],15,'liquid'],
['sugar','설탕','sugar','sauce','seasoning','#FFFFFF',[1,0,0,0,0,0,0,0],200,[1,1,1],10,'dot'],
['vinegar','식초','vinegar','sauce','seasoning','#F3EFD9',[0,0,1,0,0,0,0,.3],300,[.9,.8,.8],10,'liquid'],
['butter','버터','butter','dairy','dairy','#F7DD7A',[.1,.1,0,0,.2,1,0,.5],1800,[.4,1,.3],15,'cube'],
['cheese','치즈','cheese','dairy','dairy','#F6C744',[0,.5,.1,0,.8,.6,0,.5],2000,[.4,1,.1],30,'shred'],
['milk','우유','milk','dairy','dairy','#FBFAF4',[.4,0,0,0,.1,.3,0,.1],250,[.4,1,.2],150,'liquid'],
['cream','생크림','cream','dairy','dairy','#FFF8E8',[.2,0,0,0,.1,.9,0,.2],900,[.1,1,.1],100,'liquid'],
['chocolate','초콜릿','chocolate','dairy','dairy','#5A3420',[.9,0,0,.5,0,.6,0,.7],2000,[0,1,.1],40,'chunk'],
['water','물','water','dairy','broth','#DCEFF7',[0,0,0,0,0,0,0,0],0,[1,1,1],100,'liquid'],
];
const ING={};RAW.forEach(r=>ING[r[0]]={id:r[0],ko:r[1],en:r[2],cat:r[3],prop:r[4],color:r[5],taste:r[6],price:r[7],culture:r[8],g:r[9],shape:r[10]});
const SPICY={gochugaru:1,chili:.9,gochujang:.5,kimchi:.25,curry:.3,ramen:.2};
// 파·마늘류의 알싸한 매운맛. 생으로 쓸 때 값이고 가열하면 0.2배로 줄어든다
const SPICY_RAW={garlic:.3,scallion:.06,onion:.05};
// 짠맛·단맛·신맛을 농도로 계산하는 함량표: [소금 환산 %, 단맛(설탕 환산 %), 신맛(식초 환산 비율)]
// 소금·당류는 식품영양성분 DB의 대표값을 반올림한 근사값이다. 우유·생크림의 단맛은 유당이 설탕보다 덜 단 것을 반영해 낮췄다
const CONC={
pork:[.15,0,0],beef:[.15,0,0],chicken:[.2,0,0],bacon:[2,0,0],egg:[.35,0,0],tofu:[.02,0,0],shrimp:[.5,0,0],squid:[.6,0,0],clam:[1,0,0],anchovy:[.3,0,0],
kimchi:[2,1.5,.06],onion:[0,4.5,0],scallion:[0,2,0],garlic:[0,1,0],chili:[0,2,0],potato:[0,.8,0],carrot:[.1,4.5,0],cabbage:[0,3.5,0],zucchini:[0,2,0],mushroom:[0,.5,0],
tomato:[0,2.6,.04],spinach:[.1,.4,0],sprout:[0,.5,0],cucumber:[0,1.7,0],lettuce:[0,.8,0],basil:[0,.3,0],
rice:[0,.1,0],pasta:[0,.5,0],ramen:[1,0,0],somyeon:[1,0,0],dangmyeon:[0,0,0],tteok:[.3,1,0],flour:[0,0,0],
gochujang:[7,22,0],doenjang:[12,2,0],soy:[14,3,0],gochugaru:[0,0,0],curry:[10,5,0],sesameoil:[0,0,0],oliveoil:[0,0,0],sugar:[0,100,0],vinegar:[0,2,1],
butter:[.5,0,0],cheese:[1.7,.5,.02],milk:[.1,1.5,0],cream:[.1,1,0],chocolate:[.05,48,0]};
// 가열하면 단맛이 올라오는 재료(양파를 볶으면 달아지는 것)
const HEAT_SWEET={onion:1.5,scallion:1.3,garlic:1.2,cabbage:1.2};

// 요리 행위 8종: [id, 이름, 영문, 적정 온도, 적정 시간(분), 기본 온도, 기본 시간, 가열 여부]
const ACT_RAW=[
['raw','생으로 · 썰기','raw',null,null,null,0,false],
['mix','무치기','tossed',null,[1,10],null,3,false],
['boil','삶기 · 데치기','boiled',[95,105],[1,15],100,5,true],
['simmer','끓이기','simmered',[95,105],[10,40],100,20,true],
['steam','찌기','steamed',[95,105],[10,30],100,15,true],
['stirfry','볶기','stir-fried',[170,230],[3,12],200,6,true],
['grill','굽기 · 부치기','pan-grilled',[180,260],[5,25],220,12,true],
['fry','튀기기','deep-fried',[160,190],[3,10],175,6,true],
];
const ACT={};ACT_RAW.forEach((r,i)=>ACT[r[0]]={id:r[0],ko:r[1],en:r[2],temp:r[3],time:r[4],dTemp:r[5],dTime:r[6],heat:r[7],idx:i});
const ACT_SHORT={raw:'생으로',mix:'무침',boil:'데침',simmer:'찌개',steam:'찜',stirfry:'볶음',grill:'구이',fry:'튀김'};

// 수치 파라미터
const PARAMS={temp:{ko:'온도',unit:'°C',min:0,max:300,step:5,def:180,to:'act'},time:{ko:'시간',unit:'분',min:0,max:90,step:1,def:10,to:'act'},
  salt:{ko:'염도',unit:'%',min:0,max:3,step:.1,def:1.2,to:'plate'},spicy:{ko:'매운맛',unit:'단계',min:0,max:5,step:1,def:2,to:'plate'}};

// 조리법 적합표: 성질 16가지 × [생으로, 무치기, 삶기, 끓이기, 찌기, 볶기, 굽기, 튀기기]
const SUIT={
meat:[-1,-.8,.4,.9,.5,.9,1,.8], sea:[-.4,.2,.7,.9,.8,.8,.7,.8], egg:[-.8,-.4,.8,.6,.9,.7,.9,.6], tofu:[.2,.3,.6,1,.6,.6,.9,.7],
broth:[-.6,-.8,.5,1,.2,-.2,-.8,-1], leafy:[1,.9,.5,-.1,0,.1,-.6,-.9], root:[-.3,-.2,.7,.9,.9,.7,.8,1], allium:[.3,.5,.4,.8,.3,1,.8,.6],
chili:[.5,.7,.3,.8,.2,.9,.5,.2], kimchi:[.9,.6,0,1,-.2,.9,.7,.2], veg:[.6,.7,.7,.7,.6,.9,.7,.4], rice:[.5,.6,.2,.3,.5,.9,.4,.2],
noodle:[-1,-.3,1,.8,0,.8,-.5,.2], dough:[-.9,-.6,.6,.8,.7,.6,1,1], seasoning:[.6,1,.5,.9,.4,.9,.6,.3], dairy:[.7,.4,.3,.7,.4,.6,.6,.2]};
const PROP_KO={meat:'육류',sea:'해산물',egg:'달걀',tofu:'두부',broth:'육수',leafy:'잎채소',root:'뿌리채소',allium:'파·마늘류',chili:'고추',kimchi:'김치',veg:'채소',rice:'밥',noodle:'면',dough:'떡·반죽',seasoning:'양념',dairy:'유제품'};

// 직접 적은 궁합(−1 ~ +1). 레시피 공동출현 값보다 우선한다.
const PAIR_TXT=`gochujang butter .5|cheese gochujang .4|butter soy .5|chocolate milk .9|chocolate butter .8|chocolate sugar .8|chocolate egg .6|egg sugar .8|egg milk .8|cream egg .7|flour egg .9|flour milk .8|flour butter .9|flour sugar .8|cream sugar .8|butter sugar .8|milk cream .8|butter milk .7|cream butter .6|tteok butter .7|tteok milk .4|cheese sugar .3|cheese cream .7|
pork kimchi .95|tofu kimchi .8|kimchi scallion .7|kimchi gochugaru .8|kimchi onion .6|kimchi chocolate -.9|kimchi milk -.6|kimchi cream -.7|kimchi cheese .2|kimchi rice .9|kimchi flour .7|kimchi ramen .8|kimchi bacon .6|kimchi sesameoil .6|kimchi egg .5|kimchi basil -.5|kimchi oliveoil -.3|kimchi sugar .3|kimchi anchovy .7|kimchi tomato .1|kimchi pasta .2|
pork gochujang .9|pork gochugaru .8|pork doenjang .6|pork soy .7|pork cabbage .7|pork onion .8|pork garlic .8|pork scallion .7|pork chili .6|pork sesameoil .6|pork sugar .5|pork chocolate -.7|pork lettuce .8|pork curry .8|
beef soy .9|beef sesameoil .8|beef sugar .6|beef mushroom .8|beef spinach .5|beef dangmyeon .7|beef butter .8|beef garlic .9|beef rice .7|beef gochujang .5|beef doenjang .5|beef curry .7|
chicken gochujang .8|chicken potato .8|chicken carrot .7|chicken gochugaru .7|chicken curry .8|chicken soy .7|chicken flour .7|chicken cream .6|
gochujang rice .8|gochujang tteok .95|gochujang sugar .8|gochujang squid .9|gochujang chocolate -.8|gochujang cream -.4|gochujang milk -.5|gochujang sesameoil .7|gochujang sprout .6|gochujang spinach .6|gochujang cucumber .6|gochujang egg .6|gochujang cabbage .7|gochujang onion .8|gochujang scallion .8|gochujang basil -.6|gochujang cheese .3|gochujang oliveoil -.3|gochujang carrot .6|gochujang potato .7|gochujang ramen .5|gochujang tomato .2|
doenjang tofu .95|doenjang zucchini .9|doenjang anchovy .9|doenjang potato .8|doenjang onion .8|doenjang mushroom .8|doenjang chili .8|doenjang clam .8|doenjang garlic .7|doenjang chocolate -.9|doenjang milk -.6|doenjang cream -.7|doenjang cheese -.4|doenjang basil -.6|doenjang lettuce .7|doenjang sugar .1|doenjang tomato -.3|
gochugaru cucumber .8|gochugaru vinegar .7|gochugaru sugar .6|gochugaru chocolate -.6|gochugaru squid .8|gochugaru tofu .8|gochugaru rice .5|gochugaru tteok .7|
anchovy somyeon .9|anchovy zucchini .8|anchovy scallion .8|anchovy sprout .8|anchovy tofu .7|anchovy soy .7|anchovy chocolate -.9|anchovy cream -.6|anchovy milk -.6|anchovy onion .6|anchovy clam .7|
somyeon zucchini .8|somyeon egg .8|somyeon scallion .7|somyeon soy .7|somyeon sesameoil .6|somyeon chocolate -.8|
dangmyeon soy .9|dangmyeon spinach .8|dangmyeon carrot .8|dangmyeon onion .7|dangmyeon mushroom .8|dangmyeon sesameoil .9|dangmyeon sugar .7|dangmyeon egg .6|dangmyeon chocolate -.8|
tteok sugar .7|tteok scallion .7|tteok egg .7|tteok cabbage .6|tteok cheese .6|tteok soy .6|tteok sesameoil .5|tteok ramen .7|tteok chocolate -.2|
ramen egg .9|ramen scallion .8|ramen chili .7|ramen cheese .6|ramen chocolate -.8|ramen milk .1|
squid onion .8|squid cabbage .7|squid carrot .7|squid scallion .8|squid flour .7|squid garlic .7|squid chocolate -.9|squid cream .1|
shrimp flour .8|shrimp garlic .8|shrimp butter .8|shrimp oliveoil .7|shrimp scallion .7|shrimp tomato .6|shrimp pasta .7|shrimp cream .6|shrimp chocolate -.8|
clam scallion .7|clam pasta .7|clam garlic .8|clam oliveoil .7|clam tofu .8|clam chocolate -.9|clam flour .6|
tofu soy .8|tofu scallion .7|tofu chocolate -.6|tofu cheese -.2|tofu sesameoil .7|
sprout sesameoil .8|sprout garlic .7|sprout scallion .7|sprout rice .7|sprout gochugaru .6|
spinach sesameoil .9|spinach garlic .8|spinach soy .7|spinach rice .7|
cucumber vinegar .8|cucumber sugar .5|cucumber garlic .6|cucumber chocolate -.8|
lettuce oliveoil .8|lettuce vinegar .8|lettuce tomato .8|lettuce cheese .7|lettuce cucumber .8|lettuce egg .6|
tomato basil .95|tomato oliveoil .9|tomato garlic .9|tomato cheese .9|tomato pasta .9|tomato onion .8|tomato chocolate -.6|
basil oliveoil .9|basil cheese .9|basil pasta .8|basil garlic .8|
pasta garlic .9|pasta oliveoil .9|pasta cheese .9|pasta cream .9|pasta bacon .9|pasta butter .8|pasta mushroom .8|pasta chili .6|pasta onion .7|pasta chocolate -.7|
cream bacon .8|cream mushroom .8|cream cheese .8|cream onion .6|cream garlic .7|cream butter .7|
butter garlic .9|butter potato .8|butter mushroom .8|butter egg .8|butter cheese .7|butter flour .9|butter sugar .8|butter chocolate .9|butter milk .8|
cheese egg .8|cheese potato .8|cheese bacon .9|cheese mushroom .7|cheese milk .7|cheese chocolate -.2|
milk chocolate .95|milk sugar .8|milk egg .8|milk flour .8|milk curry .5|
chocolate sugar .9|chocolate cream .9|chocolate flour .8|chocolate egg .7|chocolate chili .3|chocolate onion -.7|chocolate garlic -.8|chocolate soy -.6|chocolate vinegar -.6|chocolate curry -.3|chocolate scallion -.7|
curry potato .9|curry carrot .9|curry onion .9|curry rice .95|
potato carrot .8|potato onion .8|potato bacon .9|potato soy .7|potato sugar .4|
egg rice .8|egg scallion .8|egg carrot .6|egg onion .7|egg flour .8|egg sesameoil .6|egg cheese .8|
onion garlic .8|onion carrot .8|onion cabbage .7|onion soy .7|scallion garlic .8|scallion sesameoil .8|
sesameoil soy .9|sesameoil garlic .8|sesameoil rice .8|sesameoil oliveoil -.2|
sugar soy .7|sugar vinegar .7|sugar garlic .4|flour oliveoil .5|flour scallion .8|flour zucchini .7|flour chili .6|
rice soy .7|rice chocolate -.6|rice cheese .5|
mushroom garlic .8|mushroom onion .8|mushroom soy .8|mushroom spinach .6`;

// 레시피 공동출현으로 계산한 궁합(RecipeNLG 레시피 200,000건, NPMI를 −0.8 ~ +0.9로 바꾼 값)
const PAIR_NPMI="bacon basil -0.01 82|bacon beef 0.12 582|bacon butter -0.2 512|bacon cabbage 0.13 130|bacon carrot 0.04 245|bacon cheese 0.19 1236|bacon chicken -0.04 297|bacon chili 0.01 146|bacon chocolate -0.8 0|bacon clam 0.36 53|bacon cream 0.01 87|bacon cucumber -0.13 24|bacon curry -0.04 25|bacon egg -0.11 1128|bacon flour -0.22 542|bacon garlic 0.04 541|bacon gochugaru 0.09 65|bacon lettuce 0.58 364|bacon milk -0.1 722|bacon mushroom 0.14 316|bacon oliveoil -0.07 66|bacon onion 0.38 3355|bacon pasta -0.04 53|bacon pork 0.57 588|bacon potato 0.39 809|bacon ramen -0.13 1|bacon rice 0.02 214|bacon scallion 0.3 478|bacon sesameoil -0.16 2|bacon shrimp 0.05 79|bacon soy 0.02 108|bacon spinach 0.31 149|bacon sprout 0.22 29|bacon sugar -0.15 1187|bacon tomato 0.19 616|bacon vinegar 0.37 1001|basil beef 0.24 519|basil butter -0.07 519|basil cabbage 0.07 62|basil carrot 0.32 380|basil cheese 0.34 1148|basil chicken 0.15 354|basil chili 0.25 217|basil chocolate -0.8 0|basil clam 0.24 23|basil cream -0.01 47|basil cucumber -0.01 30|basil curry 0.03 23|basil egg -0.18 456|basil flour -0.26 238|basil garlic 0.73 1864|basil gochugaru 0.29 90|basil lettuce -0.07 17|basil milk -0.18 269|basil mushroom 0.39 425|basil oliveoil 0.8 725|basil onion 0.3 1806|basil pasta 0.4 191|basil pork -0.01 49|basil potato 0.14 240|basil rice 0.05 145|basil scallion 0.14 180|basil sesameoil 0.01 5|basil shrimp 0.28 124|basil soy -0.0 58|basil spinach 0.25 79|basil sprout -0.03 4|basil sugar -0.25 392|basil tofu 0.16 5|basil tomato 0.64 1229|basil vinegar -0.03 166|beef butter -0.35 805|beef cabbage 0.3 538|beef carrot 0.06 667|beef cheese 0.41 4544|beef chicken -0.31 203|beef chili 0.19 681|beef chocolate -0.61 5|beef clam -0.8 0|beef cream -0.35 22|beef cucumber -0.36 12|beef curry -0.17 28|beef egg -0.14 2926|beef flour -0.43 613|beef garlic 0.31 2658|beef gochugaru 0.02 121|beef lettuce 0.36 419|beef milk -0.15 1718|beef mushroom 0.23 986|beef oliveoil -0.11 151|beef onion 0.62 10382|beef pasta 0.36 585|beef pork 0.42 854|beef potato 0.17 1060|beef ramen -0.01 8|beef rice 0.31 1271|beef scallion 0.01 467|beef sesameoil -0.0 19|beef shrimp -0.33 18|beef soy 0.11 383|beef spinach -0.12 55|beef sprout 0.18 54|beef sugar -0.44 1011|beef tomato 0.57 3249|beef vinegar -0.03 784|butter cabbage -0.18 255|butter carrot -0.11 1125|butter cheese -0.05 5198|butter chicken -0.04 2553|butter chili -0.17 555|butter chocolate 0.25 2833|butter clam 0.11 114|butter cream 0.12 958|butter cucumber -0.46 23|butter curry 0.06 318|butter egg 0.22 18213|butter flour 0.35 17905|butter garlic -0.13 2579|butter gochugaru 0.04 392|butter lettuce -0.43 24|butter milk 0.23 12659|butter mushroom 0.06 1813|butter oliveoil -0.16 397|butter onion -0.15 7968|butter pasta -0.06 416|butter pork -0.24 233|butter potato 0.05 2228|butter ramen -0.07 16|butter rice -0.05 1346|butter scallion -0.12 867|butter sesameoil -0.31 6|butter shrimp 0.06 617|butter soy -0.23 273|butter spinach 0.02 368|butter sprout -0.16 24|butter sugar 0.22 21748|butter tofu -0.27 1|butter tomato -0.26 1003|butter vinegar -0.28 921|cabbage carrot 0.64 764|cabbage cheese -0.12 200|cabbage chicken -0.12 93|cabbage chili 0.09 105|cabbage chocolate -0.8 0|cabbage clam -0.17 1|cabbage cream -0.2 10|cabbage cucumber 0.09 44|cabbage curry -0.11 7|cabbage egg -0.3 192|cabbage flour -0.3 150|cabbage garlic 0.07 313|cabbage gochugaru 0.02 24|cabbage lettuce -0.16 7|cabbage milk -0.19 222|cabbage mushroom -0.08 60|cabbage oliveoil -0.01 48|cabbage onion 0.36 1803|cabbage pasta -0.03 28|cabbage pork 0.09 70|cabbage potato 0.27 330|cabbage ramen 0.71 54|cabbage rice 0.33 327|cabbage scallion 0.18 181|cabbage sesameoil 0.2 15|cabbage shrimp -0.09 17|cabbage soy 0.18 108|cabbage spinach -0.09 11|cabbage sprout 0.32 27|cabbage sugar -0.02 970|cabbage tomato 0.32 495|cabbage vinegar 0.53 858|carrot cheese -0.08 733|carrot chicken 0.1 690|carrot chili -0.02 183|carrot chocolate -0.6 2|carrot clam 0.11 24|carrot cream -0.11 60|carrot cucumber 0.18 162|carrot curry 0.03 53|carrot egg -0.21 1087|carrot flour -0.07 1512|carrot garlic 0.21 1228|carrot gochugaru -0.01 56|carrot lettuce 0.04 77|carrot milk -0.16 820|carrot mushroom 0.18 492|carrot oliveoil 0.17 266|carrot onion 0.44 4890|carrot pasta 0.17 186|carrot pork 0.01 135|carrot potato 0.7 2053|carrot ramen 0.12 11|carrot rice 0.07 364|carrot scallion 0.12 369|carrot sesameoil 0.28 44|carrot shrimp -0.01 82|carrot soy 0.23 317|carrot spinach -0.01 57|carrot sprout 0.23 40|carrot sugar -0.13 1871|carrot tofu 0.18 9|carrot tomato 0.29 1109|carrot vinegar 0.23 951|cheese chicken 0.2 2778|cheese chili 0.35 1758|cheese chocolate -0.68 6|cheese clam -0.04 34|cheese cream -0.07 293|cheese cucumber -0.18 105|cheese curry 0.09 220|cheese egg -0.05 7303|cheese flour -0.3 2726|cheese garlic 0.26 4117|cheese gochugaru 0.12 321|cheese lettuce 0.51 1008|cheese milk 0.04 5849|cheese mushroom 0.28 1934|cheese oliveoil 0.17 816|cheese onion 0.39 12497|cheese pasta 0.39 1033|cheese pork -0.19 174|cheese potato 0.12 1665|cheese ramen -0.21 3|cheese rice -0.03 867|cheese scallion 0.26 1696|cheese sesameoil -0.24 6|cheese shrimp -0.05 238|cheese soy -0.33 73|cheese spinach 0.37 675|cheese sprout -0.17 13|cheese sugar -0.52 1767|cheese tofu -0.01 6|cheese tomato 0.32 3422|cheese vinegar -0.34 346|chicken chili 0.21 665|chicken chocolate -0.63 3|chicken clam -0.13 8|chicken cream -0.08 127|chicken cucumber -0.22 35|chicken curry 0.55 488|chicken egg -0.29 1449|chicken flour -0.2 1658|chicken garlic 0.24 2073|chicken gochugaru 0.13 170|chicken lettuce -0.03 95|chicken milk -0.05 2196|chicken mushroom 0.44 1483|chicken oliveoil 0.17 418|chicken onion 0.17 4756|chicken pasta 0.2 329|chicken pork -0.19 73|chicken potato -0.09 392|chicken ramen 0.13 18|chicken rice 0.44 1570|chicken scallion 0.15 662|chicken sesameoil 0.22 51|chicken shrimp -0.1 86|chicken soy 0.44 894|chicken spinach -0.06 70|chicken sprout 0.18 50|chicken sugar -0.56 413|chicken tofu -0.13 1|chicken tomato 0.02 849|chicken vinegar -0.16 400|chili chocolate -0.52 3|chili clam -0.01 8|chili cream -0.07 53|chili cucumber 0.1 83|chili curry -0.04 24|chili egg -0.18 769|chili flour -0.21 540|chili garlic 0.5 1687|chili gochugaru 0.15 79|chili lettuce 0.07 61|chili milk -0.12 624|chili mushroom 0.04 212|chili oliveoil 0.39 369|chili onion 0.31 2807|chili pasta 0.13 113|chili pork 0.02 96|chili potato -0.09 144|chili ramen 0.0 3|chili rice 0.08 260|chili scallion 0.38 578|chili sesameoil 0.33 40|chili shrimp 0.25 165|chili soy 0.15 175|chili spinach -0.01 37|chili sprout 0.0 8|chili sugar -0.25 716|chili tofu 0.02 2|chili tomato 0.44 1142|chili vinegar 0.24 693|chocolate cream 0.11 172|chocolate cucumber -0.8 0|chocolate curry -0.8 0|chocolate egg 0.18 3315|chocolate flour 0.13 2513|chocolate garlic -0.58 10|chocolate gochugaru -0.8 0|chocolate lettuce -0.47 1|chocolate milk 0.07 1725|chocolate mushroom -0.8 0|chocolate oliveoil -0.51 2|chocolate onion -0.72 13|chocolate pasta -0.8 0|chocolate pork -0.8 0|chocolate potato -0.46 13|chocolate rice -0.34 31|chocolate scallion -0.54 3|chocolate shrimp -0.8 0|chocolate soy -0.8 0|chocolate spinach -0.8 0|chocolate sugar 0.22 4316|chocolate tomato -0.58 6|chocolate vinegar -0.35 58|clam cream 0.09 10|clam cucumber -0.06 2|clam curry 0.0 2|clam egg -0.25 19|clam flour -0.05 63|clam garlic 0.32 111|clam gochugaru 0.06 5|clam milk 0.09 98|clam mushroom 0.07 18|clam oliveoil 0.45 55|clam onion 0.23 208|clam pasta 0.02 5|clam pork -0.07 3|clam potato 0.47 111|clam rice -0.07 7|clam scallion 0.1 20|clam shrimp 0.35 28|clam soy -0.13 2|clam spinach -0.1 1|clam sugar -0.35 10|clam tomato 0.1 34|clam vinegar -0.34 1|cream cucumber -0.15 11|cream curry -0.02 16|cream egg -0.03 847|cream flour -0.09 541|cream garlic -0.07 191|cream gochugaru 0.12 44|cream lettuce -0.2 6|cream milk -0.02 570|cream mushroom 0.06 138|cream oliveoil 0.04 66|cream onion -0.19 336|cream pasta 0.02 41|cream pork -0.31 5|cream potato -0.02 123|cream rice -0.12 54|cream scallion -0.03 82|cream sesameoil -0.09 2|cream shrimp 0.07 49|cream soy -0.3 6|cream spinach 0.03 28|cream sprout -0.05 3|cream sugar 0.09 1473|cream tomato -0.19 62|cream vinegar -0.2 60|cucumber curry 0.0 12|cucumber egg -0.38 73|cucumber flour -0.46 28|cucumber garlic 0.14 297|cucumber gochugaru 0.03 19|cucumber lettuce 0.3 70|cucumber milk -0.37 45|cucumber mushroom -0.1 38|cucumber oliveoil 0.18 83|cucumber onion 0.26 1104|cucumber pasta 0.35 114|cucumber pork -0.23 6|cucumber potato -0.13 42|cucumber rice -0.28 10|cucumber scallion 0.32 220|cucumber sesameoil 0.2 12|cucumber shrimp 0.03 28|cucumber soy -0.12 16|cucumber spinach -0.06 10|cucumber sprout 0.04 5|cucumber sugar 0.06 924|cucumber tomato 0.43 524|cucumber vinegar 0.73 1058|curry egg -0.32 54|curry flour -0.19 106|curry garlic 0.16 195|curry gochugaru 0.22 31|curry lettuce -0.07 6|curry milk -0.16 101|curry mushroom 0.1 66|curry oliveoil 0.05 29|curry onion 0.1 433|curry pasta -0.17 4|curry pork -0.04 15|curry potato -0.06 37|curry rice 0.27 132|curry scallion 0.24 105|curry sesameoil 0.04 3|curry shrimp 0.27 53|curry soy 0.23 65|curry spinach 0.02 11|curry sprout 0.01 2|curry sugar -0.33 68|curry tofu 0.03 1|curry tomato -0.02 65|curry vinegar -0.05 55|egg flour 0.71 32513|egg garlic -0.32 1895|egg gochugaru -0.16 214|egg lettuce -0.16 250|egg milk 0.28 18169|egg mushroom -0.22 946|egg oliveoil -0.26 346|egg onion -0.24 9524|egg pasta -0.14 404|egg pork -0.22 392|egg potato -0.19 1423|egg ramen -0.35 2|egg rice -0.23 956|egg scallion -0.2 904|egg sesameoil -0.2 23|egg shrimp -0.23 231|egg soy -0.25 366|egg spinach 0.1 654|egg sprout -0.06 65|egg sugar 0.5 37149|egg tofu 0.01 16|egg tomato -0.37 901|egg vinegar -0.22 1787|flour garlic -0.32 1464|flour gochugaru -0.03 333|flour lettuce -0.48 17|flour milk 0.25 14758|flour mushroom -0.12 1114|flour oliveoil -0.26 266|flour onion -0.36 5045|flour pasta -0.26 172|flour pork -0.27 224|flour potato -0.1 1635|flour ramen -0.8 0|flour rice -0.38 333|flour scallion -0.31 413|flour sesameoil -0.37 4|flour shrimp -0.16 276|flour soy -0.33 174|flour spinach -0.16 179|flour sprout -0.29 10|flour sugar 0.61 34573|flour tofu -0.18 3|flour tomato -0.37 719|flour vinegar -0.23 1406|garlic gochugaru 0.46 603|garlic lettuce -0.03 127|garlic milk -0.3 1173|garlic mushroom 0.38 1667|garlic oliveoil 0.79 2281|garlic onion 0.44 9466|garlic pasta 0.28 542|garlic pork 0.16 497|garlic potato 0.11 1073|garlic ramen -0.12 4|garlic rice 0.2 1122|garlic scallion 0.33 1393|garlic sesameoil 0.43 140|garlic shrimp 0.43 765|garlic soy 0.59 1563|garlic spinach 0.26 345|garlic sprout 0.13 52|garlic sugar -0.38 1823|garlic tofu 0.27 22|garlic tomato 0.58 3851|garlic vinegar 0.2 1807|gochugaru lettuce -0.1 6|gochugaru milk -0.1 184|gochugaru mushroom 0.09 80|gochugaru oliveoil 0.27 92|gochugaru onion 0.21 759|gochugaru pasta -0.01 18|gochugaru pork 0.05 34|gochugaru potato -0.03 58|gochugaru ramen 0.0 1|gochugaru rice 0.15 106|gochugaru scallion 0.26 141|gochugaru sesameoil 0.1 6|gochugaru shrimp 0.5 141|gochugaru soy 0.12 52|gochugaru spinach 0.07 19|gochugaru sugar -0.24 174|gochugaru tofu 0.22 5|gochugaru tomato 0.28 264|gochugaru vinegar 0.16 181|lettuce milk -0.34 44|lettuce mushroom -0.08 37|lettuce oliveoil 0.06 42|lettuce onion 0.22 856|lettuce pasta -0.1 10|lettuce pork -0.25 4|lettuce potato -0.24 15|lettuce ramen 0.2 7|lettuce rice -0.17 21|lettuce scallion 0.44 280|lettuce sesameoil 0.07 5|lettuce shrimp 0.01 21|lettuce soy -0.06 20|lettuce spinach 0.14 29|lettuce sprout -0.03 2|lettuce sugar -0.1 409|lettuce tomato 0.64 771|lettuce vinegar -0.01 101|milk mushroom -0.1 975|milk oliveoil -0.32 135|milk onion -0.14 7395|milk pasta 0.02 530|milk pork -0.16 317|milk potato 0.08 2187|milk ramen -0.3 2|milk rice -0.11 980|milk scallion -0.19 587|milk sesameoil -0.36 3|milk shrimp -0.16 209|milk soy -0.33 133|milk spinach -0.06 228|milk sprout -0.33 5|milk sugar 0.16 18720|milk tofu -0.11 4|milk tomato -0.37 503|milk vinegar -0.4 428|mushroom oliveoil 0.31 379|mushroom onion 0.37 4043|mushroom pasta 0.36 316|mushroom pork 0.09 164|mushroom potato -0.06 229|mushroom ramen 0.0 4|mushroom rice 0.36 787|mushroom scallion 0.31 597|mushroom sesameoil 0.12 20|mushroom shrimp 0.28 235|mushroom soy 0.39 469|mushroom spinach 0.27 162|mushroom sprout 0.5 96|mushroom sugar -0.45 331|mushroom tofu 0.06 4|mushroom tomato 0.22 844|mushroom vinegar -0.15 200|oliveoil onion 0.21 1630|oliveoil pasta 0.36 189|oliveoil pork 0.01 63|oliveoil potato 0.13 261|oliveoil ramen 0.02 3|oliveoil rice 0.07 174|oliveoil scallion 0.26 298|oliveoil sesameoil 0.15 14|oliveoil shrimp 0.41 205|oliveoil soy 0.12 111|oliveoil spinach 0.29 102|oliveoil sprout 0.01 6|oliveoil sugar -0.31 322|oliveoil tofu 0.11 4|oliveoil tomato 0.54 1078|oliveoil vinegar 0.21 453|onion pasta 0.27 1355|onion pork 0.37 2186|onion potato 0.45 5599|onion ramen -0.06 20|onion rice 0.41 4471|onion scallion -0.2 734|onion sesameoil -0.02 61|onion shrimp 0.24 1188|onion soy 0.16 1459|onion spinach 0.18 694|onion sprout 0.25 211|onion sugar -0.42 7074|onion tofu 0.07 19|onion tomato 0.57 8600|onion vinegar 0.34 6146|pasta pork -0.16 14|pasta potato -0.19 35|pasta rice -0.31 10|pasta scallion 0.15 148|pasta sesameoil 0.1 8|pasta shrimp 0.16 62|pasta soy -0.09 25|pasta spinach 0.08 30|pasta sprout -0.08 2|pasta sugar -0.31 201|pasta tofu 0.01 1|pasta tomato 0.42 602|pasta vinegar -0.07 104|pork potato 0.19 302|pork ramen -0.07 1|pork rice 0.27 319|pork scallion -0.02 93|pork sesameoil 0.21 18|pork shrimp -0.05 27|pork soy 0.39 263|pork spinach -0.18 7|pork sprout 0.38 38|pork sugar -0.35 235|pork tofu 0.01 1|pork tomato 0.07 268|pork vinegar 0.29 530|potato rice -0.16 146|potato scallion 0.13 444|potato sesameoil -0.22 2|potato shrimp -0.1 59|potato soy -0.2 49|potato spinach -0.15 26|potato sprout -0.13 5|potato sugar -0.32 979|potato tofu -0.01 2|potato tomato 0.14 854|potato vinegar -0.07 400|ramen scallion 0.63 72|ramen sesameoil 0.3 5|ramen soy 0.35 20|ramen spinach 0.0 1|ramen sprout 0.04 1|ramen sugar 0.06 59|ramen tomato -0.22 1|ramen vinegar 0.38 49|rice scallion 0.21 470|rice sesameoil 0.12 21|rice shrimp 0.39 344|rice soy 0.46 600|rice spinach -0.01 53|rice sprout 0.31 52|rice sugar -0.37 598|rice tofu 0.03 3|rice tomato 0.32 1139|rice vinegar -0.22 145|scallion sesameoil 0.59 109|scallion shrimp 0.45 364|scallion soy 0.48 566|scallion spinach 0.4 225|scallion sprout 0.34 53|scallion sugar -0.3 731|scallion tofu 0.27 12|scallion tomato 0.4 1212|scallion vinegar 0.1 537|sesameoil shrimp 0.2 13|sesameoil soy 0.9 186|sesameoil spinach 0.13 7|sesameoil sprout 0.49 14|sesameoil sugar -0.01 96|sesameoil tofu 0.37 5|sesameoil tomato -0.13 6|sesameoil vinegar 0.29 64|shrimp soy 0.2 99|shrimp spinach -0.07 11|shrimp sprout 0.24 17|shrimp sugar -0.36 131|shrimp tofu 0.06 2|shrimp tomato 0.23 326|shrimp vinegar -0.07 99|soy spinach 0.02 32|soy sprout 0.84 165|soy sugar -0.18 656|soy tofu 0.27 9|soy tomato 0.03 253|soy vinegar 0.33 642|spinach sprout 0.37 23|spinach sugar -0.31 107|spinach tofu 0.18 4|spinach tomato 0.03 108|spinach vinegar -0.01 90|sprout sugar -0.07 76|sprout tofu 0.3 4|sprout tomato -0.04 14|sprout vinegar 0.19 48|sugar tofu -0.17 5|sugar tomato -0.32 1495|sugar vinegar 0.27 7519|tofu tomato -0.05 2|tofu vinegar 0.02 4|tomato vinegar 0.05 873";

const PAIR={};
function _pk(a,b){return a<b?a+'|'+b:b+'|'+a}
PAIR_NPMI.split('|').forEach(s=>{if(!s)return;const [a,b,v,n]=s.split(' ');PAIR[_pk(a,b)]={v:+v,src:'recipe',n:+n}});
// 학습 궁합표(lab/learned.js, 영어 178,615건 + 한국어 6,075건 함께 학습)가 있으면 공동출현 값 대신 쓴다. 직접 적은 값은 그 위에 덮는다.
// 칸: 재료1 재료2 v 영어수 한국어수 어울림 신선함 요즘지수 숨은조합 닮음 (빈 칸은 자료 부족). v에 요즘지수를 ±10%로 곱한다(최대 ±5%).
const LEARN={};
if(typeof PAIR_LEARNED!=='undefined')PAIR_LEARNED.split('|').forEach(s=>{if(!s)return;const f=s.split(' ');const num=x=>x===''||x==null?null:+x;
  const k=_pk(f[0],f[1]),L={en:num(f[3])||0,ko:num(f[4])||0,fit:num(f[5]),fresh:num(f[6]),trend:num(f[7])||0,hidden:f[8]==='1',alike:num(f[9])};
  // 숨은 조합에서 대신 쓰는 관계(같은 성질 재료끼리, 닮음이 어울림보다 0.15 이상 높음)는 뺀다
  if(L.hidden&&ING[f[0]]&&ING[f[1]]&&(ING[f[0]].prop===ING[f[1]].prop||(L.alike!=null&&L.fit!=null&&L.alike-L.fit>=.15)))L.hidden=false;LEARN[k]=L;
  const v=num(f[2]);if(v!=null)PAIR[k]={v:Math.round(v*(1+.1*L.trend)*100)/100,src:'learned',n:L.en+L.ko,en:L.en,ko:L.ko}});
PAIR_TXT.replace(/\n/g,'').split('|').forEach(s=>{const t=s.trim().split(/\s+/);if(t.length<3)return;PAIR[_pk(t[0],t[1])]={v:+t[2],src:'hand'}});

// 메뉴 40종(디저트 6 포함): [이름, 영문, 업종, 핵심 재료, 선택 재료, 조리법(하나라도 맞으면), 그릇, 비교 판매가(데모용 가정값)]
const DISH_RAW=[
['김치찌개','kimchi stew','kor','kimchi pork','tofu onion scallion gochugaru anchovy chili','simmer','ttuk',9000],
['된장찌개','soybean paste stew','kor','doenjang tofu','zucchini onion potato mushroom anchovy chili clam','simmer','ttuk',9000],
['순두부찌개','soft tofu stew','kor','tofu gochugaru','clam egg scallion anchovy onion','simmer','ttuk',9000],
['부대찌개','army base stew','kor','kimchi ramen','bacon tofu scallion gochujang cheese onion','simmer','pan',11000],
['제육볶음','spicy stir-fried pork','kor','pork gochujang','onion scallion garlic cabbage gochugaru sugar','stirfry','plate',10000],
['불고기','bulgogi','kor','beef soy','sugar onion scallion garlic sesameoil mushroom carrot','stirfry grill','plate',13000],
['비빔밥','bibimbap','kor','rice gochujang','spinach sprout carrot egg zucchini sesameoil beef','mix boil','bowl',9000],
['김치볶음밥','kimchi fried rice','kor','rice kimchi','pork egg scallion sesameoil','stirfry','plate',8000],
['떡볶이','tteokbokki','kor','tteok gochujang','sugar scallion egg cabbage','simmer stirfry','pan',5000],
['잡채','japchae','kor','dangmyeon soy','beef carrot spinach onion mushroom sesameoil sugar','boil stirfry','plate',12000],
['라면','ramyeon','kor','ramen','egg scallion kimchi chili','boil simmer','noodle',4500],
['잔치국수','banquet noodles','kor','somyeon anchovy','zucchini egg scallion soy','boil simmer','noodle',7000],
['계란말이','rolled omelette','kor','egg','scallion carrot onion','grill','plate',6000],
['감자조림','braised potatoes','kor','potato soy','sugar garlic sesameoil','simmer','plate',5000],
['닭볶음탕','spicy braised chicken','kor','chicken gochujang','potato carrot onion gochugaru scallion','simmer','pan',22000],
['오징어볶음','spicy stir-fried squid','kor','squid gochujang','onion cabbage carrot gochugaru scallion','stirfry','plate',13000],
['해물파전','seafood scallion pancake','kor','flour scallion','squid shrimp clam egg','grill','plate',15000],
['김치전','kimchi pancake','kor','flour kimchi','pork chili','grill','plate',12000],
['시금치나물','seasoned spinach','kor','spinach sesameoil','garlic soy','boil mix','salad',4000],
['오이무침','spicy cucumber salad','kor','cucumber gochugaru','vinegar sugar garlic','mix raw','salad',4000],
['콩나물무침','seasoned bean sprouts','kor','sprout sesameoil','garlic scallion','boil mix','salad',4000],
['두부조림','braised tofu','kor','tofu soy','gochugaru scallion garlic','grill simmer','plate',7000],
['콩나물국','bean sprout soup','kor','sprout anchovy','scallion garlic chili','simmer boil','bowl',6000],
['토마토 파스타','tomato pasta','west','pasta tomato','garlic oliveoil basil onion cheese','boil stirfry','plate',14000],
['크림 파스타','cream pasta','west','pasta cream','bacon garlic mushroom cheese butter onion','boil stirfry','plate',15000],
['알리오 올리오','aglio e olio','west','pasta garlic oliveoil','chili basil cheese','boil stirfry','plate',13000],
['스테이크','steak','west','beef','butter garlic potato rosemary','grill','plate',28000],
['감자튀김','french fries','west','potato','cheese','fry','fryplate',5000],
['그린 샐러드','green salad','west','lettuce','tomato cucumber cheese oliveoil vinegar egg','raw mix','salad',9000],
['오믈렛','omelette','west','egg butter','cheese mushroom onion milk','grill','plate',9000],
['카프레제','caprese','west','tomato cheese basil','oliveoil vinegar','raw','plate',12000],
['카레라이스','curry rice','asia','rice curry','potato carrot onion pork','simmer','plate',9000],
['마파두부','mapo tofu','asia','tofu pork','gochugaru garlic scallion soy','stirfry simmer','plate',11000],
['새우튀김','shrimp tempura','asia','shrimp flour','egg','fry','fryplate',12000],
['팬케이크','pancake','dessert','flour egg milk','butter sugar','grill','plate',8000],
['크레페','crepe','dessert','flour milk egg','butter sugar cream chocolate','grill','plate',8500],
['커스터드 푸딩','custard pudding','dessert','egg milk sugar','cream','steam','bowl',6000],
['초콜릿 무스','chocolate mousse','dessert','chocolate cream','sugar milk','mix','bowl',7000],
['핫초코','hot chocolate','dessert','milk chocolate','sugar cream','simmer','bowl',5500],
['버터 떡구이','grilled rice cake with butter','dessert','tteok butter','sugar','grill','plate',6000],
];
const DISHES=DISH_RAW.map(r=>({ko:r[0],en:r[1],cat:r[2],core:r[3].split(' ').filter(x=>ING[x]),opt:r[4].split(' ').filter(x=>ING[x]),acts:r[5].split(' '),bowl:r[6],price:r[7]}));
const BOWL_KO={ttuk:'뚝배기',noodle:'면 그릇',bowl:'대접',plate:'접시',pan:'전골 팬',fryplate:'튀김 접시',salad:'샐러드 볼'};
const BOWL_EN={ttuk:'black earthenware pot',noodle:'deep noodle bowl',bowl:'wide bowl',plate:'white plate',pan:'shallow hot pot',fryplate:'plate lined with paper',salad:'salad bowl'};

// 레시피: 재료 [id, g, 연결할 요리 행위 번호(-1이면 완성 접시)], 요리 행위 [id, 다음 요리 행위 번호(-1 = 완성 접시), 온도, 시간]
// 온도·시간을 null로 두면 그 행위의 기본값을 쓰고 수치 노드를 만들지 않는다. 보드가 한눈에 보이도록 재료·요리 행위·수치 노드를 합쳐 6개 이하로 둔다.
// kind: std(일반 레시피), lab(실험적인 레시피). cat: kor·west·asia
const EXAMPLES={
kimchi:{ko:'김치찌개',kind:'std',cat:'kor',ings:[['kimchi',150,0],['pork',100,0],['tofu',150,0],['anchovy',300,0],['scallion',20,0]],acts:[['simmer',-1,null,null]]},
doenjang:{ko:'된장찌개',kind:'std',cat:'kor',ings:[['doenjang',30,0],['tofu',150,0],['zucchini',60,0],['anchovy',300,0],['onion',40,0]],acts:[['simmer',-1,null,null]]},
jeyuk:{ko:'제육볶음',kind:'std',cat:'kor',ings:[['pork',180,0],['gochujang',30,0],['onion',60,0],['scallion',20,0],['sugar',10,0]],acts:[['stirfry',-1,null,null]]},
bulgogi:{ko:'불고기',kind:'std',cat:'kor',ings:[['beef',150,0],['soy',20,0],['sugar',10,0],['onion',80,0],['sesameoil',5,0]],acts:[['stirfry',-1,null,null]]},
bibim:{ko:'비빔밥',kind:'std',cat:'kor',ings:[['spinach',50,0],['sprout',60,0],['rice',210,1],['gochujang',25,1]],acts:[['boil',1,null,null],['mix',-1,null,null]]},
kfried:{ko:'김치볶음밥',kind:'std',cat:'kor',ings:[['rice',210,0],['kimchi',100,0],['pork',60,0],['egg',50,0],['sesameoil',5,0]],acts:[['stirfry',-1,null,null]]},
tteok:{ko:'떡볶이',kind:'std',cat:'kor',ings:[['tteok',200,0],['gochujang',35,0],['sugar',15,0],['cabbage',50,0],['scallion',20,0]],acts:[['simmer',-1,null,null]]},
omelet:{ko:'계란말이',kind:'std',cat:'kor',ings:[['egg',110,0],['scallion',20,0],['carrot',30,0],['onion',30,0]],acts:[['grill',-1,null,null]]},
pasta:{ko:'토마토 파스타',kind:'std',cat:'west',ings:[['pasta',100,0],['tomato',180,1],['garlic',10,1],['oliveoil',15,1]],acts:[['boil',1,null,null],['stirfry',-1,null,null]]},
cream:{ko:'크림 파스타',kind:'std',cat:'west',ings:[['pasta',100,0],['cream',120,1],['bacon',40,1],['mushroom',40,1]],acts:[['boil',1,null,null],['stirfry',-1,null,null]]},
steak:{ko:'스테이크',kind:'std',cat:'west',ings:[['beef',180,0],['butter',15,0],['garlic',10,0],['potato',150,0]],acts:[['grill',-1,null,null]]},
curry:{ko:'카레라이스',kind:'std',cat:'asia',ings:[['rice',210,-1],['curry',20,0],['potato',80,0],['carrot',40,0],['onion',50,0]],acts:[['simmer',-1,null,null]]},
mapo:{ko:'마파두부',kind:'std',cat:'asia',ings:[['tofu',140,0],['pork',90,0],['gochugaru',5,0],['garlic',10,0],['soy',15,0]],acts:[['stirfry',-1,null,null]]},
tempura:{ko:'새우튀김',kind:'std',cat:'asia',ings:[['shrimp',120,0],['flour',50,0],['egg',30,0]],acts:[['fry',-1,null,null]]},
pancake:{ko:'팬케이크',kind:'std',cat:'dessert',ings:[['flour',80,0],['egg',50,0],['milk',100,0],['butter',10,0]],acts:[['grill',-1,180,null]]},
crepe:{ko:'초코 크레페',kind:'std',cat:'dessert',ings:[['flour',50,0],['milk',120,0],['egg',40,0],['butter',10,0],['chocolate',30,-1]],acts:[['grill',-1,null,null]]},
pudding:{ko:'커스터드 푸딩',kind:'std',cat:'dessert',ings:[['egg',100,0],['milk',200,0],['sugar',30,0],['cream',50,0]],acts:[['steam',-1,null,null]]},
mousse:{ko:'초콜릿 무스',kind:'std',cat:'dessert',ings:[['chocolate',60,0],['cream',120,0],['milk',40,0],['sugar',15,0]],acts:[['mix',-1,null,null]]},
hotchoco:{ko:'핫초코',kind:'std',cat:'dessert',ings:[['milk',250,0],['chocolate',40,0],['sugar',10,0],['cream',30,0]],acts:[['simmer',-1,null,5]]},
tteokgui:{ko:'버터 떡구이',kind:'std',cat:'dessert',ings:[['tteok',150,0],['butter',15,0],['sugar',15,0]],acts:[['grill',-1,null,null]]},
soytteok:{ko:'간장 버터 떡구이',kind:'lab',cat:'dessert',ings:[['tteok',150,0],['butter',15,0],['soy',10,0],['sugar',10,0]],acts:[['grill',-1,null,null]]},
kcream:{ko:'김치 크림 파스타',kind:'lab',cat:'west',ings:[['pasta',100,0],['cream',120,1],['kimchi',80,1],['bacon',40,1]],acts:[['boil',1,null,null],['stirfry',-1,null,null]]},
gbsteak:{ko:'고추장 버터 스테이크',kind:'lab',cat:'kor',ings:[['beef',150,0],['gochujang',20,0],['butter',15,0],['garlic',10,0],['onion',80,0]],acts:[['grill',-1,null,null]]},
crazy:{ko:'초콜릿 김치 튀김',kind:'lab',cat:'kor',ings:[['kimchi',150,0],['chocolate',60,0],['flour',80,0]],acts:[['fry',-1,220,18]]},
};
