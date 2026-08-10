# 02 — Foydalanuvchi uchun qulaylik

Portalning butun maqsadi — odamdan javob olish. Shu sababli `survey.html` dagi
kamchiliklar boshqa hamma joydan muhimroq: bu yerdagi har bir to'siq to'g'ridan-to'g'ri
yig'ilmagan javobga aylanadi.

| ID | Jiddiylik | Xatolik |
|---|---|---|
| [Q-1](#q-1) | 🟠 Yuqori | Javob variantlari klaviatura va ekran o'quvchi uchun mavjud emas |
| [Q-2](#q-2) | 🟠 Yuqori | Xato faqat rang bilan bildiriladi, tushuntiruvchi matn yo'q |
| [Q-8](#q-8) | 🟠 Yuqori | Yordamchi matnlar kontrasti AA talabidan past |
| [Q-3](#q-3) | 🔵 O'rta | Barcha savollar majburiy, o'tkazib yuborish imkoni yo'q |
| [Q-4](#q-4) | 🔵 O'rta | Sahifa yangilansa, kiritilgan javoblar yo'qoladi |
| [Q-6](#q-6) | 🔵 O'rta | Bajarilish ko'rsatkichi ekran o'quvchiga bildirilmaydi |
| [Q-5](#q-5) | ⚪ Past | Yuborish xatosi `alert()` oynasida ko'rsatiladi |
| [Q-7](#q-7) | ⚪ Past | `<form>` elementi ishlatilmagan |
| [Q-9](#q-9) | ⚪ Past | Mobil menyu sarlavha bilan mos kelmaydi |
| [Q-10](#q-10) | ⚪ Past | 404 sahifasi ingliz tilida, Express standarti |

---

## Q-1

### Javob variantlari klaviatura va ekran o'quvchi uchun mavjud emas

**Jiddiylik:** 🟠 Yuqori · **Tuzatish hajmi:** 3–4 qator CSS

#### Ta'siri

`survey.html:106` da bitta qator:

```css
.opt input{display:none}
```

Bu haqiqiy `radio` / `checkbox` elementlarini yashiradi. Muammo shundaki, `display:none`
elementni **tab tartibidan** *va* **kirish imkoniyati daraxtidan** butunlay chiqarib
tashlaydi. Ko'rinadigan doiracha (`.opt-dot`) esa shunchaki bo'sh `<span>`, unda na
`role`, na `aria-checked` bor:

```html
<label class="opt">
  <input type="radio" name="q_dq1" value="Angor tumani">  <!-- display:none -->
  <span class="opt-dot"></span>                            <!-- bo'sh span -->
  <span class="opt-text">Angor tumani</span>
</label>
```

Natijada:

- **Tab** bosib variantga o'tolmaydi
- **Strelka** bilan variantlar orasida yurolmaydi (radio guruh navigatsiyasi ishlamaydi)
- **Ekran o'quvchi** (NVDA, TalkBack, VoiceOver) bitta ham savolni o'qib bermaydi

Sichqoncha va teginish bilan ishlaydi, chunki `<label>` o'rashi saqlangan. Ya'ni xato
oddiy sinovda ko'rinmaydi.

WCAG 2.1 **2.1.1 (Klaviatura)** va **4.1.2 (Nom, rol, qiymat)** talablarining
to'g'ridan-to'g'ri buzilishi.

> Bu ayni saytning o'zi ko'zi ojizlar uchun mo'ljallangan ovozli yordamchi bilan
> maqtanayotgan joyda. Ovozli yordamchi mikrofonni talab qiladi va faqat Chrome'da
> ishlaydi; ekran o'quvchi esa ko'zi ojiz foydalanuvchilarning asosiy vositasi va u
> umuman ishlamaydi.

#### Qayerda

`survey.html:106`

#### Tuzatish

`display:none` ni fokusni saqlaydigan yashirish uslubiga almashtirish:

```css
.opt input{
  position:absolute;
  opacity:0;
  width:1px;height:1px;
  margin:0;
  pointer-events:none;
}
```

So'ng fokus ko'rinadigan holatga ega bo'lishi kerak:

```css
.opt:has(input:focus-visible){
  outline:2px solid var(--gold);
  outline-offset:2px;
}
```

Vizual ko'rinish umuman o'zgarmaydi — faqat klaviatura bilan yurish va ekran o'quvchi
ishlay boshlaydi. `:has()` barcha zamonaviy brauzerlarda qo'llab-quvvatlanadi; eski
brauzerlar uchun `.opt input:focus-visible + .opt-dot` variantidan foydalanish mumkin.

#### Tekshirish

Tuzatgandan keyin sichqonchani chetga qo'yib, faqat klaviatura bilan so'rovnomani
to'liq to'ldirib ko'rish: **Tab** → savolga o'tish, **↑↓** → variant tanlash,
**Space** → checkbox belgilash, **Enter** → yuborish (Q-7 tuzatilgandan keyin).

---

## Q-2

### Xato faqat rang bilan bildiriladi, tushuntiruvchi matn yo'q

**Jiddiylik:** 🟠 Yuqori

#### Ta'siri

«Yuborish» bosilganda javobsiz savol qizil chegara va pushti fon oladi, sahifa unga
siljiydi — lekin **bitta ham so'z yozilmaydi**. Foydalanuvchi nima kerakligini taxmin
qilishi kerak.

- Rangni ajratmaydigan odam (daltonizm) umuman hech narsa sezmaydi — WCAG **1.4.1
  (Rangni ishlatish)** buzilishi
- `aria-invalid` yo'q, jonli xabar sohasi (`role="alert"`) yo'q — ekran o'quvchi ham jim qoladi
- Nechta savol qolgani aytilmaydi; uzun so'rovnomada foydalanuvchi qolganlarini qo'lda
  qidirishi kerak

#### Qayerda

`survey.html:465–494` (mantiq), `survey.html:83` (uslub):

```css
.q-block.err{border-color:var(--danger);border-left-color:var(--danger);background:#fdf1ef}
```

```js
// survey.html:465–468
if (!checked.length) {
  block.classList.add('err');       // ← faqat klass, matn yo'q
  if (!firstErr) firstErr = block;
  return;
}
```

#### Tuzatish

1. Har bir xatoli blokka matn qo'shish:

```js
if (!checked.length) {
  block.classList.add('err');
  block.querySelector('.q-err-msg').textContent = 'Bu savolga javob bering';
  block.querySelectorAll('input').forEach(i => i.setAttribute('aria-invalid','true'));
  ...
}
```

2. Yuborish panelining ustida jamlanma ko'rsatish:

```html
<div id="submit-err" role="alert" style="display:none"></div>
```

```js
document.getElementById('submit-err').textContent =
  errCount + ' ta savol javobsiz qoldi. Ular qizil rang bilan belgilandi.';
```

Matn + rang + `aria-invalid` — uch xil signal, uchalasi ham kerak.

---

## Q-8

### Yordamchi matnlar kontrasti AA talabidan past

**Jiddiylik:** 🟠 Yuqori · **Tuzatish hajmi:** 1 qator × 4 fayl

#### Ta'siri

`--text3:#8b93a1` oq fonda taxminan **3,1:1** kontrast beradi. WCAG AA oddiy matn uchun
**4,5:1** talab qiladi (18,66px qalin yoki 24px oddiy matndan kichik hamma narsa
«oddiy matn» hisoblanadi).

Bu rang eng ko'p ishlatiladigan joylarda turadi va **hammasi 10–12px**:

| Joy | Matn |
|---|---|
| So'rovnoma kartochkasi | «⏱ 5 daqiqa», «📋 12 savol» |
| Yangiliklar/e'lonlar | sanalar |
| Bosh sahifa chiplari | «📋 5 ta so'rovnoma» |
| Yuklanish holati | «Yuklanmoqda…» |
| Kartochka havolalari | `.card-lnk` |

Yorug'da telefonda o'qish qiyin, ko'zi kuchsiz foydalanuvchi uchun umuman o'qilmaydi.

#### Qayerda

To'rt faylda bir xil `:root` bloki takrorlangan (qarang **P-5**):

- `index.html:12`
- `surveys.html`
- `survey.html:25`
- `about.html`

#### Tuzatish

```diff
- --text3:#8b93a1;
+ --text3:#6b7480;
```

`#6b7480` oq fonda **4,6:1** beradi — AA talabini qondiradi va vizual ierarxiya saqlanadi
(asosiy matn `--text:#182233` dan hamon aniq ajralib turadi).

Tekshirilgan boshqa ranglar **muammosiz**:

| Token | Fon | Kontrast | Holat |
|---|---|---|---|
| `--text2:#5b6472` | oq | 6,0:1 | ✅ |
| `--gold-bright:#2563a1` | oq | 6,2:1 | ✅ |
| `--green:#2f7a52` | oq | 5,2:1 | ✅ |
| `#a9b6c9` | `#0f2740` | 7,4:1 | ✅ |
| `#8695ab` | `#0f2740` | 5,0:1 | ✅ |

---

## Q-3

### Barcha savollar majburiy, o'tkazib yuborish imkoni yo'q

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Yuborish uchun istisnosiz **har bir** savolga javob kerak. Admin panelda savolni ixtiyoriy
qilish sozlamasi yo'q, formada «Javob berishni istamayman» varianti yo'q.

Ijtimoiy so'rovnomada nozik savol chiqsa (daromad, siyosiy qarash, sog'liq), odam odatda
uni o'tkazib yuborishni xohlaydi. Bu yerda esa ikki yo'l qoladi: yolg'on javob berish yoki
formani tashlab ketish. Ikkinchisi ma'lumot sifati uchun yaxshiroq, lekin ishtirok darajasini
tushiradi; birinchisi esa **tadqiqot natijasini buzadi**.

Har bir so'rovnomaga avtomatik qo'shiladigan 3 ta demografik savol (hudud, jins, yosh) ham
majburiy — ular ham o'tkazib yuborilmaydi.

#### Qayerda

`survey.html:462–494` (tekshiruv), `admin.html:2410–2420` (savol yaratish)

#### Tuzatish

1. Savol obyektiga `required` maydonini qo'shish (sukut bo'yicha `true`):

```js
questions.push({
  id:'q'+(questions.length+1), text, type: multi?'checkbox':'radio',
  required: row.querySelector('.cb-qrequired')?.checked !== false,
  tag:'Maxsus', tagStyle:'gray', options:opts
});
```

2. `admin.html` da savol qatoriga belgilash oynasi qo'shish: «Bu savolga javob berish shart»

3. `survey.html` da ixtiyoriy savolga yozuv qo'shib, tekshiruvdan chiqarish:

```js
if (!checked.length) {
  if (q.required === false) return;   // ixtiyoriy — o'tkazib yuborish
  block.classList.add('err');
  ...
}
```

Server tomonidagi tekshiruv (`server/index.js:258`) buni allaqachon qabul qiladi — u faqat
savol matni va variantlar sonini tekshiradi, qo'shimcha maydonlarga xalaqit bermaydi.

---

## Q-4

### Sahifa yangilansa, kiritilgan javoblar yo'qoladi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

`localStorage` ga faqat «boshlandi» belgisi yoziladi, **javoblarning o'zi hech qachon
saqlanmaydi**:

```js
// survey.html:367
try { localStorage.setItem('s' + survey.id + '_started', '1'); } catch(e) {}
```

Tasodifan «orqaga» bosish, telefonda qo'ng'iroq kelishi, brauzer varag'ining yopilishi
yoki internet uzilishi 12 savolga berilgan javobni butunlay yo'q qiladi. Bunday holatda
odam qaytib boshdan boshlamaydi — so'rovnoma yo'qotiladi.

#### Qayerda

`survey.html:367`

#### Tuzatish

Har bir `change` hodisasida javoblar obyektini saqlash:

```js
function saveDraft(){
  const draft = {};
  survey.questions.forEach(q => {
    const checked = [...document.querySelectorAll(`input[name="q_${q.id}"]:checked`)];
    if (checked.length) draft[q.id] = checked.map(el => el.value);
  });
  try { localStorage.setItem('s'+survey.id+'_draft', JSON.stringify(draft)); } catch(e) {}
}
```

Sahifa ochilganda tiklash va foydalanuvchiga bildirish:

> «Oldingi javoblaringiz tiklandi. Boshidan boshlash uchun bu yerni bosing.»

Yuborilgandan keyin `_draft` ni o'chirish (`_started` bilan bir joyda, `survey.html:509`).

Bu **M-4** ni ham haqiqiy ishlaydigan qilish uchun asos beradi.

---

## Q-6

### Bajarilish ko'rsatkichi ekran o'quvchiga bildirilmaydi

**Jiddiylik:** 🔵 O'rta

#### Ta'siri

Yuqoridagi chizig'i va «3/12» hisobchisi faqat ko'z bilan ko'riladi. `role="progressbar"`,
`aria-valuenow` yo'q; o'zgarish jonli e'lon qilinmaydi. Ekran o'quvchi foydalanuvchisi
so'rovnomaning qancha qismi qolganini bilmaydi — uzun formada bu jiddiy noqulaylik.

#### Qayerda

```html
<!-- survey.html:286 -->
<div class="hdr-progress-track"><div class="hdr-progress-fill" id="hdr-progress-fill"></div></div>
```

`survey.html:451–455` — `updateProgress()` faqat `style.width` va `textContent` ni o'zgartiradi.

#### Tuzatish

```html
<div class="hdr-progress-track" id="hdr-progress" role="progressbar"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"
     aria-label="So'rovnoma bajarilish darajasi">
  <div class="hdr-progress-fill" id="hdr-progress-fill"></div>
</div>
<span class="hdr-count" id="hdr-count" aria-live="polite"></span>
```

```js
document.getElementById('hdr-progress')
  .setAttribute('aria-valuenow', Math.round(answered/total*100));
```

---

## Q-5

### Yuborish xatosi `alert()` oynasida ko'rsatiladi

**Jiddiylik:** ⚪ Past

#### Ta'siri

Yuborish muvaffaqiyatsiz bo'lsa, brauzerning tizim oynasi chiqadi:

```js
// survey.html:517
alert(T('err_generic'));   // "Xatolik yuz berdi. Qayta urinib ko'ring."
```

- Javoblar saqlandimi yoki yo'qmi — aytilmaydi
- Qayta urinish tugmasi yo'q, formani yana qidirib topish kerak
- Sabab ajratilmaydi: internet uzilishi, cheklov (**X-2**), server xatosi — hammasi
  bir xil xabar
- Cheklovga uchragan foydalanuvchi nima qilishni bilmaydi, holbuki server aniq
  tushuntirish qaytaradi: «Juda ko'p so'rovnoma yuborildi. Birozdan so'ng qayta urining.»

#### Qayerda

`survey.html:514–518`

#### Tuzatish

Sahifa ichidagi xato bloki — serverning o'z `error` matnini ko'rsatib:

```js
} catch(e) {
  btn.disabled = false;
  btn.textContent = T('submit_btn');
  const box = document.getElementById('submit-err');
  box.innerHTML = `<p>${esc(e.serverMessage || T('err_generic'))}</p>
    <p class="hint">Javoblaringiz brauzerda saqlanib turdi — yo'qolmaydi.</p>
    <button onclick="submitSurvey()">Qayta yuborish</button>`;
  box.style.display = 'block';
}
```

Ikkinchi jumla Q-4 tuzatilgandan keyin rost bo'ladi.

---

## Q-7

### `<form>` elementi ishlatilmagan

**Jiddiylik:** ⚪ Past

#### Ta'siri

Savollar oddiy `<div id="q-list">` ichida. Shu sababli:

- **Enter** bosib yuborib bo'lmaydi
- Brauzerning o'z tekshiruvi va avtomatik to'ldirishi ishlamaydi
- Ekran o'quvchi «forma» kontekstini bildirmaydi
- Har bir savol `<fieldset>` + `<legend>` ichida bo'lmagani uchun variantlar guruh
  sifatida o'qilmaydi — foydalanuvchi «3 dan 1» kabi mo'ljalni yo'qotadi

#### Qayerda

`survey.html:290–298`

#### Tuzatish

```html
<form id="survey-form" novalidate>
  <div id="q-list"></div>
  <button type="submit" class="btn-submit" id="btn-submit">Yuborish →</button>
</form>
```

```js
document.getElementById('survey-form').addEventListener('submit', e => {
  e.preventDefault();
  submitSurvey();
});
```

Har bir savol blokini `fieldset` qilish:

```html
<fieldset class="q-block" id="qb_q1">
  <legend class="q-header"><span class="q-num">1</span> <span class="q-text">...</span></legend>
  <div class="opts">...</div>
</fieldset>
```

**Q-1** va **Q-2** bilan bir vaqtda bajarilsa oson — uchalasi ham bir xil shablonga tegadi.

---

## Q-9

### Mobil menyu sarlavha bilan mos kelmaydi

**Jiddiylik:** ⚪ Past

#### Ta'siri

Mobil menyu qattiq qiymatga bog'langan:

```css
/* index.html:47 */
.nav-mob{display:none;position:fixed;top:116px;...}
```

`116px` = 4px rangli chiziq + 36px xizmat paneli + 76px sarlavha. Lekin sarlavha
`position:sticky;top:0` (`index.html:513`) — sahifa pastga siljitilgach yuqoridagi 40px
ketadi va sarlavha 0–76px oralig'ida qotib qoladi.

Natijada sarlavha bilan menyu orasida **40px'lik bo'sh joyda sahifa matni ko'rinib
turadi** — menyu «osilib qolgan» ko'rinishga keladi.

#### Qayerda

`index.html:47` (`.nav-mob`), `index.html:513` (sticky `header`)

#### Tuzatish

Menyuni `header` ning ichiga ko'chirib, unga nisbatan joylashtirish:

```css
header{position:sticky;top:0;z-index:300}
.nav-mob{position:absolute;top:100%;left:0;right:0;...}
```

Shunda qattiq `116px` qiymatiga bog'liqlik butunlay yo'qoladi va sarlavha qayerda
turishidan qat'i nazar menyu to'g'ri joyda ochiladi.

---

## Q-10

### 404 sahifasi ingliz tilida, Express standarti

**Jiddiylik:** ⚪ Past

#### Ta'siri

Mavjud bo'lmagan manzil Express'ning standart javobini qaytaradi:

```bash
curl -w "[%{http_code}]" http://localhost:8080/yoq-sahifa
```

```html
<!DOCTYPE html>
<html lang="en">
<head><title>Error</title></head>
<body><pre>Cannot GET /yoq-sahifa</pre></body>
</html>
[404]
```

Foydalanuvchi saytdan chiqib ketadi — qaytish havolasi ham, o'zbek tili ham, saytning
o'zi ham tanilmaydi. Havolada bitta harf xato bo'lsa (yoki **X-4** dagi tunnel manzili
o'zgarib ketgan bo'lsa), respondent shu sahifani ko'radi.

#### Qayerda

`server/index.js:656` dan keyin — 404'ni ushlab qoladigan middleware yo'q.

#### Tuzatish

Statik fayllardan **keyin**, xato ishlovchisidan **oldin**:

```js
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Bunday manzil topilmadi.' });
  }
  res.status(404).sendFile(path.join(SITE_ROOT, '404.html'));
});
```

`404.html` ni saytning uslubida yozish: rangli chiziq, sarlavha, «Sahifa topilmadi»,
bosh sahifa va so'rovnomalar sahifasiga havolalar.
