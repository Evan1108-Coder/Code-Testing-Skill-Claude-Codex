---
name: code-testing
description: Use when testing is needed: planning tests, writing tests, running test suites, analyzing coverage gaps, validating changes, fixing broken test infrastructure, or auditing project-wide test quality. Supports targeted "test this" work and comprehensive "test everything" audits across common frameworks such as Vitest, Jest, pytest, Go test, Cargo test, RSpec, ExUnit, and more.
when_to_use: Trigger when the user asks to test a file, feature, bug fix, pull request, recent change, UI flow, API, parser, service, or whole project; when tests are failing; when coverage or test quality is unclear; or before shipping a risky code change.
---

# Intelligent Test Generation & Execution

## Core Principle: Handle Real-World Chaos

Real projects are messy. You will encounter projects that are NOT clean, NOT well-structured, and NOT set up properly. This skill MUST adapt to chaos gracefully. Never assume a project has:
- A working test setup
- Any existing tests at all
- A single consistent framework
- Proper configuration files
- Clean dependency management
- Consistent code style
- Up-to-date documentation

### Chaos Scenarios and How to Handle Them

**No test infrastructure exists at all:**
- No test framework installed, no test config, no test files anywhere
- Action: Pick the best framework for the project's language/ecosystem and set it up from scratch
- For JS/TS: Install Vitest (modern, fast, ESM-native) or Jest (if the project uses CJS/older tooling)
- For Python: `pip install pytest` — it works out of the box with zero config
- For Go: Built-in — no setup needed, just write `_test.go` files
- For Rust: Built-in — just add `#[cfg(test)]` modules
- Create a minimal config file. Don't over-configure — use sensible defaults
- Create the first test file as a template the user can follow

**Multiple conflicting test frameworks:**
- Project has both Jest AND Vitest configs, or Mocha AND Jest, or pytest AND unittest
- Action: Check which one CI actually runs (read `.github/workflows/`). Check which has more recent test files. Check `package.json` scripts. Use whichever is actively maintained. If truly ambiguous, ask the user.

**Test config exists but is broken:**
- Config references files that don't exist, uses deprecated options, has invalid syntax
- Action: Fix the config. Don't just report it — repair it so tests can actually run. Common fixes:
  - `transform` pointing to missing babel config → update to current preset
  - `testEnvironment` set to `jsdom` but `jsdom` not installed → install it or switch to `node` if no DOM needed
  - `moduleNameMapper` with stale path aliases → update to match current `tsconfig.json` paths
  - Python `conftest.py` importing deleted fixtures → remove stale imports

**Dependencies are missing or broken:**
- `node_modules` doesn't exist, `package-lock.json` is stale, virtual env is missing
- Action: Run the package manager first. `npm install`, `pip install -r requirements.txt`, `go mod download`. If the lockfile is stale and install fails, try deleting the lockfile and reinstalling (warn the user first).

**Mixed language project:**
- Frontend in TypeScript, backend in Python, scripts in Bash, infrastructure in Go
- Action: Each language component gets tested with its native framework. Don't try to unify them. Write separate test commands for each. Example:
  - `npm test` for the frontend
  - `pytest` for the backend
  - `go test ./...` for the infra tooling
  - Document which command tests what

**Legacy code with no types, no docs, no structure:**
- Global variables everywhere, 2000-line files, no clear module boundaries, callback hell
- Action: Don't try to refactor first. Test the code AS IT IS. Strategies:
  - Test at the highest level possible (integration/E2E) to verify behavior without understanding internals
  - For functions with side effects everywhere, capture the side effects: mock the external calls, verify they were called correctly
  - For deeply nested callbacks, test the outermost function and assert on final output
  - Accept that some legacy code is untestable without refactoring — note this in your report and suggest which refactoring would unlock testability

**Monorepo with inconsistent setup:**
- Some packages have tests, some don't. Different frameworks in different packages. Shared dependencies at root level.
- Action: Treat each package independently. Check each package's own `package.json`/config. Don't assume root-level config applies everywhere. Look for workspace configuration (`workspaces` in package.json, `pnpm-workspace.yaml`, `lerna.json`).

