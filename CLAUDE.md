# agah hoca — Eğitim Koçum
## Claude Code İçin Kapsamlı Geliştirme Promptu
### Final Versiyon · Mayıs 2026

---

## SENİN ROLÜN

Sen uzman bir **React Native (Expo)** ve **Supabase** geliştiricisisin. LGS ve YKS hazırlık sürecindeki öğrenciler için, TikTok/Shorts benzeri dikey kaydırma (swipe) mekaniğine sahip, **veri odaklı çalışan bir eğitim koçluk platformu** geliştiriyorsun.

---

## PROJE BAĞLAMI VE MARKA

- Uygulama **"agah hoca"** markası altında geliştirilecektir. `h` harfi mutlaka **küçük** yazılmalıdır.
- Arayüzde **"Eğitim Koçum"** ifadesi kullanılacaktır.
- İlk aşamada **15 kişilik kapalı öğrenci grubunda** test edilecektir.
- WhatsApp veya herhangi bir harici mesajlaşma entegrasyonu **kesinlikle olmayacaktır**.
- Tüm ödevlendirme, takip ve bildirim sistemi **uygulama içinde** yönetilecektir.

---

## KULLANILACAK TEKNOLOJİLER

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React Native (Expo SDK 51+) |
| Animasyon & Gesture | react-native-reanimated v3 + react-native-gesture-handler |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions, Storage) |
| Offline | Expo SQLite + AsyncStorage + sync queue |
| Push Bildirim | Expo Notifications + FCM (Android) + APNs (iOS) |
| Matematik Render | react-native-math-view (KaTeX tabanlı) |
| Görseller | Supabase Storage (soru görselleri için) |
| Zamanlayıcı | Supabase pg_cron (Edge Function tetikleyici) |
| AI Soru Ayrıştırma | Anthropic Claude API (claude-sonnet-4-5 modeli) |

---

## 1. TEMEL KULLANICI DENEYİMİ — SWIPE SİSTEMİ

Ekranda aynı anda yalnızca **1 soru** tam ekran gösterilecektir.

### Swipe Davranışları

| Yön | İşlem | Mekanik |
|-----|--------|---------|
| **Yukarı** | Sonraki soruya geçiş | Ana akış (TikTok/Shorts modeli) |
| **Sağa (Turlama)** | Soru "İkinci Tur"a eklenir | `status = "tur"` → bir sonraki soru |
| **Hata Defteri** | **BUTON ile** yapılır, swipe değil | `status = "error"` → yanlış swipe riskini önler |
| **Aşağı** | **KALDIRILDI** | Önceki soruya dönmek için üst bar'daki "Geri" butonu kullanılır |

**Tasarım Kararı:** Tek yönlü akış (yukarı) daha sezgiseldir. Hata defteri butona alınmıştır çünkü yanlış swipe yapma olasılığı 13-14 yaş grubunda yüksektir. "Geri" butonu üst bar'da her zaman görünür olmalıdır.

---

## 2. SORU TİPLERİ VE CEVAPLAMA

**DB alanı:** `question_type: "verbal" | "numeric"`

### 2.1 Sözel Sorular

- A-B-C-D-E şıkları gösterilir (LGS: 4 şık, YKS: 5 şık — `choices_count` alanına göre)
- **Çift tıklama (double tap) zorunludur** — yanlışlıkla işaretlemeyi önler
- **Doğru cevapta:**
  - Yeşil animasyon (görsel feedback)
  - Haptic feedback (titreşim)
  - 0.8 saniye bekleme → otomatik sonraki soru
- **Yanlış cevapta:**
  - Seçilen şık kırmızı animasyon
  - Doğru şık yeşil gösterilir
  - 1.2 saniye bekleme → otomatik sonraki soru
  - `is_correct = false` → attempt kaydedilir → **sayısal sorulardaki gibi popup AÇILMAZ**

### 2.2 Sayısal Sorular

- Şık yoktur, sadece input alanı
- **MVP:** Standart sayı klavyesi + basit matematik toolbar (kesir `½`, kök `√`, üslü `xⁿ`, π, x/y/a/b)
- **MVP Sonrası:** 3 sekmeli gelişmiş hibrit klavye (Rakamlar/İskeletler · Harfler · Özel Semboller)

### 2.3 Sayısal Sorularda Yanlış Cevap

