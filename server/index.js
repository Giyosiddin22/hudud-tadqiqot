require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Only trust X-Forwarded-* headers when explicitly told we're behind a real
// reverse proxy (nginx/Caddy/etc in production) — never trust them by default.
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Security headers. CSP is disabled: every page here uses inline <style>/<script>
// blocks by design (no build step), which a default CSP would break wholesale.
// The rest of helmet's headers (X-Content-Type-Options, X-Frame-Options,
// Referrer-Policy, etc.) still apply and cost nothing to keep.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD, // requires HTTPS once actually deployed; localhost dev stays http
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan. Iltimos, tizimga kiring.' });
}

// The Roles section stores a `perms` list per role and shows it in the admin
// UI, but until now nothing ever checked it - every logged-in admin, regardless
// of role, could hit every endpoint. This ties enforcement to that same data.
function requirePerm(perm) {
  return (req, res, next) => {
    if (!req.session || !req.session.isAdmin) {
      return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan. Iltimos, tizimga kiring.' });
    }
    const role = db.listRoles().find(r => r.name === req.session.userRole);
    if (!role || !(role.perms || []).includes(perm)) {
      return res.status(403).json({ error: 'Bu amal uchun ruxsatingiz yo\'q.' });
    }
    next();
  };
}

// CSRF mitigation: a cross-site <form> POST can't attach custom headers, so
// requiring this one on every state-changing request blocks classic
// cross-site form submission attacks. All of this project's own fetch()
// calls go through the apiFetch() helper (admin.html/survey.html), which
// always sets it.
function requireCsrfHeader(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
      return res.status(403).json({ error: 'So\'rov rad etildi (CSRF himoyasi). Sahifani yangilab qayta urinib ko\'ring.' });
    }
  }
  next();
}
app.use('/api', requireCsrfHeader);

// Rate limiting on the two endpoints anyone on the internet can hit without
// logging in: brute-forcing the admin password, and spamming fake survey
// responses.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p urinish. 15 daqiqadan so\'ng qayta urining.' }
});
const responseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  limit: Number(process.env.RESPONSE_RATE_LIMIT) || 5, // bitta IP'dan soatiga 5 ta javob — bir kishi uchun yetarli, botlarga to'siq
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p so\'rovnoma yuborildi. Birozdan so\'ng qayta urining.' }
});
// Voice assistant's AI fallback gets called at most once per question (only
// when the free local fuzzy-match fails), but it's public/unauthenticated
// (survey respondents aren't logged in), so still cap it to stop abuse.
const voiceMatchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p ovozli so\'rov yuborildi. Birozdan so\'ng qayta urining.' }
});
// /api/analyze is the one endpoint that costs real money per call — even
// though it's admin-only, a rapid-click (or scripted) burst would still run
// up an OpenAI bill with no limit at all before this.
const analyzeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p AI so\'rovi yuborildi. Birozdan so\'ng qayta urining.' }
});
// Voice assistant's spoken output (browser TTS has no usable Uzbek voice on
// most devices, so we proxy to OpenAI's TTS). Public/unauthenticated and
// costs real money per call, so cap it.
const speakLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p ovozli so\'rov yuborildi. Birozdan so\'ng qayta urining.' }
});
const MAX_SPEAK_TEXT = 600;

async function callOpenAI(messages, { maxTokens = 500, temperature = 0.3 } = {}) {
  if (!OPENAI_API_KEY) {
    const err = new Error('OPENAI_API_KEY sozlanmagan.');
    err.code = 'NO_KEY';
    throw err;
  }
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature, max_tokens: maxTokens })
  });
  if (!r.ok) {
    const errBody = await r.text();
    console.error('OpenAI API error:', r.status, errBody);
    const err = new Error(`OpenAI API xatosi (${r.status})`);
    err.code = 'API_ERROR';
    throw err;
  }
  const json = await r.json();
  return json.choices?.[0]?.message?.content?.trim() || '';
}