**Tests exist but haven't been run in months:**
- Tests reference old APIs, import deleted modules, use deprecated assertion methods
- Action: Run them first to see what breaks. Fix broken imports. Update deprecated APIs. Delete tests for code that no longer exists. This cleanup IS part of the testing process.

**No clear entry point or build step:**
- Can't figure out how to even run the project, let alone test it
- Action: Look for clues in order: README, Makefile, Dockerfile, CI config, package.json scripts, `main` files. If TypeScript, check if it needs compilation first (`tsc` or `tsx`). If the project uses a bundler, tests might need the same config (Webpack aliases, Vite resolve, etc.).

**Environment-dependent code with no local setup:**
- Code requires AWS credentials, database connections, API keys, or specific services running
- Action: For unit tests, mock ALL external services. For integration tests, check for Docker Compose files or local dev setup. If none exists, create test doubles and document what's needed for full integration testing.

**Partial or inconsistent test coverage:**
- Some modules have 95% coverage, others have 0%. Test quality varies wildly — some tests are excellent, others just check that functions don't throw.
- Action: Don't try to make everything uniform at once. Focus on the gaps in critical code first. Match the quality level of the BEST existing tests, not the worst. Note the inconsistency in your report.

### Adaptive Decision Making

When you encounter chaos, follow this decision tree:

1. **Can I run existing tests?** → Try running them. If they pass, build on that foundation.
2. **Do existing tests fail?** → Fix them first (broken tests are worse than no tests).
3. **Is there a framework installed but not configured?** → Configure it minimally.
4. **Is there NO framework at all?** → Install one appropriate for the language.
5. **Is the code testable as-is?** → If yes, write tests. If no, identify the minimum refactoring needed and propose it to the user.
6. **Is the project structure unclear?** → Read entry points, build configs, CI files to understand the architecture before testing.

Always bias toward action: get SOMETHING working and tested rather than planning the perfect test infrastructure.

---

Two modes of operation based on user intent:

## Mode 1: "Test This" (Targeted)

Triggered when the user wants to test specific changes, a file, a function, or a feature.

### Step 1: Analyze Scope

Identify what changed or what needs testing. Do ALL of the following:

- **Read the target files/functions completely** — Don't skim. Read the entire file so you understand the full context, not just the function in question.
- **Map dependencies** — What does this module import? What imports this module? Trace the call chain both directions. This tells you what to mock and what integration points exist.
- **Identify the public interface** — What functions/classes are exported? These are what external code depends on, so these are what you test. Internal helpers get tested indirectly through the public API.
- **Catalog every code path** — For each function, identify:
  - The happy path (normal expected input → expected output)
  - Every `if/else` branch — what condition triggers each branch?
  - Every `try/catch` or error handling block — what errors can occur?
  - Every early return — what conditions cause the function to exit early?
  - Loop boundaries — what happens with 0 items? 1 item? Many items?
  - Null/undefined checks — what happens when optional values are missing?
  - Type coercions or transformations — what happens with unexpected types?
- **Note boundary values** — For numeric inputs: 0, -1, MAX_INT, NaN. For strings: empty string, very long string, strings with special characters (unicode, newlines, null bytes). For arrays: empty, single element, very large.
- **Check for side effects** — Does the function write to disk? Make network calls? Modify global state? Send events? Log messages? These are things you need to verify in tests.

### Step 2: Detect Test Infrastructure (or Create It)

Before writing a single line of test code, understand the existing test setup — or build one if it doesn't exist:

- **Find existing test files** — Search for ALL of these patterns:
  - `*.test.ts`, `*.test.js`, `*.test.tsx`, `*.test.jsx`
  - `*.spec.ts`, `*.spec.js`, `*.spec.tsx`, `*.spec.jsx`
  - `*_test.go`, `*_test.py`, `test_*.py`
  - `tests/` directories, `__tests__/` directories, `spec/` directories