Yanlış cevapta direkt kırmızı çarpı **gösterilmez**. Bottom Sheet açılır:

> **"Bir işlem hatası yapmış olabilir misin? Nasıl devam etmek istersin?"**

Seçenekler:
1. **Tekrar Dene** — Klavye sıfırlanır, scratchpad üzerinden hata aranabilir
2. **Turlamaya Bırak** — Sağa swipe tetiklenir (`status = "tur"`)
3. **Hata Defterine Gönder** — `status = "error"` (buton ile, swipe değil)

---

## 3. SCRATCHPAD (KARALAMA ALANI)

- Öğrenci, soru üzerindeyken bir butona basarak şeffaf çizim katmanı açar
- Parmak veya kalemle (Apple Pencil / S Pen destekli) çizim yapılabilir
- Çizim verisi **SVG path formatında JSON** olarak saklanır (boyut optimizasyonu için)
- Aynı soruya geri dönüldüğünde çizimler **korunmuş olarak** gösterilir
- Sayısal sorularda cevap buraya değil, klavyeden girilir

**Performans Notu:** Yoğun kullanımda SVG path verisi büyüyebilir. 30 günde bir kullanılmayan çizimleri temizleyen bir Edge Function eklenmeli.

---

## 4. VERİ TABANI MİMARİSİ

> **Önemli:** Şema evrimseldir. Tüm değişiklikler **Supabase migrations** üzerinden yapılır. Her migration dosyası `supabase/migrations/` klasöründe tarihli olarak saklanır.

### 4.1 `profiles`

```sql
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  real_name     text NOT NULL,
  nickname      text UNIQUE NOT NULL,
  avatar_url    text,
  role          text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  daily_target  int DEFAULT 50,
  xp            int DEFAULT 0,
  streak_count  int DEFAULT 0,
  last_active   date,
  created_at    timestamptz DEFAULT now()
);
```

**Kurallar:**
- Nickname benzersiz ve Türkçe uygunsuz kelime filtresinden geçmiş olmalı
- Avatar başlangıçta hazır listeden (20-30 adet, çeşitli ve kapsayıcı)
- `real_name` yalnızca öğretmen/admin görebilir (RLS ile korunur)

---

### 4.2 `coach_assignments`

```sql
CREATE TABLE coach_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  is_active   boolean DEFAULT true,
  UNIQUE (coach_id, student_id)
);
```

---

### 4.3 `subjects`

```sql
CREATE TABLE subjects (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL,  -- 'Matematik', 'Fen Bilimleri', 'Türkçe', vb.
  exam    text NOT NULL CHECK (exam IN ('LGS', 'TYT', 'AYT', 'ALL'))
);
```

---

### 4.4 `topics`

```sql
CREATE TABLE topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  term        int CHECK (term IN (1, 2))  -- Dönem (kamp havuzu için)
);
```

---

### 4.5 `questions`

```sql
CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content         text NOT NULL,          -- LaTeX/MathJax destekli (KaTeX formatı)
  question_type   text NOT NULL CHECK (question_type IN ('verbal', 'numeric')),
  choices         jsonb,                  -- {"A": "...", "B": "...", ...} — sözel sorular için
  choices_count   int DEFAULT 4,          -- LGS=4, YKS=5
  correct_answer  text NOT NULL,
  topic_id        uuid REFERENCES topics(id),
  difficulty      int DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  image_url       text,                   -- Supabase Storage URL (resimli sorular için)
  source_pdf_id   uuid REFERENCES question_imports(id),  -- Hangi PDF'ten geldi
  created_by      uuid REFERENCES profiles(id),
  created_at      timestamptz DEFAULT now(),
  is_active       boolean DEFAULT true
);
```

---

### 4.6 `student_question_state` — SM-2 Desteği

```sql
CREATE TABLE student_question_state (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id       uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status            text DEFAULT 'new' CHECK (status IN ('new', 'tur', 'error', 'completed', 'archived')),
  next_review_date  date,
  error_count       int DEFAULT 0,
  ease_factor       float DEFAULT 2.5,   -- SM-2: min 1.3
  interval_days     int DEFAULT 1,        -- SM-2: bir sonraki tekrar aralığı (gün)
  repetition_count  int DEFAULT 0,        -- SM-2: üst üste doğru sayısı
  last_review_date  date,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (student_id, question_id)
);
```

