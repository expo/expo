## Repository layout

This is a pnpm workspace. Use `pnpm` for installing, running scripts, and managing dependencies;
**NEVER** use `npm` or `yarn`. Run `pnpm install` at the repo root.

- `packages/`: the Expo SDK packages, most with their own `CHANGELOG.md`.
- `apps/`: development and test apps: `bare-expo` (manual testing of packages), `native-tests`
  (host app for native unit tests), `native-component-list` (component demos), `test-suite`
  (JS test suite), `expo-go` (the Expo Go app).
- `tools/`: source of the `expotools` CLI (see the expotools section below).
- `docs/`: the docs site (docs.expo.dev).
- `templates/`: project templates published to npm.
- `guides/`: contributor guides referenced throughout this file.

## Writing tests

**Red/green:** write the test first and watch it fail, then implement the feature or fix until
it passes. **DON'T** write the implementation before the failing test exists.

### Unit tests

JS/TS unit tests use Jest and live next to the code in `__tests__/` (or `*.test.ts`). They run
as part of `et check-packages` (see Committing below).

### Native tests

Swift/Kotlin unit tests live in `packages/<pkg>/ios/Tests/` and `android/`, and run through
`et native-unit-tests` (scope with `--packages <name>`).

On iOS/macOS (Android needs no pod step), install pods before running native tests or building,
and again after adding or changing an iOS `test_spec`. Run `pod install` directly in the relevant
`apps/*/ios` or `apps/*/macos` directory rather than `et pod-install` — running it directly is
faster and avoids installing for apps you aren't working on, like Expo Go.

Running native tests:
`et native-unit-tests` — run native unit tests for all packages that provide them. Scope to
one package with `--packages <name>` (e.g. `et native-unit-tests -p ios --packages @expo/ui`).

## Committing

Before committing, you may use `turbo run <task>` to run an npm script for a given task on all dependents, for example `build`, `typecheck`, `depscheck`, `test`, and `lint`. This may also be run via `et check-packages <...packages>`, which matches how CI checks packages. Keep the loop fast by scoping it to the packages you changed, e.g. `et check-packages expo-location`, rather than running repo-wide tasks.

The compiled `build/` output is gitignored and is **not** committed. Turborepo regenerates and caches it on demand. Stage only your source edits (and other source files); **NEVER** stage `build/`.

**Commit messages** use the format `[platform][api] Title`, e.g. `[ios][video] Fix black screen
on older devices`. The API tag drops the `expo-` prefix: `[video]`, not `[expo-video]`.

**Branches** are named `<github-username>/<short-description>`, e.g. `username/fix-video-playback`.

## Changelogs

