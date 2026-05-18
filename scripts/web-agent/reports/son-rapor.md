# agah hoca — Web Analiz Raporu
📅 18 Mayıs 2026 15:43
🌐 https://agah-hoca-6nkp.vercel.app

---

## 🔴 Site Sağlık Skoru: 33/100

| Kategori | Kontrol | Başarılı | Başarısız |
|----------|---------|----------|-----------|
| Sayfalar (HTTP) | 7 | 2 | 5 |
| Supabase API | 2 | 2 | 0 |
| Browser (JS/UI) | 3 | 0 | 3 |
| **Toplam** | **12** | **4** | **8** |

---

## 🔗 HTTP Durum Detayları

- ✅ **Ana Sayfa** (`/`) — HTTP 200
- ✅ **Giriş** (`/login`) — HTTP 200
- ❌ **Kayıt** (`/register`) — HTTP 404
- ❌ **Avatar Kurulum** (`/avatar-setup`) — HTTP 404
- ❌ **Hata Defteri** (`/hata-defteri`) — HTTP 404
- ❌ **İstatistik** (`/istatistik`) — HTTP 404
- ❌ **Profil** (`/profil`) — HTTP 404

---

## 🔌 Supabase API Durumu

- ✅ **Supabase REST API** — HTTP 401
- ✅ **Supabase Auth** — HTTP 200

---

## 🌐 Browser Kontrolü (JS ve UI)

- ⚠️ **Ana Sayfa** (`/`)
  - JS Hatalar: Failed to load resource: the server responded with a status of 404 (); Failed to load resource: the server responded with a status of 404 ()
- ⚠️ **Giriş** (`/login`)
  - JS Hatalar: Failed to load resource: the server responded with a status of 404 (); Failed to load resource: the server responded with a status of 404 ()
- ⚠️ **Kayıt** (`/register`)
  - JS Hatalar: Failed to load resource: the server responded with a status of 404 (); Failed to load resource: the server responded with a status of 404 (); Failed to load resource: the server responded with a status of 404 ()

---

## 🚨 Hata Özeti (12 hata)

### 1. HTTP Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/register`
**Detay:** HTTP 404 — Kayıt

### 2. HTTP Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/avatar-setup`
**Detay:** HTTP 404 — Avatar Kurulum

### 3. HTTP Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/hata-defteri`
**Detay:** HTTP 404 — Hata Defteri

### 4. HTTP Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/istatistik`
**Detay:** HTTP 404 — İstatistik

### 5. HTTP Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/profil`
**Detay:** HTTP 404 — Profil

### 6. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/`
**Detay:** Failed to load resource: the server responded with a status of 404 ()

### 7. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/`
**Detay:** Failed to load resource: the server responded with a status of 404 ()

### 8. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/login`
**Detay:** Failed to load resource: the server responded with a status of 404 ()

### 9. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/login`
**Detay:** Failed to load resource: the server responded with a status of 404 ()

### 10. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/register`
**Detay:** Failed to load resource: the server responded with a status of 404 ()

### 11. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/register`
**Detay:** Failed to load resource: the server responded with a status of 404 ()

### 12. JavaScript Hatası — YÜKSEK
**Konum:** `https://agah-hoca-6nkp.vercel.app/register`
**Detay:** Failed to load resource: the server responded with a status of 404 ()


---

## 🤖 Claude AI Analizi

# 🔍 Agah Hoca Eğitim Platformu — Web Analiz Raporu

---

## 📋 Hata Analiz Tablosu

| Sayfa | HTTP Durumu | Öncelik |
|-------|------------|---------|
| `/register` | 404 | 🔴 Kritik |
| `/avatar-setup` | 404 | 🔴 Kritik |
| `/hata-defteri` | 404 | 🔴 Kritik |
| `/istatistik` | 404 | 🔴 Kritik |
| `/profil` | 404 | 🔴 Kritik |
| JS kaynak hataları (birden fazla) | 404 | 🔴 Kritik |

---

## 🔴 1. `/register` — HTTP 404 Hatası

### Muhtemel Sebep
Expo React Native web build'i, **Single Page Application (SPA)** mimarisi kullanır. Bu mimaride tüm rotalar `index.html` üzerinden yönetilir. Vercel, `/register` gibi alt rotalar için doğrudan dosya aramakta; ilgili dosyayı bulamayınca 404 döndürmektedir.

Kök neden büyük olasılıkla:
- `vercel.json` dosyasında **SPA yönlendirmesi (rewrite rule)** tanımlanmamış olması
- Ya da Expo web build çıktısının `web-build/` klasörünün Vercel'e doğru **publish directory** olarak bildirilmemiş olması

### Etki
> Yeni kullanıcılar **hiç kayıt olamaz**. Platform büyümesi tamamen durur. Öğrenci kazanımı sıfırlanır.

### Çözüm Önerisi

