# 다 해봄 · 메뉴 궁합 실험실

식당 사장님이 신메뉴를 만들기 전에 재료와 조리법을 보드에 이어 보고, 어울림 점수·원가·예상 메뉴를 바로 확인하는 웹 앱입니다. 정적 페이지와 Vercel 서버 함수로 이루어져 있습니다.

## 폴더 구성

- `index.html`: 시작 화면
- `pairing.html`: 실험실 화면(주소 `/dahaebom`)
- `lab/`: 화면 코드
  - `engine.js`: 점수 계산기
  - `graph.js`: 레시피 보드
  - `plate.js`: 접시 그림
  - `app.js`: 결과 칸
  - `report.js`: PDF 보고서
  - `survey.js`, `topbar.js`, `tour.js`, `ai.js`: 설문, 상단 바, 사용법 안내, AI 화면
  - `data.js`, `learned.js`: 재료와 학습 궁합 값
- `api/`: 서버 함수
  - `ai.js`: AI 요약, 챗봇, 메뉴 초안, 새 이름
  - `sangwon.js`: 서울시 실시간 상권 조회
  - `_lab.js`: AI에 넘기는 재료 목록
  - `_prompts.js`: AI 지시문
- `data/`, `img/`: 궁합 자료와 그림

## 실행 준비

1. Vercel에 이 폴더를 프로젝트로 올립니다.
2. `.env.example`에 적힌 세 가지를 Vercel 프로젝트의 환경변수에 넣습니다.
   - `ANTHROPIC_API_KEY`: Claude API 키
   - `SEOUL_API_KEY`: 서울 열린데이터광장 인증키
   - `ALLOWED_ORIGINS`: 앱이 올라간 주소(예: https://my-app.vercel.app)
3. `api/_prompts.js`의 자리표시 문장을 실제 지시문으로 바꿉니다. 공유본에는 원래 지시문이 들어 있지 않습니다. 자리표시 그대로 두어도 작동은 하지만, AI 답변의 말투와 형식이 정해지지 않습니다.

키는 코드나 주소에 넣지 않고 환경변수에만 둡니다. 키가 없으면 점수 계산, 보드, 접시 그림, PDF는 그대로 작동하고 AI 기능과 상권 자료만 꺼집니다.

## 로컬에서 보기

```bash
npm install
npx vercel dev
```

정적 화면만 볼 때는 아무 정적 서버로 폴더를 열고 `pairing.html`을 열면 됩니다.

## 자료 출처

- 재료 궁합 학습: RecipeNLG 영어 레시피, 식품의약품안전처 조리식품 레시피 DB, 만개의레시피 공개 레시피
- 상권: 서울 열린데이터광장 서울시 실시간 상권현황(OA-22385)
- 재료 단가와 메뉴 비교 판매가는 시연용 가정값입니다.
