/* ═══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
let cfg = { provider: 'default', apiKey: '' };
let busy = false;
let pendProv = 'default';
let genMode = 'image';
let attachedFile = null; // now handles image, video, audio, pdf, etc.
let activeSid = null;

// Sessions: { id, label, hist, msgsHTML }
let sessions = [];

try {
  const s = localStorage.getItem('kx_v3');
  if (s) {
    const p = JSON.parse(s);
    cfg = p.cfg || cfg;
    sessions = p.sessions || [];
  }
} catch(e) {}

function saveState() {
  const lean = sessions.map(s => ({
    ...s,
    msgsHTML: activeSid === s.id
      ? document.getElementById('msgs').innerHTML
      : s.msgsHTML
  }));
  try { localStorage.setItem('kx_v3', JSON.stringify({ cfg, sessions: lean })); } catch(e) {}
}

/* ═══════════════════════════════════════════════════════════
   THINKING STEPS
═══════════════════════════════════════════════════════════ */
const STEPS = {
  debug:   ['Reading your code carefully…','Identifying the error type…','Tracing the root cause…','Analyzing the stack context…','Building the fix…'],
  explain: ['Understanding your question…','Gathering relevant concepts…','Structuring a clear explanation…','Preparing examples…'],
  write:   ['Parsing your requirements…','Planning the implementation…','Writing the code…','Reviewing for correctness…'],
  review:  ['Reading your code…','Checking for bugs & anti-patterns…','Analyzing performance…','Drafting feedback…'],
  default: ['Understanding your request…','Thinking through the answer…','Preparing response…'],
};

function getSteps(t) {
  t = t.toLowerCase();
  if (/debug|error|fix|bug|crash|exception|undefined|null|traceback/.test(t)) return STEPS.debug;
  if (/explain|how|what|why|difference|when|where|mean|tell me/.test(t)) return STEPS.explain;
  if (/write|create|generate|build|make|implement|add|code/.test(t)) return STEPS.write;
  if (/review|improve|optimize|refactor|better|check|suggest/.test(t)) return STEPS.review;
  return STEPS.default;
}

