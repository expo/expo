# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- Improved Jetpack Compose integration for Expo UI. ([#42450](https://github.com/expo/expo/pull/42450) by [@kudo](https://github.com/kudo))

## 55.0.0-beta.0 — 2026-01-21

- [ios] - Fix modifiers import path in the example ([#41811](https://github.com/expo/expo/pull/41811) by [@pchalupa](https://github.com/pchalupa))

### 🛠 Breaking changes

- [iOS] - Match `DatePicker` API with SwiftUI API. Remove `DateTimePicker` component ([#41546](https://github.com/expo/expo/pull/41546) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Merge Circular/Linear progress components into one ([#41596](https://github.com/expo/expo/pull/41596) by [@jakex7](https://github.com/jakex7))
- [iOS] - Remove `nativeEvent` from `onSelectionChange` and `onDateChange` events in `Picker` and `DatePicker` ([#41611](https://github.com/expo/expo/pull/41611) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Add `label` support in `Slider` and match API with SwiftUI ([#41616](https://github.com/expo/expo/pull/41616) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Match `Button` API with SwiftUI's API ([#41617](https://github.com/expo/expo/pull/41617) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove `Switch` component and add `Toggle` component. ([#41675](https://github.com/expo/expo/pull/41675) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Replace `onStateChange` callback with `onIsPresentedChange` in `Popover` ([#41628](https://github.com/expo/expo/pull/41628) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Replace `onStateChange` event with `onIsExpandedChange` in `DisclosureGroup` ([#41726](https://github.com/expo/expo/pull/41726) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Replace `onValueChange` event with `onSelectionChange` in `ColorPicker`. ([#41725](https://github.com/expo/expo/pull/41725) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Use constructor for `title` prop instead of a custom `Text` in `Section`. Replace `collapsible` prop with `isExpanded` prop ([#41722](https://github.com/expo/expo/pull/41722) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove `scrollEnabled` prop from Form. Use `scrollDisabled` modifier instead. ([#41728](https://github.com/expo/expo/pull/41728) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Replace `Progress` with `ProgressView` ([#42019](https://github.com/expo/expo/pull/42019) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove `Menu` specific APIs from `ContextMenu` ([#42027](https://github.com/expo/expo/pull/42027) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove `color` prop and replace `min`, `max`, `label` prop with `minimumValueLabel`, `maximumValueLabel` and `currentValueLabel` in `Guage` ([#42022](https://github.com/expo/expo/pull/42022) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove `onPress` and `backgroundColor` from `HStack`, `VStack` and `Group`. Use modifiers instead ([#42055](https://github.com/expo/expo/pull/42055) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove `editModeEnabled` prop from `List`. Use `environment` modifier instead. Add `ForEach` component with `onDelete` and `onMove` support. Add `selection` prop to `List`. Add `environment`, `moveDisabled` and `deleteDisabled` modifiers ([#42011](https://github.com/expo/expo/pull/42011) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### 🎉 New features

- [iOS] - Add range and custom label support in `DatePicker` ([#41546](https://github.com/expo/expo/pull/41546) by [@nishan](https://github.com/intergalacticspacehighway))
- [jetpack-compose] Added `matchContents` support to `Host`. ([#41553](https://github.com/expo/expo/pull/41553) by [@kudo](https://github.com/kudo))
- [iOS] Add `timerInterval` to `Progress` component. ([#41598](https://github.com/expo/expo/pull/41598) by [@jakex7](https://github.com/jakex7))
- [iOS] Make some views public.
- [iOS] - Add `Menu` component ([#41664](https://github.com/expo/expo/pull/41664) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove presentation props from `BottomSheet` and add equivalent modifiers ([#42029](https://github.com/expo/expo/pull/42029) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Nested `Text` support ([#41707](https://github.com/expo/expo/pull/41707) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add containerRelativeFrame modifier. ([#42237](https://github.com/expo/expo/pull/42237) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- [jetpack-compose] Fixed `DatePicker` and `Picker` crash when used inside `Host` with `matchContents`. ([#41622](https://github.com/expo/expo/pull/41622) by [@kimchi-developer](https://github.com/kimchi-developer))
- [jetpack-compose] Fixed `Picker` crash when selecting an option. ([#41622](https://github.com/expo/expo/pull/41622) by [@kimchi-developer](https://github.com/kimchi-developer))
- [jetpack-compose] Fixed `Carousel` not displaying items. ([#41622](https://github.com/expo/expo/pull/41622) by [@kimchi-developer](https://github.com/kimchi-developer))
- [jetpack-compose] Fixed modifiers not being applied correctly. ([#41622](https://github.com/expo/expo/pull/41622) by [@kimchi-developer](https://github.com/kimchi-developer))
- [iOS] Skip rendering `label` as `Menu` item.

### 💡 Others

- [jetpack-compose] Replaced `DynamicTheme` as `Host.colorScheme` prop. ([#41413](https://github.com/expo/expo/pull/41413) by [@kudo](https://github.com/kudo))
- [jetpack-compose] Removed coupled `AutoSizingComposable`. ([#41595](https://github.com/expo/expo/pull/41595) by [@kudo](https://github.com/kudo))
- [jetpack-compose] Refactored leaf components to DSL pattern. ([#41622](https://github.com/expo/expo/pull/41622) by [@kimchi-developer](https://github.com/kimchi-developer))

## 0.2.0-beta.10 — 2025-12-09

### 🛠 Breaking changes

- [iOS] - Match `Picker` API with SwiftUI API ([#40982](https://github.com/expo/expo/pull/40982) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Remove `frame`, `fixedSize`, `padding` from common props and remove `color` prop from `Label` ([#41213](https://github.com/expo/expo/pull/41213) by [@nishan](https://github.com/intergalacticspacehighway))

### 🎉 New features

- [iOS] Add numeric x-axis support to Chart component ([#41236](https://github.com/expo/expo/pull/41236) by [@dileepapeiris](https://github.com/dileepapeiris))
- [iOS] Add `listRowSeparator` modifier. ([#41372](https://github.com/expo/expo/pull/41372) by [@kfirfitousi](https://github.com/kfirfitousi))
- [android] Add new modifiers. ([#41234](https://github.com/expo/expo/pull/41234) by [@aleqsio](https://github.com/aleqsio))
- [android] Add IconButton. ([#41232](https://github.com/expo/expo/pull/41232) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add `presentationBackgroundInteraction` support to `BottomSheet`. ([#00000](https://github.com/expo/expo/pull/40932) by [@chollier](https://github.com/chollier))
- [iOS] Add `menuActionDismissBehavior` modifier. ([#41087](https://github.com/expo/expo/pull/41087) by [@starsky-nev](https://github.com/starsky-nev))
- [iOS] Added `submitLabel` modifier to change the label of the keyboard submit button ([#40975](https://github.com/expo/expo/pull/40975) by [@tmallet](https://github.com/tmallet))
- [iOS] Added `textFieldStyle` modifier to set the style for text field ([#41038](https://github.com/expo/expo/pull/41038) by [@isaiah-hamilton](https://github.com/isaiah-hamilton))
- [jetpack-compose] Added `CircularWavyProgress` and `LinearWavyProgress` components. ([#40988](https://github.com/expo/expo/pull/40988) by [@kudo](https://github.com/kudo))
- [iOS] Added `RNHost` to improve RN component layout inside SwiftUI views ([#40938](https://github.com/expo/expo/pull/40938) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Added `ignoreSafeAreaKeyboardInsets` to `Host` component. ([#41302](https://github.com/expo/expo/pull/41302) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- [android] Fix events for functional view definitions. ([#41374](https://github.com/expo/expo/pull/41374) by [@aleqsio](https://github.com/aleqsio))
- [android] Remove style prop from components. ([#41233](https://github.com/expo/expo/pull/41233) by [@aleqsio](https://github.com/aleqsio))
- [android] Add missing scopes to modifiers. ([#41231](https://github.com/expo/expo/pull/41231) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Fix `ContextMenu` item with subtitle buttons ([#40926](https://github.com/expo/expo/pull/40926) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Fix `TextField` causing crash when reload and unmounting. ([#40960](https://github.com/expo/expo/pull/40960) by [@nishan](https://github.com/intergalacticspacehighway))

## 0.2.0-beta.8 — 2025-11-06

### 🛠 Breaking changes

- [Android] Move all `jetpack-compose-primitives` components to `jetpack-compose` namespace. ([#40272](https://github.com/expo/expo/pull/40272) by [@aleqsio](https://github.com/aleqsio))

### 🎉 New features

- [iOS] Add `refreshable` modifier. ([#40201](https://github.com/expo/expo/pull/40201) by [@christianwooldridge](https://github.com/christianwooldridge))
- [iOS] Add RTL support in swiftui. ([#40335](https://github.com/expo/expo/pull/40335) by [@kfirfitousi](https://github.com/kfirfitousi))
- [Android] Add Carousel component. ([#40325](https://github.com/expo/expo/pull/40325) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add `scrollDismissesKeyboard` modifier. ([#40201](https://github.com/expo/expo/pull/40201) by [@christianwooldridge](https://github.com/christianwooldridge))
- [Android] Add Android BottomSheet ([#37553](https://github.com/expo/expo/pull/37553) by [@Jeroen-G](https://github.com/Jeroen-G))
- [Android] Move all components to use Host ([#40244](https://github.com/expo/expo/pull/40244) by [@aleqsio](https://github.com/aleqsio))
- [Android] Add support for modifiers in primitives, add clip modifier. ([#40164](https://github.com/expo/expo/pull/40164) by [@aleqsio](https://github.com/aleqsio))
- Add scoped compose modifiers, move testID to modifiers. ([#39155](https://github.com/expo/expo/pull/39155) by [@aleqsio](https://github.com/aleqsio))
- [Android] Add custom button shapes. ([#40163](https://github.com/expo/expo/pull/40163) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add ref methods and onChangeFocus to TextField and SecureField. ([#39898](https://github.com/expo/expo/pull/39898) by [@aleqsio](https://github.com/aleqsio))
- [iOS] Add SF symbol typings ([#39802](https://github.com/expo/expo/pull/39802) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Add `scrollContentBackground` and `listRowBackground` modifier. ([#40195](https://github.com/expo/expo/pull/40195) by [@doombladeoff](https://github.com/doombladeoff))
- Added `onAppear` and `onDisappear` modifiers to `swift-ui`. ([#40056](https://github.com/expo/expo/pull/40056) by [@kudo](https://github.com/kudo))
- [iOS] Add Stepper component. ([#39813](https://github.com/expo/expo/pull/39813) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- [ios] Add text modifiers (`truncationMode`, `kerning`, `allowsTightening`, `textCase`, `underline`, `strikethrough`, `multilineTextAlignment`,`textSelection` and `lineSpacing`) ([#40282](https://github.com/expo/expo/pull/40282) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Added `header` and `footer` props for sections, support for collapsible sections, and headerProminence modifier ([#40340](https://github.com/expo/expo/pull/40340) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Add new modifiers (`listRowInsets`, `listSectionMargins`, `badgeProminence`, `badge`) ([#40329](https://github.com/expo/expo/pull/40329) by [@doombladeoff](https://github.com/doombladeoff))
- Add Interpolated string support in button ([#40416](https://github.com/expo/expo/pull/40416) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Added Popover component ([#40454](https://github.com/expo/expo/pull/40454) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Add RectangleMark and RuleMark support to Chart component ([#40046](https://github.com/expo/expo/pull/40046) by [@hryhoriiK97](https://github.com/hryhoriiK97))
- Adds selection API in text field, autoFocus, onSubmit event and rounded rectangle (squircle) support in glassEffect. ([#40455](https://github.com/expo/expo/pull/40455) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add `font` modifier ([#40553](https://github.com/expo/expo/pull/40553) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Add `getItemAsync` to `ShareLink` ([#40391](https://github.com/expo/expo/pull/40391) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add Grid component and modifiers `gridCellUnsizedAxes`, `gridCellColumns`, `gridColumnAlignment`, `gridCellAnchor` ([#40485](https://github.com/expo/expo/pull/40485) by [@doombladeoff](https://github.com/doombladeoff))
- [iOS] Add `labelView` to LabeledContent component ([#40798](https://github.com/expo/expo/pull/40798) by [@focux](https://github.com/focux))
- [iOS] - Add shape in `background` modifier and fix `foregroundStyle` modifer in `Label` ([#40748](https://github.com/expo/expo/pull/40748) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Add `systemImage` property to `Switch` component ([#40838](https://github.com/expo/expo/pull/40838) by [@focux](https://github.com/focux))
- [iOS] Add `icon` property to Label component ([#41178](https://github.com/expo/expo/pull/41178) by [@focux](https://github.com/focux))

### 🐛 Bug fixes

- [iOS] remove empty section header spacing when no title provided ([#40296](https://github.com/expo/expo/pull/40296) by [@dylancom](https://github.com/dylancom))
- [iOS] Merge edge and axis paddings correctly in PaddingModifier ([#40414](https://github.com/expo/expo/pull/40414) by [@lucabc2000](https://github.com/lucabc2000))
- [iOS] Enhance PaddingModifier to support default SwiftUI padding when no custom values are provided ([#40715](https://github.com/expo/expo/pull/40715) by [@betomoedano](https://github.com/betomoedano))

### 💡 Others

- [docs] Improve consistency and remove invalid platform checks. ([#40362](https://github.com/expo/expo/pull/40362) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Refactored `CommonViewProps` to `UIBaseViewProps` and reduced duplicated code. ([#40492](https://github.com/expo/expo/pull/40492) by [@kudo](https://github.com/kudo))

## 0.2.0-beta.7 - 2025-10-09

### 🎉 New features

- [iOS] Adds `controlSize` prop to Button([#40030](https://github.com/expo/expo/pull/40030) by [@betomoedano](https://github.com/betomoedano))
- [iOS] Add Divider component. ([#40283](https://github.com/expo/expo/pull/40283) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### 💡 Others

- [iOS] Make `ContextMenu` more composable. ([#40254](https://github.com/expo/expo/pull/40254) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 0.2.0-beta.6 - 2025-10-01

### 🐛 Bug fixes

- [iOS] Add `buttonStyle` modifier. ([#40119](https://github.com/expo/expo/pull/40119) by [@nishan](https://github.com/intergalacticspacehighway)) ([#40119](https://github.com/expo/expo/pull/40119) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

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
