import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ["scripts/build.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, SITE_URL: `http://localhost:${port}` },
  });
  child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${code}`))));
});

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname);
    let target = path.join(root, "dist", pathname);
    if (!target.startsWith(path.join(root, "dist"))) throw new Error("invalid path");
    const info = await stat(target).catch(() => null);
    if (info?.isDirectory()) target = path.join(target, "index.html");
    const data = await readFile(target);
    response.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`NoNote landing page: http://localhost:${port}`);
});
