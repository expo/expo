# Expo Monorepo — AI Assistant Guide

This document describes the structure, conventions, and workflows for the `expo/expo` monorepo. It is intended to orient AI assistants working on this codebase.

---

## Repository Overview

This is the main monorepo for the **Expo SDK** and related tooling. It is a Yarn workspaces monorepo managed with Node 22 (pinned via Volta). The monorepo contains native iOS (Swift/Obj-C), Android (Kotlin/Java), and JavaScript/TypeScript code.

**Key directories:**

```
expo/
├── apps/               # Test and reference apps
│   ├── bare-expo/      # Primary native test harness (links all packages)
│   ├── expo-go/        # The Expo Go client app
│   ├── test-suite/     # Unit & E2E test runner app
│   ├── native-component-list/  # Manual demo/smoke-test app
│   ├── router-e2e/     # Expo Router integration test app
│   └── sandbox/        # Sandboxed experiments
├── docs/               # Next.js documentation site (port 3002)
├── guides/             # Internal development guides (not published)
├── packages/           # All SDK packages and tooling
│   ├── @expo/          # Scoped utility packages (CLI, config plugins, etc.)
│   ├── @unimodules/    # Legacy unimodules (mostly wrappers)
│   ├── expo/           # The core `expo` package (SDK entry point)
│   ├── expo-modules-core/  # Native module infrastructure
│   ├── expo-router/    # File-based router
│   ├── expo-*/         # Individual SDK packages
│   ├── babel-preset-expo/
│   ├── jest-expo/
│   └── expo-module-scripts/  # Shared build/lint/test tooling
├── react-native-lab/   # Expo's fork of react-native (git submodule)
├── scripts/            # Shell scripts for setup and CI
├── tools/              # `expotools` (et) CLI for repository maintenance
├── templates/          # App templates for `create-expo`
└── template-files/     # File templates shared across package generation
```

---

## Core Packages

| Package | Purpose |
|---------|---------|
| `expo` | Main SDK package — re-exports core APIs, provides `AppEntry.js`, runs autolinking |
| `expo-modules-core` | Native module infrastructure for Swift/Kotlin (the "Expo Modules API") |
| `expo-router` | File-based navigation (wraps React Navigation) |
| `@expo/cli` | `npx expo` CLI — start, build, export, prebuild, install, etc. |
| `@expo/config` | Reads and validates `app.json`/`app.config.js` |
| `@expo/config-plugins` | Plugin system for modifying native projects during `expo prebuild` |
| `@expo/metro-config` | Extends Metro bundler config for Expo projects |
| `expo-module-scripts` | Shared Babel, TypeScript, Jest, ESLint config for all packages |
| `babel-preset-expo` | Babel preset used by all Expo projects |
| `jest-expo` | Jest preset and mocks for Expo apps |
| `@expo/fingerprint` | Computes project fingerprints for EAS |
| `@expo/prebuild-config` | Default config plugins applied during `expo prebuild` |
| `create-expo` / `create-expo-module` | Project/module scaffolding tools |

---

## Development Setup

> Windows is **not supported** natively. Use WSL on Windows.

### Prerequisites

- Node 22 (managed by Volta — installs automatically)
- Yarn (classic)
- Ruby 3.3+ (for iOS CocoaPods)
- Bun (optional, needed for some scripts)
- `direnv` (for env variable management)
- `git-lfs`

### Install

```sh
# Clone
git clone git@github.com:expo/expo.git

# Install JS dependencies (runs postinstall automatically)
yarn
```

`postinstall` runs:
1. `yarn-deduplicate` — deduplicates lockfile
2. `yarn workspace @expo/cli prepare` — builds the CLI
3. `patch-package` — applies patches in `patches/`
4. `validate-workspace-dependencies` via expotools

### Native Setup

```sh
# Android + downloads react-native submodule
npm run setup:native

# iOS — ensure Ruby 3.3, Xcode, Xcode CLI tools are installed
cd apps/bare-expo && pod install
```

---

## Working on Packages

All SDK packages live in `packages/`. Packages use TypeScript source under `src/` and compile to `build/`.

**Important: commit the `build/` directory.** This avoids requiring every contributor to rebuild dozens of packages on checkout.

### Typical workflow

