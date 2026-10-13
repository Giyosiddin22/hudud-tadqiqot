# Backend — to'liq server (ma'lumotlar, autentifikatsiya, AI tahlil)

Bu server endi saytning **yagona ma'lumot manbai**:

- So'rovnomalar (tayyor 5 tasi + admin panelda yaratilganlar) va ularning
  javoblari `server/data/db.json` faylida saqlanadi (Firebase/Firestore
  butunlay olib tashlandi — endi hech qanday tashqi bulut xizmatiga bog'liq
  emas).
- Admin login **haqiqiy** — parol serverda xeshlangan holda (`bcryptjs`)
  saqlanadi, sessiya xavfsiz `httpOnly` cookie orqali boshqariladi.
- `/api/analyze` — javoblarni ChatGPT (OpenAI) orqali tahlil qiladi.

## Ishga tushirish

```bash
cd server
npm install          # allaqachon bajarilgan bo'lishi mumkin
copy .env.example .env      # Windows (PowerShell: Copy-Item .env.example .env)
```

`.env` faylini oching va to'ldiring:

```
OPENAI_API_KEY=sk-...          # AI xulosa uchun, https://platform.openai.com/api-keys
SESSION_SECRET=uzun-tasodifiy-satr   # login sessiyasini imzolash uchun
```

So'ng serverni ishga tushiring:

```bash
npm start
```

Konsolda `✔ Server ishga tushdi: http://localhost:8080` deb chiqadi.
Brauzerda **http://localhost:8080** manzilini oching — butun sayt shu server
orqali ishlaydi (statik fayllar ham, API ham).

## Standart admin paroli

Birinchi ishga tushirishda admin paroli **`admin2026`** (avvalgidek). Buni
admin panel → Sozlamalar bo'limidan xohlagan vaqt o'zgartirishingiz mumkin —
yangi parol darhol serverda saqlanadi.

## Ma'lumotlar qayerda saqlanadi

- `server/data/db.json` — barcha so'rovnomalar, javoblar, admin parol xeshi
  va audit log shu yerda. Bu fayl `.gitignore`da, ya'ni git'ga qo'shilmaydi.
- Zaxira nusxa olish uchun shunchaki shu faylni ko'chirib qo'ying.
- Faylni o'chirsangiz, server keyingi ishga tushishda uni 5 ta tayyor
  so'rovnoma bilan qaytadan yaratadi (`server/data/seed-surveys.json`dan).

## Muhim eslatmalar

- Render xizmati: `https://hudud-tadqiqot-1.onrender.com`.
- Deploy manbasi: `Giyosiddin22/hudud-tadqiqot`, `main` tarmog'i.
- Render Root Directory bo'sh qoldiriladi; build: `cd server && npm ci --omit=dev`,
  start: `cd server && node index.js`, health check: `/`.
- Render muhiti: `NODE_VERSION=24`, `NODE_ENV=production`, `TRUST_PROXY=1`.
- Free tarifidagi fayllar qayta deploy yoki restartda saqlanmaydi. Javoblarni
  doimiy saqlash uchun persistent disk va unga mos `DATA_DIR` kerak:
  https://render.com/docs/disks. Pullik tarifga avtomatik o'tilmaydi.

- `.env` fayli hech qachon git'ga qo'shilmaydi — kalit/sirlar faqat sizning
  kompyuteringizda qoladi.
- OpenAI kaliti sozlanmagan bo'lsa, faqat "AI xulosa" tugmasi ishlamaydi —
  qolgan hamma narsa (so'rovnoma yaratish, javob yig'ish, login) kalitsiz ham
  to'liq ishlaydi.
- Har bir "AI xulosa" so'rovi OpenAI hisobingizdan pul yechadi (standart
  model `gpt-4o-mini` — arzon va tez). Modelni `OPENAI_MODEL` orqali
  o'zgartirish mumkin.