---

### 4.7 `student_attempts` — EN ÖNEMLİ TABLO

```sql
CREATE TABLE student_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer          text,
  is_correct      boolean NOT NULL,
  attempt_date    timestamptz DEFAULT now(),
  attempt_type    text DEFAULT 'normal' CHECK (attempt_type IN ('normal', 'tur', 'error_repeat', 'review')),
  duration_secs   int,                   -- Çözüm süresi (saniye)
  synced_at       timestamptz            -- Offline sync için: null = henüz sync edilmemiş
);
```

---

### 4.8 `scratchpad_data`

```sql
CREATE TABLE scratchpad_data (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  drawing_data  jsonb NOT NULL,          -- SVG path array
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (student_id, question_id)
);
```

---

### 4.9 `daily_packs`

```sql
CREATE TABLE daily_packs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_date       date NOT NULL,
  target_count    int NOT NULL,
  completed_count int DEFAULT 0,
  is_completed    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (student_id, pack_date)
);
```

### 4.10 `daily_pack_questions` — AYRI JUNCTION TABLO

> **Kritik Not:** `daily_packs.questions uuid[]` yerine bu junction tablo kullanılır. Sorgu performansı ve durum takibi için zorunludur.

```sql
CREATE TABLE daily_pack_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id     uuid NOT NULL REFERENCES daily_packs(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position    int NOT NULL,              -- Soru sırası
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  UNIQUE (pack_id, question_id)
);
```

---

### 4.11 `challenges`

```sql
CREATE TABLE challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  challenge_type  text NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'custom')),
  target_value    int NOT NULL,
  target_type     text NOT NULL CHECK (target_type IN ('question_count', 'correct_count', 'streak', 'duration')),
  subject_id      uuid REFERENCES subjects(id),   -- Opsiyonel ders filtresi
  topic_id        uuid REFERENCES topics(id),     -- Opsiyonel konu filtresi
  created_by      uuid NOT NULL REFERENCES profiles(id),
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);
```

---

### 4.12 `challenge_participants`

```sql
CREATE TABLE challenge_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress      int DEFAULT 0,
  completed     boolean DEFAULT false,
  completed_at  timestamptz,
  UNIQUE (challenge_id, student_id)
);
```

---

### 4.13 `badges`

```sql
CREATE TABLE badges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text NOT NULL,
  icon_url         text NOT NULL,
  condition_type   text NOT NULL CHECK (condition_type IN ('streak', 'count', 'accuracy', 'challenge', 'error_cleared')),
  condition_value  int NOT NULL,
  condition_extra  jsonb              -- Ek koşullar (örn: min_accuracy ile birlikte süre)
);
```

### 4.14 `student_badges`

```sql
CREATE TABLE student_badges (
  student_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id    uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at   timestamptz DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)
);
```

---

### 4.15 `kamp_havuzu_1` / `kamp_havuzu_2`

```sql
CREATE TABLE kamp_havuzu_1 (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  archived_at   timestamptz DEFAULT now(),
  topic_id      uuid REFERENCES topics(id),
  ease_factor   float DEFAULT 2.5,      -- SM-2 durumu korunur
  UNIQUE (student_id, question_id)
);

-- Aynı yapı kamp_havuzu_2 için tekrarlanır
```

---

### 4.16 `push_tokens`

```sql
CREATE TABLE push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_token  text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (student_id, platform)
);
```

---

### 4.17 `question_imports` — SORU YÜKLEME SİSTEMİ

```sql
CREATE TABLE question_imports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by     uuid NOT NULL REFERENCES profiles(id),
  source_type     text NOT NULL CHECK (source_type IN ('pdf', 'image', 'manual', 'json')),
  storage_path    text,                  -- Supabase Storage'daki kaynak dosya yolu
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'review', 'completed', 'failed')),
  total_pages     int,
  extracted_count int DEFAULT 0,
  reviewed_count  int DEFAULT 0,
  error_log       jsonb,
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);
```

---

## 5. SM-2 ARALIKLI TEKRAR ALGORİTMASI

**1-3-7 sabit döngüsü kullanılmaz.** Yerine **SM-2 (SuperMemo-2)** algoritması uygulanır.

### SM-2 Değerleri (her soru için `student_question_state`'te tutulur)

