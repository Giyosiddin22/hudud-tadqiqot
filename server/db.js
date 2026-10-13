const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Seed fayllar kod bilan birga keladi; db.json va zaxiralar DATA_DIR da (Render'da doimiy disk).
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(__dirname, 'data', 'seed-surveys.json');
const DEFAULT_PASSWORD = 'admin2026';

const SX_PERMS = ["So'rovnoma yaratish", "Foydalanuvchilarni boshqarish", "Natijalarni ko'rish", "Sozlamalarni o'zgartirish"];

// Date.now() alone can collide if two requests land in the same millisecond
// (a plausible double-click on "Saqlash"/"+ Qo'shish" with no submit-button
// guard) — always append a short random suffix, same as addResponse() already did.
function makeId(prefix) {
  return prefix + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function freshDB() {
  const seedSurveys = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  return {
    surveys: seedSurveys.map(s => ({ ...s, isCustom: false })),
    responses: [],
    starts: [],
    audit: [],
    users: [
      { id: 'u_1', name: 'Aziz Qodirov', email: 'aziz.q@htm.uz', role: 'Super admin', passwordHash: bcrypt.hashSync(DEFAULT_PASSWORD, 10) },
      { id: 'u_2', name: 'Dilnoza Rustamova', email: 'dilnoza.r@htm.uz', role: 'Moderator' },
      { id: 'u_3', name: 'Bobur Yusupov', email: 'bobur.y@htm.uz', role: "Ko'ruvchi" }
    ],
    roles: [
      { id: 'ro_1', name: 'Super admin', perms: [...SX_PERMS] },
      { id: 'ro_2', name: 'Moderator', perms: ["So'rovnoma yaratish", "Natijalarni ko'rish"] },
      { id: 'ro_3', name: "Ko'ruvchi", perms: ["Natijalarni ko'rish"] }
    ],
    announcements: [
      { id: 'a_1', date: '2026-07-10', text: '"Aholi turmush darajasi" so\'rovnomasi natijalari yaqinda e\'lon qilinadi.' },
      { id: 'a_2', date: '2026-07-05', text: 'Yangi so\'rovnoma: "Ekologiya monitoringi" rejalashtirilmoqda.' },
      { id: 'a_3', date: '2026-06-28', text: 'Barcha 15 tumanda so\'rov o\'tkazish 100% qamrovga yetdi.' }
    ],
    langs: [
      { code: 'uz-lat', label: "O'zbekcha (lotin)", enabled: true },
      { code: 'uz-cyr', label: 'Ўзбекча (кирилл)', enabled: true },
      { code: 'ru', label: 'Русский', enabled: true },
      { code: 'en', label: 'English', enabled: true }
    ],
    settings: { siteName: 'Hududiy Tadqiqotlar Markazi' }
  };
}

let state = fs.existsSync(DB_PATH)
  ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  : freshDB();

// Backfill fields for db.json files created before users/roles/announcements/
// langs/settings existed, so upgrading doesn't wipe existing survey/response data.
{
  const defaults = freshDB();
  for (const key of ['users', 'roles', 'announcements', 'langs', 'settings', 'starts']) {
    if (!state[key]) state[key] = defaults[key];
  }
  // Pre-existing db.json files predate per-user login (they had one shared
  // admin password in state.auth). Without a passwordHash on at least one
  // user, nobody could ever log in again after upgrading — give the first
  // user the old shared default password so the upgrade path always leaves
  // a working login.
  if (state.users.length && !state.users.some(u => u.passwordHash)) {
    state.users[0].passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  }
  delete state.auth;
}

// One-time seed of the built-in education surveys (data/*-surveys.json, e.g.
// MTT and Maktab). Each survey id is recorded in state.meta.seededIds once
// added, so an admin who later deletes one doesn't see it come back on restart,
// while a newly shipped survey in these files still gets added.
{
  const dataDir = path.join(__dirname, 'data');
  state.meta = state.meta || {};
  const seeded = new Set(state.meta.seededIds || []);
  const have = new Set(state.surveys.map(s => s.id));
  let changed = false;
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('-surveys.json') && f !== 'seed-surveys.json').sort();
  for (const f of files) {
    for (const s of JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'))) {
      // Older databases used a single mttSeeded flag: treat those MTT ids as already seeded.
      if (state.meta.mttSeeded && String(s.id).startsWith('mtt_')) seeded.add(s.id);
      if (seeded.has(s.id)) continue;
      if (!have.has(s.id)) { state.surveys.push(s); have.add(s.id); }
      seeded.add(s.id);
      changed = true;
    }
  }
  if (changed) {
    state.meta.seededIds = [...seeded];
    if (fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  }
}

const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_MIN_INTERVAL_MS = 5 * 60 * 1000; // throttle: at most one backup snapshot every 5 minutes
const MAX_BACKUPS = 20;
let lastBackupAt = 0;

function rotateBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('db-') && f.endsWith('.json'))
      .sort(); // filenames are timestamp-prefixed, so lexical sort == chronological
    const excess = files.length - MAX_BACKUPS;
    if (excess > 0) {
      for (const f of files.slice(0, excess)) fs.unlinkSync(path.join(BACKUP_DIR, f));
    }
  } catch (e) { /* best-effort cleanup — never let backup housekeeping crash a write */ }
}

