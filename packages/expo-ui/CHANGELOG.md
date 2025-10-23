# Changelog

## Unpublished

### 🛠 Breaking changes

- [Android] Move all `jetpack-compose-primitives` components to `jetpack-compose` namespace. ([#40272](https://github.com/expo/expo/pull/40272) by [@aleqsio](https://github.com/aleqsio))

### 🎉 New features

- [iOS] Add RTL support in swiftui. ([#40335](https://github.com/expo/expo/pull/40335) by [@kfirfitousi](https://github.com/kfirfitousi))
- [Android] Add Carousel component. ([#40325](https://github.com/expo/expo/pull/40325) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add `scrollDismissesKeyboard` modifier. ([#40201](https://github.com/expo/expo/pull/40201) by [@christianwooldridge](https://github.com/christianwooldridge))
- [Android] Add Android BottomSheet ([#37553](https://github.com/expo/expo/pull/37553) by [@Jeroen-G](https://github.com/Jeroen-G))
- [Android] Move all components to use Host ([#40244](https://github.com/expo/expo/pull/40244) by [@aleqsio](https://github.com/aleqsio))
- [Android] Add support for modifiers in primitives, add clip modifier. ([#40164](https://github.com/expo/expo/pull/40164) by [@aleqsio](https://github.com/aleqsio))
- Add scoped compose modifiers, move testID to modifiers. ([#39155](https://github.com/expo/expo/pull/39155) by [@aleqsio](https://github.com/aleqsio))
- [Android] Add custom button shapes. ([#40163](https://github.com/expo/expo/pull/40163) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add ref methods and onChangeFocus to TextField and SecureField. ([#39898](https://github.com/expo/expo/pull/39898) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Adds `controlSize` prop to Button([#40030](https://github.com/expo/expo/pull/40030) by [@betomoedano](https://github.com/betomoedano))
- [iOS] Add SF symbol typings ([#39802](https://github.com/expo/expo/pull/39802) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Add `scrollContentBackground` and `listRowBackground` modifier. ([#40195](https://github.com/expo/expo/pull/40195) by [@doombladeoff](https://github.com/doombladeoff))
- Added `onAppear` and `onDisappear` modifiers to `swift-ui`. ([#40056](https://github.com/expo/expo/pull/40056) by [@kudo](https://github.com/kudo))
- [iOS] Add Stepper component. ([#39813](https://github.com/expo/expo/pull/39813) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- [ios] Add text modifiers (`truncationMode`, `kerning`, `allowsTightening`, `textCase`, `underline`, `strikethrough`, `multilineTextAlignment`,`textSelection` and `lineSpacing`) ([#40282](https://github.com/expo/expo/pull/40282) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Add Divider component. ([#40283](https://github.com/expo/expo/pull/40283) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Added `header` and `footer` props for sections, support for collapsible sections, and headerProminence modifier ([#40340](https://github.com/expo/expo/pull/40340) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Add new modifiers (`listRowInsets`, `listSectionMargins`, `badgeProminence`, `badge`) ([#40329](https://github.com/expo/expo/pull/40329) by [@doombladeoff](https://github.com/doombladeoff))
- Add Interpolated string support in button ([#40416](https://github.com/expo/expo/pull/40416) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Added Popover component ([#40454](https://github.com/expo/expo/pull/40454) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Add RectangleMark and RuleMark support to Chart component ([#40046](https://github.com/expo/expo/pull/40046) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- Adds selection API in text field, autoFocus, onSubmit event and rounded rectangle (squircle) support in glassEffect. ([#40455](https://github.com/expo/expo/pull/40455) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add `font` modifier ([#40553](https://github.com/expo/expo/pull/40553) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- [iOS] Add `buttonStyle` modifier. ([#40119](https://github.com/expo/expo/pull/40119) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] remove empty section header spacing when no title provided ([#40296](https://github.com/expo/expo/pull/40296) by [@dylancom](https://github.com/dylancom))
- [iOS] Merge edge and axis paddings correctly in PaddingModifier ([#40414](https://github.com/expo/expo/pull/40414) by [@lucabc2000](https://github.com/lucabc2000))

### 💡 Others

- [iOS] Make `ContextMenu` more composable. ([#40254](https://github.com/expo/expo/pull/40254) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [docs] Improve consistency and remove invalid platform checks. ([#40362](https://github.com/expo/expo/pull/40362) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 0.2.0-beta.5 - 2025-10-01

### 🎉 New features

- [iOS] Add `variableValue` prop to Image component for SF Symbols with variable color support ([#39852](https://github.com/expo/expo/pull/39852) by [@morellodev](https://github.com/morellodev))
- [iOS] Adds `Rectangle`, `RoundedRectangle`, `UnevenRoundedRectangle`, `Circle`, `Ellipse`, `Capsule` shape components and `fill` modifier ([#39793](https://github.com/expo/expo/pull/39793) by [@nishan](https://github.com/intergalacticspacehighway)) ([#39793](https://github.com/expo/expo/pull/39793) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add `ignoreSafeArea` modifier ([#39804](https://github.com/expo/expo/pull/39804) by [@nishan](https://github.com/intergalacticspacehighway)) ([#39804](https://github.com/expo/expo/pull/39804) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add `presentationDetents`, `presentationDragIndicator`, `interactiveDismissDisabled` props to `BottomSheet`. ([#39952](https://github.com/expo/expo/pull/39952) by [@nishan](https://github.com/intergalacticspacehighway)) ([#39952](https://github.com/expo/expo/pull/39952) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add `ConcentricRectangle` shape ([#39907](https://github.com/expo/expo/pull/39907) by [@nishan](https://github.com/intergalacticspacehighway)) ([#39907](https://github.com/expo/expo/pull/39907) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add disabled modifier for swiftui. ([#39864](https://github.com/expo/expo/pull/39864) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- Add Interpolated string support in button ([#39932](https://github.com/expo/expo/pull/39932) by [@nishan](https://github.com/intergalacticspacehighway)) ([#39932](https://github.com/expo/expo/pull/39932) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] list section spacing modifier ([#40291](https://github.com/expo/expo/pull/40291) by [@dylancom](https://github.com/dylancom))

### 🐛 Bug fixes

- [Android] Fix DateTimePicker crashes. ([#39718](https://github.com/expo/expo/pull/39718) by [@hryhoriiK97](https://github.com/hryhoriiK97))

### 💡 Others

- [ios] - Set host dimension synchronously on native ([#40017](https://github.com/expo/expo/pull/40017) by [@nishan](https://github.com/intergalacticspacehighway)) ([#40017](https://github.com/expo/expo/pull/40017) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 0.2.0-beta.4 - 2025-09-22

### 🐛 Bug fixes

- [iOS] Add correct color value types. ([#39899](https://github.com/expo/expo/pull/39899) by [@EvanBacon](https://github.com/EvanBacon))
- [iOS] Updated description for glass button styles availability ([#39736](https://github.com/expo/expo/pull/39736) by [@terijaki](https://github.com/terijaki))

## 0.2.0-beta.3 — 2025-09-16

### 🎉 New features

- [iOS] Add `LabeledContent` view ([#39463](https://github.com/expo/expo/pull/39617) by [@betomoedano](https://github.com/betomoedano))
- [iOS] Add `fixedSize` modifier. ([#39734](https://github.com/expo/expo/pull/39734) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- [ios] tvOS 26 compile fix and card button. ([#39639](https://github.com/expo/expo/pull/39639) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- [Android] **Button**: Deprecate `systemImage` prop in favor of `leadingIcon` and `trailingIcon` for more flexible icon placement. The `systemImage` prop will continue to work as `leadingIcon` for backward compatibility. ([#39095](https://github.com/expo/expo/pull/39095) by [@benjaminkomen](https://github.com/benjaminkomen))

## 0.2.0-beta.2 — 2025-09-12

_This version does not introduce any user-facing changes._

## 0.2.0-beta.1 — 2025-09-11

### 🐛 Bug fixes

- [iOS] Fix tvOS compilation. ([#39542](https://github.com/expo/expo/pull/39542) by [@douglowder](https://github.com/douglowder))

## 0.2.0-beta.0 — 2025-09-10

### 🎉 New features

- [iOS] Add `foregroundStyle` modifier, deprecated `foregroundColor` ([#39183](https://github.com/expo/expo/pull/39183) by [@hirbod](https://github.com/hirbod))
- [iOS] Add `matchedGeometryEffect` modifier and `ZStack` ([#39463](https://github.com/expo/expo/pull/39463) by [@nishan](https://github.com/intergalacticspacehighway))

### 💡 Others

- Use typescript files as source and add `packages:exports`. ([#39377](https://github.com/expo/expo/pull/39377) by [@kudo](https://github.com/kudo))

## 0.2.0-alpha.9 — 2025-09-03

_This version does not introduce any user-facing changes._

## 0.2.0-alpha.8 — 2025-09-02

### 💡 Others

- Used convertibles to process modifiers' parameters. ([#39231](https://github.com/expo/expo/pull/39231) by [@kudo](https://github.com/kudo))
- Migrated `AnimationModifier` to convertibles. ([#39326](https://github.com/expo/expo/pull/39326) by [@kudo](https://github.com/kudo))

## 0.2.0-alpha.7 — 2025-08-31

_This version does not introduce any user-facing changes._

## 0.2.0-alpha.6 — 2025-08-27

_This version does not introduce any user-facing changes._

## 0.2.0-alpha.5 — 2025-08-25

### 🎉 New features

- [iOS] Add `animation` modifier. ([#38954](https://github.com/expo/expo/pull/38954) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Add `GlassEffectContainer`, `glassEffectId` and `Namespaces` support. ([#39070](https://github.com/expo/expo/pull/39070) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- [iOS] Apple TV fixes. ([#39060](https://github.com/expo/expo/pull/39060) by [@douglowder](https://github.com/douglowder))

## 0.2.0-alpha.4 — 2025-08-19

_This version does not introduce any user-facing changes._

## 0.2.0-alpha.3 — 2025-08-18

_This version does not introduce any user-facing changes._

## 0.2.0-alpha.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 0.2.0-alpha.1 — 2025-08-15

### 🛠 Breaking changes

- Merged `swift-ui-primitives` to `swift-ui` and now every component should explicitly wrap with a `<Host>`. ([#38866](https://github.com/expo/expo/pull/38866) by [@kudo](https://github.com/kudo))

### 🎉 New features

- [Android] Add compose modifier support. ([#38630](https://github.com/expo/expo/pull/38630) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add `glassEffect` modifier. ([#38876](https://github.com/expo/expo/pull/38876) by [@nishan](https://github.com/intergalacticspacehighway))
- [Android] Add Chip component for Android. ([#39094](https://github.com/expo/expo/pull/39094) by [@hryhoriiK97](https://github.com/hryhoriiK97))

## 0.2.0-alpha.0 — 2025-08-13

### 🎉 New features

- [Android] Add ref functions for setting text in swiftui textinputs. ([#38276](https://github.com/expo/expo/pull/38276) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add ref functions for setting text in swiftui textinputs. ([#38276](https://github.com/expo/expo/pull/38276) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add ContentUnavailableView. ([#38128](https://github.com/expo/expo/pull/38128) by [@Pflaumenbaum](https://github.com/Pflaumenbaum))
- Add ios `glassProminent` button variant. ([#37995](https://github.com/expo/expo/pull/37995) by [@betomoedano](https://github.com/betomoedano))
- Add support for icon only button. ([#37899](https://github.com/expo/expo/pull/37899) by [@betomoedano](https://github.com/betomoedano))
- Add ios `glass` button variant. ([#37373](https://github.com/expo/expo/pull/37373) by [@aleqsio](https://github.com/aleqsio))
- Added `jetpack-compose-primitives`. ([#36257](https://github.com/expo/expo/pull/36257) by [@kudo](https://github.com/kudo))
- Add support for controlling the state of the DisclosureGroup. ([#37704](https://github.com/expo/expo/pull/37704) by [@Pflaumenbaum](https://github.com/Pflaumenbaum))
- [Android] Add `autoCapitalize` property to `TextInput`. ([#37595](https://github.com/expo/expo/pull/37595) by [@mateoguzmana](https://github.com/mateoguzmana))
- [Android] Add `testID` support to compose primitives. ([#38005](https://github.com/expo/expo/pull/38005) by [@mateoguzmana](https://github.com/mateoguzmana))
- [iOS] Add `testID` property to views. ([#37919](https://github.com/expo/expo/pull/37919) by [@mateoguzmana](https://github.com/mateoguzmana))
- Add `SecureField` component. ([#37642](https://github.com/expo/expo/pull/37642) by [@aleqsio](https://github.com/aleqsio))
- [Android] Add `AlertDialog` component. ([#38266](https://github.com/expo/expo/pull/38266) by [@mateoguzmana](https://github.com/mateoguzmana))
- Added SwiftUI view modifiers support. ([#38543](https://github.com/expo/expo/pull/38543) by [@kudo](https://github.com/kudo))
- [iOS] Add SwiftUI Chart component. ([#38128](https://github.com/expo/expo/pull/38517) by [@hryhoriiK97](https://github.com/hryhoriiK97))

### 🐛 Bug fixes

- [iOS] Add `placeholder` TextInput prop. ([#36590](https://github.com/expo/expo/pull/36590) by [@ramonfabrega](https://github.com/ramonfabrega))
- [iOS] Fix tvOS compilation. ([#38388](https://github.com/expo/expo/pull/38388) by [@douglowder](https://github.com/douglowder))

### 💡 Others

- Make `DateTimePicker` label hidden if empty. ([#37665](https://github.com/expo/expo/pull/37665) by [@aleqsio](https://github.com/aleqsio))
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