- `ease_factor` (EF): Başlangıç 2.5, minimum 1.3
- `interval_days` (I): Başlangıç 1 gün
- `repetition_count` (n): Başlangıç 0

### Doğru Cevap

```python
if n == 0:
    I = 1
elif n == 1:
    I = 6
else:
    I = round(I * EF)

n = n + 1
next_review_date = today + I days
```

### Yanlış Cevap

```python
n = 0
I = 1
EF = max(EF - 0.2, 1.3)
next_review_date = today + 1 day
status = "error"
```

### Arşivleme Koşulu

```python
# error_count >= 2 olan soruda doğru yapılırsa:
if error_count >= 2 and is_correct:
    status = "archived"
    move_to_kamp_havuzu(term=topic.term)

# Veya: 7. günün tekrarında doğru yapılırsa da arşivlenir
if interval_days >= 7 and is_correct and status == "error":
    status = "archived"
    move_to_kamp_havuzu(term=topic.term)
```

---

## 6. GÜNLÜK PAKET SİSTEMİ

### Edge Function: `generate_daily_pack`

**Tetikleyici:** Her gün `00:00 UTC+3` (pg_cron ile)

Her öğrenci için:
1. `next_review_date <= today` olan soruları al (SM-2 tekrarları)
2. `status = "tur"` olan soruları ekle
3. Yeni sorular ekle (hedefe ulaşana kadar, adaptif zorluğa göre)
4. `daily_packs` tablosuna kaydet
5. `daily_pack_questions`'a sıralı ekle (SM-2 soruları serpiştirilir)

### "Otomatik 7'ye Bölme"

- Öğretmen haftalık toplam soru sayısı belirler (örn: 350)
- Sistem: `günlük_hedef = haftalık_hedef / 7` (varsayılan)
- Öğrenci X gün çalışmadıysa: `günlük_hedef = kalan_sorular / kalan_günler`
- Değer `profiles.daily_target`'a yazılır

---

## 7. ADAPTİF ZORLUK SİSTEMİ

- Değerlendirme penceresi: **Son 30 deneme** (konu bazında)
- %80+ başarı → `difficulty + 1` olan sorular önceliklendirilir
- %50 altı başarı → `difficulty - 1` olan sorular önceliklendirilir
- Kaynak: `student_attempts JOIN questions` ile anlık hesaplama
- Her ders için ayrı hesaplanır (Matematik başarısı Türkçe sorularını etkilemez)

---

## 8. KAMP HAVUZU SİSTEMİ

- Arşivlenen soru `student_question_state.status = "archived"` olarak işaretlenir
- `topic.term`'e göre `kamp_havuzu_1` veya `kamp_havuzu_2`'ye taşınır
- Kamp havuzundaki sorular: Sınava 1 ay kala genel tekrarlarda kullanılır
- SM-2 durumu (`ease_factor`) korunur, `interval_days = 30` olarak ayarlanır

---

## 9. SORU İÇERİĞİ YÖNETİMİ — PDF / RESİM AYRIŞTIRICA

### Genel Akış

```
Admin PDF/JPG yükler
     ↓
Supabase Storage'a kaydedilir
     ↓
question_imports tablosuna kayıt açılır (status: "pending")
     ↓
Edge Function: parse_question_file tetiklenir
     ↓
Claude API (claude-sonnet-4-5) görsel/metin analizi yapar
     ↓
Yapılandırılmış JSON döner
     ↓
Admin önizleme panelinde inceler ve düzeltir
     ↓
Onaylanan sorular questions tablosuna kaydedilir
```

### Edge Function: `parse_question_file`

**PDF için:**

```typescript
// PDF sayfaları base64 görüntüye çevrilir (pdf2pic veya pdfjs)
// Her sayfa Claude API'ye gönderilir

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01"
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: pageBase64 }
        },
        {
          type: "text",
          text: `Bu sayfadaki soruları ayrıştır ve aşağıdaki JSON formatında döndür.
Sadece JSON döndür, başka hiçbir metin yazma.

Beklenen format:
{
  "questions": [
    {
      "content": "Soru metni (LaTeX için $...$ formatı kullan)",
      "question_type": "verbal | numeric",
      "choices": {"A": "...", "B": "...", "C": "...", "D": "..."} | null,
      "correct_answer": "A | B | C | D | sayısal_cevap",
      "difficulty": 1-5,
      "has_image": true | false,
      "image_description": "Varsa görsel açıklaması"
    }
  ]
}

