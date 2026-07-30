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
try { siteUrl = new URL(rawSiteUrl); } catch { throw new Error("SITE_URL must be an absolute URL"); }
if (production && siteUrl.protocol !== "https:") throw new Error("production SITE_URL must use https");
const baseUrl = siteUrl.href.replace(/\/$/, "");

const readJson = async (name) => JSON.parse(await readFile(path.join(src, "content", name), "utf8"));
const [site, releases, en, zh, template] = await Promise.all([
  readJson("site.json"),
  readJson("releases.json"),
  readJson("en.json"),
  readJson("zh-CN.json"),
  readFile(path.join(src, "templates", "page.html"), "utf8"),
]);

function shapeKeys(value, prefix = "") {
  if (Array.isArray(value)) return value.flatMap((item, index) => shapeKeys(item, `${prefix}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => shapeKeys(item, prefix ? `${prefix}.${key}` : key));
  return [prefix];
}
if (JSON.stringify(shapeKeys(en)) !== JSON.stringify(shapeKeys(zh))) throw new Error("English and Chinese content structures do not match");

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const icon = (name) => {
  const paths = {
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.2 15 2a13.4 13.4 0 0 0-7 0C4.8.2 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4M8 19c-3 .9-3-1.5-4-2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    file: '<path d="M7 3h7l4 4v14H7zM14 3v5h5M10 12h5M10 16h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    quote: '<path d="M7 17h4V9H5v6a2 2 0 0 0 2 2ZM15 17h4V9h-6v6a2 2 0 0 0 2 2Z"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
};

function head(c, locale, canonical) {
  const other = locale === "en" ? "zh-CN" : "en";
  const lang = locale === "zh-CN" ? "zh-CN" : "en";
  const jsonLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: site.name,
    applicationCategory: "ProductivityApplication", operatingSystem: "macOS, Windows",
    description: c.meta.description, url: canonical, downloadUrl: `${baseUrl}/#download`,
    license: "https://opensource.org/license/mit",
  };
  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>${esc(c.meta.title)}</title>
  <meta name="description" content="${esc(c.meta.description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="${lang}" href="${baseUrl}/${locale}/">
  <link rel="alternate" hreflang="${other}" href="${baseUrl}/${other}/">
  <link rel="alternate" hreflang="x-default" href="${baseUrl}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NoNote">
  <meta property="og:title" content="${esc(c.meta.title)}">
  <meta property="og:description" content="${esc(c.meta.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${baseUrl}/assets/nonote-icon.png">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(c.meta.title)}">
  <meta name="twitter:description" content="${esc(c.meta.description)}">
  <meta name="twitter:image" content="${baseUrl}/assets/nonote-icon.png">
  <link rel="icon" href="/assets/nonote-icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/nonote-icon.png">
  <link rel="stylesheet" href="/assets/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>`;
}

const mediaPlaceholder = (label, hint, className = "") => `
  <div class="media-placeholder ${className}" role="img" aria-label="${esc(label)}">
    <div class="placeholder-grid" aria-hidden="true"></div>
    <div class="placeholder-app" aria-hidden="true">
      <span class="placeholder-sidebar"></span>
      <span class="placeholder-tree"></span>
      <span class="placeholder-reader"></span>
      <span class="placeholder-assistant"></span>
    </div>
    <div class="placeholder-copy">${icon("file")}<strong>${esc(label)}</strong><span>${esc(hint)}</span></div>
  </div>`;

function renderHeader(c, locale) {
  const other = locale === "en" ? "zh-CN" : "en";
  return `<header class="site-header" data-header>
    <a class="brand" href="/${locale}/" aria-label="NoNote home"><img src="/assets/nonote-icon.svg" width="34" height="34" alt=""><span>NoNote</span></a>
    <nav id="site-nav" class="site-nav" aria-label="Primary" data-nav>
      <a href="#workflow">${esc(c.nav.workflow)}</a><a href="#local-first">${esc(c.nav.privacy)}</a>
      <a href="${site.repository}" target="_blank" rel="noreferrer">${esc(c.nav.github)}</a>
      <a class="language-link" href="/${other}/" data-language>${icon("globe")} ${esc(c.nav.language)}</a>
    </nav>
    <a class="button button-small header-download" href="#download">${esc(c.nav.download)}</a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="${esc(c.nav.menu)}" data-menu-toggle>
      <span class="menu-open">${icon("menu")}</span><span class="menu-close">${icon("close")}</span>
    </button>
  </header>`;
}

