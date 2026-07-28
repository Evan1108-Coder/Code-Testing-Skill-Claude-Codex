#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillPath = join(root, "SKILL.md");
let errors = 0;

function fail(message) {
  console.error(`  FAIL: ${message}`);
  errors++;
}

function pass(message) {
  console.log(`  OK: ${message}`);
}

console.log("Validating code-testing skill...\n");

// Check SKILL.md exists and has frontmatter
if (!existsSync(skillPath)) {
  fail("missing SKILL.md");
  process.exit(1);
}
pass("SKILL.md exists");

const skill = readFileSync(skillPath, "utf8");
if (!skill.startsWith("---\n")) {
  fail("SKILL.md must start with YAML frontmatter");
} else {
  const [, frontmatter = ""] = skill.split("---\n");
  if (!frontmatter.includes("name:")) fail("frontmatter missing name");
  else pass("frontmatter has name");
  if (!frontmatter.includes("description:")) fail("frontmatter missing description");
  else pass("frontmatter has description");
  if (!frontmatter.includes("when_to_use:")) fail("frontmatter missing when_to_use");
  else pass("frontmatter has when_to_use");
}

const body = skill.split("---\n").slice(2).join("---\n");
if (body.trim().length < 500) fail("SKILL.md body too small to be operational");
else pass(`SKILL.md body is ${body.trim().length} chars`);

// Check examples directory when present
const examplesDir = join(root, "examples");
if (existsSync(examplesDir)) {
  const examples = readdirSync(examplesDir).filter((f) => f.endsWith(".md"));
  if (examples.length > 0) pass(`${examples.length} example files found: ${examples.join(", ")}`);
}

// Check any linked files in SKILL.md
const linkMatches = [...skill.matchAll(/`([^`]+\.md)`/g)].map((m) => m[1]);
for (const ref of linkMatches) {
  if (ref.startsWith("lenses/") || ref.startsWith("detection/") || ref.startsWith("examples/") || ref.startsWith("docs/")) {
    if (!existsSync(join(root, ref))) fail(`referenced file missing: ${ref}`);
  }
}

console.log(`\n${errors === 0 ? "✓ All checks passed" : `✗ ${errors} error(s) found`}`);
process.exitCode = errors > 0 ? 1 : 0;
