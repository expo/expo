# Reviewing patch-project

What to check when you change or review this package. Paths are relative to this directory.

## What the package does

patch-project keeps a user's manual edits to `android/` and `ios/` across prebuilds. It has
two parts:

- **The CLI** (`npx patch-project`, `src/cli/`) prebuilds a clean native project from the
  template, diffs the user's native project against it, and writes
  `cng-patches/<platform>+<templateChecksum>.patch`.
- **The config plugin** (`src/withPatchPlugin.ts`) applies that patch during
  `npx expo prebuild`, in a `withFinalizedMod`, after every other plugin.

The patch files are user data. Users commit them to their own repositories.

## Rules

- **Prebuild runs more than once.** With `--no-clean`, the patch can already be in the native
  project. `isPatchAppliedAsync` checks this with a reverse `git apply --check`. A change to
  the apply path must keep a second prebuild working.
- **Monorepos.** `git apply` resolves paths from the root of the enclosing repository. Every
  `git apply` call passes the `--directory` argument from `getPatchPathArgsAsync`, or the
  patch is skipped with no error when the project is in a subdirectory.
- **Git calls.** Git commands that read or write the project go through `runGitAsync` in
  `src/gitPatch.ts`, with an argv array. Never build a shell string. The one exception is the
  `git --version` check in `platformSanityCheckAsync` (`src/cli/generateNativeProjects.ts`),
  which runs before any other step. A missing `git` binary (`ENOENT`) must reach the user. It
  must not read as "patch not applied".
- **The user's native project.** The CLI moves the user's `android/` or `ios/` into
  `.patch-project-tmp/<platform>/` and deletes that directory in a `finally`. A change to this
  flow must keep the user's project recoverable when any step throws. The iOS project file is
  normalized before the diff, and `revertNormalizeNativeProjectsAsync` restores it.
- **Patch file names and format.** The name ties a patch to a template checksum. A change to
  the name, the location (`patchRoot`) or the diff options can break patches that users
  already committed. It needs a migration path or a clear error.
- **Messages.** A project shape the plugin can handle, such as a patch for another template
  checksum or a large patch, is a warning through `WarningAggregator`. A patch that cannot
  apply is an error. Each message names the patch file and what the user can do next.
- **@expo/cli internals.** The CLI loads modules from `@expo/cli/build/src/prebuild/` through
  `resolveFromExpoCli`. A change on either side can break the other. Check both packages.

## Tests

- Unit tests are in `src/__tests__/` and `src/cli/__tests__/`. `gitPatchIntegration-test.ts`
  runs real git.
- `pnpm test:e2e` builds the package, creates an app from the template, and runs the CLI and
  prebuild in `e2e/__tests__/`. A change to how patches are made or applied needs a case
  there.
- A test that only checks a mock of git or of the file system does not prove a patch applies.