/* ═══════════════════════════════════════════════════════════
   WELCOME SCREEN
═══════════════════════════════════════════════════════════ */
function renderWelcome() {
  document.getElementById('msgs').innerHTML = `
  <div class="welcome">
    <div class="welcome-icon">✳️</div>
    <h1>How can I help you today?</h1>
    <p>I'm K-XpertAI — your intelligent coding assistant by KingxTech. Debug, explain, generate, and review code instantly.</p>
    <div class="sugs">
      <button class="sug" onclick="send('Debug this error: TypeError: Cannot read properties of undefined reading length')">
        <div class="sug-icon">🐛</div><div class="sug-title">Debug my code</div>
        <div class="sug-sub">Paste an error — I'll trace & fix it</div>
      </button>
      <button class="sug" onclick="send('Explain how async/await works in JavaScript with simple examples')">
        <div class="sug-icon">💡</div><div class="sug-title">Explain a concept</div>
        <div class="sug-sub">Clear, step-by-step with examples</div>
      </button>
      <button class="sug" onclick="send('Write a Python REST API with Flask that handles user authentication')">
        <div class="sug-icon">✏️</div><div class="sug-title">Generate code</div>
        <div class="sug-sub">Describe what you need built</div>
      </button>
      <button class="sug" onclick="send('Review my code and suggest performance improvements')">
        <div class="sug-icon">🔍</div><div class="sug-title">Code review</div>
        <div class="sug-sub">Expert feedback instantly</div>
      </button>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   SESSION / HISTORY MANAGEMENT
═══════════════════════════════════════════════════════════ */
function currentSession() { return sessions.find(s => s.id === activeSid) || null; }

function newChat() {
  if (activeSid) {
    const s = currentSession();
    if (s) s.msgsHTML = document.getElementById('msgs').innerHTML;
  }
  activeSid = null;
  document.getElementById('chatTitle').textContent = 'K-XpertAI — Intelligent Assistant';
  renderWelcome();
  renderSidebar();
  closeSidebar();
  saveState();
}

function clearChat() { newChat(); }

function switchToSession(id) {
  if (activeSid) {
    const cur = currentSession();
    if (cur) cur.msgsHTML = document.getElementById('msgs').innerHTML;
  }
  const s = sessions.find(x => x.id === id);
  if (!s) return;
  activeSid = id;
  document.getElementById('chatTitle').textContent = s.label;
  document.getElementById('msgs').innerHTML = s.msgsHTML || '';
  renderSidebar();
  scroll();
  closeSidebar();
}

function createSession(label, firstMsg) {
  const id = Date.now();
  const s = { id, label: label.slice(0, 44), hist: [{ role: 'user', content: firstMsg }], msgsHTML: '' };
  sessions.unshift(s);
  activeSid = id;
  document.getElementById('chatTitle').textContent = s.label;
  renderSidebar();
  return s;
}

function getActiveHist() {
  const s = currentSession();
  return s ? s.hist : [];
}

function pushHist(role, content) {
  const s = currentSession();
  if (s) s.hist.push({ role, content });
}

function renderSidebar() {
  const list = document.getElementById('chatList');
  if (sessions.length === 0) {
    list.innerHTML = `<div style="padding:12px 14px;font-size:12px;color:var(--text-muted)">No conversations yet</div>`;
    return;
  }
  list.innerHTML = sessions.map(s => `
    <div class="chat-item ${s.id === activeSid ? 'active' : ''}" onclick="switchToSession(${s.id})">
      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <span class="chat-item-txt">${esc(s.label)}…</span>
      <button class="del-chat-btn" onclick="deleteSession(event,${s.id})" title="Delete">✕</button>
    </div>`).join('');
}

function deleteSession(e, id) {
  e.stopPropagation();
  sessions = sessions.filter(s => s.id !== id);
  if (activeSid === id) {
    activeSid = null;
    renderWelcome();
    document.getElementById('chatTitle').textContent = 'K-XpertAI — Intelligent Assistant';
  }
  renderSidebar();
  saveState();
}

/* ═══════════════════════════════════════════════════════════
   MAIN SEND
═══════════════════════════════════════════════════════════ */
async function send(preText) {
  if (busy) return;
  const inp = document.getElementById('inp');
  const txt = (preText || inp.value).trim();
  const file = attachedFile;
  if (!txt && !file) return;
  if (!preText) { inp.value = ''; inp.style.height = 'auto'; }
  clearAttach();
  document.querySelector('.welcome')?.remove();
  busy = true;
  document.getElementById('sendBtn').disabled = true;

  if (!activeSid) createSession(txt || (file ? file.name : 'File'), txt || '');
  else if (txt) pushHist('user', txt);

  appendUserWithFile(txt, file);
  const aiBlock = appendAI();

  // Choose thinking steps
  const steps = file && file.type.startsWith('image/')
    ? ['Examining the image…','Identifying objects and context…','Formulating analysis…']
    : file && file.type.startsWith('video/')
    ? ['Loading video info…','Analyzing your request…','Preparing response…']
    : getSteps(txt);

  await animThink(aiBlock, steps);

  try {
    let reply = '';
    const h = getActiveHist();
    const isImage = file && file.type.startsWith('image/');

    if (isImage) {
      if (cfg.provider === 'gemini' && cfg.apiKey) reply = await callGeminiVision(txt, file, h);
      else if (cfg.provider === 'openai' && cfg.apiKey) reply = await callOpenAIVision(txt, file);
      else reply = await callDefaultVision(txt, file, h);
    } else {
      if (cfg.provider === 'gemini' && cfg.apiKey) reply = await callGemini(txt, h);
      else if (cfg.provider === 'openai' && cfg.apiKey) reply = await callOpenAI(txt, h);
      else reply = await callDefault(txt, h);
    }

    doneThink(aiBlock);
    await showReply(aiBlock, reply);
    pushHist('assistant', reply);
  } catch(err) {
    doneThink(aiBlock);
    setHTML(aiBlock, `<span style="color:#e05555">⚠️ ${esc(err.message)}</span>`);
  }

  showActions(aiBlock);
  if (currentSession()) currentSession().msgsHTML = document.getElementById('msgs').innerHTML;
  saveState();
  busy = false;
  document.getElementById('sendBtn').disabled = false;
  document.getElementById('inp').focus();
}

/* ═══════════════════════════════════════════════════════════
   API CALLS
═══════════════════════════════════════════════════════════ */
async function callDefault(txt, h) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1000,
      system: 'You are K-XpertAI, an expert AI coding assistant built by KingxTech (founded by Alkhassim Lawal Umar Bello). Specialise in debugging, code generation, code review, and clear explanations. Be concise and accurate. Format code with markdown fences.',
      messages: h,
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || `API error ${res.status}`);
  return d.content?.[0]?.text || 'No response.';
}

async function callGemini(txt, h) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cfg.apiKey}`;
  const body = {
    contents: h.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    systemInstruction: { parts: [{ text: 'You are K-XpertAI, a smart coding assistant by KingxTech. Be concise, helpful. Format code with markdown fences.' }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await res.json();
  if (!res.ok || d.error) throw new Error(d.error?.message || `Gemini error ${res.status}`);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
}

async function callOpenAI(txt, h) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are K-XpertAI, a smart coding assistant by KingxTech. Be concise, helpful. Format code in markdown.' }, ...h],
      max_tokens: 2048, temperature: 0.7
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || `OpenAI error ${res.status}`);
  return d.choices?.[0]?.message?.content || 'No response.';
}

async function callDefaultVision(txt, img, h) {
  const userContent = [
    { type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.base64 } },
    { type: 'text', text: txt || 'What is in this image? Describe it in detail.' }
  ];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 1000,
      system: 'You are K-XpertAI, an expert AI assistant by KingxTech. Analyse images and answer questions clearly.',
      messages: [...h.slice(0, -1), { role: 'user', content: userContent }],
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || `API error ${res.status}`);
  return d.content?.[0]?.text || 'No response.';
}

