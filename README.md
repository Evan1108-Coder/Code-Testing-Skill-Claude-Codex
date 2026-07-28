# Code Testing Skill / TestPilot

> Claude/Codex testing skill for planning, writing, running, and auditing meaningful tests inside real projects.

![Status](https://img.shields.io/badge/status-beta-6b7280) ![License](https://img.shields.io/github/license/Evan1108-Coder/Code-Testing-Skill-Claude-Codex)

**AI testing skill • targeted tests • full audit mode • real validation**

## At a Glance

- Real project documentation now includes security guidance, contribution notes, issue/PR templates, and real visual snapshots.
- Maintenance snapshot: see [docs/project-snapshot.md](docs/project-snapshot.md) for a generated file-mix chart and repository checklist.
- Public repo: https://github.com/Evan1108-Coder/Code-Testing-Skill-Claude-Codex

---


## Real Visual Snapshot

These visuals are generated from the actual repository structure and project workflow, not placeholders.

![Repository file mix](docs/assets/repo-file-mix.svg)

![Project workflow](docs/assets/workflow.svg)

> Status: beta. This is a prompt/skill package, not a test framework. It improves how AI agents approach testing inside your existing project.

Also called **TestPilot** in examples and prompts.

## Why Use This Skill?

- Pushes Claude Code and Codex to inspect the project before writing tests.
- Separates targeted testing from full-project audits.
- Encourages running tests and reporting real failures instead of inventing confidence.
- Covers UI, logic, integration, regression, and edge-case review.

## Current Limitations

- It cannot replace project-specific test infrastructure.
- It works best when the repo already has runnable commands or clear setup docs.
- Agent output still needs review for risky changes or weak assertions.


A testing skill for **Claude Code** and **Codex** that teaches your AI coding agent to write, run, and audit tests intelligently — not just blindly generate them.

## How It Works

![Workflow](docs/images/workflow.jpg)

*TestPilot scans your project, detects test frameworks, writes meaningful tests, runs them, and reports real results.*

## What It Is

TestPilot is a skill file (a markdown instruction set) you drop into your Claude Code or Codex project. Once installed, your AI agent gains structured expertise in test generation, framework detection, and coverage analysis. Instead of writing generic, shallow tests, it produces meaningful tests that catch real bugs — while spotting issues in your UI, code, features, and logic.

## Two Modes

### "Test This" (Targeted)

You point at a file, function, or recent change. TestPilot analyzes the code, maps its dependencies, identifies edge cases, and writes targeted tests that follow your project's existing conventions. It then runs them and reports results.

### "Test Everything" (Comprehensive Audit)

A full project audit. TestPilot scans your codebase, identifies what has tests and what doesn't, prioritizes gaps by risk (auth and payments before getters and renderers), and systematically generates tests in batches. You get a report: coverage before/after, bugs found, and remaining gaps.

## Why It's Different

- **Framework-aware** — Automatically detects Vitest, Jest, pytest, Go test, RSpec, Cargo test, Deno, ExUnit, Mocha, and more. Matches your existing patterns.
- **Risk-prioritized** — Tests critical business logic first, not whatever's easiest.
- **Behavior-focused** — Asserts on what code does, not how it's wired internally.
- **Actually runs the tests** — Catches real failures, iterates on test bugs, reports honestly.
- **Bug detection** — Surfaces real bugs in your code, UI, features, and logic during the testing process.
- **Avoids anti-patterns** — No testing private internals, no implementation-mirroring, no mocking everything, no vanity coverage.

## Works With

Any language with a standard test runner:

- TypeScript / JavaScript (Vitest, Jest, Mocha, Deno)
- Python (pytest, unittest)
- Go
- Rust (Cargo)
- Ruby (RSpec)
- Elixir (ExUnit)
- And more

## Structure

```text
.
├── SKILL.md                    # Core testing skill
├── scripts/
│   └── validate-skill.mjs      # Skill package validation
├── docs/
│   ├── assets/
│   ├── images/
│   └── project-snapshot.md
├── .github/
│   ├── ISSUE_TEMPLATE/bug_report.md
│   ├── workflows/ci.yml
│   └── pull_request_template.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

## Installation

### Claude Code

Install this repository as the skill folder:

```bash
mkdir -p .claude/skills
git clone https://github.com/Evan1108-Coder/Code-Testing-Skill-Claude-Codex.git .claude/skills/code-testing
```

For user-level Claude Code installation:

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/Evan1108-Coder/Code-Testing-Skill-Claude-Codex.git ~/.claude/skills/code-testing
```

### Codex

Install the same root skill folder into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/Evan1108-Coder/Code-Testing-Skill-Claude-Codex.git ~/.codex/skills/code-testing
```

Claude and Codex use the same root `SKILL.md` package format in this repository.

## Usage Examples

**Targeted testing:**
```
/test this — test the auth middleware I just changed
```

**Full audit:**
```
/test everything — audit test coverage for the whole project
```

**Specific file:**
```
/test src/utils/parser.ts
```

## Test Quality Principles

- Test behavior, not implementation
- One assertion concept per test
- Descriptive test names (`"returns 404 when user not found"` not `"test error"`)
- Arrange-Act-Assert structure
- No test interdependence
- Minimal mocking (only external services, time, randomness)
- Deterministic — no flaky tests

## Validation

```bash
node scripts/validate-skill.mjs
```

## License

MIT
