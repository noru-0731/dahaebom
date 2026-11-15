// AI 요약과 사장님 챗봇. 점수는 브라우저의 계산기(engine.js)가 내고, Claude는 그 결과를 풀어 설명하고 답한다.
// 키는 환경변수 ANTHROPIC_API_KEY에만 둔다. 지시문(프롬프트)은 _prompts.js에 따로 둔다.
// POST /api/ai  { mode: 'summary' | 'chat', ctx: {...}, area: {...}|null, messages?: [{role, content}] }
import Anthropic from '@anthropic-ai/sdk';
import { ING_IDS, ACT_IDS, CATALOG, EXAMPLE } from './_lab.js';
import { RULES, CHAT_RULE, SUMMARY_TASK, DRAFT_ROLE, DRAFT_TASK, NAME_SYSTEM } from './_prompts.js';

const MODEL = 'claude-opus-5-5';
const FAST = 'claude-sonnet-5-5'; // 요약은 짧은 글이라 더 빠른 모델로 낸다
// 요청을 받을 사이트 주소. ALLOWED_ORIGINS에 쉼표로 적는다(예: https://my-app.vercel.app). 로컬 주소는 늘 허용한다.
const origins = () => (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
const isAllowed = o => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(o) || origins().some(x => o === x || o.startsWith(x + '/'));

function clip(s, n) { s = String(s ?? ''); return s.length > n ? s.slice(0, n) : s; }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 받습니다' });
  const origin = req.headers.origin || req.headers.referer || '';
  if (!isAllowed(origin)) return res.status(403).json({ error: '허용되지 않은 출처입니다' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'nokey' });

  const { mode, ctx, area, messages } = req.body || {};
  if (mode === 'draft') return draft(req, res);
  if (mode === 'name') return nickname(req, res);
  const data = `[실험실 계산 결과]\n${clip(JSON.stringify(ctx ?? null), 6000)}\n\n[상권 자료]\n${area ? clip(JSON.stringify(area), 3000) : '선택하지 않음'}`;

  let system, msgs;
  if (mode === 'chat') {
    const hist = Array.isArray(messages) ? messages.slice(-12) : [];
    msgs = hist
      .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
      .map(m => ({ role: m.role, content: clip(m.content, 1500) }));
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: '질문이 비어 있습니다' });
    while (msgs[0].role !== 'user') msgs.shift();
    system = `${RULES}\n${CHAT_RULE}\n\n${data}`;
  } else {
    system = RULES;
    msgs = [{ role: 'user', content: `${data}\n\n${SUMMARY_TASK}` }];
  }

  const client = new Anthropic();
  const params = {
    model: mode === 'chat' ? MODEL : FAST,
    max_tokens: mode === 'chat' ? 2000 : 900,
    output_config: { effort: 'low' },
    system,
    messages: msgs,
  };

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  try {
    // 안전 분류기가 거절하면 서버가 다른 모델로 이어 답하도록 fallbacks를 켠다.
    const stream = client.beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') res.write(ev.delta.text);
    }
    const fin = await stream.finalMessage();
    if (fin.stop_reason === 'refusal') res.write('\n(이 질문에는 답할 수 없습니다. 다르게 물어봐 주세요.)');
    if (fin.stop_reason === 'max_tokens') res.write('…');
  } catch (e) {
    let msg = 'AI 응답 중 문제가 생겼습니다.';
    if (e instanceof Anthropic.AuthenticationError) msg = 'AI 키가 맞지 않습니다.';
    else if (e instanceof Anthropic.RateLimitError) msg = '요청이 몰렸습니다. 잠시 뒤 다시 눌러 주세요.';
    else if (e instanceof Anthropic.BadRequestError) msg = 'AI 요청 형식 문제입니다.';
    else if (e instanceof Anthropic.APIError) msg = `AI 서버 오류(${e.status ?? '연결'})입니다.`;
    console.error(e);
    res.write(`\n[오류] ${msg}`);
  }
  res.end();
}

// ---------- 설문 → 첫 메뉴 초안 3개 ----------
const RECIPE = {
  type: 'object', additionalProperties: false,
  required: ['name', 'concept', 'fit', 'ings', 'acts', 'salt', 'spicy'],
  properties: {
    name: { type: 'string', description: '메뉴 이름(한국어, 15자 안팎)' },
    concept: { type: 'string', description: '어떤 메뉴인지 한두 문장' },
    fit: { type: 'string', description: '설문 답과 상권 자료에 맞춘 이유 한두 문장. 자료에 있는 숫자만 쓴다' },
    ings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'g', 'to'], properties: {
      id: { type: 'string', enum: ING_IDS }, g: { type: 'integer', description: '1인분 그램' },
      to: { type: 'integer', description: '이 재료를 넣는 요리 행위의 acts 번호(0부터). 완성 접시에 바로 올리면 -1' } } } },
    acts: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['key', 'to', 'temp', 'time'], properties: {
      key: { type: 'string', enum: ACT_IDS }, to: { type: 'integer', description: '다음 요리 행위의 acts 번호(자기보다 큰 번호). 마지막이면 -1(완성 접시)' },
      temp: { type: 'integer', description: '°C. 기본값을 쓰거나 온도가 없는 행위면 0' }, time: { type: 'integer', description: '분. 기본값을 쓰거나 시간이 없는 행위면 0' } } } },
    salt: { type: 'number', description: '완성 염도 %. 0.6~2.0' },
    spicy: { type: 'integer', description: '매운맛 단계 0~5' },
  },
};
const DRAFT_SCHEMA = { type: 'object', additionalProperties: false, required: ['recipes'], properties: { recipes: { type: 'array', items: RECIPE } } };