async function callGeminiVision(txt, img, h) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cfg.apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [
      { inline_data: { mime_type: img.mimeType, data: img.base64 } },
      { text: txt || 'What is in this image? Describe it in detail.' }
    ]}],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await res.json();
  if (!res.ok || d.error) throw new Error(d.error?.message || `Gemini error ${res.status}`);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
}

async function callOpenAIVision(txt, img) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are K-XpertAI, a smart assistant by KingxTech. Analyse images accurately.' },
        { role: 'user', content: [
          { type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.base64}` } },
          { type: 'text', text: txt || 'What is in this image?' }
        ]}
      ], max_tokens: 2048
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error?.message || `OpenAI error ${res.status}`);
  return d.choices?.[0]?.message?.content || 'No response.';
}

/* ═══════════════════════════════════════════════════════════
   LOGO CONFIG
═══════════════════════════════════════════════════════════ */
const AI_LOGO_URL = '';

function initLogo() {
  const img = document.getElementById('logoImg');
  if (AI_LOGO_URL) {
    img.src = AI_LOGO_URL;
  } else {
    img.style.display = 'none';
    img.parentElement.textContent = '⚡';
  }
}

function getAiAvatarHTML() {
  if (AI_LOGO_URL) {
    return `<div class="ai-av"><img src="${AI_LOGO_URL}" alt="K" onerror="this.style.display='none';this.parentElement.textContent='⚡'"/></div>`;
  }
  return `<div class="ai-av">⚡</div>`;
}

/* ═══════════════════════════════════════════════════════════
   TEXT TO SPEECH
═══════════════════════════════════════════════════════════ */
let selectedVoice = null;
let ttsRate = 1.0;
let ttsPitch = 1.0;
let ttsKeepAlive = null;
let activeSpeakBtn = null;

function getVoices() {
  return new Promise(resolve => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length) { resolve(voices); return; }
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length) resolve(voices);
    };
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

async function openVoicePanel() {
  const panel = document.getElementById('voicePanel');
  panel.classList.add('open');
  const list = document.getElementById('voiceList');
  const voices = await getVoices();
  if (!voices.length) {
    list.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:6px">No voices found on this device.</div>`;
    return;
  }
  const eng = voices.filter(v => v.lang.startsWith('en'));
  const other = voices.filter(v => !v.lang.startsWith('en'));
  const sorted = [...eng, ...other];
  list.innerHTML = sorted.map((v, i) => `
    <button class="voice-opt ${selectedVoice?.name === v.name ? 'sel' : ''}"
      onclick="selectVoice(${i})" data-idx="${i}">
      <span style="flex:1">${v.name}</span>
      <span style="font-size:10px;opacity:.5;flex-shrink:0">${v.lang}</span>
    </button>`).join('');
  window._sortedVoices = sorted;
}

function selectVoice(idx) {
  selectedVoice = window._sortedVoices[idx];
  document.querySelectorAll('.voice-opt').forEach((b, i) => b.classList.toggle('sel', i === idx));
  toast(`Voice: ${selectedVoice.name}`);
}

