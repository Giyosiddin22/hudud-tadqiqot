# 03 — Ko'p tillilik

Sayt to'rt tilni (`uz-lat`, `uz-cyr`, `ru`, `en`) qo'llab-quvvatlashini va'da qiladi:
`i18n.js` da to'rt til to'liq tarjima qilingan, admin panelda «Tillar boshqaruvi» bo'limi
bor. Lekin foydalanuvchi ko'radigan natija va'dadan ancha uzoq.

| ID | Jiddiylik | Xatolik |
|---|---|---|
| [T-1](#t-1) | 🟠 Yuqori | RU va EN tugmalari bosh sahifani deyarli tarjima qilmaydi |
| [T-2](#t-2) | 🔵 O'rta | Kirill yozuvi tayyor, lekin uni tanlash tugmasi yo'q |
| [T-3](#t-3) | 🔵 O'rta | Til tanlagich qaysi til faol ekanini ko'rsatmaydi |
| [T-4](#t-4) | ⚪ Past | Tarjima faylida ~30 ta ishlatilmaydigan kalit qolgan |

---

## T-1

### RU va EN tugmalari bosh sahifani deyarli tarjima qilmaydi

**Jiddiylik:** 🟠 Yuqori

#### Ta'siri

`data-i18n` atributlari soni sahifa bo'yicha:

| Sahifa | `data-i18n` soni | Qamrov |
|---|---:|---|
| `about.html` | 21 | yaxshi |
| `survey.html` | 13 | qoniqarli |
| `surveys.html` | 10 | qoniqarli |
| **`index.html`** | **17** | **juda past — sahifa hajmiga nisbatan** |

`index.html` dagi 17 ta atribut faqat quyidagilarni qamraydi: navigatsiya (5 ta),
3 ta hujjat nomi + yili (6 ta), 3 ta hamkor nomi + tavsifi (6 ta).

**Qattiq o'zbekcha yozilgan va hech qachon tarjima qilinmaydigan qismlar:**

- Hero sarlavhasi — «Aholi fikri — rivojlanish poydevori»
- Hero tugmasi — «So'rovnomalarda qatnashish →»
- «Qanday ishlaydi?» bo'limi va uning 3 bosqichi (sarlavha + tavsif = 6 matn)
- Bo'lim sarlavhalari — «Faol so'rovnomalar», «Yangiliklar», «E'lonlar»,
  «Me'yoriy hujjatlar», «Hamkorlar»
- «Barchasini ko'rish →», «Tafsilotlar →», «Batafsil →»
- Xizmat panelidagi «Surxondaryo viloyati ijtimoiy tadqiqotlar tizimi»
- **Butun footer** — 3 ustun sarlavhasi, 10 havola, aloqa ma'lumotlari, mualliflik huquqi
- **JS yasaydigan so'rovnoma kartochkasi** (`index.html:820–838`) — «daqiqa»,
  «ta savol», «ishtirokchi», «Faol so'rovnoma», «So'rovnomani boshlash →»
- **JS yasaydigan e'lonlar** (`index.html:762–767`) — «YANGI», «E'LON» belgilari
- Yuklanish va bo'sh holat matnlari — «Yuklanmoqda...», «Hozircha faol so'rovnoma yo'q...»

Ya'ni rus tilidagi foydalanuvchi **RU** ni bosgach, taxminan sahifaning **oltidan bir**
qismi o'zgaradi, qolgani o'zbekcha qoladi. Bu tarjima yo'qligidan ko'ra yomonroq
taassurot qoldiradi: sayt buzilganga o'xshaydi.

#### Qayerda

`index.html` — butun fayl. Eng katta bo'shliqlar: `:505`, `:555–557`, `:564–586`,
`:591–592`, `:604`, `:612`, `:625`, `:660`, `:691–732`, `:762–767`, `:820–838`

#### Tuzatish

**1-qadam — statik matnlar.** Har biriga `data-i18n` qo'shish va `i18n.js` ga kalit yozish:

```html
<h1 ... data-i18n="home_hero_h1">Aholi fikri — rivojlanish poydevori</h1>
<a href="surveys.html" class="gov-btn-primary" data-i18n="home_hero_cta">So'rovnomalarda qatnashish →</a>
```

```js
// i18n.js — 'uz-lat'
home_hero_h1:'Aholi fikri — rivojlanish poydevori',
home_hero_cta:'So\'rovnomalarda qatnashish →',
// 'ru'
home_hero_h1:'Мнение населения — основа развития',
home_hero_cta:'Участвовать в опросе →',
```

**2-qadam — JS yasaydigan qismlar.** `surveys.html` da bu allaqachon **to'g'ri** qilingan:

```js
// surveys.html:455–462 — namuna sifatida olish kerak
window._onLangChange = function() {
  if (_allSurveys.length) {
    grid.innerHTML = _allSurveys.map(buildCard).join('');
    filterCards();
  }
};
```

`index.html` da xuddi shu naqshni qo'llash: `loadHomeSurveys()` va `renderAnnouncements()`
ichidagi matnlarni `LANG.t()` orqali olish va `window._onLangChange` da qayta chizish.
Ma'lumotlarni saqlab qo'yish kerak (`let _homeSurveys = []`), aks holda til
almashtirilganda serverga qayta murojaat qilinadi.

**3-qadam — tekshirish.** Har bir tilda bosh sahifani ochib, o'zbekcha qolgan matnni
ko'z bilan qidirish. Eng oson usul — `en` tiliga o'tib, kirill/lotin o'zbek harflarini
(`o'`, `g'`, `sh`, `ch`) qidirish.

---

## T-2

### Kirill yozuvi tayyor, lekin uni tanlash tugmasi yo'q

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

`uz-cyr` uchun **hamma narsa tayyor**:

- `i18n.js:65–119` — barcha 60+ kalit to'liq tarjima qilingan
- `i18n.js:251–253` — `LANG.toggleScript()` funksiyasi yozilgan
- `i18n.js:310–313` — `.ls-script` tugmasi mantiqi yozilgan («Lotin» ↔ «Крил»)
- `server/db.js:40–41` — baza `uz-cyr` tilini biladi
- `admin.html` — «Tillar boshqaruvi» bo'limida uni yoqib-o'chirish mumkin

Lekin barcha sahifalardagi **ko'rinadigan tanlagich faqat UZ | RU | EN** beradi:

```html
<!-- index.html:507 -->
<a href="#" onclick="pickLang('uz-lat');return false" ...>UZ</a>|
<a href="#" onclick="pickLang('ru');return false" ...>RU</a>|
<a href="#" onclick="pickLang('en');return false" ...>EN</a>
```

Tayyor ish foydalanuvchiga yetib bormaydi. Surxondaryoda kirill yozuvida o'qishga
o'rgangan katta yoshli aholi ulushi sezilarli — ular uchun bu bevosita yo'qotish.
Admin «Tillar boshqaruvi» da kirillni yoqsa ham, saytda hech narsa o'zgarmaydi.

#### Qayerda

`index.html:507`, `survey.html:258`, `surveys.html:279`, `about.html:182`

#### Tuzatish

To'rtinchi variantni qo'shish:

```html
<span id="util-lang">
  <a href="#" class="ls-btn" data-lang="uz-lat" onclick="pickLang('uz-lat');return false">UZ</a>
  <span>|</span>
  <a href="#" class="ls-btn" data-lang="uz-cyr" onclick="pickLang('uz-cyr');return false">ЎЗ</a>
  <span>|</span>
  <a href="#" class="ls-btn" data-lang="ru" onclick="pickLang('ru');return false">RU</a>
  <span>|</span>
  <a href="#" class="ls-btn" data-lang="en" onclick="pickLang('en');return false">EN</a>
</span>
```

`class="ls-btn" data-lang="..."` qo'shilishi **T-3** ni ham birdan hal qiladi.

Admin panelda kirill o'chirilgan bo'lsa, `i18n.js:296–297` uni avtomatik yashiradi —
bu mantiq allaqachon yozilgan va ishlaydi.

---

## T-3

### Til tanlagich qaysi til faol ekanini ko'rsatmaydi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Xizmat panelidagi UZ havolasiga rang **qattiq yozilgan**:

```html
<a href="#" onclick="pickLang('uz-lat');..." style="color:#fff;font-weight:600">UZ</a>
<a href="#" onclick="pickLang('ru');..." style="color:#a9b6c9">RU</a>
```

`LANG.apply()` faol holatni `.ls-btn` va `.lang-dd-item` klasslari orqali yangilaydi
(`i18n.js:288–291`, `:316–324`), lekin **bu klasslar aynan shu tanlagich markupida yo'q**.

Natijada RU ga o'tgandan keyin ham UZ oq va qalin ko'rinib turadi. Foydalanuvchi bosish
ta'sir qildimi yoki yo'qmi bilmaydi — ayniqsa **T-1** tufayli sahifaning ko'p qismi
o'zbekcha qolgani uchun, u bosish ishlamadi deb o'ylaydi.

Bundan tashqari `index.html` da `.lang-dd` (til dropdown) uchun ~15 qator CSS yozilgan
(`:56–70`), lekin unga mos HTML hech qayerda yo'q — o'lik uslub.

#### Qayerda

`index.html:507`, `survey.html:258`, `surveys.html:279`, `about.html:182`

#### Tuzatish

Havolalarga klass va `data-lang` qo'shib, qattiq yozilgan inline ranglarni olib tashlash
(**T-2** dagi kod bilan bir xil), so'ng CSS'da holatni belgilash:

```css
#util-lang .ls-btn{color:#a9b6c9;font-weight:400}
#util-lang .ls-btn.ls-on{color:#fff;font-weight:600}
```

Shundan keyin mavjud `LANG.apply()` mantiqi o'zi ishlaydi — JS'ga tegish kerak emas.

Ishlatilmaydigan `.lang-dd*` uslublarini `index.html` dan o'chirish (**T-4** va **P-5**
bilan birga).

---

## T-4

### Tarjima faylida ishlatilmaydigan kalitlar qolgan

**Jiddiylik:** ⚪ Past

#### Ta'siri

`i18n.js` da bosh sahifaning **oldingi dizayniga** tegishli kalitlar qolgan va hozir
hech qayerda ishlatilmaydi:

`hero_badge`, `hero_h1`, `hero_desc`, `stat_participants`, `stat_surveys`,
`stat_districts`, `stat_minutes`, `btn_participate`, `btn_about`, `map_title`, `map_sub`,
`docs_label`, `docs_title`, `partners_title`, `contact_label`, `contact_title`,
`contact_text`, `footer_copy`, `footer_surveys`, `footer_admin`, `nav_all`, `nav_active`,
`nav_inactive`, `nav_partners`, `nav_contact`, `mob_all`, `mob_active`, `mob_inactive`,
`mob_docs`, `mob_about`, `mob_partners`, `mob_contact`, `mob_cta`, `mob_home`,
`f_inactive`, `surveys_back`, `tooltip_part`

~37 ta kalit × 4 til = **~150 o'lik qator**.

Bu keyingi tahrirlovchini chalg'itadi: kalit borligini ko'rib, sahifa tarjima qilingan
deb o'ylaydi. Aslida **T-1** dagi haqiqiy bo'shliqlar boshqa joyda.

Ba'zilari eskirgan **ma'lumotni** ham saqlab turadi va ular ayniqsa xatarli:

```js
chip_count:'📋 5 ta so\'rovnoma',    // aslida bazada 1 ta
chip_time:'⏱ 5–6 daqiqa',           // aslida 2 daqiqa
about_s2:'Faol so\'rovnoma',        // yonidagi raqam ham qattiq yozilgan
about_6_p:'...Har bir so\'rovnoma atigi 5 daqiqa.',
```

`chip_count` va `chip_time` `surveys.html` da ishlatiladi, lekin JS ularni darhol haqiqiy
qiymat bilan almashtiradi (`surveys.html:507–518`) — ya'ni foydalanuvchi bir lahza
noto'g'ri raqamni ko'rib qoladi.

#### Qayerda

`i18n.js:8–233` — barcha to'rt til bloki

#### Tuzatish

**T-1** ni bajarish jarayonida haqiqatan ishlatilgan kalitlar ro'yxatini yig'ish:

```bash
grep -oh 'data-i18n[a-z-]*="[^"]*"' *.html | grep -o '"[^"]*"' | tr -d '"' | sort -u
grep -oh "LANG.t('[^']*')" *.html | grep -o "'[^']*'" | tr -d "'" | sort -u
```

Shu ro'yxatga kirmagan kalitlarni o'chirish. Eskirgan raqamli kalitlarni (`chip_count`,
`chip_time`) esa raqamsiz shablonga aylantirish:

```js
chip_count_tpl:'📋 {n} ta so\'rovnoma',
```

Shunda JS almashtirmagan holatda ham noto'g'ri son ko'rinmaydi.
