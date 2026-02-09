import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_PUSH_TOKEN || process.env.GITHUB_TOKEN;
const OWNER = "yarasadekk-NFA";
const REPO = "nfamarket";
const BRANCH = "main";

const headers: Record<string, string> = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
};

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", ".cache", ".local", ".config", ".upm",
  "server/public", "attached_assets", ".pythonlibs",
]);

const IGNORE_FILES = new Set([
  ".env", ".env.local", ".env.production", "package-lock.json",
  ".replit", "replit.nix", "replit.md", "replit_agent.toml",
  ".replit.workflow", "generated-icon.png",
]);

const IGNORE_PATTERNS = [/^\.replit/, /replit\.nix/, /replit_agent/, /\.replit\.workflow/, /\.breakpoints$/];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split("/");
  for (const dir of parts.slice(0, -1)) {
    if (IGNORE_DIRS.has(dir) || dir.startsWith(".replit")) return true;
  }
  const fileName = parts[parts.length - 1];
  if (IGNORE_FILES.has(fileName)) return true;
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(fileName) || pattern.test(filePath)) return true;
  }
  return false;
}

function getAllFiles(dir: string, base: string = ""): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith(".replit")) {
        files.push(...getAllFiles(path.join(dir, entry.name), relativePath));
      }
    } else if (!shouldIgnore(relativePath)) {
      files.push(relativePath);
    }
  }
  return files;
}

function isBinary(filePath: string): boolean {
  const exts = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2",
    ".ttf", ".eot", ".mp3", ".mp4", ".webm", ".tar", ".gz", ".zip",
    ".pdf", ".bin", ".exe",
  ]);
  return exts.has(path.extname(filePath).toLowerCase());
}

async function apiFetch(url: string, options: any = {}): Promise<Response> {
  const res = await fetch(url, { headers, ...options });
  return res;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Collecting files...");
  const projectDir = path.resolve(__dirname, "..");
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push\n`);

  let latestSha: string | undefined;
  let treeSha: string | undefined;

  try {
    const refRes = await apiFetch(`${BASE}/git/ref/heads/${BRANCH}`);
    if (refRes.ok) {
      const refData = await refRes.json();
      latestSha = refData.object.sha;
      const commitRes = await apiFetch(`${BASE}/git/commits/${latestSha}`);
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        treeSha = commitData.tree.sha;
      }
    }
  } catch {}

  if (!latestSha) {
    console.log("Repo is empty, initializing...");
    const initRes = await apiFetch(`${BASE}/contents/README.md`, {
      method: "PUT",
      body: JSON.stringify({
        message: "Initialize repository",
        content: Buffer.from("# nfamarket\nInitializing...\n").toString("base64"),
      }),
    });
    if (!initRes.ok) {
      const t = await initRes.text();
      console.error("Init failed:", t);
      process.exit(1);
    }
    await sleep(3000);

    const refRes2 = await apiFetch(`${BASE}/git/ref/heads/${BRANCH}`);
    const refData2 = await refRes2.json();
    latestSha = refData2.object.sha;
    const commitRes2 = await apiFetch(`${BASE}/git/commits/${latestSha}`);
    const commitData2 = await commitRes2.json();
    treeSha = commitData2.tree.sha;
    console.log("Repo initialized.\n");
  }

  console.log("Creating blobs...");
  const treeItems: any[] = [];
  let count = 0;

  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    const binary = isBinary(fullPath);
    const content = binary
      ? fs.readFileSync(fullPath).toString("base64")
      : Buffer.from(fs.readFileSync(fullPath, "utf-8")).toString("base64");

    let retries = 3;
    while (retries > 0) {
      try {
        const blobRes = await apiFetch(`${BASE}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content, encoding: "base64" }),
        });

        if (blobRes.status === 403 || blobRes.status === 429) {
          console.log("  Rate limited, waiting 30s...");
          await sleep(30000);
          retries--;
          continue;
        }

        if (!blobRes.ok) {
          const t = await blobRes.text();
          throw new Error(`Blob error ${blobRes.status}: ${t.slice(0, 150)}`);
        }

        const blobData = await blobRes.json();
        treeItems.push({
          path: file,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        });
        count++;
        if (count % 20 === 0) console.log(`  ${count}/${files.length} blobs created`);
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          console.error(`  FAILED: ${file} - ${err.message.slice(0, 100)}`);
        } else {
          await sleep(2000);
        }
      }
    }
  }

  console.log(`\n${treeItems.length} blobs created. Building tree...`);

  const treeRes = await apiFetch(`${BASE}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ tree: treeItems }),
  });

  if (!treeRes.ok) {
    const t = await treeRes.text();
    console.error("Tree creation failed:", t.slice(0, 300));
    process.exit(1);
  }
  const treeData = await treeRes.json();
  console.log("Tree created.");

  console.log("Creating commit...");
  const commitRes = await apiFetch(`${BASE}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "NFA Market - Multi-chain AI Agent Marketplace\n\nnfamarket.io - Supporting ETH, Base, SOL, BNB, and TRX\nFull i18n support (EN/ZH/ES), smart contracts (ERC-8004, ERC-7857, BAP-578)",
      tree: treeData.sha,
      parents: [latestSha],
    }),
  });

  if (!commitRes.ok) {
    const t = await commitRes.text();
    console.error("Commit failed:", t.slice(0, 300));
    process.exit(1);
  }
  const commitData = await commitRes.json();
  console.log("Commit created.");

  console.log("Updating branch ref...");
  const updateRes = await apiFetch(`${BASE}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitData.sha, force: true }),
  });

  if (!updateRes.ok) {
    const t = await updateRes.text();
    console.error("Ref update failed:", t.slice(0, 300));
    process.exit(1);
  }

  console.log(`\nSuccess! All ${treeItems.length} files pushed.`);
  console.log(`Repository: https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => {
  console.error("Push failed:", err.message);
  process.exit(1);
});
