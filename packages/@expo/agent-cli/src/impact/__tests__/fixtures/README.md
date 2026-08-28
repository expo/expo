# Fingerprint fixtures — provenance

Real output of `@expo/fingerprint`, captured on **2026-08-24**. Nothing here is synthesized: the
classifier's whole job is to read another tool's vocabulary, and a table written from the
documentation rather than from the tool is how three of the values in the original design turned
out not to be `reasons` at all (llp/0011 §What the vocabulary actually is).

## The project

`friction/run3/notesapp` — an Expo Router app on SDK 57.0.15, React Native 0.86.2, managed (no
`ios/` or `android/` directory), dependencies installed. The capture ran the project's **own**
`node_modules/.bin/fingerprint`, `@expo/fingerprint` **0.20.9**, at the default `balanced` preset.

## How they were captured

```
# before
./node_modules/.bin/fingerprint fingerprint:generate . --platform ios   > before-ios.json

# the change: one native dependency
npm install react-native-mmkv        # 4.3.2; pulls react-native-nitro-modules 0.37.0

# after
./node_modules/.bin/fingerprint fingerprint:generate . --platform ios   > after-ios.json
./node_modules/.bin/fingerprint fingerprint:diff before-ios.json after-ios.json > diff-ios.json
```

The project was then restored exactly: `package.json` and `package-lock.json` back to their
recorded checksums, the two added `node_modules` directories removed, and the fingerprint
re-generated to confirm it hashes to the pre-capture value again.

## What was measured

| | sources | bytes of `{sources, hash}` |
| --- | --- | --- |
| `--platform ios` | 59 | 25,526 |
| `--platform android` | 59 | 30,378 |
| both platforms | 79 | 43,072 |

This is the measurement behind the decision to store the whole fingerprint in
`.expo/agent-cli-last-build.json` rather than gzip it or store a subset — see llp/0011
§The record has to hold the sources. It is a small app; a large one is bigger, and the record is
advisory, so a project where it grows unreasonably loses a comparison and never a command.

## The files

- **`notesapp-ios-diff.json`** — the real `fingerprint:diff`, **whole and untrimmed**: three items
  for one added native dependency. Two `added` `dir` sources for the two packages, and one
  `changed` `contents` source for the autolinking config. The `contents` strings are long and are
  kept as they were emitted; nothing in this CLI reads them, and truncating them would make the
  fixture a paraphrase.

- **`notesapp-ios-sources.json`** — **trimmed.** The real `hash`, and the first source of each
  distinct `reasons` combination in the real 59-source fingerprint: 10 of 59 kept. Every reason
  family the project produces is still represented — `expoConfig`, `expoConfigPlugins`,
  `expoConfigExternalFile`, `expoAutolinkingIos`, `rncoreAutolinkingIos`, `bareGitIgnore`,
  `packageJson:scripts`, `package:react-native` — which is what the fixture is for. **The `hash`
  therefore does not correspond to the trimmed `sources`**; it is the hash of the full 59, kept so
  the file is honest about where it came from. Nothing asserts a hash against these sources.