Kurallar:
- Matematik ifadelerini KaTeX/LaTeX formatında yaz ($\\frac{1}{2}$ gibi)
- Türkçe karakterleri koru
- Boş bırakılan cevapları "?" olarak işaretle
- Sayfada soru yoksa questions: [] döndür`
        }
      ]
    })
  })
});
```

**Admin Önizleme Paneli:**
- Ayrıştırılan her soru kart olarak gösterilir
- Düzenlenebilir alanlar: content, choices, correct_answer, difficulty, topic
- "Onayla" → questions tablosuna ekle
- "Düzenle" → inline editör açılır
- "Sil" → bu soruyu atla
- Tüm sayfanın işlemi bitince "Toplu Onayla" butonu

### Manuel Soru Ekleme

- Admin panelinde LaTeX destekli metin editörü
- Gerçek zamanlı önizleme (KaTeX render)
- Resimli soru için: görsel yükle → Supabase Storage → `image_url` alanına yaz

---

## 10. AVATAR & NİCKNAME SİSTEMİ

### Öğrenci Tarafı
- Kayıtta nickname seçer (benzersiz, Türkçe küfür/argo filtresi)
- Hazır avatar listesinden seçim yapar (MVP: 24-30 adet, çeşitli, kapsayıcı)
- Gerçek isim diğer öğrenciler tarafından **asla görülmez**

### Öğretmen Tarafı
- Panelde `nickname + real_name` eşleşmesi görünür
- Öğrenci yönetimi ve analiz için kullanılır

---

## 11. CHALLENGE (GÖREV / YARIŞMA) SİSTEMİ

### Otomatik Sistem Görevleri
- **Günlük:** "Bugün 50 soru çöz"
- **Haftalık:** "5 gün üst üste hedef tamamla"
- **Aylık:** "Toplam 2000 soru çöz"

### Öğretmen Görevleri
- Tüm sınıfa veya seçili öğrencilere
- Süreli (başlangıç + bitiş tarihi)
- Ders/konu filtreliyle özelleştirilebilir
- Örnek: "Cumartesi 10:00-12:00 arası 200 matematik sorusu"

### Challenge Tamamlama
- Tamamlama animasyonu (confetti / kutlama)
- Rozet + XP ödülü
- Leaderboard'a yansır

---

## 12. LEADERBOARDumsuz / SIRALAMA SİSTEMİ

**Demotivasyon riski önlenmiştir.**

### 3 Katmanlı Leaderboard

#### a) Kişisel Leaderboard (Varsayılan — Her Zaman Görünür)
- Öğrenci kendi geçmiş haftasıyla yarışır
- "Geçen haftaya göre +%23 soru çözdün" gibi
- **Her öğrenci her zaman bir kazanan olabilir**

#### b) Sınıf Leaderboard (Haftalık Reset — Opt-in)
- Her Pazartesi 00:00'da sıfırlanır
- Sadece **Top 10** görünür
- Nickname + Avatar + Skor
- **Alt sıradakiler listede yer almaz**
- Öğrenci isteğe bağlı katılır (varsayılan: katıl, ayarlardan çıkabilir)

#### c) Topluluk İlerleme (Anonim)
- "Bu hafta 12 öğrenci günlük hedefine ulaştı!"
- İsim yok, toplu başarı hissi

### Sıralama Kriterleri
- Çözülen soru sayısı
- Doğruluk oranı
- Challenge başarıları
- Streak uzunluğu

---

## 13. MOTİVASYON & ROZET SİSTEMİ

### Rozetler (MVP)

| Rozet | Koşul |
|-------|-------|
| 7 Gün Serisi 🔥 | 7 ardışık gün hedef tamamlama |
| 1000 Soru Kulübü 📚 | Toplam 1000 soru çözme |
| Hata Şampiyonu ✓ | 30 hata defteri sorusunu doğru tekrarlama |
| Kararlı Öğrenci ⭐ | 30 gün boyunca hedefin %80'ini tamamlama |
| Hızlı ve Doğru ⚡ | Son 50 soruda **doğruluk ≥ %85 VE ortalama süre < 90 saniye** |