```sh
# 1. Navigate to the package
cd packages/expo-constants

# 2. Start TypeScript watch build (skip if no build script)
yarn build

# 3. Edit source in src/

# 4. Test in bare-expo
cd apps/bare-expo
yarn ios    # or yarn android

# 5. Run unit tests
cd packages/expo-constants
yarn test
```

### Package scripts (via `expo-module-scripts`)

All packages expose standard scripts via the `expo-module` binary:

```sh
yarn build          # TypeScript compilation (watch mode by default)
yarn clean          # Delete build/
yarn lint           # ESLint + Prettier check
yarn lint --fix     # Auto-fix formatting
yarn test           # Jest (watch mode by default)
yarn prepublishOnly # Full production build
```

Run `yarn expo-module --help` for all commands. Set `EXPO_NONINTERACTIVE=1` for CI mode (no watch, no prompts).

### Package structure conventions

```
packages/expo-example/
├── src/              # TypeScript source
├── build/            # Compiled output — COMMIT THIS
├── ios/              # iOS native code (Swift/Obj-C)
├── android/          # Android native code (Kotlin/Java)
├── __tests__/        # Unit tests (or src/**/__tests__/)
├── package.json
├── tsconfig.json     # Auto-generated, extends expo-module-scripts
├── expo-module.config.json  # Autolinking config
└── CHANGELOG.md
```

---

## Native Module Architecture

Expo uses the **Expo Modules API** — a Swift/Kotlin DSL that auto-generates the JS bindings.

### iOS (Swift)

```swift
// In ios/ExampleModule.swift
public class ExampleModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Example")
    Function("hello") { return "Hello!" }
    AsyncFunction("doWork") { (value: String) in
      return await doExpensiveWork(value)
    }
  }
}
```

### Android (Kotlin)

```kotlin
class ExampleModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Example")
    Function("hello") { "Hello!" }
    AsyncFunction("doWork") { value: String ->
      doExpensiveWork(value)
    }
  }
}
```

### TypeScript bindings

```ts
import { requireNativeModule } from 'expo-modules-core';
const ExampleModule = requireNativeModule('Example');
```

Platform-specific files use extensions: `.ios.ts`, `.android.ts`, `.native.ts`, `.web.ts`.

---

## Testing

### Unit tests

Unit tests live in `packages/<name>/src/__tests__/` or `packages/<name>/__tests__/`.

- Use the `*-test.ts` / `*-test.tsx` extension convention (or `*.test.ts`).
- Run with `yarn test` from the package directory.
- Platform-specific test files: `.test.ios.ts`, `.test.native.ts`, `.test.web.ts`.
- New native functions must be mocked in `packages/jest-expo/src/preset/expoModules.js`.

### E2E tests (test-suite / bare-expo)

E2E tests are written in `apps/test-suite/tests/` using a subset of Jasmine.

```sh
cd apps/bare-expo
yarn test:ios      # Run E2E suite on iOS
yarn test:android  # Run E2E suite on Android
```

If you add a new test file, register it in:
- `apps/test-suite/TestUtils.js`
- `apps/bare-expo/e2e/TestSuite-test.native.js` (for auto-run)

### @expo/cli tests

The CLI has three test tiers — see `packages/@expo/cli/CLAUDE.md` for full details:

```sh
cd packages/@expo/cli
yarn test            # Unit tests (Jest + memfs)
yarn test:e2e        # E2E CLI tests (real projects)
yarn test:playwright # Browser-based Metro/server tests
```

---

## Code Style

### TypeScript / JavaScript

- **Formatter:** Prettier (config in `.prettierrc`, run via ESLint)
- **Linter:** ESLint with `eslint-config-universe` (`universe/native`, `universe/node`, `universe/web`)
- **Always run:** `yarn lint --fix` before committing

Key conventions:
- `const` by default, `let` when reassignment is needed
- `camelCase` for functions/variables, `PascalCase` for classes/components
- Suffix async functions with `Async`: `fetchDataAsync()`
- Prefix private members with `_`: `this._internalState`
- Boolean names should use a verb: `isLoaded`, `hasError`, `didComplete`
- Remove all `console.log` and commented-out code before pushing
- Use `// line` comments inline; `/** block */` above functions/classes

### Import ordering (not enforced by linter, but preferred)

1. `import` before `require()`
2. Unassigned (side-effect) imports first
3. External / Node built-ins before internal/relative
4. Alphabetical within groups

### React components