- **Identify the framework** — Check these files in order:
  - `package.json` → look in `devDependencies` and `dependencies` for `jest`, `vitest`, `mocha`, `ava`, `tape`, `@testing-library/*`
  - `vitest.config.*` or `vite.config.*` (with test section) → Vitest
  - `jest.config.*` or `"jest"` key in package.json → Jest
  - `pyproject.toml` → look for `[tool.pytest]` section
  - `pytest.ini`, `setup.cfg` with `[tool:pytest]` → pytest
  - `go.mod` → Go testing
  - `Cargo.toml` → Rust testing
  - `mix.exs` → ExUnit
  - `Gemfile` with `rspec` → RSpec
- **Read the test config file** — Don't just detect the framework; read the full config. Look for:
  - Custom test environment (`jsdom`, `node`, `happy-dom`)
  - Global setup/teardown files
  - Module name mapping or path aliases
  - Coverage settings and thresholds
  - Custom matchers or extensions
  - Timeout settings
  - Transform configurations (Babel, SWC, etc.)
- **Study 2-3 existing test files** — Read them completely. Understand:
  - How are tests organized? (describe blocks? nested? flat?)
  - What assertion style? (`expect(x).toBe(y)` vs `assert.equal(x, y)` vs `x.should.equal(y)`)
  - How are fixtures set up? (beforeEach? factory functions? test helpers?)
  - How are mocks created? (jest.mock? vi.mock? manual stubs? dependency injection?)
  - What cleanup happens in afterEach/afterAll?
  - Are there shared test utilities? (look for `test/helpers`, `test/utils`, `test/fixtures`, `__mocks__/`)
- **Check the test runner script** — Look in:
  - `package.json` scripts: `"test"`, `"test:unit"`, `"test:integration"`, `"test:watch"`
  - `Makefile` targets
  - CI config (`.github/workflows/*.yml`) — what test commands does CI run?

**IF NONE OF THE ABOVE EXISTS** — You need to bootstrap test infrastructure:
- For JS/TS projects: `npm install -D vitest` (or `jest` if the project is CommonJS-heavy), create a minimal `vitest.config.ts`:
  ```typescript
  import { defineConfig } from 'vitest/config'
  export default defineConfig({ test: { globals: true } })
  ```
- For Python: `pip install pytest`, no config file needed for basic usage
- For Go: Nothing to install — just create `*_test.go` files
- For Rust: Nothing to install — add `#[cfg(test)]` modules
- Add a `"test"` script to package.json: `"test": "vitest run"`
- Create a `tests/` directory (or match however the project organizes its source: `src/` → `src/__tests__/` or co-located `*.test.*`)
- Tell the user what you set up so they can adjust if needed

### Step 3: Generate Test Plan

Before writing code, explicitly plan what you will test. This prevents gaps and redundant tests:

- **List every function/method that needs tests** — Be specific: "functionName in file.ts"
- **For each function, list the scenarios:**
  - Happy path with typical input
  - Empty/null/undefined input
  - Error conditions (what can go wrong?)
  - Boundary values (min, max, zero, one-off)
  - Concurrent/async edge cases (if applicable)
  - State-dependent behavior (if the function reads from a store, database, or context)
- **Decide what to mock vs test for real:**
  - MOCK: network calls, filesystem operations (usually), timers, randomness, external services, databases (in unit tests)
  - DON'T MOCK: the module you're testing, pure utility functions, in-memory data structures, state stores (test with real store)
  - REAL INTEGRATION TEST: when the interaction between two modules IS the thing being tested
- **Define expected assertions** — For each scenario, write down what you expect:
  - Return value (exact value, type, shape)
  - Side effects (was a function called? with what arguments? how many times?)
  - State changes (did the store/database/file change as expected?)
  - Errors thrown (correct error type? correct message? correct error code?)
  - Events emitted (correct event name? correct payload?)

### Step 4: Write Tests

Follow these rules precisely:

**Structure:**
```
describe("ModuleName", () => {
  describe("functionName", () => {
    it("does X when given Y", () => { ... })
    it("throws Z when given invalid input", () => { ... })
  })
})
```

**Naming conventions:**
- describe block: name of the module or class
- Nested describe: name of the function or method
- it/test: starts with a verb describing the behavior — "returns", "throws", "emits", "creates", "updates", "deletes", "calls", "ignores", "handles"
- Bad names: "test 1", "works", "correct behavior", "should work properly"
- Good names: "returns empty array when no items match filter", "throws InvalidTokenError when JWT is expired", "emits 'change' event with new value after setState"

