import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const runBuild = (url = "https://nonote.example") =>
  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, SITE_URL: url },
    encoding: "utf8",
  });

const runBuildWithEnv = (environment) => {
  const env = { ...process.env };
  delete env.SITE_URL;
  return execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    env: { ...env, ...environment },
    encoding: "utf8",
  });
};

test("build generates all localized routes and metadata", () => {
  runBuild();
  for (const file of ["dist/index.html", "dist/en/index.html", "dist/zh-CN/index.html", "dist/robots.txt", "dist/sitemap.xml"]) {
    assert.ok(statSync(file).size > 0, `${file} should exist`);
  }
  const en = readFileSync("dist/en/index.html", "utf8");
  const zh = readFileSync("dist/zh-CN/index.html", "utf8");
  assert.match(en, /<html lang="en"/);
  assert.match(zh, /<html lang="zh-CN"/);
  assert.match(en, /rel="canonical" href="https:\/\/nonote\.example\/en\/"/);
  assert.match(zh, /hreflang="en" href="https:\/\/nonote\.example\/en\/"/);
  assert.match(en, /SoftwareApplication/);
});

test("build rejects invalid site URLs in production", () => {
  assert.throws(() =>
    execFileSync(process.execPath, ["scripts/build.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, SITE_URL: "http://example.com", NODE_ENV: "production" },
      stdio: "pipe",
    }),
  );
});

test("GitHub Pages project URLs prefix every internal asset and locale route", () => {
  runBuild("https://tomy128.github.io/NoNote-landing");
  const root = readFileSync("dist/index.html", "utf8");
  const zh = readFileSync("dist/zh-CN/index.html", "utf8");
  assert.match(root, /href="\/NoNote-landing\/assets\/styles\.css"/);
  assert.match(root, /src="\/NoNote-landing\/assets\/main\.js"/);
  assert.match(root, /href="\/NoNote-landing\/zh-CN\/"/);
  assert.match(root, /location\.pathname==="\/NoNote-landing\/"/);
  assert.match(zh, /src="\/NoNote-landing\/assets\/product\/derived\/zh-workspace\.webp"/);
  assert.match(zh, /rel="canonical" href="https:\/\/tomy128\.github\.io\/NoNote-landing\/zh-CN\/"/);
});

test("Vercel builds derive an HTTPS site URL from the deployment environment", () => {
  runBuildWithEnv({ CI: "true", VERCEL_PROJECT_PRODUCTION_URL: "nonote.vercel.app" });
  const en = readFileSync("dist/en/index.html", "utf8");
  assert.match(en, /rel="canonical" href="https:\/\/nonote\.vercel\.app\/en\/"/);
  assert.match(en, /href="\/assets\/styles\.css"/);
});

test("generated pages use unique ids and have image alt text", () => {
  runBuild();
  for (const locale of ["en", "zh-CN"]) {
    const html = readFileSync(`dist/${locale}/index.html`, "utf8");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${locale} should not contain duplicate ids`);
    for (const image of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(image[0], /\salt="[^"]*"/, `${locale} image should include alt`);
    }
    assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
  }
});

test("client assets stay within the agreed budget", () => {
  runBuild();
  assert.ok(statSync("dist/assets/main.js").size <= 24 * 1024, "JavaScript must stay under 24KB uncompressed");
  assert.ok(statSync("dist/assets/styles.css").size <= 64 * 1024, "CSS must stay under 64KB uncompressed");
});

test("generated pages contain the new narrative and no concept product image", () => {
  runBuild();
  for (const locale of ["en", "zh-CN"]) {
    const html = readFileSync(`dist/${locale}/index.html`, "utf8");
    assert.match(html, /id="workflow"/);
    assert.match(html, /id="local-first"/);
    assert.match(html, /class="why"/);
    assert.match(html, /class="evidence section"/);
    assert.doesNotMatch(html, /product-preview\.jpg/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
  }
});

test("build publishes verified derivatives but never raw product captures", () => {
  runBuild();
  assert.equal(existsSync("dist/assets/product/source"), false);
  for (const locale of ["en", "zh"]) {
    for (const scene of ["workspace", "reader", "assistant", "output"]) {
      const file = `dist/assets/product/derived/${locale}-${scene}.webp`;
      assert.ok(statSync(file).size > 0, `${file} should exist`);
      assert.ok(statSync(file).size <= 150 * 1024, `${file} should stay under 150KB`);
    }
  }
});