function closeVoicePanel() {
  document.getElementById('voicePanel').classList.remove('open');
}

function speakMsg(btn) {
  const bubble = btn.closest('.msg').querySelector('.ai-bubble');
  const text = bubble.innerText.replace(/Copy response|Read aloud|Stop|Voice/g, '').trim();
  if (!text) return;
  if (btn.classList.contains('speaking')) { stopSpeech(); return; }
  stopSpeech();
  ttsRate = parseFloat(document.getElementById('rateSlider').value) || 1.0;
  ttsPitch = parseFloat(document.getElementById('pitchSlider').value) || 1.0;
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = ttsRate;
  utt.pitch = ttsPitch;
  utt.lang = 'en-US';
  if (selectedVoice) {
    utt.voice = selectedVoice;
  } else {
    const voices = window.speechSynthesis.getVoices();
    utt.voice = voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
  }
  activeSpeakBtn = btn;
  btn.classList.add('speaking');
  btn.innerHTML = stopIcon() + ' Stop';
  ttsKeepAlive = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10000);
  utt.onend = () => stopSpeech();
  utt.onerror = (e) => { if (e.error !== 'interrupted') stopSpeech(); };
  window.speechSynthesis.speak(utt);
}

function stopSpeech() {
  clearInterval(ttsKeepAlive);
  window.speechSynthesis.cancel();
  if (activeSpeakBtn) {
    activeSpeakBtn.classList.remove('speaking');
    activeSpeakBtn.innerHTML = speakerIcon() + ' Read aloud';
    activeSpeakBtn = null;
  }
  document.querySelectorAll('.speak-btn.speaking').forEach(b => {
    b.classList.remove('speaking');
    b.innerHTML = speakerIcon() + ' Read aloud';
  });
}

function speakerIcon() {
  return `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>`;
}

function stopIcon() {
  return `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
}

document.addEventListener('click', e => {
  const panel = document.getElementById('voicePanel');
  if (panel.classList.contains('open') && !panel.contains(e.target) && !e.target.closest('.act-btn')) {
    closeVoicePanel();
  }
});

/* ═══════════════════════════════════════════════════════════
   IMAGE GENERATION — Pollinations.ai (fixed)
═══════════════════════════════════════════════════════════ */
async function generateImage(prompt) {
  if (busy) return;
  busy = true;
  document.getElementById('sendBtn').disabled = true;
  document.querySelector('.welcome')?.remove();
  if (!activeSid) createSession('🎨 ' + prompt, prompt);

  appendUserWithFile(`🎨 Generate image: ${prompt}`, null);
  const aiBlock = appendAI();
  await animThink(aiBlock, ['Reading your prompt…', 'Composing the visual…', 'Rendering pixels…', 'Finalising image…']);
  doneThink(aiBlock);
  const b = aiBlock.querySelector('.ai-bubble');
  b.classList.remove('stream-cur');
  b.innerHTML = `<div class="media-loading"><div class="spin"></div> Generating image — this may take 10–20 seconds…</div>`;
  scroll();

  try {
    let imgUrl = '';
    if (cfg.provider === 'openai' && cfg.apiKey) {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error?.message || 'DALL-E error');
      imgUrl = d.data[0].url;
    } else {
      // Pollinations.ai — use /prompt/ endpoint with GET (most reliable)
      const seed = Math.floor(Math.random() * 99999);
      const encoded = encodeURIComponent(prompt);
      imgUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&seed=${seed}&nologo=true&enhance=true`;
    }

    b.innerHTML = `
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">Generated image for: <em>"${esc(prompt)}"</em></p>
      <img src="${imgUrl}" class="gen-img" alt="${esc(prompt)}"
        onclick="window.open('${imgUrl}','_blank')"
        title="Click to open full size"
        onerror="this.outerHTML='<p style=color:#e05555>⚠️ Image failed to load. Try again or rephrase your prompt.</p>'"
        onload="this.style.opacity='1'"
        style="opacity:0;transition:opacity .4s"/>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px">🖼 Click to open full size · Right-click → Save image</div>`;
    pushHist('assistant', `[Generated image: "${prompt}"]`);
  } catch(err) {
    b.innerHTML = `<span style="color:#e05555">⚠️ ${esc(err.message)}</span>`;
  }

  showActions(aiBlock);
  if (currentSession()) currentSession().msgsHTML = document.getElementById('msgs').innerHTML;
  saveState(); scroll();
  busy = false;
  document.getElementById('sendBtn').disabled = false;
}