// Gemini equivalent of callOpenAI — same {role, content} message shape in,
// plain text out. System messages become Gemini's separate systemInstruction.
async function callGemini(messages, { maxTokens = 500, temperature = 0.3 } = {}) {
  if (!GEMINI_API_KEY) {
    const err = new Error('GEMINI_API_KEY sozlanmagan.');
    err.code = 'NO_KEY';
    throw err;
  }
  const systemText = messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const body = {
    contents,
    generationConfig: { temperature, maxOutputTokens: maxTokens }
  };
  if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!r.ok) {
    const errBody = await r.text();
    console.error('Gemini API error:', r.status, errBody);
    const err = new Error(`Gemini API xatosi (${r.status})`);
    err.code = 'API_ERROR';
    throw err;
  }
  const json = await r.json();
  const text = json?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  return text.trim();
}

// Shared AI call — both /api/analyze and /api/voice-match use this. Tries
// Gemini first (the OpenAI account here has hit its billing quota), falls
// back to OpenAI if Gemini isn't configured or fails.
async function callAI(messages, opts) {
  if (GEMINI_API_KEY) {
    try {
      return await callGemini(messages, opts);
    } catch (e) {
      console.error('Gemini call failed, falling back to OpenAI:', e.message);
    }
  }
  return callOpenAI(messages, opts);
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const user = db.checkUserPassword(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri.' });
  }
  req.session.isAdmin = true;
  req.session.userId = user.id;
  req.session.userName = user.name;
  req.session.userEmail = user.email;
  req.session.userRole = user.role;
  db.logAudit('Tizimga kirdi', user.name);
  const role = db.listRoles().find(r => r.name === user.role);
  res.json({ ok: true, name: user.name, email: user.email, role: user.role, perms: (role && role.perms) || [] });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    const role = db.listRoles().find(r => r.name === req.session.userRole);
    return res.json({
      loggedIn: true,
      name: req.session.userName,
      email: req.session.userEmail,
      role: req.session.userRole,
      perms: (role && role.perms) || []
    });
  }
  res.json({ loggedIn: false });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak.' });
  }
  if (!db.checkUserPassword(req.session.userEmail, currentPassword)) {
    return res.status(401).json({ error: 'Joriy parol noto\'g\'ri.' });
  }
  db.setUserPassword(req.session.userId, newPassword);
  db.logAudit('O\'z parolini o\'zgartirdi', req.session.userName);
  res.json({ ok: true });
});

