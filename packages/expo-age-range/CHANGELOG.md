# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- [iOS] Add `isEligibleForAgeFeaturesAsync` to expose Apple's `AgeRangeService.isEligibleForAgeFeatures` (iOS 26.2+). Resolves with `null` on unsupported OS versions, other platforms, or errors. ([#45525](https://github.com/expo/expo/pull/45525) by [@frankcalise](https://github.com/frankcalise))

### 🐛 Bug fixes

### 💡 Others

## 56.0.3 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- [iOS] Marked `AgeRangeModule` as `@unchecked Sendable` for Swift 6 strict-concurrency compatibility. ([#44337](https://github.com/expo/expo/pull/44337) by [@tsapeta](https://github.com/tsapeta))

## 0.2.16 - 2026-04-09

_This version does not introduce any user-facing changes._

## 0.2.15 - 2026-04-07

_This version does not introduce any user-facing changes._

## 0.2.14 - 2026-04-02

_This version does not introduce any user-facing changes._

## 0.2.13 - 2026-04-02

### 🐛 Bug fixes

- Updated remaining `AgeRangeResponse` fields to allow null values to match native API behavior. ([#44393](https://github.com/expo/expo/pull/44393) by [@vonovak](https://github.com/vonovak))
- Update AgeRangeResponse to allow null values ([#44310](https://github.com/expo/expo/pull/44310) by [@joshbuchea](https://github.com/joshbuchea))

## 0.2.12 - 2026-03-17

_This version does not introduce any user-facing changes._

## 0.2.11 - 2026-02-27

### 🎉 New features

- bump android dependency, expose new `DECLARED` user status ([#43345](https://github.com/expo/expo/pull/43345) by [@vonovak](https://github.com/vonovak))

## 0.2.10 — 2026-02-25

_This version does not introduce any user-facing changes._

## 0.2.9 — 2026-02-20

_This version does not introduce any user-facing changes._

## 0.2.8 — 2026-02-16

_This version does not introduce any user-facing changes._

## 0.2.7 — 2026-02-08

_This version does not introduce any user-facing changes._

## 0.2.6 — 2026-02-03

_This version does not introduce any user-facing changes._

## 0.2.5 — 2026-01-27

_This version does not introduce any user-facing changes._

## 0.2.4 — 2026-01-26

_This version does not introduce any user-facing changes._

## 0.2.3 — 2026-01-22

_This version does not introduce any user-facing changes._

## 0.2.2 — 2026-01-21

_This version does not introduce any user-facing changes._

## 0.2.0 — 2025-12-16

### 🎉 New features

- [android] bump com.google.android.play:age-signals dependency to 0.0.2 ([#41568](https://github.com/expo/expo/pull/41568) by [@vonovak](https://github.com/vonovak))

## 0.1.0 — 2025-12-04

- add docs for `mostRecentApprovalDate` field ([#41425](https://github.com/expo/expo/pull/41425) by [@vonovak](https://github.com/vonovak))