/* ═══════════════════════════════════════════════════════════
   VIDEO GENERATION — Pollinations.ai (fixed)
═══════════════════════════════════════════════════════════ */
async function generateVideo(prompt) {
  if (busy) return;
  busy = true;
  document.getElementById('sendBtn').disabled = true;
  document.querySelector('.welcome')?.remove();
  if (!activeSid) createSession('🎬 ' + prompt, prompt);

  appendUserWithFile(`🎬 Generate video: ${prompt}`, null);
  const aiBlock = appendAI();
  await animThink(aiBlock, ['Reading your scene…', 'Planning motion…', 'Generating frames…', 'Encoding video…']);
  doneThink(aiBlock);
  const b = aiBlock.querySelector('.ai-bubble');
  b.classList.remove('stream-cur');
  b.innerHTML = `<div class="media-loading"><div class="spin"></div> Generating video — please wait 20–60 seconds…</div>`;
  scroll();

  try {
    const seed = Math.floor(Math.random() * 99999);
    const encoded = encodeURIComponent(prompt);
    // Pollinations video API — correct endpoint
    const videoUrl = `https://video.pollinations.ai/prompt/${encoded}?seed=${seed}&nologo=true`;

    // Pre-fetch to trigger generation, then display
    b.innerHTML = `
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">Generated video for: <em>"${esc(prompt)}"</em></p>
      <video class="gen-vid" controls autoplay muted playsinline loop
        onerror="this.outerHTML='<p style=color:#e05555>⚠️ Video failed — service may be busy. <a href=\\'${videoUrl}\\' target=\\'_blank\\' style=\\'color:var(--accent)\\'>Open directly ↗</a></p>'">
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div style="display:flex;gap:12px;margin-top:8px;align-items:center;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--text-muted)">🎬 Video loads progressively · may take ~30–60s</span>
        <a href="${videoUrl}" target="_blank" style="font-size:11px;color:var(--accent);text-decoration:none;flex-shrink:0">↗ Open / Download</a>
      </div>`;

    pushHist('assistant', `[Generated video: "${prompt}"]`);
  } catch(err) {
    b.innerHTML = `<span style="color:#e05555">⚠️ ${esc(err.message)}</span>`;
  }

  showActions(aiBlock);
  if (currentSession()) currentSession().msgsHTML = document.getElementById('msgs').innerHTML;
  saveState(); scroll();
  busy = false;
  document.getElementById('sendBtn').disabled = false;
}

function triggerImgGen() {
  genMode = 'image';
  document.getElementById('genModalTitle').textContent = '🎨 Generate Image';
  document.getElementById('genModalSub').textContent = 'Describe the image you want to create.';
  document.getElementById('genPromptIn').placeholder = 'A futuristic city at night with neon lights…';
  document.getElementById('genModalBtn').textContent = 'Generate ✨';
  document.getElementById('genPromptIn').value = document.getElementById('inp').value;
  document.getElementById('genModal').classList.add('open');
  setTimeout(() => document.getElementById('genPromptIn').focus(), 200);
}

function triggerVidGen() {
  genMode = 'video';
  document.getElementById('genModalTitle').textContent = '🎬 Generate Video';
  document.getElementById('genModalSub').textContent = 'Describe the scene or motion you want to animate.';
  document.getElementById('genPromptIn').placeholder = 'Ocean waves crashing on a rocky cliff at sunset…';
  document.getElementById('genModalBtn').textContent = 'Generate 🎬';
  document.getElementById('genPromptIn').value = document.getElementById('inp').value;
  document.getElementById('genModal').classList.add('open');
  setTimeout(() => document.getElementById('genPromptIn').focus(), 200);
}

function closeGenModal() { document.getElementById('genModal').classList.remove('open'); }

async function submitGen() {
  const prompt = document.getElementById('genPromptIn').value.trim();
  if (!prompt) { toast('Please enter a prompt first'); return; }
  closeGenModal();
  if (genMode === 'image') await generateImage(prompt);
  else await generateVideo(prompt);
}

