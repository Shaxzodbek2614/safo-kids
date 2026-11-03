# Safo Kids — web ilova (demo)

AppSheet tizimining yangi web versiyasi. Hozircha **demo ma'lumotlar** bilan ishlaydi: barcha ismlar va raqamlar o'ylab topilgan, baza hali ulanmagan. Sahifa yangilansa, kiritilgan o'zgarishlar boshlang'ich holatiga qaytadi.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:3000` manzilini oching.

Yuqoridagi **"Demo rol"** tanlovi orqali tizimni turli lavozimlar ko'zi bilan ko'rish mumkin: Admin, Bosh menejer, Administrator+Hisobchi va Ustoz.

## Tuzilishi

- `src/app/(app)/*`: sahifalar (Bosh sahifa, Lidlar, Shartnomalar, To'lovlar, Qarzdorlik, Davomat va boshqalar)
- `src/lib/data/types.ts`: ma'lumotlar modeli (`docs/TZ.md`, 4-bo'lim)
- `src/lib/data/seed.ts`: demo ma'lumotlar
- `src/lib/data/store.ts`: xotiradagi saqlash va amallar. Baza ulanganda shu nomdagi server action'lar bilan almashtiriladi
- `src/lib/data/calc.ts`: hisob-kitob qoidalari (`docs/TZ.md`, 6-bo'lim)
