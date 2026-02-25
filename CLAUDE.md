# CLAUDE.md

This file provides guidance for AI assistants working with the Expo monorepo.

## Repository Overview

Expo is a platform for building universal native apps using React Native. This monorepo contains 100+ packages that form the Expo SDK, the Expo CLI, Expo Go client app, documentation, and development tooling.

**Tech stack:** TypeScript, React Native, Kotlin (Android), Swift/Objective-C (iOS), Java, Next.js (docs)

## Repository Structure

```
apps/              # Test and demo applications
  bare-expo/       # Primary testing app - links all SDK packages
  expo-go/         # Expo Go client app
  test-suite/      # E2E test runner (Jasmine-based)
  native-component-list/  # Component showcase and manual testing
  router-e2e/      # Router E2E tests
docs/              # Next.js documentation site (port 3002)
guides/            # Internal development guides
packages/          # All Expo packages
  @expo/           # Scoped infrastructure packages (cli, config, metro-config, etc.)
  expo             # Main SDK package
  expo-*/          # Feature modules (camera, audio, location, etc.)
  expo-modules-core/  # Native modules infrastructure
  expo-module-scripts/ # Shared build/test/lint tooling for packages
  jest-expo/       # Jest preset for Expo projects
react-native-lab/  # Fork of React Native (git submodule, branch exp-latest)
scripts/           # Setup and CI scripts
tools/             # Expotools CLI (`et` command)
templates/         # Project templates for create-expo-app
```

## Monorepo Setup

- **Package manager:** Yarn (v1) with workspaces
- **Workspace patterns:** `apps/*`, `packages/*`, `packages/@expo/*`
- **Node version:** 22.14.0 (managed by Volta)
- **No Lerna/Nx/Turbo** - plain Yarn workspaces
- Build artifacts in `build/` directories are committed to the repo

## Common Commands

### Root-level

```bash
yarn install              # Install all dependencies
yarn lint                 # ESLint across the entire repo
yarn lint --fix           # Auto-fix lint issues
```

### Per-package (run from within the package directory)

```bash
yarn build                # Compile TypeScript (via expo-module-scripts)
yarn test                 # Run Jest tests
yarn lint                 # Lint the package
yarn lint --fix           # Auto-fix lint issues
```

Most SDK packages use `expo-module-scripts` which provides standardized commands:
- `expo-module build` - Compile TypeScript with Babel
- `expo-module test` - Run Jest tests
- `expo-module lint` - Run ESLint
- `expo-module clean` - Clean build artifacts
- `expo-module prepare` - Prepare for publishing

### Testing apps

```bash
# From apps/bare-expo/
yarn ios                  # Run on iOS simulator
yarn android              # Run on Android emulator
yarn test:ios             # Run E2E tests on iOS
yarn test:android         # Run E2E tests on Android
```

### Documentation

```bash
# From docs/
yarn dev                  # Start dev server on port 3002
yarn build                # Production build
yarn test                 # Run docs tests
```

### Expotools

```bash
et <command>              # Run expotools commands (from repo root with direnv)
et generate-docs-api-data -p <package-name>  # Generate API docs
et validate-workspace-dependencies           # Validate dependency consistency
```

## Code Style and Formatting

### Prettier Configuration

- Print width: 100
- Tab width: 2
- Single quotes: yes
- Bracket same line (JSX): yes
- Trailing commas: es5

### ESLint

- Config: `universe/native`, `universe/node`, `universe/web` (from `eslint-config-universe`)
- Run `yarn lint --fix` before committing

### JavaScript/TypeScript Conventions

- Use `const` by default, `let` when reassignment needed
- Suffix async functions with `Async` (e.g., `fetchDataAsync`)
- Prefix private instance variables with `_` (e.g., `_currentValue`)
- Use `is`/`was`/`did` for boolean names (e.g., `isDeleted`)
- camelCase for variables/functions, PascalCase for classes/components
- Remove `console.log` and commented-out code before committing
- Import order: side-effects → external modules → aliased internals → relative imports

## Testing

### Unit Tests

- Framework: Jest (configured per-package, uses `jest-expo` preset for SDK packages)
- Test file location: `src/__tests__/` within each package
- Test file naming: `*-test.ts` or `*-test.tsx`
- Platform-specific tests: `.test.ios.ts`, `.test.native.ts`, `.test.web.ts`
- Run with `yarn test` from the package directory

### E2E Tests

- Location: `apps/test-suite/tests/`
- Framework: Jasmine (limited subset, runs on device)
- Run via `bare-expo` with `yarn test:android` or `yarn test:ios`
- New test files must be registered in `apps/test-suite/TestUtils.js`
- Auto-running tests must be added in `apps/bare-expo/e2e/TestSuite-test.native.js`

### Jest Mocks

- New bridged native functions must be mocked in `packages/jest-expo/src/preset/expoModules.js`
- See `guides/Generating Jest Mocks.md` for the mock generation tool

## Commit Message Format

```
[platform][api] Title
```

Examples:
- `[ios][video] Fixed black screen bug that appears on older devices`
- `[android][camera] Add barcode scanning support`
- `[web][constants] Fix platform detection`

## Pre-submission Checklist

When modifying packages:
1. Run `yarn build` in the modified package directory
2. Run `yarn lint --fix` to fix formatting
3. Run `yarn test` to verify tests pass
4. Update `CHANGELOG.md` in the modified package (or root for cross-cutting changes)
5. Remove all `console.log` statements and commented-out code

## Key Packages

| Package | Purpose |
|---------|---------|
| `expo` | Main SDK package, entry point |
| `expo-modules-core` | Native module infrastructure (Swift/Kotlin APIs) |
| `@expo/cli` | Expo CLI (`npx expo`) |
| `@expo/config` | App config resolution (`app.json`/`app.config.js`) |
| `@expo/config-plugins` | Native project modification system |
| `@expo/metro-config` | Metro bundler configuration |
| `@expo/metro-runtime` | Metro runtime utilities |
| `expo-router` | File-based routing library |
| `expo-modules-autolinking` | Auto-links native modules |
| `expo-module-scripts` | Shared build/test/lint infrastructure |
| `jest-expo` | Jest preset for testing Expo apps |
| `babel-preset-expo` | Babel preset for Expo projects |

## Native Code

- **iOS:** Swift and Objective-C, managed with CocoaPods. Podfiles in `apps/bare-expo/ios/`.
- **Android:** Kotlin and Java, managed with Gradle. Build files in `apps/bare-expo/android/`.
- **Native edits:** From `apps/bare-expo/`, use `yarn edit:ios` (Xcode) or `yarn edit:android` (Android Studio).
- **Rebuild required** after any native code change.

## CI/CD

- 43 GitHub Actions workflows in `.github/workflows/`
- Key workflows: `cli.yml`, `sdk.yml`, `test-suite.yml`, `android-unit-tests.yml`, `ios-unit-tests.yml`, `docs.yml`
- PR template requires: test plan, breaking changes, and new features sections
- Docs-only changes and code changes should be in separate PRs for faster CI

## Environment

- **Required:** macOS (or WSL on Windows), direnv, Ruby 3.3+, git-lfs, Node LTS
- **iOS:** Xcode + command line tools
- **Android:** JDK 17 (Zulu recommended), Android SDK/NDK
- **direnv** sets `EXPO_ROOT_DIR`, `EXPO_USE_SOURCE=1`, and installs git hooks
- Local overrides go in `.envrc.local` (not committed)
