## expotools (`et`)

This repo ships its own CLI, `expotools`, available directly as `et <command> <...args>`.
Call it as `et`, not via `npx`, `bunx`, or `pnpm run`. It's put on the PATH by `direnv`, so run
`direnv allow` once in the repo root if `et` isn't found; otherwise invoke it directly with
`node ./tools/bin/expotools.js <command>`. Many of our processes (native unit tests, prebuild,
and more) run through it.

Commands you'll reach for during normal development:

- `et check-packages` — verify that packages build and their tests pass.

Run `et --help` to discover the rest (publishing, changelogs, on-call dashboards, and more).

## Rules

- **Red/green:** write the test first and watch it fail, then implement the feature or fix until
  it passes. Don't write the implementation before the failing test exists.

## Writing tests

### Unit tests

JS/TS unit tests use Jest and live next to the code in `__tests__/` (or `*.test.ts`). They run
as part of `et check-packages` (see Committing below).

### Native tests

Swift/Kotlin unit tests live in `packages/<pkg>/ios/Tests/` and `android/`, and run through
`et native-unit-tests` (scope with `--packages <name>`).

On iOS/macOS (Android needs no pod step), install pods before running native tests or building,
and again after adding or changing an iOS `test_spec`. Run `pod install` directly in the relevant
`apps/*/ios` or `apps/*/macos` directory rather than `et pod-install` — running it directly is
faster and avoids installing for apps you aren't working on, like Expo Go. iOS unit tests run
against bare-expo, so install pods in `apps/bare-expo/ios`.

Running native tests:
`et native-unit-tests` — run native unit tests for all packages that provide them. Scope to
one package with `--packages <name>` (e.g. `et native-unit-tests -p ios --packages @expo/ui`).

## Committing

Before committing, you may use `turbo run <task>` to run an npm script for a given task on all dependents, for example `build`, `typecheck`, `depscheck`, `test`, and `lint`. This may also be run via `et check-packages <...packages>` with the names of the packages that changed. This matches how CI checks packages.

The compiled `build/` output is gitignored and is **not** committed. Turborepo regenerates and caches it on demand. Stage only your source edits (and other source files); do not stage `build/`.

## Creating PRs

Follow the contribution guide: https://github.com/expo/expo/blob/main/CONTRIBUTING.md and the PR template:

**Commit message:** format as `[platform][api] Title`, e.g. `[ios][video] Fix black screen on older devices`.

**PR description** follows the [repo PR template](https://github.com/expo/expo/blob/main/.github/PULL_REQUEST_TEMPLATE) — fill in each section:

- **Why:** the motivation for the change; link relevant issues, forum posts, or feature requests.
- **How:** how you built the feature or fixed the bug, and why you took that approach.
- **Test Plan:** how you tested the change and how a reviewer can reproduce it — include terminal
  output or screenshots when there are no automated tests.
- **Checklist:** added a `CHANGELOG.md` entry and verified the change builds, type-checks, lints,
  and tests via `et check-packages`; confirmed the change works with `npx expo prebuild` & EAS Build
  if relevant; follows the documentation style guide.
**Before submitting:** run `et check-packages` (builds, type-checks, lints, and tests), remove stray
`console.log`s or commented-out code, and do not stage the gitignored `build/` output.

**See also:**

- [Updating Changelogs](https://github.com/expo/expo/blob/main/guides/contributing/Updating%20Changelogs.md)
- [Expo Documentation Writing Style Guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md)

## Error messages

When writing error messages, consider explaining what, why, and how:

- **What:** clearly state what failed.
- **Why:** explain the likely cause at the user's level of abstraction, not just the symptom.
- **How:** tell the user what to do next, such as a fix, workaround, debugging step, or when to contact support. The user is usually a developer.

Be specific, calm, and actionable. Do not stop at the symptom. Even when the exact fix is unknown, always provide a useful next step. Include diagnostic details only when they help troubleshooting, and label them clearly.

Example error message:
The JavaScript bundler couldn't bundle your code because it depends on a Node.js native addon (node_modules/example/example.node). Use a different package fully implemented in JavaScript, or see https://metrobundler.dev/docs/resolution/ if this package already provides one and the bundler may not be configured to resolve it.