app.post('/api/auth/reset-password', requireAuth, (req, res) => {
  db.setUserPassword(req.session.userId, db.DEFAULT_PASSWORD);
  db.logAudit('O\'z parolini standart holatga qaytardi', req.session.userName);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// SURVEYS
// ══════════════════════════════════════════════════════════
app.get('/api/surveys', (req, res) => {
  res.json(db.listSurveys());
});

// Public, aggregate-only (no individual answers) — powers the homepage's
// "Jami ishtirokchi" / "bugun" stat cards with real numbers instead of
// hardcoded ones.
app.get('/api/stats', (req, res) => {
  res.json(db.publicStats());
});

app.get('/api/surveys/:id', (req, res) => {
  const survey = db.getSurvey(req.params.id);
  if (!survey) return res.status(404).json({ error: 'So\'rovnoma topilmadi.' });
  res.json(survey);
});

// Reasonable length caps — nothing here was bounded before, so a very long
// title/description could break fixed-width cards and blow out CSV exports.
const MAX_TITLE = 200, MAX_SUBTITLE = 200, MAX_DESC = 2000, MAX_QTEXT = 500, MAX_OPTION = 200;

function isValidTitle(title) {
  return typeof title === 'string' && title.trim().length > 0 && title.trim().length <= MAX_TITLE;
}

// Every question must have real text and at least 2 options, otherwise
// survey.html's renderForm() (which does q.options.map(...) with no guard)
// would crash for anyone opening the survey.
function questionsAreValid(questions) {
  return Array.isArray(questions) && questions.length > 0 && questions.every(q =>
    q && typeof q.text === 'string' && q.text.trim() && q.text.trim().length <= MAX_QTEXT &&
    Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.every(o => typeof o === 'string' && o.trim().length > 0 && o.trim().length <= MAX_OPTION)
  );
}

// Trim every free-text field before it's ever written to disk — without this,
// leading/trailing whitespace someone typed (or sent via a direct API call)
// survives verbatim and renders as odd padding/wrapping everywhere the field
// is shown.
function normalizeSurveyInput(body) {
  const out = { ...body };
  if (typeof out.title === 'string') out.title = out.title.trim();
  if (typeof out.subtitle === 'string') out.subtitle = out.subtitle.trim().slice(0, MAX_SUBTITLE);
  if (typeof out.description === 'string') out.description = out.description.trim().slice(0, MAX_DESC);
  if (Array.isArray(out.questions)) {
    out.questions = out.questions.map(q => ({
      ...q,
      text: typeof q.text === 'string' ? q.text.trim() : q.text,
      options: Array.isArray(q.options) ? q.options.map(o => typeof o === 'string' ? o.trim() : o) : q.options
    }));
  }
  return out;
}

// `minutes` is optional, but if present must be a sane positive number —
// otherwise "-5 daq." or "abc daq." can end up stored and displayed verbatim.
function isValidMinutes(minutes) {
  if (minutes === undefined || minutes === null || minutes === '') return true;
  const n = Number(minutes);
  return Number.isFinite(n) && n > 0 && n <= 120;
}

app.post('/api/surveys', requirePerm("So'rovnoma yaratish"), (req, res) => {
  const body = normalizeSurveyInput(req.body || {});
  if (!isValidTitle(body.title) || !questionsAreValid(body.questions)) {
    return res.status(400).json({ error: 'Sarlavha va har bir savolda matn + kamida 2 ta variant kerak.' });
  }
  if (!isValidMinutes(body.minutes)) {
    return res.status(400).json({ error: 'Vaqt (daqiqa) 1 dan 120 gachagi musbat son bo\'lishi kerak.' });
  }
  const survey = db.createSurvey(body);
  db.logAudit('Yangi so\'rovnoma yaratildi: ' + survey.title, req.session.userName);
  res.status(201).json(survey);
});

app.put('/api/surveys/:id', requirePerm("So'rovnoma yaratish"), (req, res) => {
  const body = normalizeSurveyInput(req.body || {});
  if (body.title !== undefined && !isValidTitle(body.title)) {
    return res.status(400).json({ error: 'Sarlavha bo\'sh bo\'lmasligi kerak.' });
  }
  if (body.questions !== undefined && !questionsAreValid(body.questions)) {
    return res.status(400).json({ error: 'Har bir savolda matn va kamida 2 ta variant bo\'lishi kerak.' });
  }
  if (body.minutes !== undefined && !isValidMinutes(body.minutes)) {
    return res.status(400).json({ error: 'Vaqt (daqiqa) 1 dan 120 gachagi musbat son bo\'lishi kerak.' });
  }
  const updated = db.updateSurvey(req.params.id, body);
  if (!updated) return res.status(404).json({ error: 'So\'rovnoma topilmadi yoki tayyor so\'rovnomani tahrirlab bo\'lmaydi.' });
  db.logAudit('So\'rovnoma tahrirlandi: ' + updated.title, req.session.userName);
  res.json(updated);
});

app.delete('/api/surveys/:id', requirePerm("So'rovnoma yaratish"), (req, res) => {
  const survey = db.getSurvey(req.params.id);
  const ok = db.deleteSurvey(req.params.id);
  if (!ok) return res.status(404).json({ error: 'So\'rovnoma topilmadi yoki tayyor so\'rovnomani o\'chirib bo\'lmaydi.' });
  db.logAudit('So\'rovnoma o\'chirildi: ' + (survey ? survey.title : req.params.id), req.session.userName);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// RESPONSES
// ══════════════════════════════════════════════════════════
// Checks that every answer actually refers to a real question on this survey
// and picks one of its real options — without this, a direct API call (not
// just the form) could write made-up question IDs / options straight into
// the data that CSV export, results, and the AI summary all read from.
function answersAreValid(survey, answers) {
  if (!Object.keys(answers).length) return false;
  const byId = new Map((survey.questions || []).map(q => [q.id, q]));
  // Written-answer questions are required unless the survey marks them optional.
  for (const q of survey.questions || []) {
    if (q.type !== 'text' || q.required === false) continue;
    const v = answers[q.id];
    if (typeof v !== 'string' || !v.trim()) return false;
  }
  for (const [qid, val] of Object.entries(answers)) {
    const q = byId.get(qid);
    if (!q) return false;
    if (q.type === 'text') {
      if (typeof val !== 'string' || !val.trim() || val.length > 1000) return false;
      continue;
    }
    const vals = Array.isArray(val) ? val : [val];
    if (q.type !== 'checkbox' && vals.length > 1) return false;
    for (const v of vals) {
      if (typeof v !== 'string' || !v.trim()) return false;
      // "Boshqa (o'zingiz yozing) — foydalanuvchi matni" shakli ham qabul qilinadi.
      const base = v.split(' — ')[0];
      if (!q.options.includes(v) && !q.options.includes(base)) return false;
    }
  }
  return true;
}

// One-way fingerprint of IP + User-Agent, salted with SESSION_SECRET — used
// only to block a second submission from the same browser/device on the same
// survey. Never reversible to an IP, never shown in any UI, not tied to a
// real identity — a practical middle ground between full anonymity (which
// allows unlimited duplicate submissions) and collecting real PII.
function fingerprint(req) {
  return crypto.createHash('sha256')
    .update(req.ip + '|' + (req.get('user-agent') || '') + '|' + SESSION_SECRET)
    .digest('hex').slice(0, 16);
}

app.post('/api/surveys/:id/responses', responseLimiter, (req, res) => {
  const survey = db.getSurvey(req.params.id);
  if (!survey) return res.status(404).json({ error: 'So\'rovnoma topilmadi.' });
  const { answers } = req.body || {};
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Javoblar (answers) yuborilmadi.' });
  }
  if (!answersAreValid(survey, answers)) {
    return res.status(400).json({ error: 'Javoblar so\'rovnoma savollariga mos kelmadi.' });
  }
  const fp = fingerprint(req);
  if (db.hasFingerprintSubmitted(req.params.id, fp)) {
    return res.status(409).json({ error: 'Siz bu so\'rovnomada allaqachon qatnashgansiz.' });
  }
  const r = db.addResponse(req.params.id, answers, fp);
  res.status(201).json({ ok: true, id: r.id });
});

app.get('/api/surveys/:id/responses', requirePerm("Natijalarni ko'rish"), (req, res) => {
  res.json(db.listResponses(req.params.id));
});

// Anonymous "form opened" ping — no PII, just increments a per-survey counter
// so the admin panel can show a real started-vs-submitted completion rate
// instead of reading the admin's own browser's localStorage.
app.post('/api/surveys/:id/started', responseLimiter, (req, res) => {
  const survey = db.getSurvey(req.params.id);
  if (!survey) return res.status(404).json({ error: 'So\'rovnoma topilmadi.' });
  db.addStart(req.params.id);
  res.status(201).json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// AUDIT
// ══════════════════════════════════════════════════════════
app.get('/api/audit', requireAuth, (req, res) => {
  res.json(db.listAudit());
});

// Client-only actions (file exports) that have no other server round-trip
// to naturally hang an audit entry off of. Whitelisted to fixed messages so
// this can't be abused to write arbitrary log text.
const AUDIT_NOTES = {
  csv_export: 'CSV hisobot yuklab olindi (hududlar statistikasi)',
  json_export: 'Ma\'lumotlar JSON formatida eksport qilindi'
};
app.post('/api/audit/note', requireAuth, (req, res) => {
  const note = AUDIT_NOTES[req.body && req.body.type];
  if (!note) return res.status(400).json({ error: 'Noma\'lum audit turi.' });
  db.logAudit(note, req.session.userName);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════
app.get('/api/users', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => res.json(db.listUsers()));
app.post('/api/users', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => {
  const { name, email, role, password } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Ism va email kerak.' });
  if (db.findUserByEmail(email)) return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan.' });
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' });
  }
  const user = db.addUser({ name, email, role, password });
  db.logAudit(`Foydalanuvchi qo'shildi: ${name} (${role})`, req.session.userName);
  res.status(201).json(user);
});
app.delete('/api/users/:id', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => {
  if (String(req.params.id) === String(req.session.userId)) {
    return res.status(400).json({ error: 'O\'zingizni o\'chira olmaysiz.' });
  }
  const removed = db.deleteUser(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
  db.logAudit(`Foydalanuvchi o'chirildi: ${removed.name}`, req.session.userName);
  res.json({ ok: true });
});
app.post('/api/users/:id/password', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => {
  const { password } = req.body || {};
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' });
  }
  const user = db.setUserPassword(req.params.id, password);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
  db.logAudit(`Foydalanuvchi paroli o'rnatildi: ${user.name}`, req.session.userName);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════════════════════
app.get('/api/roles', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => res.json(db.listRoles()));
app.post('/api/roles', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => {
  const { name, perms } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Rol nomini kiriting.' });
  const role = db.addRole({ name, perms });
  db.logAudit(`Rol qo'shildi: ${name}`, req.session.userName);
  res.status(201).json(role);
});
app.delete('/api/roles/:id', requirePerm('Foydalanuvchilarni boshqarish'), (req, res) => {
  const role = db.listRoles().find(r => String(r.id) === String(req.params.id));
  if (role) {
    const assigned = db.usersWithRole(role.name);
    if (assigned.length) {
      return res.status(409).json({ error: `Bu rol ${assigned.length} ta foydalanuvchiga biriktirilgan — avval ularni boshqa rolga o'tkazing yoki o'chiring.` });
    }
  }
  const removed = db.deleteRole(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Rol topilmadi.' });
  db.logAudit(`Rol o'chirildi: ${removed.name}`, req.session.userName);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════
app.get('/api/announcements', (req, res) => res.json(db.listAnnouncements()));
app.post('/api/announcements', requireAuth, (req, res) => {
  const { date, text, type } = req.body || {};
  if (!text) return res.status(400).json({ error: "E'lon matnini kiriting." });
  const ann = db.addAnnouncement({ date: date || new Date().toISOString().slice(0, 10), text, type });
  db.logAudit(`E'lon qo'shildi: "${text.slice(0, 40)}"`, req.session.userName);
  res.status(201).json(ann);
});
app.delete('/api/announcements/:id', requireAuth, (req, res) => {
  const removed = db.deleteAnnouncement(req.params.id);
  if (!removed) return res.status(404).json({ error: "E'lon topilmadi." });
  db.logAudit("E'lon o'chirildi", req.session.userName);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════
// LANGUAGES (public GET so the site's language switcher can read it)
// ══════════════════════════════════════════════════════════
app.get('/api/langs', (req, res) => res.json(db.listLangs()));
app.put('/api/langs/:code', requirePerm("Sozlamalarni o'zgartirish"), (req, res) => {
  const { enabled } = req.body || {};
  const lang = db.setLangEnabled(req.params.code, enabled);
  if (!lang) return res.status(404).json({ error: 'Til topilmadi.' });
  db.logAudit(`Til ${enabled ? 'yoqildi' : "o'chirildi"}: ${req.params.code}`, req.session.userName);
  res.json(lang);
});

// ══════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════
app.get('/api/settings', requireAuth, (req, res) => res.json(db.getSettings()));
app.put('/api/settings', requirePerm("Sozlamalarni o'zgartirish"), (req, res) => {
  const settings = db.setSettings(req.body || {});
  db.logAudit('Sozlamalar saqlandi', req.session.userName);
  res.json(settings);
});

// ══════════════════════════════════════════════════════════
// AI ANALYSIS (ChatGPT)
// ══════════════════════════════════════════════════════════
app.post('/api/analyze', requirePerm("Natijalarni ko'rish"), analyzeLimiter, async (req, res) => {
  if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY yoki OPENAI_API_KEY sozlanmagan. server/.env faylida kiriting va serverni qayta ishga tushiring.'
    });
  }

  const { title, context, data } = req.body || {};
  if (!data) {
    return res.status(400).json({ error: 'Tahlil uchun ma\'lumot (data) yuborilmadi.' });
  }

  const prompt = [
    'Siz ijtimoiy so\'rovnoma ma\'lumotlarini tahlil qiluvchi analitik yordamchisiz.',
    `So'rovnoma: ${title || 'nomsiz'}`,
    context ? `Kontekst: ${context}` : '',
    'Quyidagi JSON ma\'lumotlar asosida qisqa, aniq va amaliy xulosalar yozing (o\'zbek tilida, 4-6 band, har biri 1-2 gap):',
    '- Asosiy tendensiyalar',
    '- E\'tiborga loyiq g\'ayrioddiy holatlar',
    '- Tavsiya etiladigan keyingi qadamlar',
    '',
    'Ma\'lumotlar:',
    JSON.stringify(data, null, 2)
  ].filter(Boolean).join('\n');

  try {
    const summary = await callAI([
      { role: 'system', content: 'Siz foydali, aniq va o\'zbek tilida qisqa javob beruvchi ma\'lumotlar tahlilchisisiz.' },
      { role: 'user', content: prompt }
    ], { maxTokens: 1500, temperature: 0.4 }) || 'Tahlil natijasi bo\'sh qaytdi.';
    db.logAudit('AI xulosa olindi: ' + (title || ''), req.session.userName);
    res.json({ summary });
  } catch (e) {
    console.error('Analyze request failed:', e);
    res.status(e.code === 'API_ERROR' ? 502 : 500).json({ error: 'Serverda kutilmagan xato yuz berdi. Konsolni tekshiring.' });
  }
});

// ══════════════════════════════════════════════════════════
// VOICE ASSISTANT — AI fallback for matching a spoken answer to one of a
// question's options, used by survey.html only when the free local
// fuzzy/number-word matcher can't confidently pick one. Public (survey
// respondents aren't logged in) and rate-limited.
// ══════════════════════════════════════════════════════════
app.post('/api/voice-match', voiceMatchLimiter, async (req, res) => {
  const { transcript, options } = req.body || {};
  if (!transcript || !Array.isArray(options) || !options.length) {
    return res.status(400).json({ error: 'transcript va options kerak.' });
  }
  if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY yoki OPENAI_API_KEY sozlanmagan.' });
  }
  const prompt = [
    'Foydalanuvchi ovozli so\'rovnoma savoliga shunday javob berdi (nutqdan matnga aylantirilgan, xato/to\'liqsiz bo\'lishi mumkin):',
    `"${transcript}"`,
    '',
    'Variantlar (raqamlangan):',
    options.map((o, i) => `${i + 1}. ${o}`).join('\n'),
    '',
    'Foydalanuvchi qaysi variantni nazarda tutgan? FAQAT variant raqamini yozing (masalan: 2).',
    'Agar hech qanday variantga ishonch bilan mos kelmasa, 0 deb yozing.'
  ].join('\n');

  try {
    const raw = await callAI([
      { role: 'system', content: 'Siz faqat bitta son bilan javob beradigan aniq yordamchisiz.' },
      { role: 'user', content: prompt }
    ], { maxTokens: 5, temperature: 0 });
    const idx = parseInt((raw.match(/\d+/) || ['0'])[0], 10);
    const match = idx >= 1 && idx <= options.length ? options[idx - 1] : null;
    res.json({ match });
  } catch (e) {
    console.error('Voice-match request failed:', e);
    res.status(e.code === 'API_ERROR' ? 502 : 500).json({ error: 'AI mos kelishini aniqlay olmadi.' });
  }
});

// ══════════════════════════════════════════════════════════
// Gemini's TTS returns raw headerless 16-bit PCM (mono, usually 24kHz) as
// base64 — browsers can't play that directly via <audio>/new Audio(), so we
// wrap it in a minimal 44-byte WAV header before sending it to the client.
function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

// /api/speak — turns voice-assistant text into spoken audio. Browser-native
// speechSynthesis has no usable Uzbek voice on most phones (silently produces
// no audio, or an unintelligible fallback voice), so the frontend calls this
// first and only falls back to speechSynthesis if it fails. Public (used by
// blind users browsing without logging in) and rate-limited since it costs
// money. Tries Gemini TTS first (free tier), falls back to OpenAI TTS if
// Gemini isn't configured or fails.
// ══════════════════════════════════════════════════════════
app.post('/api/speak', speakLimiter, async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text kerak.' });
  }
  if (text.length > MAX_SPEAK_TEXT) {
    return res.status(400).json({ error: `Matn juda uzun (maksimal ${MAX_SPEAK_TEXT} belgi).` });
  }
  const trimmed = text.trim();

  if (GEMINI_API_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: trimmed }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            }
          })
        }
      );
      if (r.ok) {
        const data = await r.json();
        const part = data?.candidates?.[0]?.content?.parts?.[0];
        const b64 = part?.inlineData?.data;
        if (b64) {
          const rateMatch = /rate=(\d+)/.exec(part.inlineData.mimeType || '');
          const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
          const wav = pcmToWav(Buffer.from(b64, 'base64'), sampleRate);
          res.set('Content-Type', 'audio/wav');
          res.set('Cache-Control', 'no-store');
          return res.send(wav);
        }
        console.error('Gemini TTS returned no audio data:', JSON.stringify(data).slice(0, 500));
      } else {
        console.error('Gemini TTS failed:', r.status, await r.text().catch(() => ''));
      }
    } catch (e) {
      console.error('Gemini TTS request failed:', e);
    }
    // fall through to OpenAI below
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Na GEMINI_API_KEY, na OPENAI_API_KEY sozlanmagan.' });
  }
  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'alloy', input: trimmed, response_format: 'mp3' })
    });
    if (!r.ok) {
      console.error('OpenAI TTS failed:', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ error: 'Ovoz generatsiya qilinmadi.' });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-store');
    res.send(buf);
  } catch (e) {
    console.error('Speak request failed:', e);
    res.status(500).json({ error: 'Ovoz generatsiya qilinmadi.' });
  }
});

// Serve the static site (index.html, admin.html, css/js assets, etc.) from the project root.
// Mounted AFTER the /api routes so API paths always take precedence.
// Only the public/ folder is ever served — server/, backups, .env, tunnel.log
// etc. live outside it and are unreachable no matter what gets added there
// later (allowlist, not a blocklist that has to be remembered on every new file).
const SITE_ROOT = path.join(__dirname, '..', 'public');
app.use(express.static(SITE_ROOT));

// Nothing above matched — a real 404, not an Express stack trace in English.
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Bunday manzil topilmadi.' });
  }
  res.status(404).sendFile(path.join(SITE_ROOT, '404.html'));
});

// Fallback error handler — never leak stack traces/internals to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: IS_PROD ? 'Server xatosi yuz berdi.' : String(err && err.message || err) });
});

app.listen(PORT, () => {
  console.log(`✔ Server ishga tushdi: http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) {
    console.warn('⚠ OPENAI_API_KEY topilmadi — AI xulosa ishlamaydi. server/.env faylini to\'ldiring.');
  }
});
