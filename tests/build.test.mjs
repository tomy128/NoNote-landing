import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const runBuild = (url = "https://nonote.example") =>
  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, SITE_URL: url },
    encoding: "utf8",
  });

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
