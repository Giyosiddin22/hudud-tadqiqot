# 06 — Tezlik va topilish

| ID | Jiddiylik | Xatolik |
|---|---|---|
| [P-1](#p-1) | 🟠 Yuqori | Hero rasmi 2,18 MB — telefonda ko'rinmasa ham yuklanadi |
| [P-3](#p-3) | 🔵 O'rta | Sahifa tavsifi, ulashish teglari va favicon hech bir sahifada yo'q |
| [P-5](#p-5) | 🔵 O'rta | CSS har bir sahifa ichida takrorlanadi, CSP o'chirilgan |
| [P-2](#p-2) | ⚪ Past | Shriftlar tashqi CDN'dan yuklanadi |
| [P-4](#p-4) | ⚪ Past | `robots.txt` / `sitemap.xml` yo'q, admin panel indekslashdan to'silmagan |

---

## P-1

### Hero rasmi 2,18 MB — telefonda ko'rinmasa ham yuklanadi

**Jiddiylik:** 🟠 Yuqori

#### Ta'siri

`bino.png` siqilmagan holda **2 182 466 bayt** (2,18 MB).

CSS uni tor ekranlarda yashiradi:

```css
/* index.html:478–480 */
@media(max-width:1360px){
  .gov-hero-photo{display:none}
}
```

Lekin **`display:none` rasm yuklanishini to'xtatmaydi** — barcha asosiy brauzerlar
`<img>` ni `display:none` konteyner ichida ham yuklab oladi. Ya'ni:

- Telefondagi **har bir** tashrifchi ko'rmaydigan rasm uchun 2,18 MB mobil trafik sarflaydi
- 3G'da bu ~30–60 soniya
- Bosh sahifa «Faol so'rovnomalar» kartochkasi bilan birga yuklanishi kechikadi

Aholi orasida so'rov o'tkazish uchun **eng katta texnik yo'qotish shu bo'lishi mumkin**:
odam sahifa ochilishini kutmasdan chiqib ketadi va so'rovnomani hech ko'rmaydi.

#### Qayerda

`index.html:550–551` (rasm), `index.html:478–480` (yashirish)

```html
<div class="gov-hero-photo" style="position:absolute;...">
  <img src="bino.png" alt="Termiz Davlat Universiteti binosi" style="..." onerror="...">
</div>
```

#### Tuzatish

**1. Rasmni siqish.** WebP formatga o'tkazib ~150–200 KB gacha tushirish — vizual farq
sezilmaydi:

```bash
# ImageMagick yoki cwebp bilan
cwebp -q 82 -resize 1400 0 bino.png -o bino.webp
```

1400px kengligi yetarli, chunki rasm ekranning 58% qismini egallaydi.

**2. Tor ekranlarda umuman yuklamaslik.** `<picture>` + `media` bilan:

```html
<div class="gov-hero-photo">
  <picture>
    <source media="(min-width:1360px)" srcset="bino.webp" type="image/webp">
    <source media="(min-width:1360px)" srcset="bino.png">
    <!-- 1360px'dan tor ekranlarda hech qanday manba mos kelmaydi -->
    <img alt="Termiz Davlat Universiteti binosi" style="...">
  </picture>
</div>
```

`media` shartli `<source>` — brauzer shart bajarilmasa faylni **umuman so'ramaydi**.

**3. Ustuvorlikni to'g'ri belgilash.** Rasm ekranning yuqori qismida, shuning uchun
`loading="lazy"` **noto'g'ri** bo'ladi (kechikish qo'shadi). O'rniga:

```html
<img ... fetchpriority="high" decoding="async">
```

**Kutilayotgan natija:** telefonda bosh sahifa hajmi ~2,2 MB dan ~90 KB gacha tushadi.

---

## P-3

### Sahifa tavsifi, ulashish teglari va favicon hech bir sahifada yo'q

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Yettita sahifada ham quyidagilar **yo'q**:

| Teg | Soni | Oqibati |
|---|---:|---|
| `<meta name="description">` | 0 | Google natijalarida tasodifiy matn ko'rinadi |
| `og:title` / `og:description` / `og:image` | 0 | Telegram/Facebook'da havola quruq manzil bo'lib chiqadi |
| `<link rel="icon">` | 0 | Brauzer varag'ida bo'sh belgi |
| `twitter:card` | 0 | X/Twitter'da oldindan ko'rish yo'q |

So'rovnoma **asosan messenjerlar orqali tarqatiladigan** bo'lsa, bu tarqalishga bevosita
to'sqinlik qiladi. Telegramda `https://intend-making-nice-playing.trycloudflare.com`
degan quruq havola kelsa, odam uni ochishga ishonmaydi — davlat portali uchun ishonch
ayniqsa muhim.

#### Tuzatish

Har bir sahifaning `<head>` ga (matnni sahifaga qarab o'zgartirib):

```html
<meta name="description" content="Surxondaryo viloyati aholisi uchun rasmiy anonim so'rovnoma portali. TerDU va viloyat hokimligi hamkorligida.">

<meta property="og:type" content="website">
<meta property="og:site_name" content="So'rovnoma Portali">
<meta property="og:title" content="So'rovnoma Portali — Surxondaryo viloyati">
<meta property="og:description" content="Fikringizni bildiring — 2 daqiqada, to'liq anonim.">
<meta property="og:image" content="https://<sayt>/bino.webp">
<meta property="og:locale" content="uz_UZ">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
```

`og:image` uchun **P-1** da siqilgan `bino.webp` dan foydalanish mumkin (o'lchami
1200×630 ga yaqin bo'lsa yaxshi).

`favicon.svg` — sahifadagi hujjat belgisining o'zi (`index.html:517` dagi SVG) navi fonda:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#1c3f66"/>
  <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" fill="none" stroke="#fff" stroke-width="2"/>
  <path d="M14 3v6h6" fill="none" stroke="#fff" stroke-width="2"/>
</svg>
```

Bir soatlik ish, ta'siri sezilarli.

---

## P-5

### CSS har bir sahifa ichida takrorlanadi, CSP o'chirilgan

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Har bir sahifa o'z uslublarini `<style>` ichida saqlaydi:

| Fayl | Hajmi | Qatorlar |
|---|---:|---:|
| `admin.html` | 136 KB | 2 503 |
| `index.html` | 68 KB | 980 |
| `surveys.html` | 35 KB | 668 |
| `survey.html` | 32 KB | 767 |
| `about.html` | 27 KB | 475 |

Uch oqibat:

**1. Uslublar keshlanmaydi.** Har bir sahifaga o'tishda CSS qaytadan yuklanadi. Bosh
sahifadan so'rovnomaga o'tgan foydalanuvchi bir xil `:root` tokenlarini, sarlavha va
footer uslublarini ikkinchi marta yuklab oladi.

**2. Bitta o'zgarish 4 joyda takrorlanadi.** Masalan **Q-8** dagi kontrast tuzatishi
(`--text3`) to'rt faylda qo'lda o'zgartirilishi kerak va biri esdan chiqadi. Bu allaqachon
sodir bo'lgan: `index.html` da `.lang-dd*` uslublari bor, lekin ularga mos HTML yo'q
(**T-3**); `.stat-cards`, `.sidebar`, `.si-*`, `.map-*` kabi o'nlab klasslar ham oldingi
dizayndan qolgan va ishlatilmaydi.

**3. Bu CSP himoyasini o'chirishga majbur qilgan:**

```js
// server/index.js:22–26
// Security headers. CSP is disabled: every page here uses inline <style>/<script>
// blocks by design (no build step), which a default CSP would break wholesale.
app.use(helmet({ contentSecurityPolicy: false }));
```

Ya'ni XSS'ga qarshi **ikkinchi himoya qatlami yo'q**. Birinchi qatlam (`escHtml()`) yaxshi
qo'llangan, lekin bir joyda esdan chiqsa, CSP uni to'sib qolmaydi.

#### Tuzatish

Qurilish tizimi (webpack, vite) **kerak emas** — oddiy `<link>` kifoya:

**1-qadam.** Umumiy qismni bitta faylga chiqarish:

```
site.css   ← :root tokenlari, sarlavha, xizmat paneli, footer, tugmalar, tipografiya
```

```html
<link rel="stylesheet" href="site.css">
<style>/* faqat shu sahifaga xos uslublar */</style>
```

**2-qadam.** Ishlatilmaydigan klasslarni o'chirish. Tekshirish uchun:

```bash
# masalan .sidebar klassi ishlatiladimi?
grep -c 'class="[^"]*sidebar' *.html
```

**3-qadam.** Inline `<script>` larni tashqi faylga chiqarish (`home.js`, `survey-page.js`)
va inline `style="..."` atributlarini klasslarga o'tkazish — bu eng ko'p ish, lekin
shundan keyin CSP'ni yoqish mumkin bo'ladi:

```js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"]     // P-2 bajarilgandan keyin
    }
  }
}));
```

Bosqichma-bosqich bajarish mumkin: avval `site.css`, keyin skriptlar, oxirida CSP.

---

## P-2

### Shriftlar tashqi CDN'dan yuklanadi

**Jiddiylik:** ⚪ Past

#### Ta'siri

Barcha sahifalar shriftni Google'dan oladi:

```html
<!-- index.html:7 va boshqa sahifalarda -->
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&family=PT+Serif:wght@700&display=swap" rel="stylesheet">
```

Oqibatlari:

- **Render'ni to'sadi** — brauzer avval CSS faylni, keyin shrift fayllarini yuklaydi
  (ikki bosqichli kechikish)
- **Tashqi bog'liqlik** — Google Fonts ishlamasa yoki sekin javob bersa, sahifa ham
  kechikadi
- **Maxfiylik** — har bir tashrifchining IP manzili uchinchi tomonga yuboriladi. Fuqaro
  ma'lumotini yig'adigan va «to'liq anonim» deb kafolat beradigan davlat portali uchun
  bu e'tibor talab qiladigan holat (**K-2** ga qarang)
- Noto Sans'ning 5 ta og'irligi so'ralgan (400–800), lekin hammasi ishlatiladimi —
  tekshirilmagan

#### Tuzatish

Shrift fayllarini saytning o'ziga ko'chirish:

```
fonts/
├── noto-sans-400.woff2
├── noto-sans-600.woff2
├── noto-sans-700.woff2
└── pt-serif-700.woff2
```

```css
@font-face{
  font-family:'Noto Sans';
  src:url('fonts/noto-sans-400.woff2') format('woff2');
  font-weight:400; font-display:swap;
}
/* ... qolgan og'irliklar */
```

Faqat haqiqatan ishlatiladigan og'irliklarni olish. Tezlik ham oshadi (bitta domen,
bitta ulanish), tashqi bog'liqlik ham yo'qoladi, **P-5** dagi CSP ham osonlashadi.

Shriftlar SIL Open Font License ostida — saytga ko'chirish ruxsat etilgan.

---

## P-4

### `robots.txt` / `sitemap.xml` yo'q, admin panel indekslashdan to'silmagan

**Jiddiylik:** ⚪ Past

#### Ta'siri

Loyihada `robots.txt` ham, `sitemap.xml` ham yo'q. Ya'ni qidiruv tizimlari uchun hech
qanday ko'rsatma yo'q va `admin.html`, `admin-results.html` ham indekslanishi mumkin.

Bu buzilish emas — kirish baribir parol bilan himoyalangan. Lekin admin panelning
qidiruvda chiqishi keraksiz e'tibor tortadi va **X-1** dagi kabi zaifliklarni topishni
osonlashtiradi.

#### Tuzatish

**`robots.txt`** (publik papkaning ildiziga):

```
User-agent: *
Disallow: /admin.html
Disallow: /admin-results.html
Disallow: /api/
Allow: /

Sitemap: https://<sayt>/sitemap.xml
```

**`sitemap.xml`** — faqat publik sahifalar:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://<sayt>/</loc><priority>1.0</priority></url>
  <url><loc>https://<sayt>/surveys.html</loc><priority>0.9</priority></url>
  <url><loc>https://<sayt>/about.html</loc><priority>0.6</priority></url>
  <url><loc>https://<sayt>/privacy.html</loc><priority>0.4</priority></url>
</urlset>
```

`robots.txt` ko'rsatma, majburiy emas — shuning uchun admin sahifalariga qo'shimcha
himoya sifatida:

```html
<meta name="robots" content="noindex,nofollow">
```

Bu **X-4** (barqaror domen) bajarilgandan keyin ma'noga kiradi — hozirgi tunnel manzili
baribir o'zgarib turadi.
