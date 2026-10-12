"use strict";

/**
 * Syntax-check every JavaScript file in the project (server + frontend + tools)
 * without executing it. Run with: npm run check
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set(["node_modules", ".git"]);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = walk(ROOT, []).sort();
let failed = 0;

for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (err) {
    failed += 1;
    const rel = path.relative(ROOT, file);
    console.error(`\u2717 ${rel}`);
    console.error(String(err.stderr || err.message).trim());
  }
}

console.log(`Checked ${files.length} file(s).`);
if (failed) {
  console.error(`\n${failed} file(s) failed syntax check.`);
  process.exit(1);
}
console.log("All JavaScript files passed syntax check.");
