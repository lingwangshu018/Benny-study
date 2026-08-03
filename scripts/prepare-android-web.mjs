import {
  copyFile,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const webDir = path.join(root, "www");

const allowedRootExtensions = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".webmanifest",
  ".ico",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp"
]);

const excludedRootFiles = new Set([
  "package.json",
  "package-lock.json",
  "capacitor.config.json"
]);

const assetDirectories = ["assets", "data", "fonts", "icons", "images"];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function copyWebSource() {
  await rm(webDir, { recursive: true, force: true });
  await mkdir(webDir, { recursive: true });

  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (excludedRootFiles.has(entry.name)) continue;
    if (!allowedRootExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    await copyFile(path.join(root, entry.name), path.join(webDir, entry.name));
  }

  for (const directory of assetDirectories) {
    const source = path.join(root, directory);
    if (!(await exists(source))) continue;
    await cp(source, path.join(webDir, directory), { recursive: true });
  }
}

async function downloadFile(url, destination) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`下载失败：${url} (${response.status})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

async function makeThirdPartyLibrariesOffline() {
  const vendorDir = path.join(webDir, "assets", "vendor");
  await mkdir(vendorDir, { recursive: true });

  const xlsxUrl = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  const jszipUrl = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

  await Promise.all([
    downloadFile(xlsxUrl, path.join(vendorDir, "xlsx.full.min.js")),
    downloadFile(jszipUrl, path.join(vendorDir, "jszip.min.js"))
  ]);

  const indexPath = path.join(webDir, "index.html");
  let html = await readFile(indexPath, "utf8");
  html = html
    .replaceAll(xlsxUrl, "assets/vendor/xlsx.full.min.js")
    .replaceAll(jszipUrl, "assets/vendor/jszip.min.js");
  await writeFile(indexPath, html, "utf8");
}

async function validateBuildInput() {
  const indexPath = path.join(webDir, "index.html");
  if (!(await exists(indexPath))) {
    throw new Error("没有找到 www/index.html，无法构建 APK。");
  }

  const html = await readFile(indexPath, "utf8");
  if (html.includes("cdn.jsdelivr.net/npm/xlsx") || html.includes("cdn.jsdelivr.net/npm/jszip")) {
    throw new Error("APK 中仍存在未本地化的核心 CDN 依赖。");
  }
}

await copyWebSource();
await makeThirdPartyLibrariesOffline();
await validateBuildInput();

console.log("✓ Android 网页资源已准备到 www/");
console.log("✓ XLSX 与 JSZip 已改为 APK 内置离线资源");
