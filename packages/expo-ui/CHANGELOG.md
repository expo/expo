# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- [iOS] Added `ShareLink` component. ([#37125](https://github.com/expo/expo/pull/37125)) by [@pchalupa](https://github.com/pchalupa)
- Add ios `glass` button variant. ([#37373](https://github.com/expo/expo/pull/37373) by [@aleqsio](https://github.com/aleqsio))
- Added `jetpack-compose-primitives`. ([#36257](https://github.com/expo/expo/pull/36257) by [@kudo](https://github.com/kudo))
- Add support for controlling the state of the DisclosureGroup. ([#37704](https://github.com/expo/expo/pull/37704) by [@Pflaumenbaum](https://github.com/Pflaumenbaum))
### 🐛 Bug fixes

### 💡 Others

- Fixed `ExpoComposeView` breaking change errors. ([#36256](https://github.com/expo/expo/pull/36256) by [@kudo](https://github.com/kudo))

## 0.1.1-alpha.10 - 2025-07-01

### 🐛 Bug fixes

- Fixed `BottomSheet` affecting layout outside. ([#37370](https://github.com/expo/expo/pull/37370) by [@kudo](https://github.com/kudo))

## 0.1.1-alpha.9 - 2025-06-08

### 🎉 New features

- Allowed custom children in SwiftUI Button. ([#37136](https://github.com/expo/expo/pull/37136) by [@kudo](https://github.com/kudo))

## 0.1.1-alpha.8 - 2025-06-04

### 🎉 New features

- [android] Add shape component. ([#36964](https://github.com/expo/expo/pull/36964) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

- Improved `@expo/ui/swift-ui-primitives` integrations. ([#36937](https://github.com/expo/expo/pull/36937), [#36938](https://github.com/expo/expo/pull/36938) by [@kudo](https://github.com/kudo))

## 0.1.1-alpha.7 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.1.1-alpha.6 — 2025-04-30

### 🐛 Bug fixes

- [iOS] Fix initial opened state of Bottom Sheet. ([#36176](https://github.com/expo/expo/pull/36176) by [@entiendoNull](https://github.com/entiendoNull))

## 0.1.1-alpha.5 — 2025-04-25

### 💡 Others

- Shared code between current views and the Next views (now called primitives). ([#36377](https://github.com/expo/expo/pull/36377) by [@kudo](https://github.com/kudo))

## 0.1.1-alpha.4 — 2025-04-23

### 🎉 New features

- Added `matchContents` to SwiftUI.Host. ([#36312](https://github.com/expo/expo/pull/36312) by [@kudo](https://github.com/kudo))

### 💡 Others

- Renamed `<SwiftUI.Container>` to `<SwiftUI.Host>`. ([#36311](https://github.com/expo/expo/pull/36311) by [@kudo](https://github.com/kudo))

## 0.1.1-alpha.3 — 2025-04-21

### 🐛 Bug fixes

- [Android] Fixed `DatePicker` causing out of memory exception. ([#36227](https://github.com/expo/expo/pull/36227) by [@lukmccall](https://github.com/lukmccall))

## 0.1.1-alpha.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.1.1-alpha.1 — 2025-04-11

_This version does not introduce any user-facing changes._

## 0.1.1-alpha.0 — 2025-04-10

_This version does not introduce any user-facing changes._

## 0.1.0-alpha.0 — 2025-04-04

### 🛠 Breaking changes

- upgrade RN to 0.78 ([#35050](https://github.com/expo/expo/pull/35050) by [@vonovak](https://github.com/vonovak))

### 🎉 New features

- [iOS] Add bottom sheet. ([#35455](https://github.com/expo/expo/pull/35455) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add support for `pallete` and `inline` pickers. ([#35435](https://github.com/expo/expo/pull/35435) by [@aleqsio](https://github.com/aleqsio))
- Add TextInput for Android. ([#35228](https://github.com/expo/expo/pull/35228) by [@aleqsio](https://github.com/aleqsio))
- Add context menu previews. ([#35369](https://github.com/expo/expo/pull/35369) by [@aleqsio](https://github.com/aleqsio)).
- Add TextInput for iOS. ([#35098](https://github.com/expo/expo/pull/35098) by [@aleqsio](https://github.com/aleqsio))
- Add `disabled` button prop. ([#35115](https://github.com/expo/expo/pull/35115) by [@andrew-levy](https://github.com/andrew-levy))
- Add Radio option to Picker Component for Android. ([#34629](https://github.com/expo/expo/pull/34629)) by [@benjaminkomen](https://github.com/benjaminkomen)
- Add color support for `ContextMenu` components. ([#34787](https://github.com/expo/expo/pull/34787) by [@behenate](https://github.com/behenate))
- Adds `DateTimePicker` component. ([#34883](https://github.com/expo/expo/pull/34883) by [@alanjhughes](https://github.com/alanjhughes))
- Add CircularProgress and LinearProgress component. ([#34907](https://github.com/expo/expo/pull/34907) by [@janicduplessis](https://github.com/janicduplessis))
- Add Gauge component ([#35032](https://github.com/expo/expo/pull/35032) by [@jakex7](https://github.com/jakex7))
- Add List and Label component ([#35222](https://github.com/expo/expo/pull/35222) by [@Pflaumenbaum](https://github.com/Pflaumenbaum))

### 🐛 Bug fixes

- [iOS] Fix tvOS breakage. ([#35146](https://github.com/expo/expo/pull/35146) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Refactor imports, update docs ([#35819](https://github.com/expo/expo/pull/35819) by [@aleqsio](https://github.com/aleqsio))
- Drop section polyfill for Android ([#35305](https://github.com/expo/expo/pull/35305) by [@aleqsio](https://github.com/aleqsio))
- Standardize platform key ordering in `expo-module.config.json`. ([#35003](https://github.com/expo/expo/pull/35003) by [@reichhartd](https://github.com/reichhartd))
- Dismiss context menu when a menu item is tapped on Android ([#35365](https://github.com/expo/expo/pull/35365) by [@fobos531](https://github.com/fobos531))
- Migrated SwiftUI views with backward compatible `WithHostingView`. ([#35553](https://github.com/expo/expo/pull/35553) by [@kudo](https://github.com/kudo))
- Introduced `SwiftUI` components. ([#35555](https://github.com/expo/expo/pull/35555) by [@kudo](https://github.com/kudo))

## 0.0.2 — 2025-02-11

### 🎉 New features

- Add `systemImage` prop to Android `Button` component. ([#34862](https://github.com/expo/expo/pull/34862) by [@andrew-levy](https://github.com/andrew-levy))
- Add `UnwrappedChildren` for nested SwiftUI views. ([#34954](https://github.com/expo/expo/pull/34954) by [@andrew-levy](https://github.com/andrew-levy))
- Add `color` and `elementColors` props. ([#34666](https://github.com/expo/expo/pull/34666) by [@aleqsio](https://github.com/aleqsio))
- Add Button component.([#34340](https://github.com/expo/expo/pull/34340) by [@behenate](https://github.com/behenate))
- Apple TV support and source restructure. ([#34532](https://github.com/expo/expo/pull/34532) by [@douglowder](https://github.com/douglowder))
- Add `ContextMenu` component. ([#34553](https://github.com/expo/expo/pull/34553) by [@behenate](https://github.com/behenate))
- Add `ColorPicker` component. ([#34819](https://github.com/expo/expo/pull/34819) by [@andrew-levy](https://github.com/andrew-levy))

### 🐛 Bug fixes

- Fix flex/width/height props for autosized components. ([#34922](https://github.com/expo/expo/pull/34922) by [@aleqsio](https://github.com/aleqsio))
- Fix tvOS compilation. ([#34730](https://github.com/expo/expo/pull/34730) by [@douglowder](https://github.com/douglowder))
- Exclude `ColorPicker` on tvOS. ([#34929](https://github.com/expo/expo/pull/34929) by [@alanjhughes](https://github.com/alanjhughes))

### 💡 Others

- Add docs ([#34808](https://github.com/expo/expo/pull/34808) by [@aleqsio](https://github.com/aleqsio))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- Rename the events for the `Switch` component. ([#34577](https://github.com/expo/expo/pull/34577) by [@behenate](https://github.com/behenate))
- Allow lower case section titles ([#35113](https://github.com/expo/expo/pull/35113) by [@Pflaumenbaum](https://github.com/Pflaumenbaum))

## 0.0.1 — 2025-01-21

### 💡 Others

- Rename to @expo/ui

## 0.0.0 — 2025-01-21

### 🎉 New features

- [iOS] Add Picker component ([#34198](https://github.com/expo/expo/pull/34198) by [@aleqsio](https://github.com/aleqsio))
