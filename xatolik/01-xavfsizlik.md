# 01 — Xavfsizlik va joylashtirish

Bu bo'limdagi topilmalar ishlab turgan serverda `curl` bilan tekshirildi, taxmin emas.

| ID | Jiddiylik | Xatolik |
|---|---|---|
| [X-1](#x-1) | 🔴 Kritik | Ma'lumotlar bazasi, zaxira nusxalar va server kodi parolsiz yuklab olinadi |
| [X-2](#x-2) | 🔴 Kritik | Cheklovlar har bir foydalanuvchiga emas, hammaga umumiy qo'llanadi |
| [X-3](#x-3) | 🔴 Kritik | Admin sessiya cookie'si `Secure` belgisisiz yuboriladi |
| [X-4](#x-4) | 🟠 Yuqori | Rasmiy portal sinov tunneli orqali chiqarilgan |

---

## X-1

### Ma'lumotlar bazasi, zaxira nusxalar va server kodi parolsiz yuklab olinadi

**Jiddiylik:** 🔴 Kritik · **Holat:** tekshirildi va tasdiqlandi

#### Ta'siri

Istalgan odam brauzerga manzil yozib quyidagilarni oladi:

- `/server/data/db.json` — barcha admin emaillari, ularning `bcrypt` parol xeshlari,
  har bir respondentning to'liq javoblari
- `/server/data/backups/db-*.json` — 18 ta tarixiy nusxa, ya'ni o'chirilgan ma'lumotlar ham
- `/server/index.js`, `/server/db.js` — server kodi, ya'ni butun himoya mantig'i
- `/tunnel.log` — publik manzil va infratuzilma ma'lumotlari

Parol xeshlari `bcrypt` bilan yaxshi himoyalangan, lekin qo'lga olingandan keyin ularni
oflayn buzishga cheklov qolmaydi. Respondentlar javoblari esa ochiq matn.

#### Tekshiruv

```bash
curl -o /dev/null -w "%{http_code} %{size_download}\n" \
  http://localhost:8080/server/data/db.json
# 200 12292
```

Boshqa manzillar ham 200 qaytardi:

| Manzil | Javob | Hajmi |
|---|---|---|
| `/server/data/db.json` | 200 | 12 292 |
| `/server/index.js` | 200 | 31 579 |
| `/server/data/backups/db-2026-07-27T09-12-51-431Z.json` | 200 | 12 292 |
| `/tunnel.log` | 200 | 6 281 |
| `/server/.env` | 404 | — |

#### Qayerda

`server/index.js:655–656`

```js
const SITE_ROOT = path.join(__dirname, '..');
app.use(express.static(SITE_ROOT));
```

`path.join(__dirname, '..')` — loyihaning butun ildiz papkasi, ya'ni `server/` ham,
`tunnel.log` ham, `xatolik/` ham uning ichida.

`.env` faqat **tasodifan** omon qolgan: `express.static` nuqta bilan boshlanadigan
fayllarni sukut bo'yicha bermaydi (`dotfiles: 'ignore'`). Ya'ni bu himoya emas, tasodif —
`.env` nomi o'zgarsa yoki boshqa maxfiy fayl nuqtasiz nomlansa, u ham ochiq bo'ladi.

#### Tuzatish

**To'g'ri yechim** — publik fayllarni alohida papkaga ko'chirib, faqat shuni tarqatish:

```
Hududiy tadqiqotlar markazi sayti/
├── public/            ← faqat shu papka tarqatiladi
│   ├── index.html
│   ├── surveys.html
│   ├── survey.html
│   ├── about.html
│   ├── admin.html
│   ├── admin-results.html
│   ├── i18n.js
│   ├── data.js
│   └── bino.png
├── server/            ← yopiq
├── xatolik/           ← yopiq
└── tunnel.log         ← yopiq
```

```js
app.use(express.static(path.join(__dirname, '..', 'public')));
```

Bu eng ishonchli yo'l, chunki keyinchalik ildizga qo'shilgan **har qanday yangi fayl
avtomatik yopiq qoladi** — oq ro'yxat printsipi.

**Vaqtinchalik chora** (ko'chirishga vaqt bo'lmasa) — `express.static` dan **oldin**:

```js
app.use((req, res, next) => {
  if (/^\/(server|xatolik)\b/.test(req.path) || req.path.endsWith('.log')) {
    return res.status(404).send('Not found');
  }
  next();
});
```

Lekin bu qora ro'yxat: kelasi maxfiy faylni yana qo'lda qo'shish kerak bo'ladi.

#### Tuzatgandan keyin

Baza allaqachon ochiq turgan bo'lishi mumkin, shuning uchun:

1. Barcha admin parollarini almashtirish (`admin.html` → Foydalanuvchilar → parol o'rnatish)
2. `SESSION_SECRET` ni yangi tasodifiy satrga o'zgartirish — bu barcha ochiq sessiyalarni bekor qiladi
3. Respondentlarga oshkor bo'lishi mumkin bo'lgan ma'lumot hajmini baholash

---

## X-2

### Cheklovlar har bir foydalanuvchiga emas, hammaga umumiy qo'llanadi

**Jiddiylik:** 🔴 Kritik

#### Ta'siri

`tunnel.log` ko'rsatadi: sayt `cloudflared` orqali `localhost:8080` ga ulangan.
`server/.env` da `TRUST_PROXY` bo'sh, shuning uchun `app.set('trust proxy')` hech qachon
chaqirilmaydi va `express-rate-limit` barcha tashrifchilarni **bitta IP** (`127.0.0.1`,
tunnelning o'zi) deb hisoblaydi.

Uchta amaliy natija:

1. **So'rovnoma butun viloyat uchun yopiladi.** Sayt bo'yicha 10 daqiqada 20 ta javob
   kelgach, keyingi har bir respondent «Juda ko'p so'rovnoma yuborildi. Birozdan so'ng
   qayta urining» xatosini oladi. Viloyat miqyosidagi so'rov uchun bu to'liq to'siq.
2. **Adminlarni tizimdan chiqarib qo'yish mumkin.** Istalgan odam 10 marta noto'g'ri parol
   kiritib, 15 daqiqaga *barcha* adminlarni tizimga kira olmaydigan qilib qo'yadi.
3. **Ovozli yordamchi birinchi bo'lib ishdan chiqadi.** `/api/speak` ham umumiy 60 ta
   so'rovga sig'adi — ya'ni ko'zi ojiz foydalanuvchilar uchun mo'ljallangan funksiya
   eng tez tugaydi.

#### Qayerda

| Fayl:qator | Nima |
|---|---|
| `server/index.js:20` | `if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);` |
| `server/index.js:64–70` | `loginLimiter` — 15 daqiqada 10 urinish |
| `server/index.js:71–77` | `responseLimiter` — 10 daqiqada 20 javob |
| `server/index.js:81–87` | `voiceMatchLimiter` — 10 daqiqada 60 so'rov |
| `server/index.js:101–107` | `speakLimiter` — 10 daqiqada 60 so'rov |
| `server/.env` | `TRUST_PROXY=` (bo'sh) |

#### Tuzatish

1. `server/.env` ichida: `TRUST_PROXY=1` — kod buni allaqachon qo'llab-quvvatlaydi,
   qo'shimcha o'zgarish kerak emas.

2. Shundan keyin javob cheklovini haqiqiy foydalanuvchi xatti-harakatiga moslash.
   10 daqiqada 20 ta — bir odam uchun juda ko'p, shuning uchun bu ko'rsatkich aslida
   hech narsani himoya qilmaydi. Masalan:

```js
const responseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 soat
  limit: 5,                   // bir IP'dan 5 javob
  ...
});
```

> **⚠️ Muhim:** `TRUST_PROXY=1` ni **faqat** haqiqiy proksi (Cloudflare tunnel, nginx)
> orqadan turganda yoqish kerak. Aks holda cheklovni `X-Forwarded-For` sarlavhasini
> o'zgartirib chetlab o'tish mumkin bo'ladi — ya'ni tuzatish teskari ta'sir beradi.

#### Eslatma

Bu xatolik **M-3** (takroriy topshirish) bilan bog'liq: agar takrorni IP xeshi bo'yicha
to'sish yo'li tanlansa, X-2 tuzatilmagan holda **barcha** foydalanuvchilar bitta odam
sifatida ko'rinadi va birinchi javobdan keyin hech kim qatnasha olmaydi.

---

## X-3

### Admin sessiya cookie'si `Secure` belgisisiz yuboriladi

**Jiddiylik:** 🔴 Kritik

#### Ta'siri

Cookie'ning `secure` qiymati `NODE_ENV === 'production'` ga bog'langan, lekin `.env` da
`NODE_ENV` bo'sh qoldirilgan. Sayt esa tunnel orqali **HTTPS**'da ishlaydi.

Ya'ni admin sessiya kaliti shifrlanmagan ulanishga ham chiqishi mumkin va uni tarmoqni
tinglash orqali o'g'irlab, admin panelga to'liq kirish mumkin — parolni bilmasdan.

Bundan tashqari `NODE_ENV` bo'sh bo'lgani uchun xato xabarlarida server ichki tafsilotlari
klientga chiqadi (`server/index.js:661`).

#### Qayerda

```js
// server/index.js:11
const IS_PROD = process.env.NODE_ENV === 'production';

// server/index.js:33–38
cookie: {
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,   // ← hozir false
  maxAge: 8 * 60 * 60 * 1000
}

// server/index.js:661
res.status(500).json({ error: IS_PROD ? 'Server xatosi yuz berdi.' : String(err...) });
```

`server/.env`: `NODE_ENV=` (bo'sh)

#### Tuzatish

`server/.env` ichida:

```
NODE_ENV=production
```

Bitta qator — ikkita muammoni birdan yopadi (cookie himoyasi + xato xabarlari).

Mahalliy ishlab chiqishda (localhost, HTTP) uni bo'sh qoldirish to'g'ri, chunki `secure`
cookie HTTP orqali umuman ishlamaydi. Ya'ni ishlab chiqish va ishlab turgan server uchun
alohida `.env` kerak.

---

## X-4

### Rasmiy portal sinov tunneli orqali chiqarilgan

**Jiddiylik:** 🟠 Yuqori

#### Ta'siri

Sayt `trycloudflare.com` ning hisobsiz «quick tunnel» xizmati orqali ochilgan.
Cloudflare o'zi `tunnel.log` ning **birinchi qatorida** ogohlantiradi:

> Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a
> quick way to experiment and try it out. However, be aware that these account-less
> Tunnels have **no uptime guarantee**... If you intend to use Tunnels in production you
> should use a pre-created named tunnel.

Amaliy oqibatlar:

- **Manzil har qayta ishga tushganda o'zgaradi** — hozirgisi
  `https://intend-making-nice-playing.trycloudflare.com`. E'lon qilingan yoki Telegramda
  tarqatilgan havola server qayta ishga tushgach ishlamay qoladi.
- **Xizmat istalgan payt uzilishi mumkin**, javobgar tomon yo'q.
- **Server qo'lda ishga tushirilgan** — `server.pid` va bir qatorli `server.log` shuni
  ko'rsatadi. Ish stoli kompyuteri o'chsa yoki jarayon yiqilsa, sayt o'zi qaytmaydi.
- Jurnalda `TCP Connectivity ... FAIL — HTTP/2 connection is blocked or unreachable`
  yozuvi bor, tunnel «degraded transport» rejimida ishlayapti — ya'ni ulanish allaqachon
  to'liq sog'lom emas.

#### Qayerda

`tunnel.log` — `Settings: map[ha-connections:1 protocol:quic url:http://localhost:8080]`

#### Tuzatish

Ikki variant:

1. **O'z domeni bilan nomlangan Cloudflare tunneli** — bepul, manzil o'zgarmaydi,
   Cloudflare hisobiga bog'langan. Mavjud sxemani saqlab qolgan holda eng arzon yo'l.
2. **VPS + nginx + Let's Encrypt** — to'liq nazorat, davlat portali uchun odatiy yechim.

Ikkalasida ham serverni avtomatik qayta ishga tushadigan qilish kerak:
`pm2 start server/index.js --name htm-portal` yoki Windows xizmati (`nssm`).

Bu ish **X-1, X-2, X-3 tuzatilgandan keyin** bajarilsa to'g'ri bo'ladi — aks holda
zaifliklar barqaror manzilda qoladi.