**Test body pattern (Arrange-Act-Assert):**
```
it("description", () => {
  // Arrange — set up inputs, mocks, state
  const input = createTestInput({ name: "test" })
  const mockDb = { query: vi.fn().mockResolvedValue([]) }

  // Act — call the thing being tested (ONE action)
  const result = await processInput(input, mockDb)

  // Assert — verify the outcome
  expect(result.status).toBe("success")
  expect(mockDb.query).toHaveBeenCalledWith("SELECT * FROM items WHERE name = ?", ["test"])
})
```

**Matching project style:**
- If existing tests use `test()`, use `test()`. If they use `it()`, use `it()`.
- If existing tests use factories like `createTestUser()`, use the same factories.
- If existing tests put mocks in `__mocks__/`, put yours there too.
- If existing tests use `beforeAll` for expensive setup, follow that pattern.
- NEVER introduce a new test utility library that isn't already in the project.

**Independence:**
- Each test must pass when run alone AND when run with all other tests in any order.
- Never rely on test execution order.
- Always clean up: if you create temp files, delete them in afterEach. If you modify global state, restore it.
- Use fresh instances/mocks in each test (setUp in beforeEach, not at module level).

**Determinism:**
- NO real network calls — mock fetch/axios/http
- NO real timers — use fake timers (vi.useFakeTimers / jest.useFakeTimers)
- NO real random values — mock Math.random or inject a seed
- NO real dates — mock Date.now() or use fake timers
- NO reading from real filesystem unless you control the content (use tmp dirs with known content)
- NO environment-dependent behavior without mocking process.env

### Step 5: Run and Iterate

After writing tests, execute them and fix issues:

1. **Run ONLY your new tests first** — Don't waste time running the full suite initially:
   - Vitest: `npx vitest run path/to/your.test.ts`
   - Jest: `npx jest path/to/your.test.ts`
   - pytest: `pytest path/to/your_test.py`
   - Go: `go test ./pkg/yourpkg/ -run TestYourFunction`
