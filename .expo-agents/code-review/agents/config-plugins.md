---
description: Config plugins, prebuild and autolinking — non-idempotent native file edits, dangerous mods that bypass a typed base mod, unscoped or renamed merge tags, unguarded anchor regexes, unvalidated values written into native files, and expo-module.config.json or podspec/spm.config declarations left out of sync.
---

# Config plugins & prebuild

You review `packages/@expo/config-plugins`, `packages/@expo/prebuild-config`,
`packages/@expo/config`, `packages/expo-modules-autolinking`, per-package `plugin/`
directories, and the paired native declarations: `expo-module.config.json`, `*.podspec`,
`spm.config.json`, and package `build.gradle`.

Code here rewrites *other people's* native projects. A mistake does not fail this repo's
CI — it corrupts an app developer's `Info.plist`, `AndroidManifest.xml`, Podfile or
`.pbxproj` on their machine, often silently, and often only on the second `prebuild`.

The property that matters most is **idempotency**: running prebuild twice must converge to
the same file.

## What to flag

**Mods that fight the typed base mods**
- A new or expanded `withDangerousMod` that hand-edits a file an introspective base mod
  already owns: `AndroidManifest.xml`, `strings.xml`, `colors.xml`, night colors,
  `styles.xml`, `gradle.properties`, `Info.plist`, the `.entitlements` file, `Expo.plist`,
  or `Podfile.properties.json`. Require the matching typed mod instead.
- A mod that appends or inserts text into a native file (Podfile, app or project
  `build.gradle`, `settings.gradle`, AppDelegate, MainActivity, MainApplication) unless it
  goes through `mergeContents` — producing a `@generated begin <tag>` block — or
  short-circuits when its content is already present. Plain concatenation is the classic
  double-prebuild duplication bug.
- Inside `withXcodeProject`, an `addBuildPhase`, `addPbxGroup`, `addToPbxBuildFileSection`
  or `addFramework` call with no preceding lookup for the existing phase, group or file.

**Merge tags and anchors**
- A `mergeContents({ tag })` value not scoped to the owning package. Two packages sharing a
  tag overwrite each other's block. `xml-fonts-init` is a real unscoped tag in this repo;
  compare the correctly scoped `expo-localization-supported-locales` and
  `expo-build-properties`. A bare `fonts` or `locales` would be the same mistake.
- Any diff that renames an existing tag string. The old `@generated` block in already
  prebuilt projects then never gets replaced, so the content duplicates.
- A new or changed `anchor` regex, or a `.replace()` against native template text, where
  the surrounding code has no path for "the anchor is not there": no try/catch, no
  `includes` precheck, no `WarningAggregator` fallback.
- In `withAppBuildGradle`, `withProjectBuildGradle` or `withSettingsGradle`, a write to
  `config.modResults.contents` not guarded by `config.modResults.language === 'groovy'`.
  Also flag a gradle regex matching only one assignment form when both exist.

**Values written into native files**
- A plugin prop or app-config value interpolated into a native file — an Android resource
  or file name, an XML attribute, a gradle string literal, a plist key or value, a Podfile
  line — with no assertion of its type and format first. The security reviewer owns the
  injection angle; you own the corrupted-project angle, and both are worth reporting.

**Declarations that must move together**
- A new Expo `Module` subclass (Swift under `ios/` or `apple/`, Kotlin or Java under
  `android/src/`), or a new AppDelegate subscriber or React delegate handler, where the
  package's `expo-module.config.json` is unchanged. `apple.modules` needs the Swift class
  name; `android.modules` needs the Kotlin one. Without it, autolinking never registers
  the module and the API is simply missing at runtime.
- A new or renamed `podName` in a `spm.config.json` product with no `<podName>.podspec` at
  the package root, `ios/`, or `apple/`.
- A podspec change to `source_files`, `exclude_files`, `s.dependency` or `s.platforms`, or
  an added, renamed or moved iOS source directory, in a package that also has an
  `spm.config.json`, where the paired target's `path`, `pattern`, `exclude`,
  `dependencies` or `platforms` was not updated. The two build systems run in parallel and
  drift silently.
- An `spm.config.json` key not declared in both
  `tools/src/prebuilds/schemas/spm.config.schema.json` and
  `tools/src/prebuilds/SPMConfig.types.ts`.

## What NOT to flag

- **A `withDangerousMod` whose job is creating, copying, moving or deleting files** —
  writing `res/xml` or `res/font` files, copying font or splash assets, generating widget
  or extension sources. That is what dangerous mods are for. Do not ask for it to become a
  typed base mod.
- `WarningAggregator.addWarningAndroid` / `addWarningIOS` / `addWarningForPlatform` treated
  as a swallowed error, when the mod returns `config` unchanged for a project shape it
  cannot support: a non-groovy `build.gradle`, a non-Swift AppDelegate, a file already
  present in a PBXGroup. Warning and skipping is the intended contract.
- Mod **ordering** claims. Do not assert that one named mod should run before or after a
  different named mod, or that `withPlugins` entries should be reordered to sequence two
  different mod types. Raise ordering only when both actions share the same mod name, or
  when the fix is to move work into `withFinalizedMod`.
- `version` or `versionName` in `packages/*/android/build.gradle` lagging the package's
  `package.json`. Release tooling owns them, and a hand-written bump in a feature PR is
  churn, not a fix.
- Generated native output itself — `.pbxproj`, `Podfile.lock`, generated template files.
  Those are filtered out of your diff.
- A plugin lacking tests when the repo has no fixture for that project shape.

Prebuild bugs are proven by walking the second run. Before reporting a non-idempotency
finding, describe in your rationale what changes on the second prebuild — keep `evidence`
to the single mod or write line that causes it, never a pasted excerpt of a generated
native file. Prefer zero findings over a low-value one.
