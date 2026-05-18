/**
 * agah hoca — Web Analiz Ajanı
 * Siteyi tarar, hataları toplar, Claude ile analiz eder, rapor üretir.
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Yapılandırma ────────────────────────────────────────────────────────────

const CONFIG = {
  targetUrl: process.env.TARGET_URL || "https://agah-hoca-6nkp.vercel.app",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  reportDir: path.join(__dirname, "reports"),
  timeoutMs: 15000,
};

// Uygulamadaki tüm bilinen rotalar (Expo Router yapısına göre)
const ROUTES = [
  { path: "/", name: "Ana Sayfa", requiresAuth: false },
  { path: "/login", name: "Giriş", requiresAuth: false },
  { path: "/register", name: "Kayıt", requiresAuth: false },
  { path: "/avatar-setup", name: "Avatar Kurulum", requiresAuth: true },
  { path: "/hata-defteri", name: "Hata Defteri", requiresAuth: true },
  { path: "/istatistik", name: "İstatistik", requiresAuth: true },
  { path: "/profil", name: "Profil", requiresAuth: true },
];

// Supabase API kontrol noktaları
const SUPABASE_CHECKS = [
  { endpoint: "/rest/v1/", name: "Supabase REST API" },
  { endpoint: "/auth/v1/health", name: "Supabase Auth" },
];

// ─── Renk çıktısı ────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(msg, color = C.reset) {
  console.log(`${color}${msg}${C.reset}`);
}

function section(title) {
  console.log(`\n${C.bold}${C.cyan}━━━ ${title} ━━━${C.reset}`);
}

// ─── 1. Link Checker ─────────────────────────────────────────────────────────

async function runLinkChecker() {
  section("Link Checker — HTTP Durum Kontrolü");
  const results = [];

  for (const route of ROUTES) {
    const url = `${CONFIG.targetUrl}${route.path}`;
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(CONFIG.timeoutMs),
        redirect: "follow",
      });

      const ok = res.status >= 200 && res.status < 400;
      const icon = ok ? "✓" : "✗";
      const color = ok ? C.green : C.red;

      log(`  ${icon} [${res.status}] ${route.name} — ${url}`, color);
      results.push({
        route: route.path,
        name: route.name,
        url,
        status: res.status,
        ok,
        requiresAuth: route.requiresAuth,
        error: null,
      });
    } catch (err) {
      log(`  ✗ [ERR] ${route.name} — ${err.message}`, C.red);
      results.push({
        route: route.path,
        name: route.name,
        url,
        status: null,
        ok: false,
        requiresAuth: route.requiresAuth,
        error: err.message,
      });
    }
  }

  return results;
}

// ─── 2. API Checker — Supabase Sağlık Kontrolü ───────────────────────────────

async function runApiChecker() {
  section("API Checker — Supabase Bağlantı Kontrolü");
  const results = [];

  if (!CONFIG.supabaseUrl) {
    log("  ⚠ EXPO_PUBLIC_SUPABASE_URL tanımlı değil, API kontrolü atlandı.", C.yellow);
    return results;
  }

  for (const check of SUPABASE_CHECKS) {
    const url = `${CONFIG.supabaseUrl}${check.endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: CONFIG.supabaseAnonKey,
          Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
        },
        signal: AbortSignal.timeout(CONFIG.timeoutMs),
      });

      const ok = res.status >= 200 && res.status < 500;
      const icon = ok ? "✓" : "✗";
      const color = ok ? C.green : C.red;

      log(`  ${icon} [${res.status}] ${check.name}`, color);
      results.push({
        name: check.name,
        url,
        status: res.status,
        ok,
        error: null,
      });
    } catch (err) {
      log(`  ✗ [ERR] ${check.name} — ${err.message}`, C.red);
      results.push({
        name: check.name,
        url,
        status: null,
        ok: false,
        error: err.message,
      });
    }
  }

  return results;
}

// ─── 3. Browser Automator — JS Hatası ve UI Kontrolü ─────────────────────────

async function runBrowserCheck() {
  section("Browser Automator — JS Hata ve UI Kontrolü");
  const results = [];
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    log(`  ⚠ Playwright başlatılamadı: ${err.message}`, C.yellow);
    log("  ℹ Playwright'i kurmak için: npx playwright install chromium", C.gray);
    return results;
  }

  // Sadece auth gerektirmeyen sayfaları tarayıcıyla kontrol ediyoruz
  const publicRoutes = ROUTES.filter((r) => !r.requiresAuth);

  for (const route of publicRoutes) {
    const url = `${CONFIG.targetUrl}${route.path}`;
    const page = await browser.newPage();
    const consoleErrors = [];
    const networkErrors = [];
    let crashed = false;

    // Konsol hatalarını yakala
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Ağ hatalarını yakala
    page.on("requestfailed", (req) => {
      networkErrors.push({
        url: req.url(),
        failure: req.failure()?.errorText || "bilinmeyen hata",
      });
    });

    // Sayfa çökmelerini yakala
    page.on("crash", () => {
      crashed = true;
    });

    try {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: CONFIG.timeoutMs,
      });

      // Sayfa tamamen yüklendi mi?
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      const isEmpty = bodyText.trim().length < 20;

      const hasErrors = consoleErrors.length > 0 || networkErrors.length > 0 || isEmpty || crashed;
      const icon = hasErrors ? "✗" : "✓";
      const color = hasErrors ? C.yellow : C.green;

      log(`  ${icon} ${route.name}`, color);
      if (consoleErrors.length > 0) {
        consoleErrors.forEach((e) => log(`    JS Hata: ${e}`, C.red));
      }
      if (networkErrors.length > 0) {
        networkErrors.forEach((e) => log(`    Ağ Hatası: ${e.url} — ${e.failure}`, C.red));
      }
      if (isEmpty) {
        log(`    ⚠ Sayfa boş görünüyor (${bodyText.length} karakter)`, C.yellow);
      }

      results.push({
        route: route.path,
        name: route.name,
        url,
        consoleErrors,
        networkErrors: networkErrors.map((e) => `${e.url}: ${e.failure}`),
        isEmpty,
        crashed,
        ok: !hasErrors,
      });
    } catch (err) {
      log(`  ✗ ${route.name} — ${err.message}`, C.red);
      results.push({
        route: route.path,
        name: route.name,
        url,
        consoleErrors: [],
        networkErrors: [],
        isEmpty: false,
        crashed: false,
        ok: false,
        error: err.message,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return results;
}

// ─── 4. Hata Koleksiyoncusu ───────────────────────────────────────────────────

function collectErrors(linkResults, apiResults, browserResults) {
  section("Hata Koleksiyoncusu — Özet");
  const errors = [];

  // HTTP hataları
  for (const r of linkResults) {
    if (!r.ok) {
      const severity = r.status === 404 ? "yüksek" : r.status >= 500 ? "kritik" : "orta";
      errors.push({
        type: "HTTP Hatası",
        severity,
        location: r.url,
        detail: r.error || `HTTP ${r.status} — ${r.name}`,
        category: "link",
      });
    }
  }

  // API hataları
  for (const r of apiResults) {
    if (!r.ok) {
      errors.push({
        type: "API Hatası",
        severity: "kritik",
        location: r.url,
        detail: r.error || `HTTP ${r.status} — ${r.name}`,
        category: "api",
      });
    }
  }

  // Browser hataları
  for (const r of browserResults) {
    for (const e of r.consoleErrors) {
      errors.push({
        type: "JavaScript Hatası",
        severity: "yüksek",
        location: r.url,
        detail: e,
        category: "browser",
      });
    }
    for (const e of r.networkErrors) {
      errors.push({
        type: "Ağ Hatası",
        severity: "orta",
        location: r.url,
        detail: e,
        category: "browser",
      });
    }
    if (r.isEmpty) {
      errors.push({
        type: "Boş Sayfa",
        severity: "yüksek",
        location: r.url,
        detail: `${r.name} sayfası boş yüklendi`,
        category: "browser",
      });
    }
  }

  const kritik = errors.filter((e) => e.severity === "kritik").length;
  const yuksek = errors.filter((e) => e.severity === "yüksek").length;
  const orta = errors.filter((e) => e.severity === "orta").length;

  if (errors.length === 0) {
    log("  ✓ Hiç hata bulunamadı!", C.green);
  } else {
    log(`  Toplam ${errors.length} hata:`, C.bold);
    if (kritik > 0) log(`    🔴 Kritik: ${kritik}`, C.red);
    if (yuksek > 0) log(`    🟠 Yüksek: ${yuksek}`, C.yellow);
    if (orta > 0) log(`    🟡 Orta: ${orta}`, C.gray);
  }

  return errors;
}

// ─── 5. Claude AI Analizi ─────────────────────────────────────────────────────

async function analyzeWithClaude(errors, linkResults, apiResults) {
  section("Claude AI — Hata Analizi");

  if (!CONFIG.anthropicApiKey) {
    log("  ⚠ ANTHROPIC_API_KEY tanımlı değil, AI analizi atlandı.", C.yellow);
    return null;
  }

  if (errors.length === 0) {
    log("  ✓ Analiz edilecek hata yok.", C.green);
    return { summary: "Hiç hata tespit edilmedi. Site sağlıklı görünüyor.", suggestions: [] };
  }

  log("  Claude'a gönderiliyor...", C.gray);

  const client = new Anthropic({ apiKey: CONFIG.anthropicApiKey });

  const prompt = `Sen agah hoca eğitim platformunun web analiz uzmanısın.

## Site Bilgisi
- URL: ${CONFIG.targetUrl}
- Platform: Expo React Native (web build), Vercel üzerinde
- Backend: Supabase (Auth + PostgreSQL)
- Kullanıcı rolleri: öğrenci, öğretmen, admin

## Tespit Edilen Hatalar
${JSON.stringify(errors, null, 2)}

## HTTP Durum Özeti
${linkResults
  .map((r) => `- ${r.name} (${r.route}): ${r.status ?? "BAĞLANTI HATASI"} — ${r.ok ? "OK" : "HATA"}`)
  .join("\n")}

## Supabase API Durumu
${apiResults.length > 0
    ? apiResults.map((r) => `- ${r.name}: ${r.status ?? "ERR"} — ${r.ok ? "OK" : "HATA"}`).join("\n")
    : "- Kontrol yapılamadı (env değişkeni eksik)"}

## İstenen Analiz
Her hata için:
1. **Muhtemel Sebep**: Neden oluşuyor olabilir?
2. **Etki**: Öğrenciler / öğretmenler nasıl etkileniyor?
3. **Çözüm Önerisi**: Adım adım nasıl düzeltilir?
4. **Öncelik**: Kritik / Yüksek / Orta / Düşük

Sonunda genel bir "Site Sağlık Özeti" yaz (1-2 paragraf, Türkçe).
Yanıtını Markdown formatında ver.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const analysisText = message.content[0].text;
    log("  ✓ Analiz tamamlandı.", C.green);
    return { text: analysisText };
  } catch (err) {
    log(`  ✗ Claude API hatası: ${err.message}`, C.red);
    return null;
  }
}

// ─── 6. Rapor Üretici ─────────────────────────────────────────────────────────

async function generateReport(linkResults, apiResults, browserResults, errors, analysis) {
  section("Rapor Üretici");

  const now = new Date();
  const dateStr = now.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const fileDate = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const totalChecks = linkResults.length + apiResults.length + browserResults.length;
  const totalOk = [...linkResults, ...apiResults, ...browserResults].filter((r) => r.ok).length;
  const healthScore = Math.round((totalOk / totalChecks) * 100);

  const scoreEmoji = healthScore >= 90 ? "🟢" : healthScore >= 70 ? "🟡" : "🔴";

  const markdown = `# agah hoca — Web Analiz Raporu
📅 ${dateStr}
🌐 ${CONFIG.targetUrl}

---

## ${scoreEmoji} Site Sağlık Skoru: ${healthScore}/100

| Kategori | Kontrol | Başarılı | Başarısız |
|----------|---------|----------|-----------|
| Sayfalar (HTTP) | ${linkResults.length} | ${linkResults.filter((r) => r.ok).length} | ${linkResults.filter((r) => !r.ok).length} |
| Supabase API | ${apiResults.length} | ${apiResults.filter((r) => r.ok).length} | ${apiResults.filter((r) => !r.ok).length} |
| Browser (JS/UI) | ${browserResults.length} | ${browserResults.filter((r) => r.ok).length} | ${browserResults.filter((r) => !r.ok).length} |
| **Toplam** | **${totalChecks}** | **${totalOk}** | **${totalChecks - totalOk}** |

---

## 🔗 HTTP Durum Detayları

${linkResults
    .map((r) => {
      const icon = r.ok ? "✅" : "❌";
      const status = r.status ?? "HATA";
      return `- ${icon} **${r.name}** (\`${r.route}\`) — HTTP ${status}${r.error ? ` — _${r.error}_` : ""}`;
    })
    .join("\n")}

---

## 🔌 Supabase API Durumu

${apiResults.length === 0
    ? "_API kontrolü yapılamadı (EXPO_PUBLIC_SUPABASE_URL tanımlı değil)_"
    : apiResults
        .map((r) => {
          const icon = r.ok ? "✅" : "❌";
          return `- ${icon} **${r.name}** — HTTP ${r.status ?? "HATA"}${r.error ? ` — _${r.error}_` : ""}`;
        })
        .join("\n")}

---

## 🌐 Browser Kontrolü (JS ve UI)

${browserResults.length === 0
    ? "_Playwright kurulu değil veya kontrol yapılamadı_"
    : browserResults
        .map((r) => {
          const icon = r.ok ? "✅" : "⚠️";
          let detail = "";
          if (r.consoleErrors.length > 0) detail += `\n  - JS Hatalar: ${r.consoleErrors.join("; ")}`;
          if (r.networkErrors.length > 0) detail += `\n  - Ağ Hatalar: ${r.networkErrors.join("; ")}`;
          if (r.isEmpty) detail += `\n  - ⚠ Boş sayfa`;
          if (r.error) detail += `\n  - Hata: ${r.error}`;
          return `- ${icon} **${r.name}** (\`${r.route}\`)${detail}`;
        })
        .join("\n")}

---

## 🚨 Hata Özeti (${errors.length} hata)

${errors.length === 0
    ? "✅ Hiç hata tespit edilmedi!"
    : errors
        .map(
          (e, i) =>
            `### ${i + 1}. ${e.type} — ${e.severity.toUpperCase()}
**Konum:** \`${e.location}\`
**Detay:** ${e.detail}
`
        )
        .join("\n")}

---

## 🤖 Claude AI Analizi

${analysis?.text || analysis?.summary || "_AI analizi yapılamadı (ANTHROPIC_API_KEY tanımlı değil veya hata oluştu)_"}

---

_Rapor otomatik olarak agah hoca Web Analiz Ajanı tarafından oluşturuldu._
`;

  // Raporu kaydet
  await fs.mkdir(CONFIG.reportDir, { recursive: true });
  const reportPath = path.join(CONFIG.reportDir, `rapor-${fileDate}.md`);
  const latestPath = path.join(CONFIG.reportDir, "son-rapor.md");

  await fs.writeFile(reportPath, markdown, "utf-8");
  await fs.writeFile(latestPath, markdown, "utf-8");

  log(`  ✓ Rapor kaydedildi: ${reportPath}`, C.green);
  log(`  ✓ Son rapor: ${latestPath}`, C.green);

  return { reportPath, markdown, healthScore };
}

// ─── Ana Akış ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.bold}${C.blue}╔══════════════════════════════════════════╗`);
  console.log(`║   agah hoca — Web Analiz Ajanı 🔍        ║`);
  console.log(`╚══════════════════════════════════════════╝${C.reset}`);
  log(`Hedef: ${CONFIG.targetUrl}`, C.gray);
  log(`Zaman: ${new Date().toLocaleString("tr-TR")}`, C.gray);

  const startTime = Date.now();

  // Tüm kontrolleri çalıştır
  const linkResults = await runLinkChecker();
  const apiResults = await runApiChecker();
  const browserResults = await runBrowserCheck();

  // Hataları topla ve önceliklendir
  const errors = collectErrors(linkResults, apiResults, browserResults);

  // Claude ile analiz et
  const analysis = await analyzeWithClaude(errors, linkResults, apiResults);

  // Rapor üret
  const { reportPath, healthScore } = await generateReport(
    linkResults,
    apiResults,
    browserResults,
    errors,
    analysis
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${C.bold}${"═".repeat(50)}${C.reset}`);
  log(`✅ Analiz tamamlandı — ${elapsed} saniye`, C.green);
  log(`📊 Sağlık skoru: ${healthScore}/100`, healthScore >= 80 ? C.green : C.yellow);
  log(`📄 Rapor: ${reportPath}`, C.cyan);
  console.log(`${C.bold}${"═".repeat(50)}${C.reset}\n`);

  // CI ortamında hata varsa exit code 1 döndür
  if (process.env.CI && errors.filter((e) => e.severity === "kritik").length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${C.red}FATAL: ${err.message}${C.reset}`);
  console.error(err.stack);
  process.exit(1);
});
