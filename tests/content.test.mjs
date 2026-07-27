import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => JSON.parse(readFileSync(`src/content/${name}.json`, "utf8"));

function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
  return typeof value;
}

test("localized content has the same shape", () => {
  assert.deepEqual(shape(read("en")), shape(read("zh-CN")));
});

test("release manifest contains the exact supported platform set", () => {
  const release = read("releases");
  assert.match(release.tag, /^v\d+\.\d+\.\d+$/);
  assert.equal(release.platforms.length, 3);
  assert.deepEqual(release.platforms.map((item) => item.id), ["macos-arm64", "macos-x64", "windows-x64"]);
  for (const platform of release.platforms) {
    assert.ok(platform.url.startsWith("https://github.com/tomy128/NoNote/releases/download/"));
    assert.ok(platform.requirement);
  }
});
