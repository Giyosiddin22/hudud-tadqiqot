# 00 — Yaxshi ishlangan tomonlar

Bular tahlil davomida **tasdiqlangan**. Qayta yozish kerak emas va keyingi ishlarda
buzib qo'ymaslik kerak — ayniqsa **X-1** (papkalarni qayta joylashtirish) va **P-5**
(CSS'ni ajratish) kabi katta o'zgarishlarda.

---

## Xavfsizlik

### Parollar to'g'ri saqlanadi

`bcrypt` bilan xeshlash (10 rounds), `passwordHash` **hech qachon** klientga qaytarilmaydi —
barcha o'qish joylarida ajratib tashlanadi:

```js
// server/db.js:201–203
listUsers() {
  return state.users.map(({ passwordHash, ...rest }) => ({ ...rest, canLogin: !!passwordHash }));
}
```

`addUser()` va `deleteUser()` da ham xuddi shunday (`:209`, `:217`). Bu izchil qo'llangan —
bir joyda ham esdan chiqmagan.

### Anonimlik da'vosi rost

Javob bilan birga IP manzil, `User-Agent`, `Referer` yoki boshqa aniqlovchi ma'lumot
saqlanmaydi:

```js
// server/db.js:149
const r = { id: 'r_'+Date.now()+'_'+..., surveyId, answers, submittedAt: ... };
```

Faqat hujjati yo'q — **K-2** ga qarang. Kodning o'zi to'g'ri.

### CSRF himoyasi bor

Barcha o'zgartiruvchi so'rovlarda `X-Requested-With` sarlavhasi talab qilinadi:

```js
// server/index.js:51–59
function requireCsrfHeader(req, res, next) {
  if (['POST','PUT','DELETE','PATCH'].includes(req.method)) {
    if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
      return res.status(403).json({ error: 'So\'rov rad etildi (CSRF himoyasi)...' });
    }
  }
  next();
}
app.use('/api', requireCsrfHeader);
```

Tashqi saytdagi `<form>` bu sarlavhani qo'sha olmaydi, ya'ni klassik CSRF hujumi to'siladi.
Klient tomonda `apiFetch()` yordamchisi uni har doim qo'shadi (`admin.html:1299–1303`) —
naqsh izchil.

### XSS'dan himoya izchil

Barcha `innerHTML` shablonlarida `escHtml()` qo'llangan — so'rovnoma nomlari, javoblar,
e'lonlar, foydalanuvchi ismlari, audit yozuvlari. Uchta faylda uchta mustaqil, lekin
bir xil ishlaydigan nusxa bor (`index.html:748`, `surveys.html:416`, `admin.html:1293`)
va hammasi `&`, `<`, `>`, `"`, `'` ni qamraydi.

Faqat CSP ikkinchi qatlam sifatida yo'q — **P-5** ga qarang.

### Xavfsizlik sarlavhalari yoqilgan

`helmet` o'rnatilgan va ishlayapti. Tekshirildi:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: no-referrer
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
X-Permitted-Cross-Domain-Policies: none
```

Faqat CSP o'chirilgan (**P-5**).

### Audit jurnali oq ro'yxatda

Klient faqat oldindan belgilangan xabar turlarini yozdirishi mumkin — jurnalga ixtiyoriy
matn kiritib bo'lmaydi:

```js
// server/index.js:359–368
const AUDIT_NOTES = {
  csv_export: 'CSV hisobot yuklab olindi (hududlar statistikasi)',
  json_export: 'Ma\'lumotlar JSON formatida eksport qilindi'
};
app.post('/api/audit/note', requireAuth, (req, res) => {
  const note = AUDIT_NOTES[req.body && req.body.type];
  if (!note) return res.status(400).json({ error: 'Noma\'lum audit turi.' });
  ...
});
```

Jurnal 200 yozuv bilan cheklangan (`db.js:192`) — cheksiz o'sib ketmaydi.

---

## Ma'lumotlar bilan ishlash

### Ma'lumot bazasi yozuvi atomik

Vaqtinchalik faylga yozib, keyin `rename` — server yiqilsa ham `db.json` yarim yozilgan
holda qolmaydi:

```js
// server/db.js:103–110
function persist() {
  const serialized = JSON.stringify(state, null, 2);
  const tmpPath = DB_PATH + '.tmp-' + process.pid;
  fs.writeFileSync(tmpPath, serialized);
  fs.renameSync(tmpPath, DB_PATH);   // atomik almashtirish
  maybeBackup(serialized);
}
```

`process.pid` qo'shilgani ham to'g'ri — ikki jarayon bir vaqtda yozsa to'qnashmaydi.

### Zaxira nusxa avtomatik

5 daqiqada bir marta (throttle), 20 nusxa saqlanadi, eskisi o'zi o'chadi:

```js
// server/db.js:72–98
const BACKUP_MIN_INTERVAL_MS = 5 * 60 * 1000;
const MAX_BACKUPS = 20;
```

`rotateBackups()` xatolarni yutib yuboradi — zaxira olish jarayoni haqiqiy yozuvni
hech qachon buzmaydi. Bu to'g'ri ustuvorlik.

Faqat nusxalar publik ochiq — **X-1**.

### So'rovnoma validatsiyasi puxta

Server tomonda haqiqiy tekshiruv bor:

```js
// server/index.js:249
const MAX_TITLE = 200, MAX_SUBTITLE = 200, MAX_DESC = 2000, MAX_QTEXT = 500, MAX_OPTION = 200;
```

- Sarlavha bo'sh emas va 200 belgidan oshmaydi
- Har savolda matn va **kamida 2 variant** — `survey.html` dagi `q.options.map()`
  qulashining oldini oladi
- `minutes` 1–120 oralig'ida musbat son
- Barcha matn maydonlari yozishdan oldin `trim()` qilinadi (`normalizeSurveyInput`)

Izohlarda **nima uchun** shunday qilinganigacha yozilgan. Shu darajani javoblarga ham
qo'llash kerak — **M-2**.

### Rol o'chirishda tekshiruv bor

Foydalanuvchi biriktirilgan rolni o'chirishga yo'l qo'yilmaydi:

```js
// server/index.js:416–423
const assigned = db.usersWithRole(role.name);
if (assigned.length) {
  return res.status(409).json({
    error: `Bu rol ${assigned.length} ta foydalanuvchiga biriktirilgan — avval ularni boshqa rolga o'tkazing...`
  });
}
```

«Osilib qolgan» rol nomlari paydo bo'lmaydi. Xato xabari ham foydalanuvchiga nima
qilishni aytadi — yaxshi namuna.

### Identifikator to'qnashuvi hisobga olingan

```js
// server/db.js:14–16
function makeId(prefix) {
  return prefix + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
```

`Date.now()` yolg'iz ishlatilsa, «Saqlash» tugmasini ikki marta tez bosganda bir xil
`id` chiqishi mumkin edi. Tasodifiy qo'shimcha buni to'sadi.

### Yangilanish yo'li o'ylangan

`server/db.js:53–69` — eski `db.json` fayllarida yo'q maydonlarni to'ldiradi va eng
muhimi: hech bo'lmasa bitta foydalanuvchida `passwordHash` bo'lishini kafolatlaydi.
Aks holda yangilanishdan keyin **hech kim tizimga kira olmasdi**. Bu holat oldindan
o'ylangan.

---

## Interfeys

### Sessiya tugashi bildiriladi

Admin panel har 5 daqiqada sessiyani tekshirib, tugaganda ko'rinadigan banner chiqaradi:

```js
// admin.html:1348–1360
_sessionWatcher = setInterval(async () => {
  const j = await (await fetch('/api/auth/me')).json();
  if (!j.loggedIn) {
    document.getElementById('session-expired-banner').style.display = 'block';
    clearInterval(_sessionWatcher);
  }
}, 5*60*1000);
```

Kutilmagan 401 xatosining oldini oladi — so'rovnoma qurayotgan admin ishini yo'qotmaydi.
Bitta tarmoq uzilishida bezovta qilmaydi (`catch` bo'sh) — bu ham to'g'ri qaror.

### Mobil uchun o'ylangan

- Teginish zonalari 44px (`survey.html:192`, `index.html:286–287`) — Apple va Google
  tavsiyasiga mos
- `env(safe-area-inset-bottom)` hisobga olingan (`survey.html:194`) — iPhone'da yuborish
  tugmasi pastdagi chiziq ostida qolmaydi
- `prefers-reduced-motion` qo'llangan (`index.html:310`, `survey.html:237`) — animatsiyaga
  sezgir foydalanuvchilar uchun
- 360px'gacha alohida moslashuv qatlamlari bor

### So'rovnoma formasida holat aniq ko'rinadi

- Javob berilgan savol yashil chap chegara oladi (`.q-block.answered`)
- Yuqorida bajarilish chizig'i va «3/12» hisobchisi
- «Boshqa (o'zingiz yozing)» varianti tanlanganda matn maydoni ochiladi va fokus
  avtomatik unga o'tadi (`survey.html:407–412`)
- Xatoli savolga avtomatik siljish (`scrollIntoView`)

Faqat bularning hammasi **ko'z bilan** ishlaydi — **Q-1**, **Q-2**, **Q-6** shu haqda.

### Ovozli yordamchida haqiqiy muammolar hal qilingan

Kodda ko'rinadigan tuzatishlar amaliy sinovdan o'tganini ko'rsatadi:

- `no-speech` va `aborted` xatolari qayta urinish hisobiga **kirmaydi** — aks holda
  jimlik so'rovni buzardi (`survey.html:611–618`)
- Tasdiq gapi tugagandan **keyin** sahifa almashadi — avval o'rtada uzilib qolardi
  (`index.html:960–963`)
- Ro'yxat to'liq o'qib bo'lingandan keyin mikrofon yoqiladi — avval mikrofon fon
  shovqinini yozardi (`surveys.html:659–663`)
- Brauzer `speechSynthesis` da o'zbek ovozi yo'qligi tan olingan va server orqali
  haqiqiy TTS qo'shilgan, brauzer varianti zaxira sifatida qolgan

### Til almashganda ro'yxat qayta chiziladi

`surveys.html:455–462` da `window._onLangChange` naqshi to'g'ri qo'llangan — JS yasagan
kartochkalar til almashganda qayta chiziladi. Aynan shu naqshni `index.html` ga ko'chirish
kerak (**T-1**).

---

## Umumiy baho

Kod **ehtiyotkorlik bilan yozilgan**: izohlarda «nima uchun» tushuntirilgan, chegara
holatlari o'ylangan, xato xabarlari o'zbek tilida va foydalanuvchiga nima qilishni aytadi.
Server tomonidagi validatsiya, atomik yozuv, CSRF va XSS himoyasi — bularning hammasi
professional darajada.

Asosiy muammolar **kod sifatida emas, sozlamada**: uchta kritik topilma ham `.env`
faylidagi bo'sh qiymatlar va bitta `express.static` chaqiruvidan kelib chiqadi. Ya'ni
tuzatish arzon — asosiy poydevor mustahkam.