**Adım 1 — `vercel.json` dosyası oluştur/güncelle:**
```json
{
  "version": 2,
  "buildCommand": "expo export --platform web",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> ⚠️ `outputDirectory` değeri Expo sürümüne göre `dist` veya `web-build` olabilir. `package.json`'daki build scriptini kontrol et.

**Adım 2 — Build çıktısını doğrula:**
```bash
expo export --platform web
# veya
npx expo export -p web
ls dist/   # index.html burada olmalı
```

**Adım 3 — Vercel Dashboard'dan kontrol:**
- Settings → General → **Output Directory** → `dist` veya `web-build` olarak ayarla
- Redeploy yap

### Öncelik
🔴 **Kritik** — Kullanıcı edinimi tamamen engellenmiş durumda.

---

## 🔴 2. `/avatar-setup` — HTTP 404 Hatası

### Muhtemel Sebep
`/register` ile aynı kök nedenden kaynaklanmaktadır: **SPA rewrite kurallarının eksikliği**. Ek olarak, bu rota muhtemelen kayıt akışının ikinci adımı olduğundan, `/register` çalışmadan bu sayfaya zaten ulaşılamayacaktır.

İkincil olası neden:
- Bu rotanın Expo Router / React Navigation config'inde tanımlanmış ancak **web için export edilmemiş** olması

### Etki
> Kullanıcılar profil fotoğrafı/avatar belirleyemez. Kişiselleştirme deneyimi yok olur. Öğrenci bağlılığı (engagement) düşer.

### Çözüm Önerisi

**Adım 1 — Vercel rewrite kuralını uygula** (yukarıdaki `vercel.json` çözümü bu sorunu da kapsar)

**Adım 2 — Expo Router kullanıyorsan rota dosyasını kontrol et:**
```
app/
├── avatar-setup.tsx   ✅ Bu dosya var mı?
├── register.tsx
├── index.tsx
```

**Adım 3 — Rota adlandırmasını doğrula:**
```tsx
// Expo Router ile dinamik rota örneği
// app/avatar-setup.tsx dosyası içinde:
export default function AvatarSetupScreen() {
  return ( ... );
}
```

**Adım 4 — Navigation stack'i kontrol et:**
```tsx
// Kayıt sonrası yönlendirme doğru mu?
router.push('/avatar-setup'); // Expo Router
// veya
navigation.navigate('AvatarSetup'); // React Navigation
```

### Öncelik
🔴 **Kritik** — Kullanıcı onboarding akışı kopuk.

---

## 🔴 3. `/hata-defteri` — HTTP 404 Hatası

### Muhtemel Sebep
Yine aynı SPA yönlendirme sorunu. Türkçe karakter içeren rota adları (`hata-defteri`) bazen URL encoding sorunlarına yol açabilir, ancak bu durumda tire (-) kullanıldığı için encoding problemi düşük ihtimal. Asıl sorun Vercel rewrite eksikliği.

### Etki
> Öğrenciler yanlış yaptıkları soruları kaydedemez, tekrar edemez. **Platformun pedagojik çekirdeği çalışmıyor.** Öğretmenler öğrenci hatalarını analiz edemez.

### Çözüm Önerisi

**Adım 1 — Rewrite kuralını uygula** (tüm 404'leri çözecek)

**Adım 2 — Supabase tablo erişimini test et:**
```sql
-- Supabase SQL Editor'da kontrol et
SELECT * FROM hata_defteri LIMIT 5;
-- RLS (Row Level Security) politikaları aktif mi?
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'hata_defteri';
```

**Adım 3 — RLS politikası örneği (eksikse ekle):**
```sql
-- Öğrenci sadece kendi hatalarını görebilsin
CREATE POLICY "ogrenci_kendi_hatalari" ON hata_defteri
  FOR SELECT USING (auth.uid() = ogrenci_id);
```

### Öncelik
🔴 **Kritik** — Platformun temel öğrenme aracı kullanılamıyor.

---

## 🔴 4. `/istatistik` — HTTP 404 Hatası

### Muhtemel Sebep
SPA rewrite eksikliği (birincil neden). Ek olarak, bu sayfa büyük olasılıkla Supabase'den **aggregated query** çekiyor; sayfa açılsa bile Supabase REST API'nin `401` döndürdüğü durumlar veri yükleme sorununa yol açabilir.

### Etki
> Öğrenciler gelişimlerini göremez. Öğretmenler sınıf performansını takip edemez. Admin'ler platform metriklerine erişemez. **Veri odaklı eğitim tamamen sekteye uğrar.**

### Çözüm Önerisi

**Adım 1 — Rewrite kuralını uygula**

**Adım 2 — Supabase 401 sorununu incele:**

>

---

_Rapor otomatik olarak agah hoca Web Analiz Ajanı tarafından oluşturuldu._