function maybeBackup(serialized) {
  const now = Date.now();
  if (now - lastBackupAt < BACKUP_MIN_INTERVAL_MS) return;
  lastBackupAt = now;
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(BACKUP_DIR, `db-${stamp}.json`), serialized);
    rotateBackups();
  } catch (e) { /* backups are best-effort, never block the real write */ }
}

// Atomic write: write to a temp file in the same directory, then rename over
// the real file. A crash mid-write leaves either the old file or the new one
// intact — never a half-written, corrupt db.json.
function persist() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const serialized = JSON.stringify(state, null, 2);
  const tmpPath = DB_PATH + '.tmp-' + process.pid;
  fs.writeFileSync(tmpPath, serialized);
  fs.renameSync(tmpPath, DB_PATH);
  maybeBackup(serialized);
}
if (!fs.existsSync(DB_PATH)) persist();

module.exports = {
  // ── Surveys ──────────────────────────────────────────
  listSurveys() {
    return state.surveys.map(({ questions, ...rest }) => ({
      ...rest,
      questionCount: (questions || []).length,
      responseCount: this.responseCount(rest.id),
      startCount: this.startCount(rest.id)
    }));
  },
  getSurvey(id) {
    return state.surveys.find(s => String(s.id) === String(id)) || null;
  },
  createSurvey(data) {
    const survey = { ...data, id: makeId('c_'), isCustom: true };
    state.surveys.push(survey);
    persist();
    return survey;
  },
  updateSurvey(id, data) {
    const idx = state.surveys.findIndex(s => String(s.id) === String(id) && s.isCustom);
    if (idx === -1) return null;
    state.surveys[idx] = { ...state.surveys[idx], ...data, id: state.surveys[idx].id, isCustom: true };
    persist();
    return state.surveys[idx];
  },
  deleteSurvey(id) {
    const idx = state.surveys.findIndex(s => String(s.id) === String(id) && s.isCustom);
    if (idx === -1) return false;
    state.surveys.splice(idx, 1);
    state.responses = state.responses.filter(r => String(r.surveyId) !== String(id));
    persist();
    return true;
  },

  // ── Responses ────────────────────────────────────────
  // fp is a one-way hash of (IP + User-Agent), never the IP itself — see
  // server/index.js's fingerprint() — used only to block a second submission
  // from the same browser/device on the same survey, never shown in any UI.
  addResponse(surveyId, answers, fp) {
    const r = { id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), surveyId, answers, submittedAt: new Date().toISOString(), fp };
    state.responses.push(r);
    persist();
    return r;
  },
  hasFingerprintSubmitted(surveyId, fp) {
    return state.responses.some(r => String(r.surveyId) === String(surveyId) && r.fp === fp);
  },
  listResponses(surveyId) {
    return state.responses.filter(r => String(r.surveyId) === String(surveyId));
  },
  responseCount(surveyId) {
    return state.responses.filter(r => String(r.surveyId) === String(surveyId)).length;
  },

  // ── Starts (anonymous "opened the form" events — no PII, just a count +
  // timestamp per survey, so completion rate / drop-off can be computed
  // honestly instead of reading the admin's own browser localStorage) ──
  addStart(surveyId) {
    state.starts = state.starts || [];
    state.starts.push({ surveyId, at: new Date().toISOString() });
    persist();
    return true;
  },
  startCount(surveyId) {
    return (state.starts || []).filter(s => String(s.surveyId) === String(surveyId)).length;
  },
  // Public aggregate-only stats (no answers/PII) for the homepage — safe to
  // expose without auth since it's just counts, not individual responses.
  publicStats() {
    const now = new Date();
    const today = state.responses.filter(r => {
      const d = new Date(r.submittedAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;
    return { total: state.responses.length, today };
  },

  // ── Auth (per-user login — each admin has their own email + password) ──
  DEFAULT_PASSWORD,
  findUserByEmail(email) {
    return state.users.find(u => u.email && u.email.toLowerCase() === String(email || '').toLowerCase());
  },
  checkUserPassword(email, pw) {
    const u = this.findUserByEmail(email);
    if (!u || !u.passwordHash) return null;
    return bcrypt.compareSync(String(pw || ''), u.passwordHash) ? u : null;
  },
  setUserPassword(id, pw) {
    const u = state.users.find(x => String(x.id) === String(id));
    if (!u) return null;
    u.passwordHash = bcrypt.hashSync(String(pw), 10);
    persist();
    return u;
  },

  // ── Audit ────────────────────────────────────────────
  logAudit(action, actor) {
    state.audit.unshift({ time: new Date().toISOString(), actor: actor || state.settings.adminName || 'Admin', action });
    state.audit = state.audit.slice(0, 200);
    persist();
  },
  listAudit() {
    return state.audit;
  },

  // ── Users ────────────────────────────────────────────
  // Never return passwordHash to the client — strip it on every read.
  listUsers() {
    return state.users.map(({ passwordHash, ...rest }) => ({ ...rest, canLogin: !!passwordHash }));
  },
  addUser(data) {
    const user = { id: makeId('u_'), name: data.name, email: data.email, role: data.role };
    if (data.password) user.passwordHash = bcrypt.hashSync(String(data.password), 10);
    state.users.push(user);
    persist();
    const { passwordHash, ...safe } = user;
    return { ...safe, canLogin: !!passwordHash };
  },
  deleteUser(id) {
    const idx = state.users.findIndex(u => String(u.id) === String(id));
    if (idx === -1) return null;
    const [removed] = state.users.splice(idx, 1);
    persist();
    const { passwordHash, ...safe } = removed;
    return safe;
  },

  // ── Roles ────────────────────────────────────────────
  listRoles() { return state.roles; },
  addRole(data) {
    const role = { id: makeId('ro_'), name: data.name, perms: data.perms || [] };
    state.roles.push(role);
    persist();
    return role;
  },
  // Users store their role as a plain name string, not an id — deleting a
  // role that's still assigned would leave those users with a dangling,
  // no-longer-selectable role name (invisible/unfixable in the UI). Refuse
  // the delete instead of silently orphaning them.
  usersWithRole(roleName) {
    return state.users.filter(u => u.role === roleName);
  },
  deleteRole(id) {
    const idx = state.roles.findIndex(r => String(r.id) === String(id));
    if (idx === -1) return null;
    const [removed] = state.roles.splice(idx, 1);
    persist();
    return removed;
  },

  // ── Announcements ────────────────────────────────────
  listAnnouncements() { return state.announcements; },
  addAnnouncement(data) {
    const ann = { id: makeId('a_'), date: data.date, text: data.text, type: data.type === 'yangilik' ? 'yangilik' : 'elon' };
    state.announcements.unshift(ann);
    persist();
    return ann;
  },
  deleteAnnouncement(id) {
    const idx = state.announcements.findIndex(a => String(a.id) === String(id));
    if (idx === -1) return null;
    const [removed] = state.announcements.splice(idx, 1);
    persist();
    return removed;
  },

  // ── Languages ────────────────────────────────────────
  listLangs() { return state.langs; },
  setLangEnabled(code, enabled) {
    const lang = state.langs.find(l => l.code === code);
    if (!lang) return null;
    lang.enabled = !!enabled;
    persist();
    return lang;
  },

  // ── Settings ─────────────────────────────────────────
  getSettings() { return state.settings; },
  setSettings(data) {
    state.settings = { ...state.settings, ...data };
    persist();
    return state.settings;
  }
};
