# 04 — Ma'lumotlarning ishonchliligi

Bu bo'lim eng nozik, chunki portal natijalari hokimlik uchun tavsiyalarga aylanadi.
Ko'rsatkich noto'g'ri bo'lsa, qaror ham noto'g'ri chiqadi.

| ID | Jiddiylik | Xatolik |
|---|---|---|
| [M-1](#m-1) | 🟠 Yuqori | Admin panelda to'qib chiqarilgan raqamlar haqiqiy deb ko'rsatiladi |
| [M-2](#m-2) | 🟠 Yuqori | Server javoblarni so'rovnoma savollariga tekshirmaydi |
| [M-3](#m-3) | 🟠 Yuqori | Takroriy topshirishni faqat brauzer to'sib turadi |
| [M-4](#m-4) | 🔵 O'rta | «Yarim qolgan javoblar» bo'limi adminning o'z brauzerini o'qiydi |
| [M-5](#m-5) | 🔵 O'rta | Rollar va ruxsatlar hech narsani cheklamaydi |

---

## M-1

### Admin panelda to'qib chiqarilgan raqamlar haqiqiy deb ko'rsatiladi

**Jiddiylik:** 🟠 Yuqori

#### Ta'siri

Bosh sahifadagi beshta ko'rsatkich kartasidan **to'rttasi** HTML ichiga qattiq yozilgan son:

| Karta | Ko'rsatiladigan qiymat | Haqiqat |
|---|---|---|
| Jami javoblar | **1 751** + «↑ +128 (12,5%) o'tgan oyga nisbatan» | bazada **1** ta javob |
| Tumanlar qamrovi | **15/15** — «100% to'liq qamrov» | 1 ta javob, ya'ni 1 tuman |
| O'rtacha to'ldirish vaqti | **1:15** daqiqa | umuman hisoblanmaydi — boshlanish vaqti saqlanmaydi |
| Yakunlash darajasi | **78%** «o'rtacha» | umuman hisoblanmaydi |
| Faol so'rovnomalar | `—` → JS to'ldiradi | ✅ haqiqiy |

CSS'da `.sx-tag-demo` degan «demo» belgisi uslubi yozilgan (`admin.html:431`), lekin u
**hech bir elementga qo'llanmagan** — ya'ni bu raqamlarni namunaviy deb belgilaydigan
hech narsa yo'q.

Panelni ochgan rahbar «1 751 javob» va «100% to'liq qamrov» ni ishonchli ko'rsatkich deb
o'qiydi va hisobotga kiritadi. Bundan tashqari «Hududlar statistikasi», «Qamrov
monitoringi», «So'nggi faoliyatlar» va «Qamrov bo'yicha ogohlantirishlar» bo'limlari ham
namunaviy ma'lumot asosida ishlaydi.

#### Qayerda

| Fayl:qator | Nima |
|---|---|
| `admin.html:639` | `<div class="sc-val" ...>1 751</div>` |
| `admin.html:640` | `↑ +128 (12.5%) o'tgan oyga nisbatan` |
| `admin.html:660–661` | `15/15` + `100% to'liq qamrov` |
| `admin.html:670` | `1:15` |
| `admin.html:682` | `78%` + SVG gauge `stroke-dashoffset="24.9"` |
| `admin.html:431` | ishlatilmagan `.sx-tag-demo` uslubi |

#### Tuzatish

**Hisoblanadigan uchtasini haqiqiy ma'lumotdan olish:**

1. **Jami javoblar** — `/api/stats` allaqachon buni qaytaradi (`server/db.js:162–169`):
   ```js
   const s = await (await apiFetch('/api/stats')).json();
   document.querySelector('#sc-total .sc-val').textContent = s.total.toLocaleString('uz-UZ');
   ```
   O'sish foizini olib tashlash yoki `s.today` asosida «bugun +N» ga almashtirish.

2. **Tumanlar qamrovi** — demografik savollar hududni allaqachon yozib oladi
   (`admin.html:2424`, `dq1` = «Hududingizni tanlang»). Javoblarni o'qib, `dq1`
   qiymatlarining noyob sonini hisoblash kifoya:
   ```js
   const seen = new Set(responses.map(r => r.answers.dq1).filter(Boolean));
   el.textContent = seen.size + '/15';
   ```

3. **Yakunlash darajasi** — hozircha hisoblab bo'lmaydi, lekin **Q-4** (javoblarni
   saqlash) va **M-4** (boshlanish hodisasini serverga yozish) bajarilgandan keyin
   *boshlangan / yuborilgan* nisbati sifatida haqiqiy chiqadi.

**Hisoblab bo'lmaydiganini kartadan butunlay olib tashlash:**

**O'rtacha to'ldirish vaqti** — buning uchun so'rovnoma ochilgan vaqt saqlanmaydi.
Kartani o'chirish yoki `—` qo'yib «ma'lumot yig'ilmoqda» deb yozish.

> **Muhim:** yolg'on raqamni «demo» deb belgilash o'chirishdan ko'ra **yomonroq** —
> u baribir ekrandan hisobotga ko'chiriladi. Hisoblanmaydigan ko'rsatkich bo'sh
> turishi kerak.

---

## M-2

### Server javoblarni so'rovnoma savollariga tekshirmaydi

**Jiddiylik:** 🟠 Yuqori · **Holat:** tekshirildi va tasdiqlandi

#### Ta'siri

`POST /api/surveys/:id/responses` faqat `answers` obyekt ekanini tekshiradi, uning
**ichiga qaramaydi**:

```js
// server/index.js:337–341
const { answers } = req.body || {};
if (!answers || typeof answers !== 'object') {
  return res.status(400).json({ error: 'Javoblar (answers) yuborilmadi.' });
}
const r = db.addResponse(req.params.id, answers);
```

`db.addResponse()` esa kelgan narsani o'zgartirmasdan saqlaydi (`server/db.js:148–153`).

Demak quyidagilar bazaga tushadi va keyin CSV eksport, natijalar sahifasi va AI
xulosasiga o'tadi:

- mavjud bo'lmagan savol identifikatori
- variantlar ro'yxatida yo'q javob matni
- bir tanlovli (`radio`) savolga massiv
- cheksiz uzun matn (faqat 1 MB umumiy `body` cheklovi bor)
- bo'sh obyekt `{}` — «javob» sifatida hisoblanadi va `responseCount` ni oshiradi

#### Tekshiruv

```bash
curl -X POST http://localhost:8099/api/surveys/c_1784630489102_y20nq/responses \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"answers":{"zzz_nonexistent":"HAMMASI YOLGON","q1":["a","b","c"]}}'
```

```json
{"ok":true,"id":"r_1785384879764_qc1je"}
```

HTTP 201. Sinov yozuvi bazadan **darhol o'chirildi**, `responses`: 2 → 1.

#### Qayerda

`server/index.js:334–343`, `server/db.js:148–153`

#### Tuzatish

Javobni yozishdan **oldin** so'rovnoma savollariga solishtirish:

```js
function answersAreValid(survey, answers) {
  const byId = new Map((survey.questions || []).map(q => [q.id, q]));
  for (const [qid, val] of Object.entries(answers)) {
    const q = byId.get(qid);
    if (!q) return false;                                  // noma'lum savol
    const vals = Array.isArray(val) ? val : [val];
    if (q.type !== 'checkbox' && vals.length > 1) return false;   // radio'ga massiv
    for (const v of vals) {
      if (typeof v !== 'string' || !v.trim()) return false;
      // "Boshqa (o'zingiz yozing) — foydalanuvchi matni" shakli ham qabul qilinadi
      const base = v.split(' — ')[0];
      if (!q.options.includes(v) && !q.options.includes(base)) return false;
    }
  }
  return true;
}
```

```js
if (!answersAreValid(survey, answers)) {
  return res.status(400).json({ error: 'Javoblar so\'rovnoma savollariga mos kelmadi.' });
}
```

Bo'sh javobni ham rad etish kerak: `if (!Object.keys(answers).length) return 400`.

> So'rovnoma **yaratishda** bunday tekshiruv allaqachon yaxshi yozilgan
> (`server/index.js:249–291` — `isValidTitle`, `questionsAreValid`, `isValidMinutes`).
> Shu darajani javoblarga ham qo'llash kerak.

---

## M-3

### Takroriy topshirishni faqat brauzer to'sib turadi

**Jiddiylik:** 🟠 Yuqori

#### Ta'siri

Yagona to'siq — brauzerdagi belgi:

```js
// survey.html:362
if (localStorage.getItem('s' + survey.id + '_done') === '1') { ... }
// survey.html:508
localStorage.setItem('s' + survey.id + '_done', '1');
```

Serverda hech qanday tekshiruv yo'q. Ya'ni:

- brauzer ma'lumotlarini tozalash
- maxfiy (incognito) oyna
- boshqa brauzer yoki qurilma
- to'g'ridan-to'g'ri `curl` so'rovi

— har biri cheksiz javob yuborishga yo'l beradi.

Bundan tashqari **interfeys buni ochiq taklif qiladi**:

> «✓ Siz bu so'rovnomada qatnashgansiz — *qayta topshirishingiz mumkin*»

(`i18n.js` — `already_msg`, to'rt tilda ham shunday)

Natijada `responseCount` va undan kelib chiqadigan **barcha foizlar ilmiy tadqiqot uchun
ishonchsiz**. Bir odam yoki bir guruh natijani xohlagan tomonga burishi mumkin.

#### Qayerda

`survey.html:362`, `survey.html:508`; matn — `i18n.js`, `already_msg` kaliti

#### Tuzatish

To'liq yechim anonimlik bilan ziddiyatga kiradi, shuning uchun **tanlov ochiq qoldirilishi
kerak**. Uchta amaliy yo'l:

**1-yo'l — anonimlikni saqlab, IP xeshi bo'yicha to'sish**

Serverda IP + `User-Agent` ning **xeshini** vaqtincha saqlash (masalan 24 soat) va shu
xesh bo'yicha takrorni rad etish:

```js
const fp = crypto.createHash('sha256')
  .update(req.ip + '|' + (req.get('user-agent')||'') + '|' + SESSION_SECRET)
  .digest('hex').slice(0, 16);
```

Shaxs aniqlanmaydi (xesh qaytarilmaydi, `SESSION_SECRET` bilan tuzlangan), lekin takror
to'siladi.

> ⚠️ Bu yo'l **X-2 tuzatilmagan holda ishlamaydi** — hozir barcha foydalanuvchilar bir
> xil IP (`127.0.0.1`) dan ko'rinadi, ya'ni birinchi javobdan keyin **hech kim**
> qatnasha olmaydi.

**2-yo'l — bir martalik havola (eng aniq)**

Tuman vakillari orqali tarqatiladigan, bir marta ishlatiladigan token:
`survey.html?id=...&t=abc123`. Qamrov nazorati uchun ham eng ishonchli usul — kim
qatnashgani emas, qancha token ishlatilgani hisoblanadi.

**3-yo'l — ochiq tan olish (eng arzon)**

Takrorni to'smaslik, lekin natijalar sahifasida va metodologiyada ochiq yozib qo'yish:
«Ma'lumotlar ochiq so'rov usulida yig'ilgan, takroriy topshirish texnik jihatdan
to'silmagan». Ilmiy qiymati past, lekin **halol**.

**Qaysi yo'l tanlansa ham**, hozirgi «qayta topshirishingiz mumkin» matnini o'zgartirish
kerak — u foydalanuvchini takror yuborishga faol undab turadi.

---

## M-4

### «Yarim qolgan javoblar» bo'limi adminning o'z brauzerini o'qiydi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Bo'lim adminning **o'zining** brauzeridagi belgini tekshiradi:

```js
// admin.html:1979–1980
const started = localStorage.getItem('s'+s.id+'_started')==='1';
const done    = localStorage.getItem('s'+s.id+'_done')==='1';
```

Respondentlarning yarim qolgan urinishlari **serverga hech qachon yozilmaydi**
(`survey.html:367` — faqat `localStorage`). Ya'ni bo'lim faqat adminning o'zi ochib
ko'rgan so'rovnomalarni ko'rsatishi mumkin.

Lekin panelda u **monitoring vositasi** sifatida taqdim etilgan. Bu **M-1** bilan bir xil
muammo: paneldagi ko'rsatkich haqiqatni ko'rsatmaydi, lekin ko'rsatayotgandek turadi.
Admin «yarim qolgan javob yo'q» degan xulosaga keladi, holbuki o'nlab odam formani
tashlab ketgan bo'lishi mumkin.

#### Qayerda

`admin.html:1979–1980`, `survey.html:367`

#### Tuzatish

Ikki variant:

**A. Bo'limni olib tashlash** — eng tez va halol yo'l.

**B. Haqiqiy qilish:**

1. So'rovnoma ochilganda serverga anonim hodisa yuborish:
   ```js
   // survey.html — renderForm() ichida
   fetch(`/api/surveys/${survey.id}/started`, {
     method:'POST', headers:{'X-Requested-With':'XMLHttpRequest'}
   }).catch(()=>{});
   ```

2. Serverda hisoblagichni saqlash (shaxsiy ma'lumotsiz — faqat son va vaqt):
   ```js
   // server/db.js
   addStart(surveyId){ state.starts.push({ surveyId, at:new Date().toISOString() }); persist(); }
   ```

3. Yuborilgach hisobga olish — «boshlangan» va «yuborilgan» sonlari farqi haqiqiy
   tashlab ketish darajasini beradi. Bu **M-1** dagi «Yakunlash darajasi» kartasini ham
   haqiqiy qiladi.

**Q-4** (javoblarni brauzerda saqlash) bilan birga qilinsa mantiqiy chiqadi.

---

## M-5

### Rollar va ruxsatlar hech narsani cheklamaydi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Barcha API yo'llari faqat `requireAuth` orqali o'tadi:

```js
// server/index.js:41–44
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan...' });
}
```

`perms` massivi bazada saqlanadi va panelda chiroyli ko'rsatiladi, lekin **hech bir
yo'lda tekshirilmaydi**. Amalda:

| Rol | Panelda yozilgan huquqlari | Haqiqatda qila oladi |
|---|---|---|
| Super admin | 4 ta huquq | hammasi |
| Moderator | So'rovnoma yaratish, Natijalarni ko'rish | **hammasi** |
| Ko'ruvchi | Natijalarni ko'rish | **hammasi** |

Ya'ni «Ko'ruvchi» roli ham so'rovnomani o'chirishi, foydalanuvchi qo'shishi, boshqa
adminning parolini almashtirib qo'yishi va sozlamalarni o'zgartirishi mumkin.

Panelda bu haqda eslatma bor, lekin interfeysning o'zi (checkbox'lar, rol tanlash)
teskarisini ko'rsatadi — ishonch yolg'on joyga qo'yiladi.

#### Qayerda

`server/index.js:41–44` va undan keyingi barcha `requireAuth` ishlatilgan yo'llar
(`:208`, `:221`, `:293`, `:306`, `:323`, `:345`, `:352`, `:363`, `:373–403`, `:408–428`,
`:434`, `:441`, `:452`, `:463`, `:464`, `:473`)

#### Tuzatish

Ma'lumot tuzilmasi **allaqachon tayyor** — faqat tekshiruv yo'q.

1. Login paytida rolni sessiyaga yozish (`server/index.js:189–194`):
   ```js
   req.session.userRole = user.role;
   ```

2. Ruxsat tekshiruvchi middleware:
   ```js
   function requirePerm(perm) {
     return (req, res, next) => {
       if (!req.session || !req.session.isAdmin) {
         return res.status(401).json({ error: 'Avtorizatsiyadan o\'tilmagan.' });
       }
       const role = db.listRoles().find(r => r.name === req.session.userRole);
       if (!role || !(role.perms || []).includes(perm)) {
         return res.status(403).json({ error: 'Bu amal uchun ruxsatingiz yo\'q.' });
       }
       next();
     };
   }
   ```

3. Yo'llarga qo'llash:
   ```js
   app.post('/api/surveys', requirePerm("So'rovnoma yaratish"), ...);
   app.delete('/api/surveys/:id', requirePerm("So'rovnoma yaratish"), ...);
   app.post('/api/users', requirePerm('Foydalanuvchilarni boshqarish'), ...);
   app.put('/api/settings', requirePerm("Sozlamalarni o'zgartirish"), ...);
   ```

4. Klient tomonda ham ruxsatsiz bo'limlarni yashirish — `/api/auth/me` javobiga
   `perms` qo'shib.

**Muqobil variant:** rollarni interfeysdan butunlay olib tashlab, ular haqiqiy emasligini
yashirmaslik. Bu ham to'g'ri yechim — noto'g'ri ishonchdan ko'ra yaxshiroq.
