-- ============================================================
-- agah hoca — Temel Seed Verisi
-- Tarih: 2026-05-06
-- ============================================================

-- Dersler
INSERT INTO public.subjects (name, exam) VALUES
  ('Matematik',         'LGS'),
  ('Fen Bilimleri',     'LGS'),
  ('Türkçe',            'LGS'),
  ('T.C. İnkılap Tarihi ve Atatürkçülük', 'LGS'),
  ('Din Kültürü',       'LGS'),
  ('İngilizce',         'LGS'),
  ('Temel Matematik',   'TYT'),
  ('Türkçe',            'TYT'),
  ('Sosyal Bilimler',   'TYT'),
  ('Fen Bilimleri',     'TYT'),
  ('Matematik',         'AYT'),
  ('Fizik',             'AYT'),
  ('Kimya',             'AYT'),
  ('Biyoloji',          'AYT'),
  ('Edebiyat',          'AYT');

-- MVP Rozetleri
INSERT INTO public.badges (name, description, icon_url, condition_type, condition_value) VALUES
  ('7 Gün Serisi',        '7 ardışık gün günlük hedefi tamamla',              '🔥', 'streak',        7),
  ('30 Gün Kararlı',      '30 gün boyunca hedefin %80''ini tamamla',          '⭐', 'streak',        30),
  ('1000 Soru Kulübü',    'Toplam 1000 soru çöz',                             '📚', 'count',         1000),
  ('Hata Şampiyonu',      '30 hata defteri sorusunu doğru tekrarla',          '✓',  'error_cleared', 30),
  ('Hızlı ve Doğru',      'Son 50 soruda doğruluk ≥ %85 ve ort. süre < 90s', '⚡', 'accuracy',      85);
