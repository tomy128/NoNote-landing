import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "src", "content", "releases.json");
const repository = "tomy128/NoNote";
const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "NoNote-Landing",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});
if (!response.ok) throw new Error(`GitHub latest release request failed: ${response.status}`);
const release = await response.json();
if (release.draft || release.prerelease) throw new Error("latest release must be public and stable");

const version = String(release.tag_name || "").replace(/^v/, "");
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`unsupported release tag: ${release.tag_name}`);
const expected = new Map([
  [`NoNote_${version}_macos_aarch64.dmg`, "macos-arm64"],
  [`NoNote_${version}_macos_x86_64.dmg`, "macos-x64"],
  [`NoNote_${version}_windows_x86_64-setup.exe`, "windows-x64"],
]);
const assets = new Map(release.assets.map((asset) => [asset.name, asset]));
if (assets.size !== expected.size || [...expected.keys()].some((name) => !assets.has(name))) {
  throw new Error(`release assets do not match the expected platform set: ${[...assets.keys()].join(", ")}`);
}

const current = JSON.parse(await readFile(manifestPath, "utf8"));
const byId = new Map(current.platforms.map((platform) => [platform.id, platform]));
const platforms = [...expected].map(([name, id]) => {
  const asset = assets.get(name);
  if (!Number.isFinite(asset.size) || asset.size <= 0) throw new Error(`release asset is empty: ${name}`);
  const existing = byId.get(id);
  if (!existing) throw new Error(`manifest is missing platform metadata: ${id}`);
  return { ...existing, url: asset.browser_download_url };
});

const manifest = {
  ...current,
  version,
  tag: release.tag_name,
  releaseUrl: release.html_url,
  verifiedAt: new Date().toISOString().slice(0, 10),
  platforms,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced NoNote ${release.tag_name} with ${platforms.length} assets`);