function renderHero(c) {
  const steps = c.hero.demoSteps.map((step, index) => `<button type="button" class="demo-step${index === 0 ? " is-active" : ""}" data-demo-step="${index}" aria-pressed="${index === 0}"><span>0${index + 1}</span>${esc(step)}</button>`).join("");
  return `<section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy" data-reveal>
      <p class="lead">${esc(c.hero.eyebrow)}</p>
      <h1 id="hero-title">${esc(c.hero.title)}<br><em>${esc(c.hero.titleAccent)}</em></h1>
      <p class="hero-body">${esc(c.hero.body)}</p>
      <div class="hero-actions"><a class="button button-primary" href="#download">${icon("download")}${esc(c.hero.download)}</a><a class="button button-secondary" href="${site.repository}" target="_blank" rel="noreferrer">${icon("github")}${esc(c.hero.github)}</a></div>
      <p class="hero-note">${esc(c.hero.note)}</p>
    </div>
    <div class="product-stage" data-demo data-reveal>
      <div class="stage-aura" aria-hidden="true"></div>
      <figure class="product-window">
        <div class="window-bar" aria-hidden="true"><i></i><i></i><i></i><span>NoNote · Knowledge Workspace</span></div>
        ${mediaPlaceholder(c.hero.mediaPending, c.hero.mediaHint, "hero-media")}
        <span class="demo-focus focus-0" aria-hidden="true"></span><span class="demo-focus focus-1" aria-hidden="true"></span><span class="demo-focus focus-2" aria-hidden="true"></span>
      </figure>
      <div class="demo-controls" aria-label="${esc(c.hero.mediaLabel)}">${steps}</div>
    </div>
  </section>`;
}

function renderProblem(c) {
  return `<section class="problem section" aria-labelledby="problem-title">
    <div class="problem-heading" data-reveal><p class="lead">${esc(c.problem.lead)}</p><h2 id="problem-title">${esc(c.problem.title)}</h2><p>${esc(c.problem.body)}</p></div>
    <ol class="problem-list">${c.problem.items.map((item) => `<li data-reveal><span>${item.number}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></li>`).join("")}</ol>
  </section>`;
}

