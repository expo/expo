# Changelog

## Unpublished

### 🛠 Breaking changes

- Replace the required `name` field of `InlineModulesXcodeParams` with the optional `appName`, used only as a tiebreak fallback when several application targets exist. ([#49413](https://github.com/expo/expo/pull/49413) by [@vonovak](https://github.com/vonovak))

### 🎉 New features

### 🐛 Bug fixes

- Resolve the main Xcode target by its application product type instead of the app name, so renamed and `--no-clean` projects match. Skip aggregate and legacy targets, prefer the target named after the on-disk project when several exist (warn when none matches), and match quoted target names in `xcodeProjectTargets`. ([#49413](https://github.com/expo/expo/pull/49413) by [@vonovak](https://github.com/vonovak))

### 💡 Others

## 0.1.4 — 2026-07-29

_This version does not introduce any user-facing changes._

## 0.1.3 — 2026-07-15

_This version does not introduce any user-facing changes._

## 0.1.2 — 2026-07-07

_This version does not introduce any user-facing changes._

## 0.1.1 — 2026-06-30

_This version does not introduce any user-facing changes._

## 0.1.0 — 2026-06-25

_This version does not introduce any user-facing changes._

## 0.0.12 — 2026-06-15

### 🎉 New features

- Add option to specify targets to use with inline modules ([#46698](https://github.com/expo/expo/pull/46698) by [@HubertBer](https://github.com/HubertBer))

## 0.0.11 — 2026-06-05

### 🐛 Bug fixes

- Fix inline modules not regiestering for all of the targets on iOS, leading to [compilation errors when using expo-widgets #46219](https://github.com/expo/expo/issues/46219) ([#XXXXXX](https://github.com/expo/expo/pull/XXXXXX) by [@HubertBer](https://github.com/HubertBer)) ([#46484](https://github.com/expo/expo/pull/46484) by [@HubertBer](https://github.com/HubertBer))
