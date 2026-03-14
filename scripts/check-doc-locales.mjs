import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const docsDir = path.resolve("docs");
const enDir = path.join(docsDir, "en");

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function getFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return null;
  }

  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (fieldMatch) {
      fields.set(fieldMatch[1], fieldMatch[2].trim());
    }
  }

  return { raw: match[1], fields };
}

function normalizeRoute(route) {
  return route.replace(/\/+/g, "/").replace(/\/$/, "");
}

function routeFromRelativePath(relativePath) {
  return `/${toPosixPath(relativePath).replace(/\.md$/, "")}`;
}

function findAbsoluteLinks(content) {
  const matches = [];
  const patterns = [
    /\]\((\/[^)\s]+)\)/g,
    /\bhref="(\/[^"]+)"/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      matches.push(match[1]);
    }
  }

  return matches;
}

async function ensureDirectoryExists(dir) {
  try {
    const result = await stat(dir);
    return result.isDirectory();
  } catch {
    return false;
  }
}

const problems = [];

if (!(await ensureDirectoryExists(enDir))) {
  problems.push("Missing docs/en directory.");
} else {
  const rootFiles = (await listMarkdownFiles(docsDir))
    .filter((file) => !file.startsWith(enDir + path.sep))
    .sort();
  const enFiles = (await listMarkdownFiles(enDir)).sort();

  const rootRelative = new Set(
    rootFiles.map((file) => toPosixPath(path.relative(docsDir, file))),
  );
  const enRelative = new Set(
    enFiles.map((file) => toPosixPath(path.relative(enDir, file))),
  );

  for (const relativePath of rootRelative) {
    if (!enRelative.has(relativePath)) {
      problems.push(`Missing English counterpart for docs/${relativePath}`);
    }
  }

  for (const relativePath of enRelative) {
    if (!rootRelative.has(relativePath)) {
      problems.push(`Missing Chinese counterpart for docs/en/${relativePath}`);
    }
  }

  const rootRoutes = new Set(
    [...rootRelative].map((relativePath) =>
      normalizeRoute(routeFromRelativePath(relativePath)),
    ),
  );

  const filesToCheck = [
    ...rootFiles.map((file) => ({ file, locale: "zh", baseDir: docsDir })),
    ...enFiles.map((file) => ({ file, locale: "en", baseDir: enDir })),
  ];

  for (const { file, locale, baseDir } of filesToCheck) {
    const relativePath = toPosixPath(path.relative(baseDir, file));
    const displayPath =
      locale === "zh" ? `docs/${relativePath}` : `docs/en/${relativePath}`;
    const content = await readFile(file, "utf8");
    const frontmatter = getFrontmatter(content);

    if (!frontmatter) {
      problems.push(`Missing frontmatter in ${displayPath}`);
      continue;
    }

    if (!frontmatter.fields.get("title")) {
      problems.push(`Missing title in ${displayPath}`);
    }

    if (!frontmatter.fields.get("summary")) {
      problems.push(`Missing summary in ${displayPath}`);
    }

    if (locale !== "en") {
      continue;
    }

    for (const rawLink of findAbsoluteLinks(content)) {
      const [linkPath] = rawLink.split(/[?#]/, 1);
      const normalized = normalizeRoute(linkPath);

      if (normalized.startsWith("/en/")) {
        continue;
      }

      if (rootRoutes.has(normalized)) {
        problems.push(
          `English doc ${displayPath} links to root doc route ${normalized}; use /en${normalized} instead.`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error("docs:check failed:");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log("docs:check passed");
