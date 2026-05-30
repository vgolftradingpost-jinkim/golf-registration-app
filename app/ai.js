/* ================================================================
   ai.js — Claude Vision API 호출 + 분석 흐름
   의존: rules.js (RULES, FORM_DEFAULTS), 그리고 app.js의
        getApiKey, getModel, showLoading, hideLoading, showScreen, toast,
        populateEditForm, goToEditManual, openApiKeyModal 등 전역 함수
   v12 (2026-05-30) 모듈 분리
   ================================================================ */

async function callClaudeVision(images, preType = '') {
  const apiKey = getApiKey();
  const model = getModel();
  if (!apiKey) throw new Error('No API key set');

  // Photo 1: Head Brand/Model, Photo 2: Head Model/Degree, Photo 3: Head Degree
  // Photo 4: Shaft Brand/Model, Photo 5: Shaft Model/Flex/Weight, Photo 6: Shaft Flex/Weight
  const labels = [
    'Head 1 — Brand & Model name',
    'Head 2 — Model name & Loft degree',
    'Head 3 — Loft degree (close-up)',
    'Shaft 1 — Shaft brand & model name',
    'Shaft 2 — Shaft model, flex & weight label',
    'Shaft 3 — Shaft flex & weight (close-up)'
  ];

  const content = [];
  images.forEach((dataUrl, i) => {
    if (!dataUrl) return; // null 이미지 스킵
    const base64 = dataUrl.split(',')[1];
    const mediaType = dataUrl.split(';')[0].split(':')[1];
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 }
    });
    content.push({ type: 'text', text: `[Photo ${i+1}: ${labels[i]}]` });
  });

  // Brand hint — RULES.brandNormalize의 공식 표기를 모델에 제공
  const brandList = Array.from(new Set(Object.values(RULES.brandNormalize))).join(', ');

  // Type-specific hints
  const typeHint = preType
    ? `\nConfirmed club type: ${preType}. Set "club_type" to "${preType}".`
    : '';
  const loftHint = `\nIMPORTANT: Head 2 and Head 3 photos are intentionally focused on the loft angle printed on the club head. Read the exact loft degrees from Head 2-3 and return it as "loft".`;
  const putterHint = (preType === 'Putter')
    ? `\nIf this is a Putter, also read the shaft length printed on the head or shaft (commonly 32"–35") and return it as "putter_length" (number only, e.g. 34 or 33.5).`
    : '';

  content.push({
    type: 'text',
    text: `Analyze these golf club photos (up to 6).${typeHint}${loftHint}${putterHint}

Reference brand list (use the EXACT official spelling when matched):
${brandList}

Return ONE JSON object only (no markdown, no commentary):
- brand: official brand name (use the reference list spelling when applicable, e.g. TaylorMade not "Taylor Made"). For Japanese-only logos, return the romanized/English form (e.g. "HONMA", "XXIO", "PRGR").
- model: model name in English. If the head shows Japanese characters only, transliterate to romanized English (e.g. "TSi3", "MAVRIK", "Stealth Plus+", "Exotics XCG7").
- logo_text: every readable text/logo/code on the club head, space-separated (e.g. "XCGB EXOTICS 9" or "SIM2 MAX TaylorMade"). Include everything engraved, separate from brand/model.
- club_type: ${preType || 'one of: Driver / Wood / Hybrid / Iron Set / Wedge / Putter'}
- loft: loft angle number from Head 2-3 (e.g. 10.5)
- putter_length: putter length number only when club_type is Putter (e.g. 34 or 33.5); otherwise null
- shaft_brand: shaft brand from Shaft 1
- shaft_model: shaft model from Shaft 1-2 (e.g. "Ventus Blue 6", "TENSEI CK Pro")
- shaft_flex: one of R / S / SR / X / L / A / Uni
- shaft_weight: shaft weight (e.g. "55g", "65g")
- shaft_material: Graphite / Steel / SteelFiber
- gender: Men or Women (if visible)
- handed: Right or Left (if visible)

Output JSON only.`
  });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: content }]
    })
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${resp.status}`);
  }

  const data = await resp.json();
  const text = data.content[0].text.trim();

  // Extract JSON (handle markdown code blocks)
  let jsonStr = text;
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) jsonStr = codeMatch[1].trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('AI JSON parse failed. Raw response:', text);
    const err = new Error('AI 응답 형식 오류 — 다시 시도하거나 수동 입력으로 진행하세요.');
    err.code = 'parse_error';
    throw err;
  }
}

/* ================================================================
   ANALYZE PHOTOS (main flow)
   ================================================================ */
async function analyzePhotos() {
  const apiKey = getApiKey();
  if (!apiKey) {
    openApiKeyModal();
    return;
  }

  // 오프라인 사전 감지 — 네트워크 호출 자체를 건너뛰고 수동 입력으로 안내
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    toast('오프라인 상태 — AI 분석을 사용할 수 없습니다. 수동으로 입력해 주세요.', true);
    goToEditManual();
    return;
  }

  const allImages = [...STATE.images.head, ...STATE.images.shaft];
  const preType = document.getElementById('capture-type').value;
  showLoading('Analyzing photos...', 'Claude Vision AI is reading your club');

  try {
    const aiResult = await callClaudeVision(allImages, preType);
    console.log('AI Result:', aiResult);

    populateEditForm(aiResult);
    hideLoading();
    showScreen('edit');
    toast('AI analysis complete!');

  } catch (err) {
    hideLoading();
    console.error('API Error:', err);
    const msg = String(err.message || '');

    if (msg.includes('API key') || msg.includes('401') || msg.includes('authentication')) {
      toast('API 키가 유효하지 않습니다. 설정을 확인하세요.', true);
      openApiKeyModal();
    } else if (msg.includes('429') || msg.toLowerCase().includes('rate_limit')) {
      toast('요청 한도 초과 — 잠시 후 다시 시도해 주세요.', true);
      goToEditManual();
    } else if (msg.includes('529') || msg.toLowerCase().includes('overloaded')) {
      toast('Claude 서버 혼잡 — 잠시 후 다시 시도해 주세요.', true);
      goToEditManual();
    } else if (err.code === 'parse_error') {
      toast(msg, true);
      goToEditManual();
    } else if (err.name === 'AbortError' || msg.toLowerCase().includes('timeout')) {
      toast('응답 지연으로 중단됨 — 네트워크 확인 후 다시 시도해 주세요.', true);
      goToEditManual();
    } else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
      toast('네트워크 연결 실패 — 인터넷 상태를 확인하세요.', true);
      goToEditManual();
    } else {
      toast('Analysis failed: ' + msg, true);
      goToEditManual();
    }
  }
}