/* ═══════════════════════════════════════════════════════════
   FILE ATTACH — images, video, audio, PDF, code, zip, etc.
═══════════════════════════════════════════════════════════ */
function handleFile(input) {
  const file = input.files[0];
  if (!file) return;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPDF   = file.type === 'application/pdf';
  const isText  = file.type.startsWith('text/') || /\.(js|ts|py|html|css|json|md|jsx|tsx|txt|csv|xml|yml|yaml|sh|php|rb|java|c|cpp|cs|go|rs|swift)$/i.test(file.name);

  if (isImage) {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      attachedFile = { base64: dataUrl.split(',')[1], mimeType: file.type, name: file.name, dataUrl, kind: 'image' };
      showAttachPill(
        `<img src="${dataUrl}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0"/>`,
        file.name
      );
    };
    reader.readAsDataURL(file);

  } else if (isVideo) {
    attachedFile = { name: file.name, mimeType: file.type, kind: 'video', file };
    showAttachPill(
      `<span style="font-size:20px;flex-shrink:0">🎬</span>`,
      file.name
    );
    // Append video info to textarea for AI context
    const ta = document.getElementById('inp');
    ta.value = `[Attached video: ${file.name} (${formatBytes(file.size)})] ` + ta.value;
    resize(ta);

  } else if (isAudio) {
    attachedFile = { name: file.name, mimeType: file.type, kind: 'audio', file };
    showAttachPill(
      `<span style="font-size:20px;flex-shrink:0">🎵</span>`,
      file.name
    );
    const ta = document.getElementById('inp');
    ta.value = `[Attached audio: ${file.name} (${formatBytes(file.size)})] ` + ta.value;
    resize(ta);

  } else if (isPDF) {
    attachedFile = { name: file.name, mimeType: file.type, kind: 'pdf', file };
    showAttachPill(
      `<span style="font-size:20px;flex-shrink:0">📄</span>`,
      file.name
    );
    const ta = document.getElementById('inp');
    ta.value = `[Attached PDF: ${file.name} (${formatBytes(file.size)})] ` + ta.value;
    resize(ta);

  } else if (isText) {
    const reader = new FileReader();
    reader.onload = e => {
      const ta = document.getElementById('inp');
      const ext = file.name.split('.').pop().toLowerCase();
      ta.value = `Here is my ${ext} file (${file.name}):\n\`\`\`${ext}\n${e.target.result.slice(0, 6000)}\n\`\`\`\n` + ta.value;
      resize(ta); ta.focus();
      toast(`📎 ${file.name} added to message`);
    };
    reader.readAsText(file);

  } else {
    // Any other file (zip, exe, docx, etc.) — show as attachment note
    attachedFile = { name: file.name, mimeType: file.type, kind: 'file', file };
    showAttachPill(
      `<span style="font-size:20px;flex-shrink:0">📎</span>`,
      file.name
    );
    const ta = document.getElementById('inp');
    ta.value = `[Attached file: ${file.name} (${file.type || 'unknown'}, ${formatBytes(file.size)})] ` + ta.value;
    resize(ta);
  }

  input.value = '';
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function showAttachPill(iconHTML, name) {
  let pill = document.getElementById('imgPill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'imgPill';
    pill.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 14px 0;';
    document.querySelector('.input-row').after(pill);
  }
  pill.innerHTML = `
    ${iconHTML}
    <span style="font-size:12px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</span>
    <button onclick="clearAttach()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:15px;padding:2px 6px;border-radius:4px" title="Remove">✕</button>`;
}

function clearAttach() {
  attachedFile = null;
  document.getElementById('imgPill')?.remove();
}

// Keep old name working too
function clearImg() { clearAttach(); }

/* ═══════════════════════════════════════════════════════════
   DOM HELPERS
═══════════════════════════════════════════════════════════ */
function appendUserWithFile(text, file) {
  const m = document.getElementById('msgs');
  const d = document.createElement('div');
  d.className = 'msg msg-user';

  let mediaHTML = '';
  if (file) {
    if (file.kind === 'image') {
      mediaHTML = `<img src="${file.dataUrl}" class="img-preview" alt="${esc(file.name)}"/>`;
    } else if (file.kind === 'video') {
      mediaHTML = `<div class="file-chip">🎬 ${esc(file.name)}</div>`;
    } else if (file.kind === 'audio') {
      mediaHTML = `<div class="file-chip">🎵 ${esc(file.name)}</div>`;
    } else if (file.kind === 'pdf') {
      mediaHTML = `<div class="file-chip">📄 ${esc(file.name)}</div>`;
    } else {
      mediaHTML = `<div class="file-chip">📎 ${esc(file.name)}</div>`;
    }
  }

  d.innerHTML = `
    <div class="bubble">${mediaHTML}${text ? esc(text).replace(/\n/g, '<br>') : ''}</div>
    <div class="msg-actions">
      <button class="act-btn" onclick="copyTxt(this,${JSON.stringify(text || '')})">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy
      </button>
    </div>`;
  m.appendChild(d); scroll();
}

