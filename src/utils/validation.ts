// Türkçe küfür/argo filtresi — MVP için temel liste
const BLOCKED_WORDS = [
  'orospu', 'sik', 'göt', 'amk', 'bok', 'piç', 'oç', 'ibne', 'yarrak',
  'puşt', 'kaltak', 'orospu', 'sikik', 'götveren',
];

export function isNicknameBlocked(nickname: string): boolean {
  const lower = nickname.toLowerCase().trim();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (trimmed.length < 3) return 'Kullanıcı adı en az 3 karakter olmalıdır.';
  if (trimmed.length > 20) return 'Kullanıcı adı en fazla 20 karakter olabilir.';
  if (!/^[a-zA-Z0-9_À-ž]+$/.test(trimmed)) {
    return 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.';
  }
  if (isNicknameBlocked(trimmed)) return 'Bu kullanıcı adı kullanılamaz.';
  return null;
}

export function validateEmail(email: string): string | null {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Geçerli bir e-posta adresi giriniz.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Şifre en az 6 karakter olmalıdır.';
  return null;
}
