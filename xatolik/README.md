# Xatoliklar ro'yxati — So'rovnoma Portali

Tahlil sanasi: **30.07.2026**
Tekshirildi: 7 sahifa, 2 server moduli (`server/index.js`, `server/db.js`), `server/data/db.json`
Usul: qo'lda kod o'qish + ishlab turgan serverga `curl` so'rovlari (8099-portda vaqtincha ishga tushirilgan)

---

## ⚠️ Ogohlantirish: bu papka hozir internetdan ochiq

`server/index.js:655` butun loyiha ildizini statik fayl sifatida tarqatadi (xatolik **X-1**).
Ya'ni hozircha `https://<sayt>/xatolik/README.md` manzili bu faylni hammaga qaytaradi —
saytning barcha zaifliklari ro'yxati bilan birga.

**X-1 tuzatilmagunicha bu papkani serverdan yopib turish kerak.** Eng tez chora —
`server/index.js` da `express.static` dan oldin quyidagini qo'yish:

```js
app.use((req, res, next) => {
  if (/^\/(server|xatolik)\b/.test(req.path) || req.path.endsWith('.log')) {
    return res.status(404).send('Not found');
  }
  next();
});
```

To'liq yechim X-1 faylida yozilgan.

---

## Umumiy hisob

| Jiddiylik | Soni | Ma'nosi |
|---|---:|---|
| 🔴 Kritik | 3 | Ma'lumot sizib chiqishi — darhol tuzatish kerak |
| 🟠 Yuqori | 9 | Foydalanuvchi ishlatolmaydi yoki ma'lumot ishonchsiz |
| 🔵 O'rta | 13 | Sezilarli noqulaylik, aylanma yo'l bor |
| ⚪ Past | 9 | Sifat va pardozlash masalalari |
| **Jami** | **34** | |

---

## Fayllar

| Fayl | Mazmuni | Topilmalar |
|---|---|---:|
| [01-xavfsizlik.md](01-xavfsizlik.md) | Ma'lumotlarning ochiqligi, joylashtirish | 4 |
| [02-qulaylik.md](02-qulaylik.md) | Kirish imkoniyati, forma bilan ishlash | 10 |
| [03-koptillilik.md](03-koptillilik.md) | UZ / ЎЗ / RU / EN tarjimalari | 4 |
| [04-malumot-ishonchliligi.md](04-malumot-ishonchliligi.md) | Ko'rsatkichlar, javoblarni yig'ish, rollar | 5 |
| [05-kontent-havolalar.md](05-kontent-havolalar.md) | Ishlamaydigan havolalar, yo'q sahifalar | 6 |
| [06-tezlik-seo.md](06-tezlik-seo.md) | Yuklanish tezligi, meta teglar, indekslash | 5 |
| [00-yaxshi-ishlangan.md](00-yaxshi-ishlangan.md) | Buzib qo'ymaslik kerak bo'lgan 12 tomon | — |
| [tahlil.html](tahlil.html) | Butun tahlilning brauzerda o'qiladigan ko'rinishi | 34 |

---

## Eng muhim uchtasi

Qolgan hamma narsadan oldin shu uchtasi. Har uchalasi ham serverning bitta
sozlama xatosidan kelib chiqadi, ya'ni tuzatish arzon.