function catalogText() {
  const C = CATALOG;
  const ings = C.ings.map(([id, ko, cat, g, p]) => `${id} ${ko} (${C.cats[cat]}, 기본 ${g}g, 100g ${p}원)`).join('\n');
  const acts = C.acts.map(([id, ko, t, m, dt, dm]) => `${id} ${ko}: 온도 ${t ? t.join('~') + '°C(기본 ' + dt + ')' : '없음(0)'}, 시간 ${m ? m.join('~') + '분(기본 ' + dm + ')' : '없음(0)'}`).join('\n');
  const dishes = C.dishes.map(([ko, cat, core, acts, price]) => `${ko}(${cat}): 핵심 ${core} / ${acts} / ${price}원`).join('\n');
  return { ings, acts, dishes };
}

async function draft(req, res) {
  const { survey, area } = req.body || {};
  const C = catalogText();
  const prompt = `[사장님 설문]\n${clip(JSON.stringify(survey ?? {}), 2000)}\n\n[가게 상권 자료]\n${area ? clip(JSON.stringify(area), 2500) : '없음'}\n\n` +
    `[쓸 수 있는 재료 48종] id 이름 (분류, 기본 양, 데모 단가)\n${C.ings}\n\n[요리 행위 8종]\n${C.acts}\n\n[참고 메뉴 34종] 이름(분류): 핵심 재료 / 조리 / 비교 판매가\n${C.dishes}\n\n` +
    `[레시피 틀 예시: ${EXAMPLE.name}]\n${JSON.stringify(EXAMPLE)}\n(ings의 세 번째 값과 acts의 두 번째 값이 연결 번호. acts는 [행위, 다음 번호, 온도, 시간])\n\n` +
    DRAFT_TASK;
  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: MODEL, max_tokens: 8000, output_config: { effort: 'low', format: { type: 'json_schema', schema: DRAFT_SCHEMA } },
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      system: `${RULES}\n${DRAFT_ROLE}`,
      messages: [{ role: 'user', content: prompt }],
    });
    const fin = await stream.finalMessage();
    if (fin.stop_reason === 'refusal') return res.status(422).json({ error: '이 설문으로는 초안을 만들 수 없습니다.' });
    const text = fin.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const out = JSON.parse(text);
    return res.status(200).json({ recipes: (out.recipes || []).slice(0, 3), usage: { in: fin.usage.input_tokens, out: fin.usage.output_tokens } });
  } catch (e) {
    console.error(e);
    let msg = 'AI 초안을 만들지 못했습니다.';
    if (e instanceof Anthropic.RateLimitError) msg = '요청이 몰렸습니다. 잠시 뒤 다시 눌러 주세요.';
    else if (e instanceof Anthropic.APIError) msg = `AI 서버 오류(${e.status ?? '연결'})입니다.`;
    return res.status(502).json({ error: msg });
  }
}

// 새 가능성 이름: 계산기가 가른 성공·실패와 그 사연을 바탕으로 메뉴 이름 하나를 짓는다.
// 입력 { mode:'name', combo:{재료:[{이름,g}], 조리:[{행위,온도,시간}], 가까운메뉴, 유사도, 판정:'성공'|'실패', 사연:[{사연,재료,재료1,재료2}], 점수, 예시이름} }  출력 { name }
async function nickname(req, res) {
  const combo = req.body?.combo;
  if (!combo || !Array.isArray(combo.재료) || !combo.재료.length) return res.status(400).json({ error: '조합이 비어 있습니다' });
  const client = new Anthropic();
  try {
    const stream = client.beta.messages.stream({
      model: FAST, max_tokens: 80, output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      system: NAME_SYSTEM,
      messages: [{ role: 'user', content: clip(JSON.stringify(combo), 1500) }],
    });
    const fin = await stream.finalMessage();
    const name = (fin.content || []).filter(b => b.type === 'text').map(b => b.text).join('').replace(/["'「」『』\n.]/g, '').trim().slice(0, 24);
    if (!name || fin.stop_reason === 'refusal') return res.status(502).json({ error: 'empty' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ name });
  } catch (e) {
    return res.status(502).json({ error: 'ai' });
  }
}
