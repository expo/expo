# Changelog

## 0.5.4

### Patch Changes

- Updated dependencies. ([#51283](https://github.com/expo/expo/pull/51283), [#51274](https://github.com/expo/expo/pull/51274), [#51163](https://github.com/expo/expo/pull/51163), [#51196](https://github.com/expo/expo/pull/51196), [#50369](https://github.com/expo/expo/pull/50369))
  - @expo/ui@58.0.15

## 0.5.3

### Patch Changes

- Updated dependencies. ([#50941](https://github.com/expo/expo/pull/50941), [#50860](https://github.com/expo/expo/pull/50860))
  - @expo/ui@58.0.14

## 0.5.2

### Patch Changes

- Ship an agent skill for App Intents setup, invocation handling, entity catalogs, donations, and Spotlight in the npm package. ([#51070](https://github.com/expo/expo/pull/51070) by [@behenate](https://github.com/behenate))
- Add a `--donations` option and prompt to `npx expo-app-intents init` that scaffolds donation code for the selected examples. ([#50967](https://github.com/expo/expo/pull/50967) by [@behenate](https://github.com/behenate))
- Updated dependencies. ([#50893](https://github.com/expo/expo/pull/50893), [#51116](https://github.com/expo/expo/pull/51116), [#51007](https://github.com/expo/expo/pull/51007), [#50910](https://github.com/expo/expo/pull/50910), [#50909](https://github.com/expo/expo/pull/50909), [#51108](https://github.com/expo/expo/pull/51108))
  - @expo/ui@58.0.13

## 0.5.1

### Patch Changes

- Updated dependencies. ([#50984](https://github.com/expo/expo/pull/50984), [#50927](https://github.com/expo/expo/pull/50927), [#50687](https://github.com/expo/expo/pull/50687))
  - @expo/ui@58.0.12

## 0.5.0

### Minor Changes

- Add `donateIntentAsync()` and `deleteDonationsAsync()` to donate App Intents to the system. ([#50760](https://github.com/expo/expo/pull/50760) by [@chrfalch](https://github.com/chrfalch))

### Patch Changes

- Updated dependencies. ([#50881](https://github.com/expo/expo/pull/50881), [#49933](https://github.com/expo/expo/pull/49933))
  - @expo/ui@58.0.11

## 0.4.8

### Patch Changes

- Updated dependencies. ([#50801](https://github.com/expo/expo/pull/50801), [#49986](https://github.com/expo/expo/pull/49986), [#50674](https://github.com/expo/expo/pull/50674), [#50786](https://github.com/expo/expo/pull/50786), [#50851](https://github.com/expo/expo/pull/50851))
  - @expo/ui@58.0.10

## 0.4.7

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))
- Updated dependencies. ([#50762](https://github.com/expo/expo/pull/50762), [#50579](https://github.com/expo/expo/pull/50579), [#50693](https://github.com/expo/expo/pull/50693))
  - @expo/ui@58.0.9

## 0.4.6 — 2026-09-28

_This version does not introduce any user-facing changes._

## 0.4.5 — 2026-09-25

_This version does not introduce any user-facing changes._

## 0.4.4 — 2026-09-23

### 🐛 Bug fixes

- Annotate the mail example templates with macOS availability so `npx expo-app-intents init` output works on macOS. ([#50525](https://github.com/expo/expo/pull/50525) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.4.3 — 2026-09-22

_This version does not introduce any user-facing changes._

## 0.4.2 — 2026-09-21

### 🐛 Bug fixes

- Fix the duplicate setup check in `init` reporting Windows-style paths, which also made its tests fail on Windows. ([#50175](https://github.com/expo/expo/pull/50175) by [@alanjhughes](https://github.com/alanjhughes))

## 0.4.1 — 2026-09-16

_This version does not introduce any user-facing changes._

## 0.4.0 — 2026-09-15

_This version does not introduce any user-facing changes._

## 0.3.0 — 2026-09-14

### 🎉 New features

- [iOS] Add `AppEntityView`, a UIKit wrapper for associating React Native content with an App Entity. ([#49663](https://github.com/expo/expo/pull/49663) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [iOS] Drop macOS from the podspec platforms to fix `pod install` failing with "Unable to find a specification for `ExpoUI`". ([#50065](https://github.com/expo/expo/pull/50065) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.2.0 — 2026-09-10

### 🎉 New features

- Add docs. ([#47226](https://github.com/expo/expo/pull/47226) by [@behenate](https://github.com/behenate))
- Add cli tool. ([#47223](https://github.com/expo/expo/pull/47223) by [@behenate](https://github.com/behenate))
- Initial release. ([#47207](https://github.com/expo/expo/pull/47207) by [@behenate](https://github.com/behenate))
