# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 55.0.8 — 2026-03-27

_This version does not introduce any user-facing changes._

## 55.0.7 — 2026-03-19

_This version does not introduce any user-facing changes._

## 55.0.6 — 2026-03-18

### 🎉 New features

- Pass environment to AppIntent ([#43925](https://github.com/expo/expo/pull/43925) by [@jakex7](https://github.com/jakex7))
- Automatically add `target` for `Button`. ([#43977](https://github.com/expo/expo/pull/43977) by [@jakex7](https://github.com/jakex7))
- Add support for `Link` view from `@expo/ui`. ([#43985](https://github.com/expo/expo/pull/43985) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Add support for `React.Fragment`. ([#43833](https://github.com/expo/expo/pull/43833) by [@jakex7](https://github.com/jakex7))
- Add Button children support. ([#43832](https://github.com/expo/expo/pull/43832) by [@jakex7](https://github.com/jakex7))
- Remove unused `Compression` related code. ([#43981](https://github.com/expo/expo/pull/43981) by [@jakex7](https://github.com/jakex7))

## 55.0.5 — 2026-03-17

_This version does not introduce any user-facing changes._

## 55.0.4 — 2026-03-11

### 🛠 Breaking changes

- Pass environment to Widgets and Live Activities. ([#43681](https://github.com/expo/expo/pull/43681) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Filter out invalid children. ([#43720](https://github.com/expo/expo/pull/43720) by [@jakex7](https://github.com/jakex7))

## 55.0.3 — 2026-03-05

### 🐛 Bug fixes

- [plugin] Fix reading undefined when config is not provided. ([#43568](https://github.com/expo/expo/pull/43568) by [@jakex7](https://github.com/jakex7))
- Skip server bundling in `export:embed` call for `expo-widgets` bundle ([#43602](https://github.com/expo/expo/pull/43602) by [@kitten](https://github.com/kitten))

## 55.0.2 — 2026-02-26

### 🎉 New features

- Add support for `after(date)` dismissal policy, final content state, and `contentDate` when ending a Live Activity. ([#43472](https://github.com/expo/expo/pull/43472) by [@jakex7](https://github.com/jakex7))
- [plugin] Add `contentMarginsDisabled`. ([#43799](https://github.com/expo/expo/pull/43799) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Add missing project root to `watchFolders` in `metro.config.js` ([#43449](https://github.com/expo/expo/pull/43449) by [@kitten](https://github.com/kitten))

### 💡 Others

- Remove extraneous `@expo/config-plugins` dependency ([#43452](https://github.com/expo/expo/pull/43452) by [@kitten](https://github.com/kitten))

## 55.0.1 — 2026-02-25

### 🐛 Bug fixes

- Fix "blinking" on interactions. ([#43416](https://github.com/expo/expo/pull/43416) by [@jakex7](https://github.com/jakex7))
- Generate WidgetBundle for live activity even when there are no widgets. ([#43425](https://github.com/expo/expo/pull/43425) by [@jakex7](https://github.com/jakex7))

## 55.0.0 — 2026-02-25

### 🎉 New features

- New API based on shared objects. ([#43243](https://github.com/expo/expo/pull/43243) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Fix iOS bundle build for irregularly hoisted dependencies or monorepos ([#43350](https://github.com/expo/expo/pull/43350) by [@kitten](https://github.com/kitten))

## 55.0.0-alpha.8 — 2026-02-20

_This version does not introduce any user-facing changes._

## 55.0.0-alpha.7 — 2026-02-16

### 🎉 New features

- Render widgets in JSC. ([#42987](https://github.com/expo/expo/pull/42987) by [@jakex7](https://github.com/jakex7))
- Create widgets runtime bundle at build time. ([#43170](https://github.com/expo/expo/pull/43170) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Fix blank widget preview content ([#42857](https://github.com/expo/expo/pull/42857) by [@garygcchiu](https://github.com/garygcchiu))
- Fix duplicated warnings on start and prebuild. ([#43072](https://github.com/expo/expo/pull/43072) by [@jakex7](https://github.com/jakex7))

## 55.0.0-alpha.6 — 2026-02-08

### 🐛 Bug fixes

- Register widget extension target with EAS Build => Apple Developer Portal ([#42954](https://github.com/expo/expo/pull/42954) by [@garygcchiu](https://github.com/garygcchiu))
- Set DEVELOPMENT_TEAM on the widget target during prebuild when ios.appleTeamId is configured ([#42954](https://github.com/expo/expo/pull/42954) by [@garygcchiu](https://github.com/garygcchiu))

## 55.0.0-alpha.5 — 2026-02-03

### 🎉 New features

- Add push-to-start token listener. ([#42721](https://github.com/expo/expo/pull/42721) by [@jakex7](https://github.com/jakex7))
- Add `onTokenReceived` event and additional Live Activities functions. ([#42724](https://github.com/expo/expo/pull/42724) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Fix build issue with "ambiguous implicit access level for import" ([#42507](https://github.com/expo/expo/pull/42507) by [@garygcchiu](https://github.com/garygcchiu))

## 55.0.0-alpha.4 — 2026-01-27

### 💡 Others

- Fixed availability check. ([#42543](https://github.com/expo/expo/pull/42543) by [@tsapeta](https://github.com/tsapeta))
- Fixed autolinking when building react-native from source. ([#42553](https://github.com/expo/expo/pull/42553) by [@jakex7](https://github.com/jakex7))

## 55.0.0-alpha.3 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.0-alpha.2 — 2026-01-23

_This version does not introduce any user-facing changes._

## 55.0.0-alpha.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0-alpha.0 — 2026-01-21

_This version does not introduce any user-facing changes._
