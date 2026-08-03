import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const source = path.join(process.cwd(), ".github", "signing", "benny-debug-keystore.b64");
const targetDir = path.join(os.homedir(), ".android");
const target = path.join(targetDir, "debug.keystore");

const encoded = (await readFile(source, "utf8")).trim();
const bytes = Buffer.from(encoded, "base64");

await mkdir(targetDir, { recursive: true });
await writeFile(target, bytes);
await chmod(target, 0o600);

console.log("✓ Android personal test identity is ready");
