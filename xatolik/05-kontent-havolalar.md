# 05 — Kontent va havolalar

| ID | Jiddiylik | Xatolik |
|---|---|---|
| [K-1](#k-1) | 🔵 O'rta | Footerdagi to'rtta havola hech qayerga olib bormaydi |
| [K-2](#k-2) | 🔵 O'rta | «To'liq anonim» kafolati bor, maxfiylik siyosati sahifasi yo'q |
| [K-5](#k-5) | 🔵 O'rta | Bosh sahifa «Faol so'rovnomalar» ostida faqat bittasini ko'rsatadi |
| [K-6](#k-6) | 🔵 O'rta | Saytning eskirgan nusxasi publik ochiq turadi |
| [K-3](#k-3) | ⚪ Past | Oltita «Tafsilotlar» / «Batafsil» havolasi bo'sh |
| [K-4](#k-4) | ⚪ Past | Qidiruv tugmasi qidirmaydi |

---

## K-1

### Footerdagi to'rtta havola hech qayerga olib bormaydi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

«Yordam» ustunidagi havolalar mavjud bo'lmagan `id` larga ishora qiladi:

| Havola | Manzil | Holat |
|---|---|---|
| Tez-tez so'raladigan savollar | `#faq` | ❌ bunday `id` yo'q |
| Metodologiya | `#methodology` | ❌ bunday `id` yo'q |
| Maxfiylik siyosati | `#privacy` | ❌ bunday `id` yo'q |
| Foydalanish shartlari | `#terms` | ❌ bunday `id` yo'q |
| Bog'lanish | `#aloqa` | ✅ ishlaydi |

`index.html` dagi barcha mavjud `id` lar: `aloqa`, `docs`, `gov-elonlar`, `gov-news`,
`gov-survey-card`, `gov-yangiliklar`, `nav-mob`, `partners`, `util-lang`, `va-btn`,
`va-status`.

Bu to'rtta buzilgan havola **to'rtta sahifada** takrorlanadi (`index.html`, `surveys.html`,
`survey.html`, `about.html` — oxirgi uchtasi `index.html#faq` shaklida), ya'ni jami
**16 ta ishlamaydigan havola**.

Bosilganda `index.html` ning tepasiga tushadi — foydalanuvchi sayt buzilgan deb o'ylaydi.

#### Qayerda

`index.html:713–716`, `surveys.html:375–378`, `about.html` va `survey.html` dagi
mos footer bloklari

#### Tuzatish

Kamida ikkitasi haqiqatan zarur (**K-2** ga qarang), shuning uchun:

1. **`privacy.html`** yozish — majburiy darajada zarur (K-2)
2. **`faq.html`** yozish — «anonimmi?», «qancha vaqt oladi?», «natijalar qayerda
   e'lon qilinadi?», «bir necha marta qatnashsam bo'ladimi?» kabi savollar
3. **`methodology.html`** — namuna hajmi, tanlash usuli, natijalarni qayta ishlash
4. **`terms.html`** — yoki bu havolani butunlay olib tashlash

Yozishga imkon bo'lmasa — havolalarni footerdan **olib tashlash**. Ishlamaydigan havola
yo'q havoladan yomonroq: birinchisi ishonchni buzadi, ikkinchisi shunchaki yo'q.

---

## K-2

### «To'liq anonim» kafolati bor, maxfiylik siyosati sahifasi yo'q

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Sayt bir necha joyda qat'iy kafolat beradi:

- `index.html:583` — «Javoblaringiz xavfsiz va anonim tarzda yuboriladi»
- `about.html` — «Javoblar to'liq anonim saqlanadi. Shaxsiy ma'lumotlar hech qanday
  shaklda to'planmaydi»
- Har bir so'rovnoma kartochkasida — «🔒 Anonim»

**Kod tekshiruvi bu da'volarni tasdiqlaydi.** Server javob bilan birga faqat quyidagini
saqlaydi:

```js
// server/db.js:149
const r = { id:..., surveyId, answers, submittedAt: new Date().toISOString() };
```

IP manzil ham, `User-Agent` ham, `Referer` ham, cookie ham yozilmaydi. Bu **maqtovga
sazovor** va ko'p loyihada bunday bo'lmaydi.

Muammo — bu da'voni tasdiqlaydigan **hujjat yo'q**:

- Foydalanuvchi «anonim» so'ziga ishonishi kerak, tekshirish imkoni yo'q
- Har bir so'rovnomaga avtomatik **hudud + jins + yosh** savollari qo'shiladi
  (`admin.html:2423–2427`). Kichik tumanda bu uchtasi birgalikda ba'zi hollarda
  shaxsni toraytirishi mumkin va foydalanuvchiga bu haqda aytilmaydi
- Natijalar qanday va qachon e'lon qilinishi yozilmagan
- Ma'lumot qancha vaqt saqlanishi yozilmagan

Fuqarodan ma'lumot yig'adigan davlat portali uchun bu hujjat **majburiy darajada zarur**.

#### Tuzatish

Qisqa `privacy.html` yozish. Kod allaqachon to'g'ri ishlayotgani uchun bu **faqat matn
yozish ishi** — texnik o'zgarish kerak emas. Yoritilishi kerak:

| Bo'lim | Mazmuni |
|---|---|
| Nima saqlanadi | Savollarga berilgan javoblar va yuborilgan vaqt |
| Nima saqlanmaydi | IP manzil, ism, telefon, email, qurilma ma'lumoti — hech biri |
| Demografik savollar | Hudud, jins, yosh nima uchun so'raladi va qanday ishlatiladi |
| Kim ko'radi | Faqat vakolatli tahlilchilar; individual javob e'lon qilinmaydi |
| Qancha turadi | Aniq muddat (masalan tadqiqot yakunlanganidan keyin 3 yil) |
| Natijalar | Qayerda va qanday shaklda (faqat jamlangan holda) e'lon qilinadi |
| Aloqa | Savol bo'lsa kimga murojaat qilish |

Shu bilan birga `faq.html` va `methodology.html` ni ham qo'yish **K-1** ni yopadi.

Qo'shimcha: so'rovnoma sahifasining boshida bir qatorli eslatma berish yaxshi bo'ladi —
«Bu so'rovnoma anonim: ismingiz ham, IP manzilingiz ham saqlanmaydi.
[Batafsil](privacy.html)».

---

## K-5

### Bosh sahifa «Faol so'rovnomalar» ostida faqat bittasini ko'rsatadi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Kod ro'yxatdan faqat birinchisini oladi:

```js
// index.html:817
const s = list[0];
```

Ya'ni bazada nechta so'rovnoma bo'lishidan qat'i nazar, **ko'plikda** yozilgan sarlavha
(«Faol so'rovnomalar») ostida **bittasi** chiqadi.

Hozir bazada bitta so'rovnoma bor, shuning uchun xato ko'rinmaydi. Ikkinchisi qo'shilgan
kunidan boshlab foydalanuvchi bosh sahifadan uni topa olmaydi — faqat «Barchasini
ko'rish →» havolasini bosgan odam ko'radi.

#### Qayerda

`index.html:804–840` (`loadHomeSurveys()`), aniq qator `:817`

#### Tuzatish

Kartochka yasash mantiqini funksiyaga ajratib, uchta-to'rttasini ko'rsatish:

```js
const shown = list.slice(0, 3);
wrap.innerHTML = shown.map(buildHomeCard).join('');
```

Kartochkalarni yonma-yon joylashtirish uchun o'ram qo'shish:

```js
wrap.style.display = 'grid';
wrap.style.gap = '16px';
wrap.style.gridTemplateColumns = 'repeat(auto-fit,minmax(300px,1fr))';
```

Yoki soddaroq: bittadan ko'p bo'lsa sarlavha yonida sonni ko'rsatish
(«Faol so'rovnomalar (4)») va uchtasini chizish.

**T-1** ni bajarish jarayonida bu funksiya baribir qayta yozilishi kerak, shuning uchun
ikkalasini birga qilish tejamli.

---

## K-6

### Saytning eskirgan nusxasi publik ochiq turadi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Loyiha ildizida `Sorovnoma Portali.html` nomli **899 KB**'lik fayl bor. Uning sarlavhasi —
`<title>Bundled Page</title>`, ya'ni bu saytning oldingi, bir faylga jamlangan nusxasi
(392 qator, ichida barcha CSS va JS).

**X-1** tufayli u `/Sorovnoma%20Portali.html` manzilida haqiqiy sayt bilan **yonma-yon
xizmat qiladi**:

- Qidiruv tizimlari indekslashi mumkin
- Kimdir eski ma'lumotni (eski so'rovnomalar, eski raqamlar, eski aloqa ma'lumotlari)
  haqiqiy deb o'qishi mumkin
- Har bir tashrifda 899 KB keraksiz trafik

Shuningdek `Ai.png` (133 KB) ham hech bir sahifada ishlatilmayotganga o'xshaydi —
tekshirish kerak.

#### Qayerda

`Sorovnoma Portali.html` (899 144 bayt), `Ai.png` (133 494 bayt)

#### Tuzatish

**X-1** dagi `public/` papkaga o'tish bu muammoni **o'zi hal qiladi** — eski nusxa
publik papkaga ko'chirilmaydi va avtomatik yopiladi.

Alohida ish sifatida: faylni `arxiv/` papkaga ko'chirish yoki o'chirish. Ishlatilmaydigan
rasmlarni tekshirish:

```bash
grep -l "Ai.png" *.html    # hech narsa chiqmasa — ishlatilmaydi
```

---

## K-3

### Oltita «Tafsilotlar» / «Batafsil» havolasi bo'sh

**Jiddiylik:** ⚪ Past

#### Ta'siri

Me'yoriy hujjatlar va hamkorlar bo'limlaridagi 6 ta havola `href="#"` ga ishora qiladi:

| Bo'lim | Havola | Qator |
|---|---|---|
| Me'yoriy hujjatlar | «Tafsilotlar →» — «Ta'lim to'g'risida»gi Qonun | `index.html:634` |
| Me'yoriy hujjatlar | «Tafsilotlar →» — Yoshlar siyosati qonuni | `index.html:642` |
| Me'yoriy hujjatlar | «Tafsilotlar →» — Viloyat hokimligi qarori | `index.html:650` |
| Hamkorlar | «Batafsil →» — Viloyat hokimligi | `index.html:669` |
| Hamkorlar | «Batafsil →» — TerDU | `index.html:677` |
| Hamkorlar | «Batafsil →» — Hududiy Tadqiqotlar Markazi | `index.html:685` |

Bosilganda sahifa tepasiga sakraydi. Foydalanuvchi buni xato deb qabul qiladi va
saytning qolgan qismiga ishonchi tushadi.

#### Tuzatish

**Eng tez yechim** — haqiqiy tashqi manzilga ulash:

- Hujjatlar → `lex.uz` dagi mos sahifa (masalan
  `https://lex.uz/docs/-5013007` kabi), `target="_blank" rel="noopener"` bilan
- Hamkorlar → ularning rasmiy sayti (`tersu.uz`, `surxondaryo.uz`)

Bunga imkon bo'lmasa — havolalarni **butunlay olib tashlash**. Kartochka o'zi kerakli
ma'lumotni beradi (hujjat nomi, yili, raqami), «Tafsilotlar» yozuvi majburiy emas.

---

## K-4

### Qidiruv tugmasi qidirmaydi

**Jiddiylik:** ⚪ Past

#### Ta'siri

Sarlavhadagi lupa belgisi shunchaki boshqa sahifaga o'tkazadi:

```html
<!-- index.html:525 -->
<button ... onclick="location.href='surveys.html'" aria-label="Qidirish">
  <svg><!-- lupa --></svg>
</button>
```

Foydalanuvchi qidiruv maydoni ochilishini kutadi (lupa belgisining umumiy ma'nosi shu),
o'rniga boshqa sahifaga tushadi va qidiruv maydonini **o'zi topishi** kerak bo'ladi.

#### Qayerda

`index.html:525`

#### Tuzatish

Eng oson yo'l — `surveys.html` dagi maydonga darhol fokus berish:

```html
<button onclick="location.href='surveys.html?focus=search'" aria-label="So'rovnoma qidirish">
```

```js
// surveys.html — init() ichida
if (new URLSearchParams(location.search).get('focus') === 'search') {
  document.getElementById('search-input').focus();
}
```

Bir necha qatorda bajariladi va foydalanuvchi kutgan natijaga yaqin bo'ladi.

To'liqroq variant — tugma bosilganda sarlavhada ochiladigan haqiqiy qidiruv maydoni,
lekin bu ko'proq ish va bosh sahifada qidiriladigan kontent hozircha kam.