Most packages in `packages/` have their own `CHANGELOG.md`, and every PR that changes a package
should add an entry to it. A PR that changes several packages adds an entry to each changed
package's changelog. Changelogs exist only for packages: PRs limited to `apps/`, `docs/`,
`tools/`, or `guides/` don't need an entry anywhere. See
[Updating Changelogs](https://github.com/expo/expo/blob/main/guides/contributing/Updating%20Changelogs.md)
for the full guide.

### Where the entry goes

Add a bullet under the `## Unpublished` heading, inside the category matching the change; create
the category heading if it's missing. **ALWAYS** append the entry at the end of the category,
after the existing entries: the order of changes sometimes matters.

- `🛠 Breaking changes`: API changes that require users to update their code or configuration
  (major bump).
- `🎉 New features`: non-breaking additions to the public API (at least a minor bump). Features
  that are internal-only belong in Others instead.
- `🐛 Bug fixes`: bug fixes and documentation clarifications.
- `⚠️ Notices`: deprecations and corner-case behavior changes that stay backwards compatible.
- `💡 Others`: internal changes, refactors, build tooling, routine work.
- `📚 3rd party library updates`: upgrades of libraries shipped in Expo Go (root changelog only).

### Writing the entry

- One concise sentence containing only text and links (no lists, headers, tables, images, or
  inline HTML). Longer adoption notes for breaking changes go in the PR description or a linked
  document on [`expo/fyi`](https://github.com/expo/fyi).
- Write for a reader with zero context about the change: describe the user-visible effect, not
  the implementation.
- Prefix platform-specific entries with `[iOS]`, `[Android]`, or `[Web]`, matching existing
  entries in the file.
- End with links to the PR and the author's GitHub profile:

  ```
  - [iOS] Fixed video playback stalling on older devices. ([#NNNNN](https://github.com/expo/expo/pull/NNNNN) by [@username](https://github.com/username))
  ```

The PR number doesn't exist until the PR is opened, so predict it right before creating the PR:
fetch the most recent issue and PR numbers and take `max + 1`.

```
gh issue list -R expo/expo -L 1 --state all --json number
gh pr list   -R expo/expo -L 1 --state all --json number
```

After creating the PR, **ALWAYS** compare its actual number with the prediction and fix the entry
if they differ. The review bot also suggests these links in a code review, but **DON'T** rely on
it: a silent mismatch leaves a dead link.

## Creating PRs

Follow the contribution guide: https://github.com/expo/expo/blob/main/CONTRIBUTING.md and the PR template.

**Self-review:** before opening a non-trivial PR, and before adding the changelog entry, run
`/deep-code-review` with no arguments (local mode: it reviews the branch against `main` and
reports findings in the conversation without posting anything to GitHub). **DON'T** fix the
findings straightaway: present them to the author and let them decide which ones to address.

**Comprehension check:** before opening a non-trivial PR, ask the author 2-4 focused questions
about the code in the conversation to confirm they understand what's being submitted and to
surface bugs or questionable decisions before reviewers see them. Skip this only for trivial
changes (typo fixes, version bumps, formatting, mechanical renames).

- Ask all questions in a single `AskUserQuestion` call. Give each question at least 3 concrete
  answer options (one correct, the others plausible but wrong), plus a separate "walk me through
  it" escape option.
- Ask about the non-obvious parts: design decisions and tradeoffs, assumptions and edge cases the
  change depends on, details a maintainer might trip on. Don't ask about things obvious from the
  diff.
- If an answer reveals a real problem, fix it before opening the PR. If the author can't answer
  confidently, walk through that part of the code together first; a shaky answer means the code
  isn't ready.
- Contributors working on a fork (check `git remote -v` against `expo/expo`) get a higher bar:
  **DON'T** open the PR until they can explain what the change does and why.

**Title:** same format as commit messages, `[platform][api] Title` (see Committing above).

**PR description** follows the [repo PR template](https://github.com/expo/expo/blob/main/.github/PULL_REQUEST_TEMPLATE) — fill in each section:

- **Why:** the motivation for the change; link relevant issues, forum posts, or feature requests.
- **How:** how you built the feature or fixed the bug, and why you took that approach.
- **Test Plan:** how you tested the change and how a reviewer can reproduce it — include terminal
  output or screenshots when there are no automated tests.
- **Checklist:** added a `CHANGELOG.md` entry (see Changelogs above) and verified the change
  builds, type-checks, lints, and tests via `et check-packages`; confirmed the change works with
  `npx expo prebuild` & EAS Build if relevant; follows the
  [documentation style guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

Write the description from the final state of the change: describe what the PR does now, **NOT**
how it evolved while you worked on it (approaches you abandoned, bugs you introduced and fixed
along the way, earlier revisions of the diff). **DON'T** use em dashes (—); rewrite with commas,
parentheses, colons, or separate sentences instead.

**Creating the PR:** **ALWAYS** create it as a draft; mark it ready for review once CI passes. Pass the
description through stdin with a quoted heredoc so backticks and newlines survive unescaped:

```
gh pr create --draft --title "..." --body-file - <<'EOF'
...
EOF
```

**Before submitting:** remove stray `console.log`s and commented-out code.

## expotools (`et`)

This repo ships its own CLI, `expotools`, available directly as `et <command> <...args>`.
Call it as `et`, **NOT** via `npx`, `bunx`, or `pnpm run`. It's put on the PATH by `direnv`, so run
`direnv allow` once in the repo root if `et` isn't found; otherwise invoke it directly with
`node ./tools/bin/expotools.js <command>`. Many of our processes (native unit tests, prebuild,
and more) run through it.

Commands you'll reach for during normal development:

- `et check-packages` — verify that packages build and their tests pass. Scope it by listing
  package names, e.g. `et check-packages expo-location`.
- `et add-changelog` — add a changelog entry to a package (see Changelogs above).

Run `et --help` to discover the rest (publishing, changelogs, on-call dashboards, and more).

## Error messages

When writing error messages, consider explaining what, why, and how:

- **What:** clearly state what failed.
- **Why:** explain the likely cause at the user's level of abstraction, not just the symptom.
- **How:** tell the user what to do next, such as a fix, workaround, debugging step, or when to contact support. The user is usually a developer.

Be specific, calm, and actionable. Do not stop at the symptom. Even when the exact fix is unknown, always provide a useful next step. Include diagnostic details only when they help troubleshooting, and label them clearly.

Example error message:
The JavaScript bundler couldn't bundle your code because it depends on a Node.js native addon (node_modules/example/example.node). Use a different package fully implemented in JavaScript, or see https://metrobundler.dev/docs/resolution/ if this package already provides one and the bundler may not be configured to resolve it.
