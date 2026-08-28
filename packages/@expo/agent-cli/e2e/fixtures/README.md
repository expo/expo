<!-- @ref llp/0002-testing-and-evals.plan.md -->
<!-- @ref llp/0004-smart-start-and-project-state.rfc.md -->

# E2E fixture projects

Every fixture is a complete, tiny Expo project with a **committed `node_modules`** directory. The
packages in there are test doubles, not real dependencies: they carry only the files the probe and
the skill discovery read. `.gitignore` in this directory re-includes `node_modules`, which the
repository root otherwise ignores.

`setupFixtureAsync()` (see `../utils.ts`) copies a fixture to a temporary directory per test and
installs the stub `expo` bin into it, so no test mutates the checked-in files.

## What a stub proves, and what it cannot

A stub accepts whatever it was written to accept, so a passing e2e test proves the **shape** of an
invocation — that `@expo/agent-cli` sends these arguments, in this order, and reads the answer — and never
its **availability** in the CLI a user's project actually resolves. The two look identical in a
green test and are not the same question.

So: **a flag verified against this monorepo's source must also be run once against the published
binary** (`npx <package>@latest`, in a project outside this repository) before it ships. The
monorepo is ahead of the registry, and `--preset` is what that costs — an option of
`@expo/fingerprint`'s CLI here and not in the 0.20.9 a real SDK 57 project installs, which answered
`unknown or unexpected option: --preset` and exited non-zero [observed — live, 2026-08-24]. Every
`@expo/agent-cli impact` test passed throughout. `llp/0002` §A flag is not shipped until it has run against
the published binary is the rule; `src/lint/foreignFlags.ts` pins the list of flags it applies to,
so adding one is a visible diff.

## The matrix

| Fixture                | Native state                | Expo Go      | Purpose                                                             |
| ---------------------- | --------------------------- | ------------ | ------------------------------------------------------------------- |
| `skills-app`           | CNG                         | compatible   | Skill discovery, linking, and the `expo` subprocess boundary         |
| `go-app`               | CNG                         | compatible   | The `expo-go` and `web` rules; the only fixture with `react-native-web` |
| `dev-client-app`       | CNG                         | incompatible | Unbundled native module plus `expo-dev-client`; the `dev-client-stale` rule |
| `dev-client-fresh-app` | CNG                         | incompatible | A working fingerprint CLI and a matching recorded build; the `dev-client-fresh` rule |
| `bare-app`             | committed `ios/`+`android/` | incompatible | Custom native code; the `bare-stale` rule                            |
| `broken-app`           | CNG                         | n/a          | A dependency listed in `package.json` but absent from `node_modules` |

The `bare-fresh` rule has no fixture of its own. It needs both a recorded build and checked-in
native directories, so `plan-test.ts` copies `dev-client-fresh-app` and adds the native
directories to that copy, instead of committing a sixth near-identical project.

## Shared test doubles

Each fixture ships its own copy of these, because a fixture must stand alone once copied:

- `node_modules/expo/bin/cli` — stub `expo` bin. It records every invocation as one JSON line in
  `stub-expo-invocations.jsonl` and starts no Metro. `STUB_EXPO_LISTEN` makes `start` bind the port it
  reports and answer `GET /status` the way a dev server whose bundler has finished does, which is what
  lets `--wait-ready` be driven end to end; `STUB_EXPO_DIE_AFTER_STATUS_MS` then makes it die a fixed
  time **after** that answer, printing the macOS Automation refusal the real CLI dies of. Keying the
  death on the request rather than on a clock is what makes F140 — a dev server that answers and is
  then gone — reproducible instead of a race. `expo config` answers with the
  contents of the file `STUB_EXPO_CONFIG_JSON` names and exits, the way the real CLI prints one JSON
  object there and nothing else — with the stub's own `stub_expo_start` line still above it, so the
  "last JSON line wins" parse of `inspect:config-plugins` is tested against a stream that has two.
- `node_modules/expo/internal/unstable-autolinking-exports.js` — resolves the direct dependencies
  listed in `package.json`, reporting unresolved ones as `undefined` like the real linker does.
  Skill discovery needs it; the project-state probe does not, because the probe classifies packages
  from their files alone. It is kept in every fixture so that any of them can also run the `skills`
  commands, and `start`/`dev`, which sync skills after the dev server starts.
- `node_modules/expo/bundledNativeModules.json` — the short list of packages that count as bundled
  in Expo Go for these fixtures. Only `expo-camera`, `expo-dev-client` and `react-native-web` are
  in it, so any other native module is "unbundled".

## The fingerprint tool

Only `dev-client-fresh-app` ships one, as a stub `@expo/fingerprint` package. Everywhere else the
probe finds no `fingerprint` bin and reports `fingerprint.hash === null` without throwing, which is
what the tests assert.

The stub prints one fixed hash, and `.expo/agent-cli-last-build.json` in that fixture records the
same hash — that pair is what makes the project look freshly built. Two environment variables let a
test steer it without editing the fixture: `STUB_FINGERPRINT_HASH` prints a different hash, which
simulates a changed native surface, and `STUB_FINGERPRINT_EXIT_CODE` makes the tool fail.

**It also records every invocation**, one JSON line in `stub-fingerprint-invocations.jsonl`, read
with `readStubFingerprintInvocations()`. That log is the only way to observe the fingerprint caching
of `llp/0023` from outside: a memo hit, a cache hit and a recomputation all print the same hash and
differ only in how many subprocesses ran.

**`STUB_FINGERPRINT_HASH` is not a way to move the fingerprint of a cached project.** An environment
variable is not a file, and the cross-run cache is revalidated against files — so a run that only
sets it is answered out of `.expo/agent-cli-fingerprint.json` with the old hash. A test that needs the
hash to move has to change something the pinned set covers as well, `app.json` being the smallest,
which is also how a real project moves its hash.

**And it has to change that file's *length*.** The cache pins each file by size and modification
time, and both an in-memory filesystem and a fast disk can write twice inside one millisecond — so a
rewrite of the same length moves neither half of the key, and a test that relies on it passes or
fails by luck. Two flaky tests were found this way. Adding a field to `app.json` is the usual fix.

`node_modules/.bin/fingerprint` is not committed. `installStubFingerprintAsync()` in `../utils.ts`
writes the shims into the temporary copy, the same way the stub `expo` bin is installed, so the
executable bits never have to live in git.

## Native module doubles

A package counts as a native module through the markers a real Expo module has:

- `expo-module.config.json` at the package root, and
- for `fake-native-module`, an `ios/` and an `android/` directory with one build file each.

`fake-js-lib` has neither, so it is JS-only.