1. **[X-1](01-xavfsizlik.md#x-1)** — Butun ma'lumotlar bazasi (`db.json`), 18 ta zaxira nusxa,
   server kodi va `tunnel.log` internetdan parolsiz yuklab olinadi. Ichida admin emaillari,
   parol xeshlari va har bir respondentning javoblari bor.
2. **[X-2](01-xavfsizlik.md#x-2)** — `TRUST_PROXY` sozlanmagani uchun cheklovlar har bir
   foydalanuvchiga emas, hammaga birgalikda qo'llanadi: 20 ta javobdan keyin butun viloyat
   uchun so'rovnoma yopiladi, 10 ta noto'g'ri parol barcha adminlarni tizimdan chiqaradi.
3. **[Q-1](02-qulaylik.md#q-1)** — So'rovnomani klaviatura yoki ekran o'quvchi bilan
   to'ldirish mumkin emas. Sababi bitta CSS qatori, tuzatish 3–4 qator.

---

## Barcha topilmalar (bir jadvalda)

| ID | Jiddiylik | Xatolik | Asosiy fayl |
|---|---|---|---|
| [X-1](01-xavfsizlik.md#x-1) | 🔴 Kritik | Ma'lumotlar bazasi, zaxira nusxalar va server kodi parolsiz yuklab olinadi | `server/index.js:655` |
| [X-2](01-xavfsizlik.md#x-2) | 🔴 Kritik | Cheklovlar har bir foydalanuvchiga emas, hammaga umumiy qo'llanadi | `server/index.js:20` |
| [X-3](01-xavfsizlik.md#x-3) | 🔴 Kritik | Admin sessiya cookie'si `Secure` belgisisiz yuboriladi | `server/index.js:36` |
| [X-4](01-xavfsizlik.md#x-4) | 🟠 Yuqori | Rasmiy portal sinov tunneli (`trycloudflare.com`) orqali chiqarilgan | `tunnel.log` |
| [Q-1](02-qulaylik.md#q-1) | 🟠 Yuqori | Javob variantlari klaviatura va ekran o'quvchi uchun mavjud emas | `survey.html:106` |
| [Q-2](02-qulaylik.md#q-2) | 🟠 Yuqori | Xato faqat rang bilan bildiriladi, tushuntiruvchi matn yo'q | `survey.html:465` |
| [Q-3](02-qulaylik.md#q-3) | 🔵 O'rta | Barcha savollar majburiy, o'tkazib yuborish imkoni yo'q | `survey.html:462` |
| [Q-4](02-qulaylik.md#q-4) | 🔵 O'rta | Sahifa yangilansa, kiritilgan javoblar yo'qoladi | `survey.html:367` |
| [Q-5](02-qulaylik.md#q-5) | ⚪ Past | Yuborish xatosi `alert()` oynasida ko'rsatiladi | `survey.html:517` |
| [Q-6](02-qulaylik.md#q-6) | 🔵 O'rta | Bajarilish ko'rsatkichi ekran o'quvchiga bildirilmaydi | `survey.html:286` |
| [Q-7](02-qulaylik.md#q-7) | ⚪ Past | `<form>` elementi ishlatilmagan | `survey.html:290` |
| [Q-8](02-qulaylik.md#q-8) | 🟠 Yuqori | Yordamchi matnlar kontrasti AA talabidan past (3,1:1) | `index.html:12` |
| [Q-9](02-qulaylik.md#q-9) | ⚪ Past | Mobil menyu sarlavha bilan mos kelmaydi | `index.html:47` |
| [Q-10](02-qulaylik.md#q-10) | ⚪ Past | 404 sahifasi ingliz tilida, Express standarti | `server/index.js:656` |
| [T-1](03-koptillilik.md#t-1) | 🟠 Yuqori | RU va EN tugmalari bosh sahifani deyarli tarjima qilmaydi | `index.html` |
| [T-2](03-koptillilik.md#t-2) | 🔵 O'rta | Kirill yozuvi tayyor, lekin uni tanlash tugmasi yo'q | `index.html:507` |
| [T-3](03-koptillilik.md#t-3) | 🔵 O'rta | Til tanlagich qaysi til faol ekanini ko'rsatmaydi | `index.html:507` |
| [T-4](03-koptillilik.md#t-4) | ⚪ Past | Tarjima faylida ~30 ta ishlatilmaydigan kalit qolgan | `i18n.js` |
| [M-1](04-malumot-ishonchliligi.md#m-1) | 🟠 Yuqori | Admin panelda to'qib chiqarilgan raqamlar haqiqiy deb ko'rsatiladi | `admin.html:639` |
| [M-2](04-malumot-ishonchliligi.md#m-2) | 🟠 Yuqori | Server javoblarni so'rovnoma savollariga tekshirmaydi | `server/index.js:334` |
| [M-3](04-malumot-ishonchliligi.md#m-3) | 🟠 Yuqori | Takroriy topshirishni faqat brauzer to'sib turadi | `survey.html:362` |
| [M-4](04-malumot-ishonchliligi.md#m-4) | 🔵 O'rta | «Yarim qolgan javoblar» bo'limi adminning o'z brauzerini o'qiydi | `admin.html:1979` |
| [M-5](04-malumot-ishonchliligi.md#m-5) | 🔵 O'rta | Rollar va ruxsatlar hech narsani cheklamaydi | `server/index.js:41` |
| [K-1](05-kontent-havolalar.md#k-1) | 🔵 O'rta | Footerdagi 4 havola hech qayerga olib bormaydi (16 marta takrorlangan) | `index.html:713` |
| [K-2](05-kontent-havolalar.md#k-2) | 🔵 O'rta | «To'liq anonim» kafolati bor, maxfiylik siyosati sahifasi yo'q | — |
| [K-3](05-kontent-havolalar.md#k-3) | ⚪ Past | Oltita «Tafsilotlar» / «Batafsil» havolasi bo'sh (`href="#"`) | `index.html:634` |
| [K-4](05-kontent-havolalar.md#k-4) | ⚪ Past | Qidiruv tugmasi qidirmaydi | `index.html:525` |
| [K-5](05-kontent-havolalar.md#k-5) | 🔵 O'rta | Bosh sahifa «Faol so'rovnomalar» ostida faqat bittasini ko'rsatadi | `index.html:817` |
| [K-6](05-kontent-havolalar.md#k-6) | 🔵 O'rta | Saytning eskirgan nusxasi publik ochiq turadi (899 KB) | `Sorovnoma Portali.html` |
| [P-1](06-tezlik-seo.md#p-1) | 🟠 Yuqori | Hero rasmi 2,18 MB — telefonda ko'rinmasa ham yuklanadi | `bino.png` |
| [P-2](06-tezlik-seo.md#p-2) | ⚪ Past | Shriftlar tashqi CDN'dan yuklanadi | `index.html:7` |
| [P-3](06-tezlik-seo.md#p-3) | 🔵 O'rta | Sahifa tavsifi, ulashish teglari va favicon hech bir sahifada yo'q | barcha sahifalar |
| [P-4](06-tezlik-seo.md#p-4) | ⚪ Past | `robots.txt` / `sitemap.xml` yo'q, admin panel indekslashdan to'silmagan | — |
| [P-5](06-tezlik-seo.md#p-5) | 🔵 O'rta | CSS har bir sahifa ichida takrorlanadi, CSP o'chirilgan | `index.html`, `admin.html` |

---

## Tuzatish tartibi

### 1️⃣ Darhol — saytni yopib turib

**X-1, X-2, X-3, K-6, M-1**

Statik fayllarni `public/` papkaga ko'chirish, `NODE_ENV=production` va `TRUST_PROXY=1`
qo'yish, javob cheklovini qayta hisoblash, eski nusxa faylni olib tashlash, admin
paneldagi to'qib chiqarilgan raqamlarni o'chirish.

> **Muhim:** bazadagi parollarni ham almashtirish kerak — xeshlar allaqachon ochiq
> turgan bo'lishi mumkin.

### 2️⃣ Birinchi hafta — arzon, ta'siri katta

**Q-1, Q-2, Q-8, T-1, T-3, M-2, M-3, K-1, K-2, P-1, P-3**

Formani klaviatura va ekran o'quvchi uchun ishlaydigan qilish, xato matnlarini qo'shish,
matn kontrastini AA darajasiga chiqarish, bosh sahifani to'liq tarjima qilish, javoblarni
serverda tekshirish, hero rasmini siqish, meta va favicon qo'shish, maxfiylik siyosati
sahifasini yozish.

### 3️⃣ Keyingi bosqich — rejalashtirib

**Q-3, Q-4, Q-5, Q-6, Q-7, Q-9, Q-10, T-2, T-4, M-4, M-5, K-3, K-4, K-5, P-2, P-4, P-5, X-4**

Javoblarni brauzerda saqlash va tiklash, ixtiyoriy savollar, rollarni haqiqiy ishlaydigan
qilish, CSS'ni umumiy faylga chiqarish va CSP'ni yoqish, kirill tanlagichi, o'zbekcha 404,
nomlangan tunnel yoki VPS'ga o'tish, jarayonni avtomatik qayta ishga tushirish.

---

## Tahlil paytida saytga nima qilingan

- Server tekshirish uchun vaqtincha **8099-portda** ishga tushirildi (asosiy 8080 tegilmadi).
- **M-2** ni tasdiqlash uchun bazaga bitta sinov javobi yozildi va **darhol o'chirildi**;
  `db.json` dastlabki holatiga qaytarildi (`responses`: 2 → 1).
- Saytning boshqa hech bir fayli o'zgartirilmadi. Bu `xatolik/` papkasi — yangi qo'shilgan
  yagona narsa.
