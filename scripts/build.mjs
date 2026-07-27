import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");
const production = process.env.NODE_ENV === "production" || process.env.CI === "true";
const rawSiteUrl = process.env.SITE_URL || (production ? "" : "http://localhost:4173");

if (!rawSiteUrl) throw new Error("SITE_URL is required for a production build");
let siteUrl;
try {
  siteUrl = new URL(rawSiteUrl);
} catch {
  throw new Error("SITE_URL must be an absolute URL");
}
if (production && siteUrl.protocol !== "https:") throw new Error("production SITE_URL must use https");
const baseUrl = siteUrl.href.replace(/\/$/, "");

const readJson = async (name) =>
  JSON.parse(await readFile(path.join(src, "content", name), "utf8"));
const [site, releases, en, zh, template] = await Promise.all([
  readJson("site.json"),
  readJson("releases.json"),
  readJson("en.json"),
  readJson("zh-CN.json"),
  readFile(path.join(src, "templates", "page.html"), "utf8"),
]);

function keys(value, prefix = "") {
  if (Array.isArray(value)) return value.flatMap((item, index) => keys(item, `${prefix}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => keys(item, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

const enKeys = keys(en);
const zhKeys = keys(zh);
if (JSON.stringify(enKeys) !== JSON.stringify(zhKeys)) {
  throw new Error("English and Chinese content structures do not match");
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const icon = (name) => {
  const paths = {
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.2 15 2a13.4 13.4 0 0 0-7 0C4.8.2 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4M8 19c-3 .9-3-1.5-4-2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

function head(content, locale, canonical) {
  const alternate = locale === "en" ? "zh-CN" : "en";
  const lang = locale === "zh-CN" ? "zh-CN" : "en";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "macOS, Windows",
    description: content.meta.description,
    url: canonical,
    downloadUrl: `${baseUrl}/#download`,
    license: "https://opensource.org/license/mit",
  };
  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>${escapeHtml(content.meta.title)}</title>
  <meta name="description" content="${escapeHtml(content.meta.description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="${lang}" href="${baseUrl}/${locale}/">
  <link rel="alternate" hreflang="${alternate}" href="${baseUrl}/${alternate}/">
  <link rel="alternate" hreflang="x-default" href="${baseUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NoNote">
  <meta property="og:title" content="${escapeHtml(content.meta.title)}">
  <meta property="og:description" content="${escapeHtml(content.meta.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${baseUrl}/assets/product-preview.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(content.meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(content.meta.description)}">
  <meta name="twitter:image" content="${baseUrl}/assets/product-preview.jpg">
  <link rel="icon" href="/assets/nonote-icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/nonote-icon.png">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>`;
}

function renderHeader(c, locale) {
  const otherLocale = locale === "en" ? "zh-CN" : "en";
  return `
  <header class="site-header" data-header>
    <a class="brand" href="/${locale}/" aria-label="NoNote home">
      <img src="/assets/nonote-icon.svg" width="34" height="34" alt="">
      <span>NoNote</span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-menu-toggle>
      <span class="sr-only">Menu</span><span class="menu-open">${icon("menu")}</span><span class="menu-close">${icon("close")}</span>
    </button>
    <nav id="site-nav" class="site-nav" aria-label="Primary" data-nav>
      <a href="#product">${escapeHtml(c.nav.product)}</a>
      <a href="#local-first">${escapeHtml(c.nav.privacy)}</a>
      <a href="${site.repository}" target="_blank" rel="noreferrer">${escapeHtml(c.nav.github)}</a>
      <a class="language-link" href="/${otherLocale}/" data-language>${icon("globe")} ${escapeHtml(c.nav.language)}</a>
      <a class="button button-small" href="#download">${escapeHtml(c.nav.download)}</a>
    </nav>
  </header>`;
}

function renderHero(c) {
  const steps = c.hero.demoSteps
    .map((step, index) => `<button type="button" class="demo-step${index === 0 ? " is-active" : ""}" data-demo-step="${index}" aria-pressed="${index === 0}"><span>0${index + 1}</span>${escapeHtml(step)}</button>`)
    .join("");
  return `
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(c.hero.eyebrow)}</p>
      <h1 id="hero-title">${escapeHtml(c.hero.title)}<br><em>${escapeHtml(c.hero.titleAccent)}</em></h1>
      <p class="hero-body">${escapeHtml(c.hero.body)}</p>
      <div class="hero-actions">
        <a class="button button-primary" href="#download">${icon("download")}${escapeHtml(c.hero.download)}</a>
        <a class="button button-secondary" href="${site.repository}" target="_blank" rel="noreferrer">${icon("github")}${escapeHtml(c.hero.github)}</a>
      </div>
      <p class="hero-note">${escapeHtml(c.hero.note)}</p>
    </div>
    <div class="product-stage" data-demo>
      <div class="stage-glow" aria-hidden="true"></div>
      <figure class="product-window">
        <div class="window-bar" aria-hidden="true"><i></i><i></i><i></i><span>NoNote · Research Workspace</span></div>
        <img src="/assets/product-preview.jpg" width="1568" height="1003" alt="${escapeHtml(c.hero.preview)}" fetchpriority="high">
        <span class="demo-focus focus-0" aria-hidden="true"></span>
        <span class="demo-focus focus-1" aria-hidden="true"></span>
        <span class="demo-focus focus-2" aria-hidden="true"></span>
      </figure>
      <div class="demo-controls" aria-label="${escapeHtml(c.hero.preview)}">${steps}</div>
    </div>
  </section>`;
}

function renderProof(c) {
  return `<div class="proof-strip" aria-label="Product facts">${c.proof.map((item) => `<span>${icon("check")}${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderWorkflow(c) {
  return `
  <section class="section workflow" id="product" aria-labelledby="workflow-title">
    <div class="section-intro">
      <p class="eyebrow">${escapeHtml(c.workflow.eyebrow)}</p>
      <h2 id="workflow-title">${escapeHtml(c.workflow.title)}</h2>
      <p>${escapeHtml(c.workflow.body)}</p>
    </div>
    <div class="workflow-shell" data-workflow>
      <div class="workflow-tabs" role="tablist">
        ${c.workflow.steps.map((step, index) => `<button type="button" role="tab" id="tab-${step.id}" aria-controls="panel-${step.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-workflow-tab="${index}"><span>${step.number}</span><strong>${escapeHtml(step.title)}</strong></button>`).join("")}
      </div>
      <div class="workflow-panels">
        ${c.workflow.steps.map((step, index) => `<article role="tabpanel" id="panel-${step.id}" aria-labelledby="tab-${step.id}"${index ? " hidden" : ""} data-workflow-panel="${index}"><span class="workflow-orbit" aria-hidden="true"><i></i><i></i><i></i></span><p>${escapeHtml(step.text)}</p></article>`).join("")}
      </div>
    </div>
  </section>`;
}

function renderCapabilities(c) {
  return `
  <section class="section capabilities" aria-labelledby="capabilities-title">
    <div class="section-intro">
      <p class="eyebrow">${escapeHtml(c.capabilities.eyebrow)}</p>
      <h2 id="capabilities-title">${escapeHtml(c.capabilities.title)}</h2>
    </div>
    <div class="capability-list">
      ${c.capabilities.items.map((item, index) => `<article class="capability-item"><div class="capability-index">0${index + 1}</div><div><span>${escapeHtml(item.label)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div></article>`).join("")}
    </div>
  </section>`;
}

function renderLocal(c) {
  return `
  <section class="local-first" id="local-first" aria-labelledby="local-title" data-local>
    <div class="local-copy">
      <p class="eyebrow">${escapeHtml(c.local.eyebrow)}</p>
      <h2 id="local-title">${escapeHtml(c.local.title)}</h2>
      <p>${escapeHtml(c.local.body)}</p>
      <ul>${c.local.points.map((point) => `<li>${icon("check")}<span>${escapeHtml(point)}</span></li>`).join("")}</ul>
      <a href="${site.repository}" target="_blank" rel="noreferrer">${escapeHtml(c.local.link)} ${icon("arrow")}</a>
    </div>
    <div class="local-map" aria-label="Local-first data flow">
      <svg viewBox="0 0 620 420" role="img">
        <title>Files remain on device while NoNote creates a local index and connects to a provider chosen by the user.</title>
        <path class="map-path" d="M106 210 C170 210 176 110 268 110 S354 210 414 210 S470 118 530 118"/>
        <path class="map-path map-path-secondary" d="M268 110 C320 110 324 310 414 310 S474 210 530 210"/>
        <g class="map-node"><rect x="32" y="174" width="148" height="72" rx="16"/><text x="106" y="204">Your files</text><text x="106" y="225">On device</text></g>
        <g class="map-node map-node-primary"><rect x="232" y="74" width="136" height="72" rx="16"/><text x="300" y="105">NoNote</text><text x="300" y="126">Local index</text></g>
        <g class="map-node"><rect x="378" y="274" width="136" height="72" rx="16"/><text x="446" y="305">You decide</text><text x="446" y="326">Confirm action</text></g>
        <g class="map-node"><rect x="464" y="82" width="124" height="72" rx="16"/><text x="526" y="113">AI</text><text x="526" y="134">Your provider</text></g>
      </svg>
    </div>
  </section>`;
}

function renderShowcase(c) {
  return `
  <section class="section showcase" aria-labelledby="showcase-title">
    <div class="section-intro">
      <p class="eyebrow">${escapeHtml(c.showcase.eyebrow)}</p>
      <h2 id="showcase-title">${escapeHtml(c.showcase.title)}</h2>
    </div>
    <div class="showcase-grid">
      <div class="showcase-visual"><img src="/assets/product-preview.jpg" width="1568" height="1003" loading="lazy" alt="${escapeHtml(c.hero.preview)}"></div>
      <ol>${c.showcase.items.map((item) => `<li><span>${item.number}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div></li>`).join("")}</ol>
    </div>
  </section>`;
}

function renderDownload(c) {
  const cards = releases.platforms.map((platform) => `
    <article class="download-card" data-platform="${platform.os}">
      <div><span class="recommendation" hidden>${escapeHtml(c.download.recommended)}</span><span class="format">${platform.format}</span></div>
      <h3>${escapeHtml(platform.label)}</h3>
      <p>${escapeHtml(platform.arch)} · NoNote ${escapeHtml(releases.version)}</p>
      <p class="requirement">${escapeHtml(c.download.requirements)}: ${escapeHtml(platform.requirement)}</p>
      <a class="button button-download" href="${platform.url}" data-download>${icon("download")}${escapeHtml(c.download.download)} <span>${platform.format}</span></a>
    </article>`).join("");
  return `
  <section class="download-section" id="download" aria-labelledby="download-title">
    <div class="section-intro">
      <p class="eyebrow">${escapeHtml(c.download.eyebrow)}</p>
      <h2 id="download-title">${escapeHtml(c.download.title)}</h2>
      <p>${escapeHtml(c.download.body)}</p>
    </div>
    <div class="download-grid">${cards}</div>
    <div class="download-meta"><span>${escapeHtml(c.download.unsigned)} · v${escapeHtml(releases.version)}</span><a href="${releases.releaseUrl}" target="_blank" rel="noreferrer">${escapeHtml(c.download.allReleases)} ${icon("arrow")}</a></div>
  </section>`;
}

function renderFaq(c) {
  return `
  <section class="section faq" aria-labelledby="faq-title">
    <div class="section-intro">
      <p class="eyebrow">${escapeHtml(c.faq.eyebrow)}</p>
      <h2 id="faq-title">${escapeHtml(c.faq.title)}</h2>
    </div>
    <div class="faq-list">${c.faq.items.map((item) => `<details><summary>${escapeHtml(item.q)}<span aria-hidden="true">+</span></summary><p>${escapeHtml(item.a)}</p></details>`).join("")}</div>
  </section>`;
}

function renderFooter(c, locale) {
  const year = new Date().getUTCFullYear();
  return `
  <footer class="site-footer">
    <div class="footer-brand"><a class="brand" href="/${locale}/"><img src="/assets/nonote-icon.svg" width="34" height="34" alt=""><span>NoNote</span></a><p>${escapeHtml(c.footer.tagline)}</p></div>
    <nav aria-label="Footer">
      <a href="#product">${escapeHtml(c.footer.product)}</a>
      <a href="#download">${escapeHtml(c.footer.download)}</a>
      <a href="${site.repository}">${escapeHtml(c.footer.source)}</a>
      <a href="${site.releases}">${escapeHtml(c.footer.releases)}</a>
      <a href="https://opensource.org/license/mit">${escapeHtml(c.footer.license)}</a>
    </nav>
    <p class="copyright">© ${year} ${escapeHtml(c.footer.copyright)}</p>
  </footer>`;
}

function body(c, locale) {
  return `${renderHeader(c, locale)}<main id="main">${renderHero(c)}${renderProof(c)}${renderWorkflow(c)}${renderCapabilities(c)}${renderLocal(c)}${renderShowcase(c)}${renderDownload(c)}${renderFaq(c)}</main>${renderFooter(c, locale)}`;
}

function render(c, locale, canonical) {
  return template
    .replaceAll("{{LANG}}", locale === "zh-CN" ? "zh-CN" : "en")
    .replaceAll("{{LOCALE}}", locale)
    .replaceAll("{{HEAD}}", head(c, locale, canonical))
    .replaceAll("{{SKIP}}", locale === "zh-CN" ? "跳到主要内容" : "Skip to main content")
    .replaceAll("{{BODY}}", body(c, locale));
}

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "en"), { recursive: true });
await mkdir(path.join(dist, "zh-CN"), { recursive: true });
await mkdir(path.join(dist, "assets"), { recursive: true });
await cp(path.join(src, "assets"), path.join(dist, "assets"), { recursive: true });

const enPage = render(en, "en", `${baseUrl}/en/`);
const zhPage = render(zh, "zh-CN", `${baseUrl}/zh-CN/`);
const rootPage = render(en, "en", `${baseUrl}/`).replace(
  "</head>",
  `<script>try{const saved=localStorage.getItem("nonote-locale");const wanted=saved||((navigator.language||"").toLowerCase().startsWith("zh")?"zh-CN":"en");if(location.pathname==="/"&&wanted!=="en")location.replace("/"+wanted+"/")}catch{}</script></head>`,
);
await Promise.all([
  writeFile(path.join(dist, "index.html"), rootPage),
  writeFile(path.join(dist, "en", "index.html"), enPage),
  writeFile(path.join(dist, "zh-CN", "index.html"), zhPage),
  writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`),
  writeFile(
    path.join(dist, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${baseUrl}/</loc></url>\n  <url><loc>${baseUrl}/en/</loc></url>\n  <url><loc>${baseUrl}/zh-CN/</loc></url>\n</urlset>\n`,
  ),
]);

console.log(`Built NoNote landing page for ${baseUrl}`);
