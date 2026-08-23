# Recorded introspected config

`introspect-sdk57.json` is what `expo config --type introspect --json` prints, which is the whole
input of `src/config/effective.ts`.

**Provenance: recorded, then trimmed.** Produced by running
`CI=1 ./node_modules/.bin/expo config --type introspect --json` in `apps/minimal-tester` of this
monorepo on 2026-08-23, against SDK 57 with `@expo/cli` 57.0.11. The absolute project path was
replaced by `/project`, and four bulky parts were cut so the fixture stays readable:

- `ios.infoPlist` keeps 8 of its 31 keys.
- `ios.splashScreenStoryboard.document` keeps its root attributes instead of the whole XIB tree.
- `android.gradleProperties` keeps the first 9 `property` entries of 67 (the comment and blank-line
  entries are gone, which is why the property count in the tests is 9 and not 26).
- `_internal.autolinkedModules` keeps 12 of 29.

Everything else — `pluginHistory` with its 13 entries, the `plugins` array of 3, the Android
manifest with its 7 permissions, and every other mod — is verbatim. Nothing was invented: the
shapes the reshaper reads (`{ resources: { color: [...] } }`, `{ $: { 'android:name': ... } }`,
`{ type: 'property', key, value }`) are the ones a real run produced.

The project it came from declares three plugins (`expo-brownfield`, `expo-splash-screen`,
`expo-build-properties`) and `pluginHistory` records 13, of which exactly one — `expo-splash-screen`
— is declared. That is what makes it a useful fixture for the declared/auto join: both halves are
non-empty, and it also shows the honest gap, since `expo-brownfield` and `expo-build-properties` are
declared and are in no `pluginHistory` entry.
