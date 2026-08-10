# Bosh sahifadagi barcha tugma va belgilar — to'liq izoh

> **Eslatma:** Bosh sahifa (va so'rovnomalar/so'rovnoma/loyiha haqida sahifalari) rasmiy "davlat portali" uslubida butunlay qayta qurilgan (Noto Sans + PT Serif shrift, to'q ko'k #1c3f66 rang, tekis/soyasiz dizayn). Quyida **hozirgi, joriy holat** tasvirlangan.

## 1. Eng yuqori — 3 rangli chiziq va xizmat paneli

- Yupqa 3 rangli chiziq (ko'k / kulrang / yashil) — sof dekorativ
- To'q-ko'k xizmat paneli: chapda "Surxondaryo viloyati ijtimoiy tadqiqotlar tizimi" yozuvi, o'ngda **UZ | RU | EN** til havolalari — bosilganda til darhol almashadi

## 2. Asosiy header

| Element | Vazifasi |
|---|---|
| 📋 logotip + "So'rovnoma Portali" / "TerDU · Surxondaryo viloyati hokimligi" | Brend belgisi, bosilmaydi |
| 🔍 Qidiruv tugmasi | surveys.html sahifasiga o'tkazadi |
| ☰ (faqat mobil/tor ekranda) | Yon menyuni ochadi/yopadi |
| Nav qatori: **So'rovnomalar, Me'yoriy hujjatlar, Loyiha haqida, Yangiliklar, Aloqa** | Mos ravishda: surveys.html; shu sahifadagi #docs bo'limi; about.html; "Yangiliklar" bo'limiga sirg'alish; footerdagi Aloqa bo'limiga sirg'alish |

## 3. Hero (bosh banner)

- Katta sarlavha: **"Aholi fikri — rivojlanish poydevori"**
- **"So'rovnomalarda qatnashish →"** tugmasi — surveys.html'ga o'tadi
- O'ngda Termiz Davlat Universiteti binosi rasmi (diagonal kesilgan, faqat ≥1360px kengroq ekranlarda ko'rinadi, tor ekranlarda yashiriladi — matn bilan to'qnashmasligi uchun)

## 4. "Qanday ishlaydi?" bo'limi

3 bosqichli tushuntirish (raqam + sarlavha + tavsif, ustida ingichka chiziq bilan): **1) So'rovnomani tanlang → 2) Savollarga javob bering → 3) Yuboring**

## 5. "Faol so'rovnomalar" bo'limi

- Bitta katta, chegarali karta — **backenddan haqiqiy ma'lumot** bilan to'ladi (hozircha 1 ta real so'rovnoma: "Sport bo'yicha ijtimoiy so'rovnoma")
- Ko'rsatiladi: kategoriya belgisi, sarlavha, tavsif, ⏰ vaqt / 📋 savollar soni / 👥 ishtirokchilar soni (hammasi real), "● Faol so'rovnoma" holati
- **"So'rovnomani boshlash →"** tugmasi — survey.html sahifasiga (aynan shu so'rovnoma id'si bilan) o'tkazadi
- "Barchasini ko'rish →" havolasi — surveys.html'ga o'tadi

## 6. "Yangiliklar" va "E'lonlar" (ikki alohida ustun)

- Backenddagi e'lonlar avtomatik ikkiga bo'linadi: "natija"/"yangi" so'zlari bor matnlar — **Yangiliklar** ustuniga, qolganlari — **E'lonlar** ustuniga tushadi
- Har bir qator: rangli kategoriya belgisi (NATIJALAR/YANGI/E'LON), matn, sana

## 7. "Me'yoriy hujjatlar" bo'limi (#docs)

3 ta hujjat kartasi (ingichka chiziqli grid, soyasiz) — har birida icon, sarlavha, yil/izoh va **"Tafsilotlar →"** havolasi (hozircha `#`ga ishora qiladi, real hujjat sahifasi yo'q).

## 8. "Hamkorlar" bo'limi (#partners → index.html'da endi shu joyda)

3 ta tashkilot kartasi (Viloyat hokimligi, TerDU, Hududiy Tadqiqotlar Markazi), har birida qisqa harf-belgisi (SH/TD/HT) va **"Batafsil →"** havolasi (hozircha `#`).

## 9. Footer (to'q-ko'k, 4 ustunli)

- Sayt nomi + qisqa tavsif
- **Tezkor havolalar** — Bosh sahifa, So'rovnomalar, Loyiha haqida, Me'yoriy hujjatlar, Yangiliklar
- **Yordam** — FAQ, Metodologiya, Maxfiylik siyosati, Foydalanish shartlari, Bog'lanish (bir nechtasi hali `#faq` kabi ishora qiladi, real sahifa yo'q)
- **Aloqa** — real manzil ("Barkamol avlod" ko'chasi 43-uy), ishonch telefoni (76 221 74 55), qo'shimcha raqam (76 221 76 90), email (info@tersu.uz)

## 10. 🎙️ Ovozli yordamchi (pastki-o'ng burchakda, barcha sahifalarda)

Ko'zi ojiz foydalanuvchilar uchun. Bosilganda Gemini (yoki zaxira variant OpenAI) orqali tabiiy ovozda sahifani o'qib beradi, ovozli buyruqlarni tinglaydi ("so'rovnomalar", "to'xta" va h.k.).

---

**Eng ehtimoliy so'raladigan savollar:**

1. **"Nega 'Tafsilotlar'/'Batafsil' havolalari hech qayerga olib bormaydi?"** — Bu hujjat/hamkor sahifalari hali alohida yaratilmagan, hozircha faqat kartochka ko'rinishida ma'lumot beriladi.
2. **"Nega admin panel boshqacha ko'rinadi?"** — Foydalanuvchiga ko'rinadigan sahifalar yaqinda yangi rasmiy uslubga o'tkazildi, lekin admin panel hozircha eski dizaynda qoldirildi (funksionallikka ta'sir qilmaydi, faqat vizual farq).

---
---

# Admin panel — barcha tugma va bo'limlar haqida to'liq izoh

Admin panelga kirish: `admin.html` sahifasi, parol orqali (bir xil parol barcha admin foydalanuvchilar uchun umumiy — alohida login/parol tizimi yo'q, bu haqiqat "Rollar" bo'limida ham yozib qo'yilgan).

## 1. Yon panel (chap tomondagi navigatsiya)

Bo'limlar 5 guruhga bo'lingan:

**ASOSIY**
- **Umumiy ko'rinish** — admin panelga kirgandagi bosh sahifa (dashboard), barcha muhim ko'rsatkichlar shu yerda jamlangan

**SO'ROVNOMALAR**
- **So'rovnoma yaratish** — yangi so'rovnoma qurish formasi
- **So'rovnomalar** — barcha mavjud so'rovnomalar ro'yxati va ularni tahrirlash
- **Savollar banki** — barcha so'rovnomalardagi savollarni bir joyda ko'rish
- **Javoblar** — kelib tushgan javoblarni ko'rish
- **Yarim qolgan javoblar** — forma ochib, oxirigacha yuborilmagan urinishlar ro'yxati (shu brauzerda)

**NATIJALAR VA TAHLIL**
- **Natijalar va hisobotlar** — har bir so'rovnoma bo'yicha batafsil natijalar sahifasiga (admin-results.html) o'tish
- **Hududlar statistikasi** — 15 tuman bo'yicha ishtirok jadvali
- **Qamrov monitoringi** — qaysi hududlarda so'rov yetarlicha o'tkazilmaganini kuzatish

**FOYDALANUVCHILAR**
- **Foydalanuvchilar** — admin foydalanuvchilar ro'yxati (nomi, emaili, roli)
- **Rollar va ruxsatlar** — rol turlari va ularga biriktirilgan huquqlar ro'yxati

**TIZIM BOSHQARUVI**
- **Xabarlar va e'lonlar** — bosh sahifadagi "So'nggi e'lonlar" blokini boshqarish
- **Tillar boshqaruvi** — saytda qaysi tillar (Lotin, Kirill, Rus, Ingliz) yoqiq/o'chiqligini boshqarish
- **Sozlamalar** — sayt nomi, admin parolini o'zgartirish/tiklash
- **Audit log** — kim, qachon, nima qilgani haqidagi tarixiy yozuvlar (parol o'zgartirish, eksport qilish va h.k.)

Yon panelning pastida:
- **"🌐 Saytga qaytish"** — ochiq (public) saytga (index.html) o'tadi
- **"🔴 Chiqish"** — admin sessiyasidan chiqadi (logout)

## 2. Yuqori panel (Topbar)

- **☰** — mobil rejimda yon panelni ochish/yopish
- Bo'lim nomi (masalan "Umumiy ko'rinish") — hozir qaysi bo'limda turganingizni ko'rsatadi
- **"🔴 Real vaqt"** — ma'lumotlar jonli yangilanib turishini bildiruvchi belgi
- **🔔 (bildirishnoma belgisi)** — hozircha dekorativ, real bildirishnoma tizimi yo'q
- **Avatar + "Admin" / "Super administrator"** — kim tizimga kirganini ko'rsatuvchi belgi (real, alohida foydalanuvchi hisoblari emas — tizimda faqat bitta umumiy admin kirish parolidan foydalaniladi)

## 3. "Umumiy ko'rinish" (Dashboard) sahifasi

### Tezkor amallar (5 ta katak)
- **"Yangi so'rovnoma yaratish"** → "So'rovnoma yaratish" bo'limiga o'tadi
- **"So'rovnomalarni ko'rish"** → "So'rovnomalar" bo'limiga o'tadi
- **"Natijalarni ko'rish"** → "Natijalar va hisobotlar" bo'limiga o'tadi
- **"Hisobot yaratish"** → hududlar bo'yicha ishtirok hisobotini CSV formatda darhol yuklab beradi
- **"Ma'lumot eksporti"** → barcha so'rovnoma va javoblarni JSON formatda yuklab beradi

### Statistik kartalar
- **"Jami javoblar"** — barcha so'rovnomalarga kelgan javoblar soni
- **"Faol so'rovnomalar"** — real backenddan olingan, saytda nechta so'rovnoma borligini ko'rsatadi
- **"Tumanlar qamrovi"**, **"O'rtacha to'ldirish vaqti"**, **"Yakunlash darajasi"** — hozircha namunaviy (demo) ko'rsatkichlar

### "So'rovnomalar ro'yxati" jadvali
Har bir qatorda so'rovnoma nomi, holati ("Tayyor"/"Maxsus"), javoblar soni, oxirgi javob vaqti va ikkita tugma:
- **"Ko'rish"** — o'sha so'rovnomaning batafsil natijalar sahifasini (admin-results.html) ochadi
- **"Tahrir"** — "So'rovnomalar" bo'limiga o'tkazadi, u yerdan tahrirlash mumkin

### Boshqa kartalar
- **"Hududlar xaritasi"** — bosh sahifadagilar bilan bir xil, faqat admin ko'rinishida
- **"Javoblar dinamikasi"** — kunlik javoblar grafigi
- **"So'nggi faoliyatlar"** va **"Qamrov bo'yicha ogohlantirishlar"** — hozircha namunaviy (demo) ma'lumotlar

## 4. "So'rovnoma yaratish" bo'limi

Yangi so'rovnoma qurish formasi:
- **Sarlavha, Qisqa tavsif, To'liq tavsif** — matn maydonlari
- **Vaqt (daqiqa)** — so'rovnomani to'ldirish taxminiy vaqti
- **Rang mavzusi** — 5 rangdan birini tanlash (kartochka rangini belgilaydi)
- **"Standart demografik savollarni qo'shish (hudud, jins, yosh)"** — belgilansa, har bir so'rovnomaga avtomatik 3 ta savol (hududingiz, jinsingiz, yoshingiz) qo'shiladi
- **"+ Savol qo'shish"** — yangi savol qatori qo'shadi; har bir savolda:
  - Savol matni
  - **"Bir nechta variant tanlash mumkin"** — belgilansa, foydalanuvchi javob berayotganda bir nechta variantni tanlashi mumkin bo'ladi (checkbox), aks holda faqat bittasini (radio)
  - **"+ Variant qo'shish"** — javob variantlarini ko'paytiradi
- **"💾 So'rovnomani saqlash"** — so'rovnomani backendga yuboradi, saqlangach darhol saytda ko'rina boshlaydi

## 5. "So'rovnomalar" bo'limi

Barcha so'rovnomalar jadvali — nomi, savollar soni, vaqt, holati. Har biri uchun **"Ko'rish"** (natijalar sahifasi) va **"Tahrir"** (to'liq tahrirlash paneli — sarlavha, tavsif, savollar, variantlarni o'zgartirish) tugmalari. Faqat o'zingiz yaratgan ("Maxsus") so'rovnomalar tahrirlanadi.

## 6. "Savollar banki" va "Javoblar" bo'limlari

- **Savollar banki** — barcha so'rovnomalardagi savollarni ro'yxat ko'rinishida ko'rsatadi
- **Javoblar** — har bir so'rovnomaga kelgan javoblarni jadval ko'rinishida ko'rsatadi

Har bir so'rovnoma qatorida **"🤖 AI xulosa"** tugmasi bor — bosilsa, o'sha so'rovnomaning barcha javoblarini AI (ChatGPT/Gemini) orqali tahlil qilib, qisqacha xulosa chiqaradi (javob bo'lmasa tugma faolsizlanadi).

## 7. "Yarim qolgan javoblar" bo'limi

Foydalanuvchi so'rovnomani ochib, lekin oxirigacha yubormagan holatlarni ko'rsatadi (faqat shu qurilma/brauzerda kuzatiladi, umumiy statistika emas).

## 8. "Natijalar va hisobotlar" bo'limi

Har bir so'rovnoma uchun alohida karta — bosilsa, o'sha so'rovnomaning to'liq natijalar sahifasiga (savol-javob taqsimoti, hudud kesimi, kunlik dinamika) o'tkazadi.

## 9. "Hududlar statistikasi" va "Qamrov monitoringi"

15 tuman bo'yicha ishtirok ko'rsatkichlari va qaysi hududlar maqsad darajasidan orqada qolayotganini ko'rsatadi (hozircha namunaviy ma'lumotlar asosida).

## 10. "Foydalanuvchilar" bo'limi

- **"+ Foydalanuvchi qo'shish"** — yangi admin foydalanuvchi (ism, email, rol) qo'shadi
- Har bir foydalanuvchi qatorida o'chirish imkoniyati bor
- **Eslatma:** bu ro'yxat faqat "kim mas'ul" degan ma'lumot uchun — tizimga kirish uchun baribir bitta umumiy parol ishlatiladi, har bir foydalanuvchining alohida login-paroli yo'q

## 11. "Rollar va ruxsatlar" bo'limi

- **"+ Rol qo'shish"** — yangi rol turi (masalan "Moderator") va unga tegishli huquqlar ro'yxatini yaratadi
- Rol o'chirilishi mumkin, lekin agar shu rolga biriktirilgan foydalanuvchi bo'lsa, avval ularni boshqa rolga o'tkazish kerak
- **Muhim eslatma (panelda ham yozilgan):** bu huquqlar checkbox'lari hozircha faqat ma'lumot xarakterida — ular real ravishda kirish huquqini cheklamaydi, chunki tizimda yagona umumiy parol ishlatiladi

## 12. "Xabarlar va e'lonlar" bo'limi

- **"+ Qo'shish"** — yangi e'lon (sana + matn) qo'shadi, bosh sahifadagi "So'nggi e'lonlar" blokida darhol ko'rinadi
- Har bir e'lonni o'chirish mumkin

## 13. "Tillar boshqaruvi" bo'limi

Har bir til (Lotin, Kirill, Rus, Ingliz) yonida yoqish/o'chirish tugmasi — o'chirilgan til saytdagi til almashtirgichda endi ko'rinmaydi.

## 14. "Sozlamalar" bo'limi

- Sayt nomini o'zgartirish
- **"Standart holatga qaytarish"** — admin parolini boshlang'ich holatga (`admin2026`) qaytaradi, bosishdan oldin tasdiqlash so'raladi (chunki bu og'ir/qaytarib bo'lmaydigan amal)

## 15. "Audit log" bo'limi

Kim, qachon, qanday muhim amal bajarganini (parol o'zgartirish, CSV/JSON eksport qilish va h.k.) ro'yxat ko'rinishida ko'rsatadi — tizim faoliyatini nazorat qilish uchun.

---

**Eng ehtimoliy so'raladigan savollar va javoblari:**

1. **"Har bir foydalanuvchining alohida paroli bormi?"** — Yo'q, hozircha tizimda bitta umumiy admin paroli bor. "Foydalanuvchilar" va "Rollar" bo'limlari kim mas'ulligini yozib qo'yish uchun, real kirish nazorati uchun emas.
2. **"AI xulosa qanday ishlaydi?"** — Javoblar bo'limidagi tugma bosilsa, barcha javoblar sun'iy intellektga (ChatGPT yoki Gemini) yuborilib, qisqacha, tushunarli xulosa qaytariladi.
3. **"Nega ba'zi raqamlar (qamrov, vaqt, ogohlantirishlar) hali demo?"** — Bular real hisoblash uchun ko'proq ma'lumot (masalan, tumanlar bo'yicha maqsad ko'rsatkichi) kerak bo'lgan qismlar, hozircha namunaviy holatda, keyinchalik to'ldirilishi mumkin.