// Keep old name working
function appendUserWithImg(text, img) { appendUserWithFile(text, img ? { ...img, kind: 'image' } : null); }

function appendAI() {
  const m = document.getElementById('msgs');
  const d = document.createElement('div');
  d.className = 'msg msg-ai';
  const uid = 'td' + Date.now();
  d.innerHTML = `
    <div class="ai-hdr">
      ${getAiAvatarHTML()}
      <span class="ai-name">K-XpertAI</span>
    </div>
    <div class="think-block">
      <div class="think-head" onclick="toggleThink(this)">
        <div class="think-dots" id="${uid}"><span></span><span></span><span></span></div>
        <span class="think-lbl">Thinking…</span>
        <span class="think-chev open">▼</span>
      </div>
      <div class="think-body open"><div class="think-steps"></div></div>
    </div>
    <div class="ai-bubble stream-cur"></div>
    <div class="msg-actions" style="display:none">
      <button class="act-btn" onclick="copyAI(this)">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copy response
      </button>
      <button class="act-btn speak-btn" onclick="speakMsg(this)">${speakerIcon()} Read aloud</button>
      <button class="act-btn" onclick="openVoicePanel()" title="Voice settings">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        Voice
      </button>
    </div>`;
  m.appendChild(d); scroll(); return d;
}

async function animThink(block, steps) {
  const lbl = block.querySelector('.think-lbl');
  const stps = block.querySelector('.think-steps');
  for (let i = 0; i < steps.length; i++) {
    lbl.textContent = steps[i];
    const s = document.createElement('div');
    s.className = 'think-step';
    s.textContent = steps[i];
    stps.appendChild(s); scroll();
    await sleep(350 + Math.random() * 250);
  }
}

function doneThink(block) {
  const dots = block.querySelector('.think-dots');
  const lbl = block.querySelector('.think-lbl');
  if (dots) dots.classList.add('done');
  if (lbl) lbl.textContent = 'Done thinking';
  setTimeout(() => {
    block.querySelector('.think-body')?.classList.remove('open');
    block.querySelector('.think-chev')?.classList.remove('open');
  }, 900);
}

async function showReply(block, text) {
  const b = block.querySelector('.ai-bubble');
  b.classList.remove('stream-cur');
  const segments = [];
  const codeRx = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m2;
  while ((m2 = codeRx.exec(text)) !== null) {
    if (m2.index > last) segments.push({ type: 'text', content: text.slice(last, m2.index) });
    segments.push({ type: 'code', lang: m2[1] || 'code', content: m2[2].trim() });
    last = m2.index + m2[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) });
  b.innerHTML = '';
  for (const seg of segments) {
    if (seg.type === 'code') {
      const pre = document.createElement('pre');
      const hdr = document.createElement('div');
      hdr.className = 'code-hdr';
      hdr.innerHTML = `<span class="code-lang">${seg.lang}</span><button class="copy-code" onclick="cpCode(this)">📋 Copy</button>`;
      const code = document.createElement('code');
      pre.appendChild(hdr); pre.appendChild(code); b.appendChild(pre);
      const lines = seg.content.split('\n');
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        for (let ci = 0; ci < line.length; ci++) {
          code.textContent += line[ci];
          if (ci % 4 === 0) { scroll(); await sleep(8); }
        }
        if (li < lines.length - 1) code.textContent += '\n';
        scroll(); await sleep(18);
      }
    } else {
      const chars = seg.content;
      let buf = '';
      const span = document.createElement('span');
      b.appendChild(span);
      for (let i = 0; i < chars.length; i++) {
        buf += chars[i];
        span.innerHTML = md(buf);
        const ch = chars[i];
        let delay = 12;
        if (ch === '.' || ch === '!' || ch === '?') delay = 55;
        else if (ch === ',' || ch === ';' || ch === ':') delay = 28;
        else if (ch === '\n') delay = 35;
        if (i % 3 === 0) { scroll(); await sleep(delay); }
      }
    }
  }
  scroll();
}

