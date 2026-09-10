#!/usr/bin/env node
// Hook PostToolUse (Write|Edit) exclusivo de Arcade Vault: lintea con ESLint
// el archivo recién escrito y muestra un aviso si hay findings, sin bloquear
// ni auto-corregir nada.

import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const LINTABLE_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".mdx",
]);

const IGNORED_SEGMENTS = [
  "node_modules",
  ".next",
  ".git",
  ".playwright-mcp",
  ".playwright-screenshots",
];

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  const raw = readStdin();
  if (!raw) return;

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const filePath = payload?.tool_input?.file_path;
  if (!filePath || typeof filePath !== "string") return;

  const projectDir = process.env.CLAUDE_PROJECT_DIR
    ? path.resolve(process.env.CLAUDE_PROJECT_DIR)
    : process.cwd();
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(projectDir, filePath);
  const rel = path.relative(projectDir, absPath);

  // Fuera del proyecto.
  if (rel.startsWith("..") || path.isAbsolute(rel)) return;

  const segments = rel.split(path.sep);
  if (segments.some((s) => IGNORED_SEGMENTS.includes(s))) return;

  const ext = path.extname(absPath).toLowerCase();
  if (!LINTABLE_EXT.has(ext)) return;

  if (!fs.existsSync(absPath)) return;

  const eslintBin = path.join(
    projectDir,
    "node_modules",
    "eslint",
    "bin",
    "eslint.js"
  );
  if (!fs.existsSync(eslintBin)) return;

  const result = spawnSync(
    process.execPath,
    [eslintBin, "--no-color", absPath],
    { cwd: projectDir, encoding: "utf8" }
  );

  // exit 0 == sin findings.
  if (result.status === 0) return;

  const output = (result.stdout || result.stderr || "").trim();
  if (!output) return;

  process.stdout.write(
    JSON.stringify({
      systemMessage: `⚠️ ESLint en ${rel}:\n${output}`,
    })
  );
}

try {
  main();
} catch {
  // Un hook roto nunca debe interrumpir la sesión.
}
