# Target path fixtures

Two parsers read the output of `swift package dump-package`: `resolveTargetPaths` in
`scripts/spm/manifests.js`, and `resolveCheckedInTargetSourceRoot` in
`tools/src/prebuilds/CheckedInManifest.ts`. Both test suites run every case in this directory,
so the two cannot drift apart on where a target's sources live.

Each case directory holds:

- `dump.json`: the real output of `swift package dump-package` for the case.
- The source tree that the dump refers to. Every directory holds at least one file, because git
  does not keep empty directories.
- `expected.json`: `targets` maps each resolved target to its source directory, relative to the
  case directory. `unresolved` lists the targets whose sources do not exist.

The `Package.swift` of each case is not checked in, so that no tool mistakes a case for a real
package.

## Regenerating a dump

The dumps were generated with Swift 6.4 (swift-tools-version 6.2).

1. Outside this repository, create a directory with the case's `Package.swift`.
2. Run `swift package dump-package > raw.json` in that directory.
3. Replace the absolute path in `packageKind` with a fixed placeholder, and change nothing else:

   ```sh
   jq '.packageKind = {"root": ["/fixture"]}' raw.json > dump.json
   ```

4. Copy `dump.json` into the case directory.