function renderWorkflow(c) {
  return `<section class="workflow" id="workflow" aria-labelledby="workflow-title" data-workflow>
    <div class="workflow-intro section" data-reveal><p class="lead">${esc(c.workflow.lead)}</p><h2 id="workflow-title">${esc(c.workflow.title)}</h2><p>${esc(c.workflow.body)}</p></div>
    <div class="workflow-story section">
      <div class="workflow-visual" data-reveal>
        <div class="window-bar" aria-hidden="true"><i></i><i></i><i></i><span>NoNote · Knowledge Lab</span></div>
        ${mediaPlaceholder(c.workflow.mediaPending, c.hero.mediaHint, "workflow-media")}
        <div class="workflow-signal" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="workflow-steps" role="tablist" aria-label="${esc(c.workflow.lead)}">
        ${c.workflow.steps.map((step, index) => `<button type="button" role="tab" id="workflow-tab-${step.id}" aria-controls="workflow-panel-${step.id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-workflow-tab="${index}"><span>${step.number}</span><small>${esc(step.verb)}</small><strong>${esc(step.title)}</strong><em>${esc(step.text)}</em></button>`).join("")}
      </div>
      <div class="sr-only">${c.workflow.steps.map((step, index) => `<div role="tabpanel" id="workflow-panel-${step.id}" aria-labelledby="workflow-tab-${step.id}"${index ? " hidden" : ""} data-workflow-panel="${index}">${esc(step.text)}</div>`).join("")}</div>
    </div>
  </section>`;
}

function renderWhy(c) {
  return `<section class="why" aria-labelledby="why-title" data-why>
    <div class="why-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="why-inner" data-reveal>
      <p class="lead">${esc(c.why.lead)}</p><h2 id="why-title">${esc(c.why.title)}</h2><p class="why-body">${esc(c.why.body)}</p>
      <blockquote>${icon("quote")}<p>${esc(c.why.quote)}</p><cite>${esc(c.why.signature)}</cite></blockquote>
    </div>
  </section>`;
}

function renderLocal(c) {
  const d = c.local.diagram;
  return `<section class="local section" id="local-first" aria-labelledby="local-title">
    <div class="local-copy" data-reveal><p class="lead">${esc(c.local.lead)}</p><h2 id="local-title">${esc(c.local.title)}</h2><p>${esc(c.local.body)}</p>
      <div class="local-links"><a href="${site.repository}" target="_blank" rel="noreferrer">${esc(c.local.source)} ${icon("arrow")}</a><a href="${site.releases}" target="_blank" rel="noreferrer">${esc(c.local.release)} ${icon("arrow")}</a></div>
    </div>
    <div class="local-system" data-local data-reveal>
      <svg viewBox="0 0 760 360" role="img" aria-labelledby="local-map-title"><title id="local-map-title">${esc(c.local.title)}</title>
        <path class="map-line line-a" d="M145 180C240 180 226 84 350 84S480 180 594 180"/><path class="map-line line-b" d="M350 84C380 84 398 284 510 284S560 180 594 180"/>
        <g class="map-node"><rect x="36" y="134" width="218" height="92" rx="16"/><text x="145" y="172">${esc(d.files)}</text><text x="145" y="198">${esc(d.local)}</text></g>
        <g class="map-node primary"><rect x="282" y="38" width="180" height="92" rx="16"/><text x="372" y="76">${esc(d.index)}</text><text x="372" y="102">${esc(d.local)}</text></g>
        <g class="map-node"><rect x="420" y="238" width="180" height="92" rx="16"/><text x="510" y="276">${esc(d.choice)}</text><text x="510" y="302">${esc(d.controlled)}</text></g>
        <g class="map-node provider"><rect x="550" y="134" width="174" height="92" rx="16"/><text x="637" y="172">${esc(d.provider)}</text><text x="637" y="198">${esc(d.controlled)}</text></g>
      </svg>
    </div>
    <div class="local-points">${c.local.points.map((point) => `<article data-reveal>${icon("check")}<div><h3>${esc(point.title)}</h3><p>${esc(point.text)}</p></div></article>`).join("")}</div>
  </section>`;
}

function renderEvidence(c) {
  return `<section class="evidence section" aria-labelledby="evidence-title">
    <div class="evidence-heading" data-reveal><p class="lead">${esc(c.evidence.lead)}</p><h2 id="evidence-title">${esc(c.evidence.title)}</h2><p>${esc(c.evidence.body)}</p></div>
    <div class="evidence-list">${c.evidence.items.map((item, index) => `<article class="evidence-item${index % 2 ? " reverse" : ""}" data-reveal>
      <div class="evidence-copy"><span>${item.number} · ${esc(item.label)}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>
      <button class="evidence-media" type="button" data-media-open="${item.id}" aria-label="${esc(c.evidence.open)}: ${esc(item.title)}">${mediaPlaceholder(item.media, c.hero.mediaHint, `media-${item.id}`)}<span>${esc(c.evidence.open)} ${icon("arrow")}</span></button>
    </article>`).join("")}</div>
    <dialog class="media-dialog" data-media-dialog aria-label="${esc(c.evidence.open)}"><button type="button" data-media-close aria-label="${esc(c.evidence.close)}">${icon("close")}</button><div data-media-dialog-content></div></dialog>
  </section>`;
}

function renderDownload(c) {
  const cards = releases.platforms.map((p) => `<article class="download-card" data-platform="${p.os}" data-arch="${p.arch}">
    <div><span class="recommendation" hidden>${esc(c.download.recommended)}</span><span class="format">${p.format}</span></div><h3>${esc(p.label)}</h3><p>${esc(p.arch)} · NoNote ${esc(releases.version)}</p>
    <p class="requirement">${esc(c.download.requirements)}: ${esc(p.requirement)}</p><a class="button button-download" href="${p.url}" data-download>${icon("download")}${esc(c.download.download)} <span>${p.format}</span></a>
  </article>`).join("");
  return `<section class="download-section" id="download" aria-labelledby="download-title">
    <div class="download-heading" data-reveal><p class="lead">${esc(c.download.lead)}</p><h2 id="download-title">${esc(c.download.title)}</h2><p>${esc(c.download.body)}</p><p class="platform-message" data-platform-message data-unknown="${esc(c.download.unknown)}" data-mac-unknown="${esc(c.download.macUnknown)}" hidden></p></div>
    <div class="download-grid">${cards}</div><div class="download-meta"><span>${esc(c.download.unsigned)} · v${esc(releases.version)}</span><a href="${releases.releaseUrl}" target="_blank" rel="noreferrer">${esc(c.download.allReleases)} ${icon("arrow")}</a></div>
  </section>`;
}

function renderFaq(c) {
  return `<section class="faq section" aria-labelledby="faq-title"><div class="faq-heading" data-reveal><p class="lead">${esc(c.faq.lead)}</p><h2 id="faq-title">${esc(c.faq.title)}</h2></div>
    <div class="faq-list">${c.faq.items.map((item) => `<details><summary>${esc(item.q)}<span aria-hidden="true">+</span></summary><p>${esc(item.a)}</p></details>`).join("")}</div></section>`;
}

function renderFooter(c, locale) {
  const year = new Date().getUTCFullYear();
  return `<footer class="site-footer"><div class="footer-brand"><a class="brand" href="/${locale}/"><img src="/assets/nonote-icon.svg" width="34" height="34" alt=""><span>NoNote</span></a><p>${esc(c.footer.tagline)}</p></div>
    <nav aria-label="Footer"><a href="#workflow">${esc(c.footer.workflow)}</a><a href="#local-first">${esc(c.footer.privacy)}</a><a href="#download">${esc(c.footer.download)}</a><a href="${site.repository}">${esc(c.footer.source)}</a><a href="${site.releases}">${esc(c.footer.releases)}</a><a href="https://opensource.org/license/mit">${esc(c.footer.license)}</a></nav>
    <p class="copyright">© ${year} ${esc(c.footer.copyright)}</p></footer>`;
}

const body = (c, locale) => `${renderHeader(c, locale)}<main id="main">${renderHero(c)}<div class="proof-strip">${c.proof.map((item) => `<span>${icon("check")}${esc(item)}</span>`).join("")}</div>${renderProblem(c)}${renderWorkflow(c)}${renderWhy(c)}${renderLocal(c)}${renderEvidence(c)}${renderDownload(c)}${renderFaq(c)}</main>${renderFooter(c, locale)}`;
const render = (c, locale, canonical) => template.replaceAll("{{LANG}}", locale === "zh-CN" ? "zh-CN" : "en").replaceAll("{{LOCALE}}", locale).replaceAll("{{HEAD}}", head(c, locale, canonical)).replaceAll("{{SKIP}}", locale === "zh-CN" ? "跳到主要内容" : "Skip to main content").replaceAll("{{BODY}}", body(c, locale));

await rm(dist, { recursive: true, force: true });
await Promise.all([mkdir(path.join(dist, "en"), { recursive: true }), mkdir(path.join(dist, "zh-CN"), { recursive: true }), mkdir(path.join(dist, "assets"), { recursive: true })]);
await cp(path.join(src, "assets"), path.join(dist, "assets"), { recursive: true });
const enPage = render(en, "en", `${baseUrl}/en/`);
const zhPage = render(zh, "zh-CN", `${baseUrl}/zh-CN/`);
const rootPage = render(en, "en", `${baseUrl}/`).replace("</head>", `<script>try{const saved=localStorage.getItem("nonote-locale");const wanted=saved||((navigator.language||"").toLowerCase().startsWith("zh")?"zh-CN":"en");if(location.pathname==="/"&&wanted!=="en")location.replace("/"+wanted+"/")}catch{}</script></head>`);
await Promise.all([
  writeFile(path.join(dist, "index.html"), rootPage), writeFile(path.join(dist, "en", "index.html"), enPage), writeFile(path.join(dist, "zh-CN", "index.html"), zhPage),
  writeFile(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`),
  writeFile(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${baseUrl}/</loc></url>\n  <url><loc>${baseUrl}/en/</loc></url>\n  <url><loc>${baseUrl}/zh-CN/</loc></url>\n</urlset>\n`),
]);
console.log(`Built NoNote landing page for ${baseUrl}`);