function setHTML(block, html) {
  const b = block.querySelector('.ai-bubble');
  b.classList.remove('stream-cur');
  b.innerHTML = html;
}

function showActions(block) {
  const a = block.querySelector('.msg-actions');
  if (a) a.style.display = 'flex';
}

function toggleThink(head) {
  head.nextElementSibling.classList.toggle('open');
  head.querySelector('.think-chev').classList.toggle('open');
}

/* ═══════════════════════════════════════════════════════════
   MARKDOWN
═══════════════════════════════════════════════════════════ */
function md(t) {
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang || 'code';
    return `<pre><div class="code-hdr"><span class="code-lang">${l}</span><button class="copy-code" onclick="cpCode(this)">📋 Copy</button></div><code>${esc(code.trim())}</code></pre>`;
  });
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
  t = t.replace(/^### (.+)$/gm, '<strong style="font-size:14px">$1</strong>');
  t = t.replace(/^## (.+)$/gm, '<strong style="font-size:15px">$1</strong>');
  t = t.replace(/^# (.+)$/gm, '<strong style="font-size:16px">$1</strong>');
  t = t.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  t = t.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  t = t.split(/\n\n+/).map(p => { p = p.trim(); if (!p || p.startsWith('<')) return p; return `<p>${p.replace(/\n/g, '<br>')}</p>`; }).join('');
  return t;
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR TOGGLE
═══════════════════════════════════════════════════════════ */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sbOverlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('open');
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════ */
function openSettings() {
  pendProv = cfg.provider;
  document.getElementById('apiIn').value = cfg.apiKey;
  document.querySelectorAll('.prov-opt').forEach(o => o.classList.remove('sel'));
  (document.getElementById('opt-' + cfg.provider) || document.getElementById('opt-default')).classList.add('sel');
  document.getElementById('modal').classList.add('open');
}

function closeModal() { document.getElementById('modal').classList.remove('open'); }

function pickProv(p) {
  pendProv = p;
  document.querySelectorAll('.prov-opt').forEach(o => o.classList.remove('sel'));
  (document.getElementById('opt-' + p) || document.getElementById('opt-default')).classList.add('sel');
}

function saveSettings() {
  cfg.provider = pendProv;
  cfg.apiKey = document.getElementById('apiIn').value.trim();
  saveState();
  updateUI();
  closeModal();
  toast('Settings saved ✓');
}

function updateUI() {
  const lbls = { default: 'K-XpertAI (Free)', gemini: 'Gemini 2.0 Flash', openai: 'GPT-4o Mini' };
  const pills = { default: 'Free', gemini: 'Gemini', openai: 'OpenAI' };
  document.getElementById('modelLbl').textContent = lbls[cfg.provider] || 'K-XpertAI';
  document.getElementById('provLbl').textContent = pills[cfg.provider] || 'Free';
}

/* ═══════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════ */
function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
function resize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 180) + 'px'; }
function scroll() { requestAnimationFrame(() => { const a = document.getElementById('chatArea'); a.scrollTop = a.scrollHeight; }); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function copyTxt(btn, text) {
  navigator.clipboard.writeText(text).then(() => { const o = btn.innerHTML; btn.textContent = '✓ Copied'; setTimeout(() => btn.innerHTML = o, 1500); });
}

function cpCode(btn) {
  const code = btn.closest('pre').querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => { const o = btn.innerHTML; btn.textContent = '✓ Copied'; setTimeout(() => btn.innerHTML = o, 1500); });
}

function copyAI(btn) {
  const b = btn.closest('.msg').querySelector('.ai-bubble');
  navigator.clipboard.writeText(b.innerText).then(() => { const o = btn.innerHTML; btn.textContent = '✓ Copied'; setTimeout(() => btn.innerHTML = o, 1500); });
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
renderWelcome();
renderSidebar();
updateUI();
initLogo();

if (sessions.length > 0) {
  const last = sessions[0];
  activeSid = last.id;
  document.getElementById('chatTitle').textContent = last.label;
  document.getElementById('msgs').innerHTML = last.msgsHTML || '';
  if (!last.msgsHTML) renderWelcome();
  renderSidebar();
}

document.getElementById('modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('genModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeGenModal(); });
document.getElementById('genPromptIn').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitGen(); } });
