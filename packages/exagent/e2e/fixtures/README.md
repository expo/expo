<!-- @ref llp/0002-testing-and-evals.plan.md -->
<!-- @ref llp/0004-smart-start-and-project-state.rfc.md -->

# E2E fixture projects

Every fixture is a complete, tiny Expo project with a **committed `node_modules`** directory. The
packages in there are test doubles, not real dependencies: they carry only the files the probe and
the skill discovery read. `.gitignore` in this directory re-includes `node_modules`, which the
repository root otherwise ignores.

`setupFixtureAsync()` (see `../utils.ts`) copies a fixture to a temporary directory per test and
installs the stub `expo` bin into it, so no test mutates the checked-in files.

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
  `stub-expo-invocations.jsonl` and never starts a real dev server.
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

The stub prints one fixed hash, and `.expo/exagent-last-build.json` in that fixture records the
same hash — that pair is what makes the project look freshly built. Two environment variables let a
test steer it without editing the fixture: `STUB_FINGERPRINT_HASH` prints a different hash, which
simulates a changed native surface, and `STUB_FINGERPRINT_EXIT_CODE` makes the tool fail.

`node_modules/.bin/fingerprint` is not committed. `installStubFingerprintAsync()` in `../utils.ts`
writes the shims into the temporary copy, the same way the stub `expo` bin is installed, so the
executable bits never have to live in git.

## Native module doubles

A package counts as a native module through the markers a real Expo module has:

- `expo-module.config.json` at the package root, and
- for `fake-native-module`, an `ios/` and an `android/` directory with one build file each.

`fake-js-lib` has neither, so it is JS-only.
