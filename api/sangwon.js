// 서울시 실시간 상권현황(OA-22385) 조회. 인증키는 Vercel 환경변수 SEOUL_API_KEY에만 둔다.
// GET /api/sangwon?area=POI009
export default async function handler(req, res) {
  const area = String(req.query.area || 'POI009');
  if (!/^POI\d{3}$/.test(area)) return res.status(400).json({ error: '장소 코드 형식이 맞지 않습니다' });
  const key = process.env.SEOUL_API_KEY;
  if (!key) return res.status(503).json({ error: '서버에 상권 인증키가 없습니다' });
  try {
    const r = await fetch(`http://openapi.seoul.go.kr:8088/${key}/json/citydata_cmrcl/1/5/${area}`, { signal: AbortSignal.timeout(12000) });
    const j = await r.json();
    const L = j.LIVE_CMRCL_STTS;
    if (!L) return res.status(502).json({ error: (j.RESULT && j.RESULT.resultMsg) || '상권 자료를 받지 못했습니다' });
    const num = v => (v === '' || v == null ? null : Number(v));
    const out = {
      area: j.AREA_NM, code: j.AREA_CD,
      level: L.AREA_CMRCL_LVL,
      payCnt: num(L.AREA_SH_PAYMENT_CNT),
      payMin: num(L.AREA_SH_PAYMENT_AMT_MIN), payMax: num(L.AREA_SH_PAYMENT_AMT_MAX),
      time: L.CMRCL_TIME,
      male: num(L.CMRCL_MALE_RATE), female: num(L.CMRCL_FEMALE_RATE),
      age: [10, 20, 30, 40, 50, 60].map(a => ({ a, v: num(L[`CMRCL_${a}_RATE`]) })),
      personal: num(L.CMRCL_PERSONAL_RATE), corp: num(L.CMRCL_CORPORATION_RATE),
      biz: (L.CMRCL_RSB || []).map(b => ({
        big: b.RSB_LRG_CTGR, mid: b.RSB_MID_CTGR, level: b.RSB_PAYMENT_LVL,
        cnt: num(b.RSB_SH_PAYMENT_CNT), min: num(b.RSB_SH_PAYMENT_AMT_MIN), max: num(b.RSB_SH_PAYMENT_AMT_MAX),
        shops: num(b.RSB_MCT_CNT), shopsAt: b.RSB_MCT_TIME,
      })),
    };
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(out);
  } catch (e) {
    return res.status(502).json({ error: '서울 열린데이터광장 응답이 늦거나 끊겼습니다' });
  }
}