> **Not:** "Hızlı Çözücü" rozeti yalnızca **doğrulukla birlikte** hızı ödüllendirmelidir. Sade hız rozeti öğrencileri okumadan geçmeye teşvik eder — LGS/YKS için zararlı.

### MVP Sonrası
- XP sistemi (her doğru cevap = puan, zorluk × çarpan)
- Seviye atlama (Seviye 1-100)
- Avatar kozmetikleri (XP ile açılır)

---

## 14. OFFLINE SENARYO

### Cache Stratejisi
- `daily_pack_questions` listesi SQLite'ta yerel olarak tutulur
- Bir sonraki günün paketi gece otomatik indirilir
- Soru görselleri (image_url) offline için cache'lenir
- Çözümler yerel queue'da tutulur → bağlantı gelince sync

### Senkronizasyon

**Çatışma Çözümü:**
- **Timestamp tabanlı "son yazan kazanır"** uygulanır
- Öğrenciye teknik seçim diyaloğu **gösterilmez**
- `student_attempts.attempt_date` server timestamp ile karşılaştırılır
- Senkronizasyon sırasında loading indicator gösterilir
- `synced_at` null olan kayıtlar queue'da bekler

---

## 15. BİLDİRİM SİSTEMİ

> **Mimari Notu:** Supabase Realtime push notification için **kullanılamaz**. Supabase Realtime WebSocket üzerinden client'a database değişikliği bildirir — bu mobil push değildir.
>
> **Doğru Mimari:** Expo Notifications API + Expo Push Service → FCM (Android) + APNs (iOS)

### Akış

```
Supabase Edge Function (tetikleyici)
     ↓
push_tokens tablosundan expo_token al
     ↓
Expo Push API'ye HTTP POST gönder
     ↓
Expo Push Service → FCM (Android) / APNs (iOS)
     ↓
Cihazda bildirim görünür
```

### Bildirim Türleri

| Tür | Tetikleyici | İçerik |
|-----|-------------|--------|
| Günlük Hatırlatma | Her gün 09:00 | "Bugünkü 50 soruluk paket hazır! 🚀" |
| Hedef Uyarısı | Gün sonu 20:00 (tamamlanmamışsa) | "Bugün 30/50 soru çözdün, 20 soru kaldı!" |
| Streak Riski | Streak kırılma riski | "3 günlük serini kaybetmek üzeresin! 🔥" |
| Challenge Başlangıç | `challenge.start_date` | "Yeni meydan okuma başladı!" |
| Challenge Bitiş | `challenge.end_date - 1 gün` | "Challenge bitiyor, son 24 saat!" |
| SM-2 Tekrar | `next_review_date = today` | "Hata defterinden 5 soru bugün tekrar günü!" |
| Rozet | Rozet kazanıldığında | "Yeni rozet kazandın: 1000 Soru Kulübü! 🏆" |

---

## 16. ÖĞRETMEN (KOÇ) PANELİ

Koç aşağıdakileri görebilir:

| Metrik | Kaynak |
|--------|--------|
| Günlük çözüm sayısı | `daily_packs.completed_count` |
| Doğruluk oranı | `student_attempts.is_correct` agregasyonu |
| Konu bazlı başarı | `questions.topic_id + student_attempts` JOIN |
| Hata defteri yoğunluğu | `student_question_state.status = "error"` count |
| Öğrenci karşılaştırma | `profiles.nickname + metrikler` (anonim görünüm) |
| Çözüm süresi trendi | `student_attempts.duration_secs` zaman serisi |
| SM-2 ilerleme | `student_question_state.ease_factor` ortalaması |

**Öğretmen panelinde `real_name + nickname` eşleşmesi görünür.**
**Öğrenciler birbirlerinin gerçek isimlerini asla görmez.**

---

## 17. GÜVENLİK — RLS POLİTİKALARI