2. **If tests fail, diagnose:**
   - Is it a test bug? (wrong mock setup, wrong expected value, wrong import path) → Fix the test
   - Is it an actual code bug? (the function genuinely doesn't handle this case) → Report it clearly: "BUG FOUND: functionName in file.ts does not handle X case. Expected: Y. Actual: Z."
   - Is it an environment issue? (missing dependency, wrong Node version, permission error) → Report it and suggest a fix
   - Is it an infrastructure issue? (test runner can't resolve paths, TypeScript compilation fails, module format mismatch ESM/CJS) → Fix the config. Common fixes:
     - ESM/CJS mismatch: add `"type": "module"` to package.json or configure transform in test config
     - Path alias failures: add `resolve.alias` to vitest config matching `tsconfig.json` paths
     - Missing types: `npm install -D @types/node @types/jest` etc.
     - Permission denied: check file permissions, avoid testing in read-only directories
3. **Run the FULL test suite** — After your tests pass in isolation:
   - This catches regressions — did you break something else?
   - This catches shared state issues — does your test interfere with existing tests?
4. **Report results clearly:**
   - "X new tests written across Y files"
   - "All Z tests passing (X new + Y existing)"
   - "Coverage: before A% → after B% (if coverage tool available)"
   - "Bugs found: [list any actual bugs discovered]"

---

## Mode 2: "Test Everything" (Comprehensive Audit)

Triggered when the user wants to improve overall test coverage or audit testing health.

### Step 1: Scan the Project

Build a complete testing inventory:

- **Map source → test files** — For every source file, determine if a corresponding test file exists:
  - `src/auth/login.ts` → `tests/auth/login.test.ts` or `src/auth/login.test.ts` or `src/auth/__tests__/login.test.ts`
  - Note which source files have NO corresponding test file
- **Count metrics:**
  - Total source files vs total test files
  - Test-to-source ratio (healthy projects: 0.8-1.5 test files per source file)
  - Lines of test code vs lines of source code
- **Check existing coverage** — Run coverage tool if available:
  - `npx vitest --coverage` or `npx jest --coverage` or `pytest --cov` or `go test -cover ./...`
  - Note: don't run this on huge projects without checking if it's configured first
- **Identify broken tests** — Look for:
  - Tests marked with `.skip`, `.todo`, `@pytest.mark.skip`, `t.Skip()`
  - Tests that are commented out
  - Test files that import non-existent modules (stale tests)
- **Check test infrastructure health:**
  - Is CI running tests? (check `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`)
  - Are there flaky tests? (check CI history for intermittent failures)
  - Is coverage tracking enabled? (check for `coveralls`, `codecov`, coverage config)

### Step 2: Prioritize by Risk

Not all code deserves equal testing effort. Prioritize by impact of bugs:

**CRITICAL — Test these first (bugs here = user-facing incidents, security vulnerabilities, data loss):**
- Authentication and authorization (login, session management, permission checks, token validation)
- Payment/billing logic (charge calculations, subscription management, refunds)
- Data mutations (database writes, file writes, state changes that persist)
- Public API endpoints (the contract external consumers depend on)
- Core business logic (the domain rules that define what the product does)
- Security-sensitive code (input validation, sanitization, encryption, CSRF protection)
- Data migrations and schema changes

**HIGH — Test next (bugs here = degraded experience, incorrect behavior):**
- Shared utility functions (used by many modules — a bug here multiplies)
- State management (stores, reducers, context — controls what users see)
- Data transformations (parsing, serialization, formatting — data integrity depends on these)
- Error handling paths (how does the system recover from failures?)
- Event systems (pub/sub, webhooks, callbacks — ordering and delivery matter)
- Caching logic (invalidation bugs are subtle and hard to diagnose)

**MEDIUM — Test when critical/high are covered:**
- UI components with logic (forms with validation, modals with state, filters)
- Configuration parsing (what happens with invalid config? missing fields?)
- CLI command handlers (argument parsing, output formatting)
- Background jobs and schedulers (do they run? do they retry on failure?)
- Logging and telemetry (are the right events emitted with the right data?)

**LOW — Test last (or skip unless specifically requested):**
- Pure UI rendering with no logic (styled components, layout containers)
- Generated code (protobuf stubs, GraphQL types, ORM models)
- Simple getters/setters with no logic
- Type-only files (interfaces, type aliases)
- Constants and configuration values
- Third-party library wrappers with no custom logic

### Step 3: Coverage Gap Analysis

For each module, identify what testing is MISSING:

- **Untested functions** — Functions with zero test coverage. Find by:
  - Reading the source file and checking if any test imports/calls each exported function
  - Running coverage and checking for 0% functions
- **Partial coverage** — Functions that have tests but miss important scenarios:
  - Only happy path tested (no error cases)
  - Only one input shape tested (what about empty? null? large?)
  - Only synchronous behavior tested (what about async/concurrent?)
  - Only success callbacks tested (what about failure callbacks?)
- **Missing integration tests** — Two modules work together but no test verifies their integration:
  - API handler → database queries (does the handler correctly translate request → query → response?)
  - Event emitter → event handler (does the handler receive and process events correctly?)
  - Auth middleware → route handler (does protected route correctly reject unauthorized requests?)
- **Environmental edge cases not tested:**
  - What happens when disk is full? (file write operations)
  - What happens when network is slow/down? (API calls, timeouts)
  - What happens when the database connection drops? (reconnection, transaction rollback)
  - What happens when env vars are missing? (startup, feature flags)

### Step 4: Generate Tests in Batches

Work systematically, not all at once:

1. **Batch by module** — One source file or one closely-related group at a time
2. **Start with the highest priority** — Critical items first
3. **Write, run, confirm** — After each batch:
   - Write the tests
   - Run them (just the new batch, not the full suite yet)
   - Fix any test bugs
   - Report: "Batch 1: auth module — 12 tests added, all passing"
4. **Ask before continuing** — If the total scope is more than 3-4 batches, ask the user: "Completed batch 1 (auth). Ready for batch 2 (state management)?"
5. **Full suite run after each batch** — Ensure no regressions

### Step 5: Summary Report

When finished, provide:

```
## Test Audit Results

**Tests added:** X new tests across Y files
**Coverage change:** A% → B% (or "coverage tool not configured")
**Full suite status:** Z/Z passing

### By priority:
- Critical: [list what was tested]
- High: [list what was tested]
- Remaining gaps: [list what still needs tests and why you skipped it]

### Bugs discovered:
- [BUG] description — file:line — expected X, got Y

### Recommendations:
- [any test infrastructure improvements suggested]
```

---

## Testing Terminal/CLI/TUI Applications

When testing terminal applications (Ink, Blessed, terminal-kit, raw ANSI, or any terminal UI), pay special attention to these concerns:

### Terminal Dimensions

Terminal apps behave differently based on terminal size. You MUST test:

- **Standard sizes:** 80x24 (classic default), 120x30 (modern default), 132x43 (wide)
- **Narrow terminals:** 40x24, 60x20 — Does the UI wrap? Does it truncate? Does it crash?
- **Very small terminals:** 20x10 — Does the app show an error message? Does it degrade gracefully?
- **Very large terminals:** 200x60 — Does content stretch? Are there alignment issues?
- **What to check at each size:**
  - Does text wrap correctly or get cut off?
  - Do columns/tables align properly?
  - Are progress bars the right width?
  - Do menu items fit without overflow?
  - Is there horizontal scrolling when needed?
  - Does the layout switch from multi-column to single-column at narrow widths?

**How to mock terminal size:**
```typescript
// Node.js
process.stdout.columns = 80
process.stdout.rows = 24
// or mock the TTY
vi.spyOn(process.stdout, 'columns', 'get').mockReturnValue(80)
vi.spyOn(process.stdout, 'rows', 'get').mockReturnValue(24)
```

### ANSI Output and Colors

- **Test with color disabled** — Set `NO_COLOR=1` or `FORCE_COLOR=0` and verify output is readable without ANSI codes
- **Test color output** — Verify correct ANSI sequences are emitted (use snapshot testing or strip-ansi for comparison)
- **Check that color codes don't break width calculations** — ANSI escape sequences are zero-width but naive `string.length` counts them

### Keyboard Input

- **Arrow keys** — Up, Down, Left, Right navigation
- **Enter/Return** — Selection/confirmation
- **Escape** — Cancel/back
- **Ctrl+C** — Graceful exit (not just process.kill)
- **Tab** — Focus switching between elements
- **Special sequences** — Home, End, Page Up, Page Down, Delete, Backspace
- **Rapid input** — What happens if the user types faster than the UI updates?
- **Paste** — Multi-character input in one event (especially with newlines)

### Terminal State Management

- **Cursor position** — Is it restored correctly after operations?
- **Alternate screen buffer** — If the app uses it (`\x1b[?1049h`), does it restore the original screen on exit?
- **Scroll regions** — Are they set up and torn down correctly?
- **Raw mode** — If the app enables raw mode, does it disable it on exit (including on crash/error)?
- **Signal handling** — SIGINT, SIGTERM, SIGWINCH (terminal resize) — are they handled?

### Interactive Prompts

- **Default values** — Does pressing Enter without input use the default?
- **Validation** — Does invalid input show an error and re-prompt?
- **Autocomplete** — Does it filter correctly as the user types?
- **Multi-select** — Can items be selected/deselected? Is the selection state shown correctly?
- **Scrollable lists** — When there are more items than terminal height, does scrolling work?

---

## Testing Async/Concurrent Code

### Promises and async/await

- **Resolved path** — Does the function return the correct value?
- **Rejected path** — Does it throw/reject with the correct error?
- **Timeout** — What happens if the async operation takes too long?
- **Cancellation** — If the operation supports AbortController, does cancellation work?
- **Sequential vs parallel** — If multiple async operations happen, is the order correct?

### Race conditions

- **Concurrent writes** — What if two operations modify the same resource simultaneously?
- **Stale reads** — What if data changes between read and write?
- **Debounce/throttle** — Does the timing logic work correctly with fake timers?

### Event-driven code

- **Event ordering** — Are events emitted in the expected sequence?
- **Event payload** — Does each event contain the correct data?
- **Listener cleanup** — Are event listeners removed to prevent memory leaks?
- **Error in event handler** — Does an error in one handler prevent other handlers from running?

---

## Testing State Management

### What to verify in stores (Zustand, Redux, MobX, Vuex, etc.):

- **Initial state** — Does the store start with the correct default values?
- **Actions/mutations** — Does each action produce the expected state change?
- **Selectors/getters** — Do derived values compute correctly?
- **Subscription notifications** — Are subscribers notified on change?
- **State boundaries** — What happens at min/max values? Does a counter go below 0? Does a list exceed its max size?
- **Concurrent updates** — If two actions fire simultaneously, is the final state correct?
- **Reset** — If the store supports reset, does it return to initial state completely?
- **Persistence** — If state is persisted (localStorage, disk), does save/load round-trip correctly?

---

## Testing File System Operations

- **Always use temp directories** — Create a temp dir in beforeEach, delete it in afterEach
- **Test with different file contents:** empty files, very large files, binary files, files with unicode names
- **Test permissions:** read-only files, non-existent files, non-existent parent directories
- **Test paths:** relative vs absolute, paths with spaces, paths with special characters, symlinks
- **Test concurrent access:** what happens if two operations read/write the same file?
- **On Windows vs Unix:** path separators, line endings, case sensitivity

---

## Testing Network/API Calls

- **Mock at the HTTP level** — Use `msw` (Mock Service Worker), `nock`, or framework-provided mocks. Don't mock your own HTTP client wrapper.
- **Test all HTTP methods** — GET, POST, PUT, DELETE, PATCH if used
- **Test response codes:** 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limited), 500 (server error), 503 (service unavailable)
- **Test request format:** correct headers, correct body serialization, correct query parameters
- **Test timeout behavior:** what happens when the server doesn't respond?
- **Test retry logic:** does the client retry on 5xx? Does it respect Retry-After headers?
- **Test pagination:** does the client handle paginated responses correctly?
- **Test rate limiting:** does the client back off when rate limited?

---

## Test Quality Principles

- **Test behavior, not implementation** — Assert on outputs and side effects, not internal state. If you refactor the internals, tests should still pass.
- **One assertion concept per test** — Each test should verify one logical thing (may use multiple `expect` calls for one concept, e.g., checking both status code and body of a response is ONE concept).
- **Descriptive test names** — The test name should be a specification. Reading all test names should tell you what the module does.
  - Bad: `it("works")`, `it("test error")`, `it("should handle case")`
  - Good: `it("returns 404 when user not found")`, `it("retries 3 times on network timeout")`, `it("truncates message to 280 characters when over limit")`
- **Arrange-Act-Assert** — Clear separation. Setup is obvious. The action being tested is one line. Assertions verify the outcome.
- **No test interdependence** — Each test must pass in isolation and in any order. Use beforeEach for fresh state.
- **Minimal mocking** — Only mock what you MUST mock (external services, time, randomness, filesystem in unit tests). The more you mock, the less your test proves.
- **Deterministic** — Run the test 1000 times, get the same result. No flakiness.
- **Fast** — Unit tests should complete in milliseconds. If a test takes seconds, you're probably doing I/O you should mock.
- **Readable** — A test is documentation. Someone unfamiliar with the codebase should understand what the module does by reading the tests.

---

## Framework Detection Cheat Sheet

| Signal | Framework | Run Command | Coverage Command |
|--------|-----------|-------------|-----------------|
| `vitest` in package.json | Vitest | `npx vitest run` | `npx vitest --coverage` |
| `jest` in package.json | Jest | `npx jest` | `npx jest --coverage` |
| `@testing-library/*` | RTL (with Jest/Vitest) | Same as above | Same as above |
| `mocha` in package.json | Mocha | `npx mocha` | `npx nyc mocha` |
| `ava` in package.json | AVA | `npx ava` | `npx c8 ava` |
| `pytest` in requirements/pyproject | pytest | `pytest` | `pytest --cov` |
| `unittest` imports | Python unittest | `python -m pytest` | `pytest --cov` |
| `_test.go` files | Go testing | `go test ./...` | `go test -cover ./...` |
| `#[cfg(test)]` in .rs | Rust | `cargo test` | `cargo tarpaulin` |
| `*.test.ts` + `deno.json` | Deno | `deno test` | `deno test --coverage` |
| `*.spec.rb` | RSpec | `bundle exec rspec` | `bundle exec rspec --format doc` |
| `ExUnit` in mix.exs | ExUnit | `mix test` | `mix test --cover` |
| `*.test.swift` | XCTest | `swift test` | `swift test --enable-code-coverage` |
| `*_test.dart` | Flutter test | `flutter test` | `flutter test --coverage` |

---

## Anti-Patterns to Avoid

- **Testing implementation, not behavior** — Don't assert on internal variable values. Assert on what the function returns or what side effects it causes. If you refactor internals, tests shouldn't break.
- **Duplicating implementation logic in tests** — If your test just repeats the production logic to compute the expected value, you're testing nothing. Use hardcoded expected values.
- **Mocking everything** — If you mock the database, the API client, the filesystem, and the logger, what are you actually testing? Just the glue code. Use integration tests with real dependencies for critical paths.
- **Generating trivial tests for coverage** — 100 tests asserting that getters return the value they were set to proves nothing. Focus on behavior with meaningful inputs.
- **Not running tests after writing them** — ALWAYS run your tests. A test that doesn't pass is worse than no test (it gives false confidence or blocks CI).
- **Testing library/framework behavior** — Don't test that `Array.map` works or that `express.Router` routes correctly. Trust your dependencies.
- **Writing flaky tests** — If a test sometimes passes and sometimes fails, it's worse than no test. Fix the non-determinism or delete the test.
- **Snapshot testing overuse** — Snapshots are useful for catching unintended changes in complex output (ANSI terminal output, HTML rendering). They are NOT useful for testing logic. If a snapshot breaks, the developer should understand WHY, not just update it blindly.
- **Ignoring test maintenance** — If you add a new parameter to a function, update ALL existing tests that call it. Don't leave tests that pass by coincidence because of default parameter values.
- **Testing private methods directly** — If you need to test a private method, either: (a) test it through the public API, or (b) it's doing enough to warrant being extracted into its own module with its own public API.
- **Copy-paste test duplication** — If you're copying the same test body with minor variations, use parameterized tests (test.each in Jest/Vitest, @pytest.mark.parametrize in pytest, table-driven tests in Go).

---

## What "Good Coverage" Means

Coverage is NOT just a percentage. Here's what to aim for:

- **Line coverage** — What percentage of lines were executed during tests. Aim: 80%+ for critical modules, 60%+ overall. But 100% line coverage does NOT mean no bugs.
- **Branch coverage** — Were both sides of every if/else executed? This is MORE important than line coverage. A function with 100% line coverage but 50% branch coverage has untested logic paths.
- **Function coverage** — Were all functions called at least once? Any function with 0% coverage is a gap.
- **What coverage DOESN'T tell you:**
  - Whether the assertions are correct (code can be executed without being verified)
  - Whether edge cases are covered (line coverage says "this line ran" not "this line ran with all important inputs")
  - Whether integration between modules works
  - Whether the tests are deterministic and reliable

---

## Handling Common Testing Challenges

### The function is too complex to test
- **Solution:** This is a design smell. The function probably does too many things. Suggest refactoring: extract pure logic into testable helper functions. Test those. Integration-test the orchestrating function at a higher level.

### External dependencies make testing hard
- **Solution:** Use dependency injection. Pass dependencies as parameters instead of importing them directly. In tests, pass mocks. In production, pass real implementations.

### The test requires complex setup
- **Solution:** Create factory functions or fixtures. `createTestUser({ admin: true })` is clearer than 20 lines of manual object construction in every test.

### Tests are slow
- **Solution:** Slow tests are usually doing real I/O. Mock it for unit tests. Keep integration tests (with real I/O) in a separate suite that runs less frequently.

### Can't test without running the whole app
- **Solution:** The module is too tightly coupled. Extract the logic you want to test into a pure function that takes inputs and returns outputs. Wire it up to the app separately.