- Use functional components and hooks (the style guide's class-based examples are legacy)
- Place hooks at the top, render logic at the bottom

---

## Commit Messages

Format: `[platform][api] Short description`

Examples:
- `[ios][video] Fix black screen on older devices`
- `[android][camera] Add zoom support`
- `[docs] Update expo-constants API reference`
- `[cli] Add --json flag to expo config`

---

## Changelogs

Each package has a `CHANGELOG.md`. Update it for every user-facing change under the `## Unpublished` heading.

**Categories:**
- `### 🛠 Breaking changes` — triggers major version bump
- `### 🎉 New features` — triggers at least minor bump
- `### 🐛 Bug fixes`
- `### ⚠️ Notices` — deprecations, behavior changes
- `### 💡 Others` — internal changes, refactors
- `### 📚 3rd party library updates` — root CHANGELOG only

Each entry should include links to the PR and author's GitHub profile.

Use the expotools helper: `et add-changelog`

---

## Git Workflow

- **main is always green** — never push broken code to `main`
- Develop on feature branches
- Rebase (not merge) onto `main`: `git rebase main`
- Squash related commits before merging
- Force-push feature branches after rebase: `git push --force`
- Keep PRs small and focused

---

## Documentation

Docs live in `docs/` and are a Next.js app running on port `3002`.

```sh
cd docs
yarn
yarn dev
```

- Edit pages under `docs/pages/`
- For API docs: changes in `docs/pages/versions/vXX.0.0/` must also be copied to `docs/pages/versions/unversioned/`
- Regenerate package API docs: `et generate-docs-api-data -p <package-name>`

---

## Tooling (expotools)

The `tools/` directory contains `expotools` (`et`), an internal CLI for repo maintenance:

```sh
# Run from repo root
node tools/bin/expotools.js <command>
# or after setup:
et <command>
```

Common commands:
- `et add-changelog` — add a changelog entry
- `et generate-docs-api-data -p <package>` — regenerate package API docs
- `et validate-workspace-dependencies` — validate workspace dep consistency
- `et merge-changelogs` — merge changelogs for release (SDK release only)

---

## Debugging

### CLI debug output

```sh
# Legacy debug logs
DEBUG=expo:* npx expo start

# Structured event logs (newer modules)
LOG_EVENTS=1 npx expo start       # stdout
LOG_EVENTS=events.log npx expo start  # file
```

### Environment variables

| Variable | Effect |
|----------|--------|
| `EXPO_DEBUG=1` | Sets `DEBUG=expo:*` |
| `EXPO_NONINTERACTIVE=1` | Disables watch mode / interactive prompts |
| `LOG_EVENTS=1` | Enables JSONL structured event output |
| `LOG_EVENTS=<file>` | Writes structured events to a file |

---

## Key Files for Common Tasks

| Task | Location |
|------|---------|
| Add a new SDK package | `packages/expo-<name>/` — follow `expo-module-template` |
| Add a new `expo` CLI command | `packages/@expo/cli/src/<command>/` |
| Modify app.json schema | `packages/@expo/config-types/` |
| Add a config plugin | `packages/@expo/config-plugins/src/` |
| Change Metro config defaults | `packages/@expo/metro-config/src/` |
| Modify Babel preset | `packages/babel-preset-expo/` |
| Add a Jest mock for a native module | `packages/jest-expo/src/preset/expoModules.js` |
| Modify the web error overlay | `packages/@expo/log-box/src/` |
| Modify autolinking | `packages/expo-modules-autolinking/` |

---

## Platform Notes

### Windows

- iOS development (`expo run:ios`, iOS prebuild) is **not supported** on Windows
- Use POSIX paths for Metro module specifiers — use `convertPathToModuleSpecifier()` from `@expo/cli/src/start/server/middleware/metroOptions.ts`
- Environment variables are case-insensitive on Windows: handle both `SYSTEMROOT` and `SystemRoot`

### Web

- Web entry points use the `.web.ts` extension
- CSS Modules are supported in `@expo/log-box` and similar packages
- Shadow DOM isolation is used for web overlays

---

## Per-Package CLAUDE.md Files

Some packages have their own CLAUDE.md with deeper package-specific guidance:

- `packages/@expo/cli/CLAUDE.md` — CLI structure, Metro internals, debug system, Windows path handling
- `packages/@expo/log-box/CLAUDE.md` — Log box architecture, CSS modules, shadow DOM