```sql
-- Öğrenci sadece kendi profilini okuyabilir
CREATE POLICY "student_read_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Öğretmen atandığı öğrencileri görebilir (real_name dahil)
CREATE POLICY "teacher_read_assigned_students"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM coach_assignments
    WHERE coach_id = auth.uid()
    AND student_id = profiles.id
    AND is_active = true
  )
);

-- Öğrenci sadece kendi denemelerini görebilir
CREATE POLICY "student_read_own_attempts"
ON student_attempts FOR SELECT
USING (auth.uid() = student_id);

-- Öğrenci sadece kendi state'ini görebilir
CREATE POLICY "student_read_own_state"
ON student_question_state FOR SELECT
USING (auth.uid() = student_id);

-- Öğretmen soru ekleyebilir/düzenleyebilir
CREATE POLICY "teacher_manage_questions"
ON questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- push_tokens: sadece kendi token'ı
CREATE POLICY "student_manage_own_push_token"
ON push_tokens FOR ALL
USING (auth.uid() = student_id);
```

---

## 18. GELİŞTİRME TAKVIMI

### Faz 1: Temel Altyapı (Hafta 1-2)
- [ ] Supabase projesi kurulumu
- [ ] Tüm tablolar ve migration dosyaları (yukarıdaki şemaya göre)
- [ ] RLS politikaları
- [ ] Auth sistemi (email + şifre)
- [ ] Nickname/avatar seçim ekranı (kayıt akışı)
- [ ] Coach-atama sistemi

### Faz 2: Core UX (Hafta 3-4)
- [ ] Swipe ekranı (yukarı = sonraki, sağa = turlama)
- [ ] Sözel soru cevaplama (çift tıklama + feedback)
- [ ] Sayısal soru cevaplama (input + basit toolbar)
- [ ] Yanlış cevap bottom sheet (sayısal için)
- [ ] Scratchpad (karalama alanı)
- [ ] Hata defteri butonu
- [ ] Üst bar "Geri" butonu

### Faz 3: Algoritma (Hafta 5-6)
- [ ] SM-2 implementasyonu (Edge Function veya client-side)
- [ ] `generate_daily_pack` Edge Function (pg_cron 00:00)
- [ ] Adaptif zorluk hesaplama (son 30 deneme, konu bazında)
- [ ] Kamp havuzu mantığı ve arşivleme

### Faz 4: Soru İçeriği Yönetimi (Hafta 7-8)
- [ ] Admin paneli: PDF/resim yükleme
- [ ] `parse_question_file` Edge Function (Claude API entegrasyonu)
- [ ] Önizleme ve onay paneli
- [ ] LaTeX destekli manuel soru ekleme editörü
- [ ] Supabase Storage entegrasyonu (resimli sorular)

### Faz 5: Gamification (Hafta 9-10)
- [ ] Rozet sistemi (tanımlar + kazanma mantığı)
- [ ] Streak takibi (daily_packs tamamlama kontrol)
- [ ] 3 katmanlı Leaderboard
- [ ] Challenge oluşturma ve katılım

### Faz 6: Koç Paneli (Hafta 11-12)
- [ ] Öğretmen dashboard (performans grafikleri)
- [ ] Konu bazlı analiz
- [ ] Challenge yönetimi
- [ ] real_name + nickname eşleşmeli öğrenci listesi

### Faz 7: Offline & Bildirim (Hafta 13-14)
- [ ] SQLite offline cache (Expo SQLite)
- [ ] Sync queue ve timestamp tabanlı conflict resolution
- [ ] Expo Notifications + push_tokens yönetimi
- [ ] FCM/APNs kurulumu
- [ ] Tüm bildirim türleri için Edge Function

---

## 19. GENEL TASARIM İLKESİ

Bu sistem:

❌ Sadece soru çözen bir uygulama değil  
✅ Veriyle yönlendiren bir eğitim koçluk platformudur

**Hedef:** Öğrencilerin çalışma alışkanlığını içselleştirmelerine yardımcı olmak. Gamification unsurları manipülasyon aracı değil; motivasyon, süreklilik ve özgüven için kullanılır.

**MVP'de Zorunlu Olanlar:**
1. Swipe sistemi + soru cevaplama
2. SM-2 tekrar algoritması
3. Günlük paket sistemi
4. Hata defteri
5. Kamp havuzu
6. Koç paneli (temel)
7. PDF soru ayrıştırma

**MVP Sonrasına Bırakılabilecekler:**
- Hibrit klavye (3 sekme)
- XP ve seviye sistemi
- Challenge sistemi
- Offline tam destek
- Bildirim sistemi

---

*Prompt Versiyon: 2.0 Final (Claude Code için)*  
*Tarih: 6 Mayıs 2026*  
*Analiz & Revizyon: agah hoca + Claude Sonnet 4.6*
