# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Added `@expo/ui/community/slider`, a drop-in replacement for `@react-native-community/slider`. ([#45623](https://github.com/expo/expo/pull/45623) by [@nishan](https://github.com/intergalacticspacehighway))
- Make `ChartView` public. ([#45674](https://github.com/expo/expo/pull/45674) by [@jakex7](https://github.com/jakex7))

### 🐛 Bug fixes

- Fix `useNativeState` recreating the `ObservableState` when initial value changes; the seed is now captured once via `useRef`. ([#45623](https://github.com/expo/expo/pull/45623) by [@nishan](https://github.com/intergalacticspacehighway))

### 💡 Others

## 56.0.5 — 2026-05-11

### 🎉 New features

- [iOS] Added the `scrollIndicators(visibility, axes?)` SwiftUI modifier in `@expo/ui/swift-ui/modifiers`, wrapping SwiftUI's `scrollIndicators(_:axes:)`. ([#45649](https://github.com/expo/expo/pull/45649) by [@vonovak](https://github.com/vonovak))

### 💡 Others

- [iOS] Consolidated the duplicate `AxisOptions` / `AxisSetType` enums into a single `AxisOptions` in `Convertibles/AxisOptions.swift`. ([#45649](https://github.com/expo/expo/pull/45649) by [@vonovak](https://github.com/vonovak))

## 56.0.4 — 2026-05-08

### 💡 Others

- [universal] Refactored web components to use `StyleSheet.create` instead of inline styles, added `react-native-web` type declarations, and tightened prop handling. ([#45485](https://github.com/expo/expo/pull/45485) by [@zoontek](https://github.com/zoontek))

## 56.0.3 — 2026-05-07

_This version does not introduce any user-facing changes._

## 56.0.2 — 2026-05-06

### 🐛 Bug fixes

- Fix Compose `TextField` selection state synchronization. ([#45424](https://github.com/expo/expo/pull/45424) by [@nishan](https://github.com/intergalacticspacehighway))
- Fixed dynamic sizing regression for `@expo/ui/community/bottom-sheet`. ([#45412](https://github.com/expo/expo/pull/45412) by [@kudo](https://github.com/kudo))

## 56.0.1 — 2026-05-05

_This version does not introduce any user-facing changes._

## 56.0.0 — 2026-05-05

### 🛠 Breaking changes

- [SwiftUI] Use `fixedSize` modifier for Host `matchContents` ([#44642](https://github.com/expo/expo/pull/44642) by [@nishan](https://github.com/intergalacticspacehighway))
- [jetpack-compose] Use intrinsic size for Host `matchContents` to match iOS ([#44642](https://github.com/expo/expo/pull/44642) by [@nishan](https://github.com/intergalacticspacehighway))
- [SwiftUI] `TextField`: removed `defaultValue`, added `text` prop backed by an `ObservableState` (from `useNativeState`), added worklet support for `onTextChange`, and renamed `onValueChange` → `onTextChange`. ([#44988](https://github.com/expo/expo/pull/44988) by [@nishan](https://github.com/intergalacticspacehighway))
- Bumped minimum iOS/tvOS version to 16.4, macOS to 13.4. ([#43296](https://github.com/expo/expo/pull/43296) by [@tsapeta](https://github.com/tsapeta))
- [jetpack-compose] Changed `Host` underlying `MaterialTheme` to `MaterialExpressiveTheme`. ([#44896](https://github.com/expo/expo/pull/44896) by [@kudo](https://github.com/kudo))

### 🎉 New features

- [android] Use `LocalContentColor` when `tint` is omitted ([#45329](https://github.com/expo/expo/pull/45329) by [@Ubax](https://github.com/Ubax))
- [universal] Added `TextInput` component that mirrors RN's `TextInput` API but routes to SwiftUI on iOS, Compose on Android, and RN's `TextInput` on web. ([#45205](https://github.com/expo/expo/pull/45205) by [@nishan](https://github.com/intergalacticspacehighway))
- [compose] Exposed extension utilities for third-party modules: `ModifierRegistry.unregister`, and re-exported `createModifier` / `createModifierWithEventListener` / `createViewModifierEventListener` from `@expo/ui/jetpack-compose/modifiers`. Exported `PrimitiveBaseProps` from `@expo/ui/jetpack-compose`. ([#45122](https://github.com/expo/expo/pull/45122) by [@nishan](https://github.com/intergalacticspacehighway))
- [android] Add `colors` prop to `HorizontalFloatingToolbar` to override the variant's default toolbar and FAB container/content colors. ([#45244](https://github.com/expo/expo/pull/45244) by [@Ubax](https://github.com/Ubax))
- [android] Added `HorizontalPager` component wrapping Compose's `HorizontalPager`. ([#45163](https://github.com/expo/expo/pull/45163) by [@vonovak](https://github.com/vonovak))
- [compose] Added worklet and `ObservableState` support to `TextField`. Added `value` prop accepting `ObservableState<string | TextFieldValue>` (create via `useNativeState`). `onValueChange` now supports worklets for synchronous UI-thread updates. Added `TextFieldValue` type with `text` + `selection` for worklet-driven caret control. Replaced `defaultValue`, callers pass state via `useNativeState` or omit for an empty field. ([#45024](https://github.com/expo/expo/pull/45024) by [@nishan](https://github.com/intergalacticspacehighway))
- Added `@expo/ui/community/masked-view` — a drop-in replacement for `@react-native-masked-view/masked-view`. ([#45488](https://github.com/expo/expo/pull/45488) by [@vonovak](https://github.com/vonovak))
- [android] Add `WorkletCallback` shared object for synchronous UI thread callbacks. ([#44681](https://github.com/expo/expo/pull/44681) by [@nishan](https://github.com/intergalacticspacehighway))
- [android] Add `ObservableState` shared object and `useNativeState` hook for controlling native Compose state from JS. ([#44655](https://github.com/expo/expo/pull/44655) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Added `Mask` component wrapping SwiftUI's `.mask(alignment:_:)` modifier, with a `Mask.Content` slot for the mask element. ([#44934](https://github.com/expo/expo/pull/44934) by [@vonovak](https://github.com/vonovak))
- add ExposedDropdownMenuBox ([#44201](https://github.com/expo/expo/pull/44201) by [@vonovak](https://github.com/vonovak))
- Added `@expo/ui/community/picker` — Android, iOS and web `Picker` drop-in replacement for `@react-native-picker/picker`. ([#44058](https://github.com/expo/expo/pull/44058) by [@vonovak](https://github.com/vonovak))
- [iOS] Added `TabView` and `TabView.Tab` components wrapping SwiftUI's `TabView`, with `tabViewStyle` and `indexViewStyle` modifiers for the page (swipeable) and bottom-tab styles. ([#44780](https://github.com/expo/expo/pull/44780) by [@vonovak](https://github.com/vonovak))
- [iOS] Added `containerRelativeShape` to shape types for `clipShape`, `mask`, `background`, `containerShape`, `contentShape`, and `glassEffect` modifiers. Enables proper shape adaptation in widgets and container-relative contexts using SwiftUI's `ContainerRelativeShape`. ([#44704](https://github.com/expo/expo/pull/44704) by [@hypnokermit](https://github.com/hypnokermit))
- [iOS] Add `ObservableState` shared object and `useNativeState` hook for controlling native SwiftUI state from JS. ([#44214](https://github.com/expo/expo/pull/44214) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Add shared object worklet support with `.value` property API for `ObservableState`. ([#44215](https://github.com/expo/expo/pull/44215) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Add `WorkletCallback` shared object for synchronous UI thread callbacks. ([#44216](https://github.com/expo/expo/pull/44216) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Added `scrollPosition` and `id` modifiers for tracking and scrolling to view-aligned targets in `ScrollView` and other scrollable containers (iOS 17+). ([#44652](https://github.com/expo/expo/pull/44652) by [@ramonclaudio](https://github.com/ramonclaudio))
- Added `@expo/ui/datetimepicker` — an Android and iOS `DateTimePicker` drop-in replacement for `@react-native-community/datetimepicker`. ([#44014](https://github.com/expo/expo/pull/44014) by [@vonovak](https://github.com/vonovak))
- [swift-ui] Added `LazyHStack` and `LazyVStack`. ([#44612](https://github.com/expo/expo/pull/44612) by [@kudo](https://github.com/kudo))
- [jetpack-compose] Added `LazyRow` component and `onVisibilityChanged` modifier. ([#44615](https://github.com/expo/expo/pull/44615) by [@kudo](https://github.com/kudo))
- Added universal components. ([#44601](https://github.com/expo/expo/pull/44601) by [@kudo](https://github.com/kudo))
- [iOS] Add `containerBackground` modifier. ([#44192](https://github.com/expo/expo/pull/44192) by [@jakex7](https://github.com/jakex7))
- [jetpack-compose] Added `defaultMinSize` modifier. ([#44813](https://github.com/expo/expo/pull/44813) by [@kudo](https://github.com/kudo))
- [jetpack-compose] Added Material 3 dynamic colors support. ([#44896](https://github.com/expo/expo/pull/44896) by [@kudo](https://github.com/kudo))
- Added universal `FieldGroup` and `Spacer`. ([#44814](https://github.com/expo/expo/pull/44814) by [@kudo](https://github.com/kudo))
- Added `@expo/ui/community/bottom-sheet` as drop-in replacement for `@gorhom/bottom-sheet`. ([#44683](https://github.com/expo/expo/pull/44683) by [@kudo](https://github.com/kudo))
- Added universal `Icon` components for Android and iOS. ([#45217](https://github.com/expo/expo/pull/45217) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fix `installOnUIRuntime` crash by ensuring `react-native-reanimated` initializes before accessing worklet runtime. ([#44582](https://github.com/expo/expo/pull/44582) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Fix initial prop values not being applied since `init` runs before `updateProps`. ([#43954](https://github.com/expo/expo/pull/43954) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Fix prop syncing race condition where stale values override user interactions. Replace `onReceive(Sequence.publisher)` with `onAppear` + `onChange` across all SwiftUI views. ([#43954](https://github.com/expo/expo/pull/43954) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Fix `Slider` thumb snapping back during drag by guarding `.onReceive` with `isEditing` state. ([#43701](https://github.com/expo/expo/issues/43701) by [@fedeciancaglini](https://github.com/fedeciancaglini)) ([#43797](https://github.com/expo/expo/pull/43797) by [@fedeciancaglini](https://github.com/fedeciancaglini))
- [Android] Fix touch events for RN views inside Compose BottomSheet. ([#43716](https://github.com/expo/expo/pull/43716) by [@nishan](https://github.com/intergalacticspacehighway))
- [Android] Fix `RNHostView` child parent related crash. ([#43691](https://github.com/expo/expo/pull/43691) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Fix `foregroundStyle` typings and runtime narrowing so React Native color values like `PlatformColor()` work in color and gradient styles. ([#44349](https://github.com/expo/expo/pull/44349) by [@eliotgevers](https://github.com/eliotgevers))
- [Android] Added `RNHostView` to improve RN component layout inside Compose views. ([#43495](https://github.com/expo/expo/pull/43495) by [@nishan](https://github.com/intergalacticspacehighway))
- [Android] Fix `ContextMenu` not expanding when triggered by `IconButton`. ([#43592](https://github.com/expo/expo/pull/43592) by [@nishan](https://github.com/intergalacticspacehighway))
- [android] fix modifiers export ([#43639](https://github.com/expo/expo/pull/43639) by [@Ubax](https://github.com/Ubax))
- [jetpack-compose] Fixed `RNHostView` re-parenting exception. ([#44522](https://github.com/expo/expo/pull/44522) by [@kudo](https://github.com/kudo))
- Fixed runtime crash when missing `Host` component for SwiftUI or Jetpack Compose components. ([#44118](https://github.com/expo/expo/pull/44118) by [@kudo](https://github.com/kudo))

### 💡 Others

- Moved `DateTimePicker` to `@expo/ui/community/datetime-picker`. The old `@expo/ui/datetimepicker` export still works but logs a deprecation warning in development. ([@vonovak](https://github.com/vonovak)) ([#45211](https://github.com/expo/expo/pull/45211) by [@vonovak](https://github.com/vonovak))
- [jetpack-compose] Use view hash code as key for `Children`. ([#44521](https://github.com/expo/expo/pull/44521) by [@kudo](https://github.com/kudo))
- Refactored `ComposableScope` and allow extensibility. ([#44698](https://github.com/expo/expo/pull/44698) by [@kudo](https://github.com/kudo))
- [jetpack-compose] Reuse `HorizontalAlignment` converter in `LazyColumn`. ([#44755](https://github.com/expo/expo/pull/44755) by [@kudo](https://github.com/kudo))
- [jetpack-compose] Added `horizontalScroll` and `verticalScroll` modifiers. ([#44464](https://github.com/expo/expo/pull/44464) by [@kudo](https://github.com/kudo))
- [Android] Added AsyncFunction support to the functional `ExpoUIView` DSL. ([#44081](https://github.com/expo/expo/pull/44081) by [@kudo](https://github.com/kudo))
- [iOS] Fixed build error when using precompiled `ExpoModulesCore.xcframework`. ([#45016](https://github.com/expo/expo/pull/45016) by [@kudo](https://github.com/kudo))
- [Android] Improved application startup performance by reducing reflection. ([#45021](https://github.com/expo/expo/pull/45021) by [@lukmccall](https://github.com/lukmccall))
- [jetpack-compose] Added `expand` and `partialExpand` to `ModalBottomSheet`. ([#44682](https://github.com/expo/expo/pull/44682) by [@kudo](https://github.com/kudo))
- Removed iOS universal `Host` workaround. ([#45173](https://github.com/expo/expo/pull/45173) by [@kudo](https://github.com/kudo))
- [iOS] Unblocked precompiled-xcframework distribution via the runtime worklets provider. ([#45026](https://github.com/expo/expo/pull/45026) by [@chrfalch](https://github.com/chrfalch))
- Fine tine docs for universal components. ([#45406](https://github.com/expo/expo/pull/45406) by [@kudo](https://github.com/kudo))

## 55.0.15 - 2026-05-05

_This version does not introduce any user-facing changes._

## 55.0.14 - 2026-05-04

### 🎉 New features

- Added `@expo/ui/community/segmented-control` — a drop-in replacement for `@react-native-segmented-control/segmented-control`. ([#44611](https://github.com/expo/expo/pull/44611) by [@vonovak](https://github.com/vonovak))

## 55.0.13 - 2026-05-01

_This version does not introduce any user-facing changes._

## 55.0.12 - 2026-04-21

### 🎉 New features

- [iOS] Added `Overlay` component. ([#44610](https://github.com/expo/expo/pull/44610) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44610](https://github.com/expo/expo/pull/44610) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 55.0.11 - 2026-04-09

### 🛠 Breaking changes

- [iOS] Match `TextField` and `SecureField` API with SwiftUI: replaced `multiline`, `numberOfLines`, `allowNewlines` with `axis` prop. Moved `keyboardType`, `autocorrectionDisabled`, `onSubmit` from props to modifier registry. Renamed events `onValueChanged` → `onValueChange`, `onFocusChanged` → `onFocusChange`, `onSelectionChanged` → `onSelectionChange`. Removed hardcoded `fixedSize`. Added `LineLimitModifier` with `reservesSpace` and range support. Added `OnSubmitModifier` and `KeyboardTypeModifier`. ([#44549](https://github.com/expo/expo/pull/44549) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44549](https://github.com/expo/expo/pull/44549) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Match `TextField` API to native Compose: renamed `TextInput` to `TextField`/`OutlinedTextField`, replaced individual keyboard props with `keyboardOptions`/`keyboardActions` matching `KeyboardOptions`/`KeyboardActions`, added `enabled`, `readOnly`, `isError`, `singleLine`, `maxLines`, `minLines`, `shape`, `colors`. Added composable slots: `placeholder`, `leadingIcon`, `trailingIcon`, `prefix`, `suffix`, `supportingText`. Added imperative `focus()`/`blur()` and `onFocusChanged` event. ([#44545](https://github.com/expo/expo/pull/44545) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44545](https://github.com/expo/expo/pull/44545) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 55.0.10 - 2026-04-07

_This version does not introduce any user-facing changes._

## 55.0.9 - 2026-04-06

_This version does not introduce any user-facing changes._

## 55.0.8 - 2026-04-02

_This version does not introduce any user-facing changes._

## 55.0.7 - 2026-04-02

### 🛠 Breaking changes

- [android] Match `Icon` API to native: renamed `tintColor` to `tint`. Match `ListItem` API to native: replaced string props with slot sub-components (`HeadlineContent`, `SupportingContent`, `OverlineContent`, `LeadingContent`, `TrailingContent`). Renamed color props to match `ListItemDefaults.colors()`. Added `tonalElevation`, `shadowElevation`. Removed `color`, `onPress`. ([#44054](https://github.com/expo/expo/pull/44054) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44054](https://github.com/expo/expo/pull/44054) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 55.0.6 - 2026-03-27

### 🛠 Breaking changes

- [android] Refactored `PullToRefreshBox` indicator props: replaced `loadingIndicatorModifiers` with nested `indicator` prop containing `color`, `containerColor`, and `modifiers`. Added `contentAlignment` prop. ([#44079](https://github.com/expo/expo/pull/44079) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44079](https://github.com/expo/expo/pull/44079) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Split `Divider` into `HorizontalDivider` and `VerticalDivider` matching native Compose components. Added `thickness` and `color` props. ([#44035](https://github.com/expo/expo/pull/44035) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44035](https://github.com/expo/expo/pull/44035) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Match `AlertDialog` API to native Compose: replaced string props (`title`, `text`, `confirmButtonText`, `dismissButtonText`) with slot sub-components (`AlertDialog.Title`, `AlertDialog.Text`, `AlertDialog.ConfirmButton`, `AlertDialog.DismissButton`, `AlertDialog.Icon`). Removed `visible` prop (use conditional rendering), `onConfirmPressed`/`onDismissPressed` (renamed to `onDismissRequest`), and `confirmButtonColors`/`dismissButtonColors` (replaced with dialog-level `colors`). ([#43997](https://github.com/expo/expo/pull/43997) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43997](https://github.com/expo/expo/pull/43997) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### 🎉 New features

- [android] add `imePadding` modifier ([#43652](https://github.com/expo/expo/pull/43652) by [@Ubax](https://github.com/Ubax))

## 55.0.5 - 2026-03-19

### 🛠 Breaking changes

- [android] Split `Carousel` into `HorizontalCenteredHeroCarousel`, `HorizontalMultiBrowseCarousel`, and `HorizontalUncontainedCarousel` matching native Compose components. Added `HorizontalCenteredHeroCarousel`. ([#44034](https://github.com/expo/expo/pull/44034) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44034](https://github.com/expo/expo/pull/44034) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 55.0.4 - 2026-03-18

### 🎉 New features

- [iOS] Add `Link` view. ([#43983](https://github.com/expo/expo/pull/43983) by [@jakex7](https://github.com/jakex7))
- [iOS] Add `widgetURL` modifier. ([#43984](https://github.com/expo/expo/pull/43984) by [@jakex7](https://github.com/jakex7))

## 55.0.3 - 2026-03-17

### 🛠 Breaking changes

- [iOS] Renamed Stepper `defaultValue` to `value` and `onValueChanged` to `onValueChange`. ([#43954](https://github.com/expo/expo/pull/43954) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43954](https://github.com/expo/expo/pull/43954) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Replace `Picker` with `SingleChoiceSegmentedButtonRow`, `MultiChoiceSegmentedButtonRow`, and `SegmentedButton` components. Replace `RadioButton` `nativeClickable` prop with `onClick` event. ([#43809](https://github.com/expo/expo/pull/43809) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43809](https://github.com/expo/expo/pull/43809) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Split `ToggleButton` into separate M3 components: `ToggleButton`, `IconToggleButton`, `FilledIconToggleButton`, `OutlinedIconToggleButton`. Removed `variant`, `text`, `color`, `disabled` props. Added `colors` with checked/unchecked variants. ([#43974](https://github.com/expo/expo/pull/43974) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43974](https://github.com/expo/expo/pull/43974) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Match `Switch` API to native: removed `variant` prop and split into separate `Switch` and `Checkbox` components matching native M3 APIs. Renamed `elementColors` to `colors`, `onValueChange` to `onCheckedChange`, removed `color` convenience prop. ([#43887](https://github.com/expo/expo/pull/43887) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43887](https://github.com/expo/expo/pull/43887) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Refactored Progress Indicators to match native Compose API: split into `LinearProgressIndicator`, `CircularProgressIndicator`, `LinearWavyProgressIndicator`, `CircularWavyProgressIndicator`. Flattened `elementColors.trackColor` to `trackColor`. Added `strokeCap`, `gapSize`, `strokeWidth` props. ([#43907](https://github.com/expo/expo/pull/43907) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43907](https://github.com/expo/expo/pull/43907) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Refactored `Card` to match native Material3 API: split into `Card`/`ElevatedCard`/`OutlinedCard` with type-specific props (`elevation`, `border`). ([#43896](https://github.com/expo/expo/pull/43896) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43896](https://github.com/expo/expo/pull/43896) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Split `Button` into separate M3 components: `Button`, `FilledTonalButton`, `OutlinedButton`, `ElevatedButton`, `TextButton`. Removed `variant`, `text`, `leadingIcon`, `trailingIcon`, `color`, `elementColors`, `disabled` props. ([#43859](https://github.com/expo/expo/pull/43859) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43859](https://github.com/expo/expo/pull/43859) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Split `IconButton` into separate M3 components: `IconButton`, `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton`. Removed `variant`, `color`, `elementColors`, `disabled`, `onPress` props. ([#43859](https://github.com/expo/expo/pull/43859) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43859](https://github.com/expo/expo/pull/43859) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Refactored `Chip` to match native Material3 API: split into `AssistChip`/`FilterChip`/`InputChip`/`SuggestionChip` with slot-based content, added `colors`/`elevation`/`border` props. Merged `FilterChip` into `Chip` module. ([#43900](https://github.com/expo/expo/pull/43900) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43900](https://github.com/expo/expo/pull/43900) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Refactored `Slider` to match native Material3 API: renamed `elementColors` to `colors`, removed `color` convenience prop. ([#43840](https://github.com/expo/expo/pull/43840) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43840](https://github.com/expo/expo/pull/43840) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] rename ContextMenu to DropdownMenu ([#43794](https://github.com/expo/expo/pull/43794) by [@Ubax](https://github.com/Ubax))
- [android] configure ContextMenu by using native children ([#43792](https://github.com/expo/expo/pull/43792) by [@Ubax](https://github.com/Ubax))
- [android] control ContextMenu expanded state from JS ([#43793](https://github.com/expo/expo/pull/43793) by [@Ubax](https://github.com/Ubax))

### 🐛 Bug fixes

- [iOS] Fix SwiftUI `aspectRatio` modifier to allow omitting `ratio` and use the content's intrinsic aspect ratio. ([#45232](https://github.com/expo/expo/pull/45232) by [@2hwayoung](https://github.com/2hwayoung))

### 🎉 New features

- [android] Added `TooltipBox`, `PlainTooltip`, and `RichTooltip` components matching native Compose Tooltip API. Supports plain and rich tooltips with slot-based content, programmatic show/dismiss via ref, and `isPersistent`, `hasAction`, `enableUserInput`, `focusable` props. ([#44373](https://github.com/expo/expo/pull/44373) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44373](https://github.com/expo/expo/pull/44373) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Added `Badge` and `BadgedBox` components wrapping Jetpack Compose's Badge API for status indicators and count overlays. ([#44139](https://github.com/expo/expo/pull/44139) by [@benjaminkomen](https://github.com/benjaminkomen))
- [android] Added `shape`, `border`, `selected`, `checked`, `onClick`, and `onCheckedChange` props to `Surface`, supporting clickable, selectable, and toggleable variants. ([#44079](https://github.com/expo/expo/pull/44079) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44079](https://github.com/expo/expo/pull/44079) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Added nested text support for Compose `Text` with style inheritance, custom fonts via `expo-font`, `background`, `shadow`, and `lineBreak` properties. ([#44094](https://github.com/expo/expo/pull/44094) by [@nishan](https://github.com/intergalacticspacehighway)) ([#44094](https://github.com/expo/expo/pull/44094) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] Added `outlined` variant to `TextInput` component. ([#43719](https://github.com/expo/expo/pull/43719) by [@benjaminkomen](https://github.com/benjaminkomen))
- [iOS] Added `locale` and `timeZone` support to `modifiers`. ([#44013](https://github.com/expo/expo/pull/44013) by [@vonovak](https://github.com/vonovak))
- [android] Added `ref.hide()` for animated dismiss and more configurable props (`containerColor`, `contentColor`, `scrimColor`, `showDragHandle`, `sheetGesturesEnabled`, `properties`, `DragHandle` slot) to `BottomSheet`. ([#43972](https://github.com/expo/expo/pull/43972) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43972](https://github.com/expo/expo/pull/43972) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Added `date`, `dateStyle`, `timerInterval`, `countsDown`, and `pauseTime` props to `Text` component for displaying auto-updating dates, timers, and countdowns using SwiftUI's `Text.DateStyle`. ([#43552](https://github.com/expo/expo/pull/43552) by [@LouisRaverdy](https://github.com/LouisRaverdy))
- [android] Added `Checkbox` and `TriStateCheckbox` components. ([#43887](https://github.com/expo/expo/pull/43887) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43887](https://github.com/expo/expo/pull/43887) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [Android] Added `DatePickerDialog` and `TimePickerDialog` components, and `selectableDates` prop to `DateTimePicker`. ([#43895](https://github.com/expo/expo/pull/43895) by [@vonovak](https://github.com/vonovak))
- [android] Added `FloatingActionButton` component. ([#43738](https://github.com/expo/expo/pull/43738) by [@benjaminkomen](https://github.com/benjaminkomen))
- [android] Added `enabled`, `onValueChangeFinished`, and `Slider.Thumb`/`Slider.Track` slot support to `Slider` component. ([#43840](https://github.com/expo/expo/pull/43840) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43840](https://github.com/expo/expo/pull/43840) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] add AnimatedVisibility transition API ([#43632](https://github.com/expo/expo/pull/43632) by [@Ubax](https://github.com/Ubax))

## 55.0.2 - 2026-03-11

### 🎉 New features

- [Android] Added `graphicsLayer` modifier and animation helpers for per-value animation in it. Added `indication` option to `clickable` modifier to control ripple effects. ([#43655](https://github.com/expo/expo/pull/43655) by [@vonovak](https://github.com/vonovak))
- [Android] Added border color customization for `Switch` and `Checkbox` components. ([#43770](https://github.com/expo/expo/pull/43770) by [@liestig](https://github.com/liestig))
- [iOS] Added `defaultScrollAnchor` modifier for controlling initial scroll position (iOS 17+). ([#43914](https://github.com/expo/expo/pull/43914) by [@ramonclaudio](https://github.com/ramonclaudio))
- [iOS] Added `defaultScrollAnchorForRole` modifier for per-role scroll anchor control (iOS 18+). ([#43923](https://github.com/expo/expo/pull/43923) by [@ramonclaudio](https://github.com/ramonclaudio))
- [iOS] Added `scrollTargetBehavior` and `scrollTargetLayout` modifiers for scroll target configuration (iOS 17+). ([#43955](https://github.com/expo/expo/pull/43955) by [@ramonclaudio](https://github.com/ramonclaudio))
- [iOS] Added `textInputAutocapitalization` modifier for controlling keyboard autocapitalization behavior (iOS 15+). ([#44547](https://github.com/expo/expo/pull/44547) by [@ramonclaudio](https://github.com/ramonclaudio))
- [iOS] Added `textContentType` modifier for enabling autofill and semantic text input hints (iOS 13+). ([#44548](https://github.com/expo/expo/pull/44548) by [@ramonclaudio](https://github.com/ramonclaudio))
- [iOS] Added `rotation3DEffect` modifier for 3D rotation transforms ([#43640](https://github.com/expo/expo/pull/43640) by [@vonovak](https://github.com/vonovak))
- [iOS] Added `ControlGroup` component. ([#43581](https://github.com/expo/expo/pull/43581) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43581](https://github.com/expo/expo/pull/43581) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [android] detect FAB in HorizontalFloatingToolbar ([#43601](https://github.com/expo/expo/pull/43601) by [@Ubax](https://github.com/Ubax))
- [android] Add `elementColors` prop to the `DateTimePicker` component ([#43787](https://github.com/expo/expo/pull/43787) by [@iankberry](https://github.com/iankberry))
- [iOS] Added `AccessoryWidgetBackground` component ([#43729](https://github.com/expo/expo/pull/43729) by [@huextrat](https://github.com/huextrat))
- [iOS] Add support for local image uri ([#43707](https://github.com/expo/expo/pull/43707) by [@jakex7](https://github.com/jakex7))

### 💡 Others

- [iOS] Add `AsyncFunction` support in `ExpoUIView` definition function. ([#43669](https://github.com/expo/expo/pull/43669) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43669](https://github.com/expo/expo/pull/43669) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Introduce `SlotView` to replace structural child view types with a single generic slot. ([#43607](https://github.com/expo/expo/pull/43607) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43607](https://github.com/expo/expo/pull/43607) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Make RNHostView SwiftUI view ([#43570](https://github.com/expo/expo/pull/43570) by [@nishan](https://github.com/intergalacticspacehighway)) ([#43570](https://github.com/expo/expo/pull/43570) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 55.0.1 — 2026-02-25

### 🎉 New features

- [iOS] Added `luminanceToAlpha` modifier. ([#43417](https://github.com/expo/expo/pull/43417) by [@jakex7](https://github.com/jakex7))

## 55.0.0 — 2026-02-25

### 🎉 New features

- [iOS] Added `ConfirmationDialog` component. ([#43366](https://github.com/expo/expo/pull/43366) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Added `monospacedDigit` modifier. ([#43328](https://github.com/expo/expo/pull/43328) by [@axeelz](https://github.com/axeelz))

## 55.0.0-preview.7 — 2026-02-20

### 🎉 New features

- [iOS] Added per-axis `scaleEffect` support (`{ x, y }`) to view modifiers. ([#43228](https://github.com/expo/expo/pull/43228) by [@ramonclaudio](https://github.com/ramonclaudio))

### 💡 Others

- [jetpack-compose] Added more views and modifiers. ([#42734](https://github.com/expo/expo/pull/42734) by [@kudo](https://github.com/kudo))

## 55.0.0-preview.6 — 2026-02-16

### 🎉 New features

- [iOS] - Support `Section` `footer` prop with `title` prop. ([#42966](https://github.com/expo/expo/pull/42966) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Added `contentTransition` modifier. ([#42980](https://github.com/expo/expo/pull/42980) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Added `ScrollView` component. ([#43162](https://github.com/expo/expo/pull/43162) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Added `selection` and `onSelectionChange` to `presentationDetents` modifier for programmatic control of bottom sheet detents. ([#42910](https://github.com/expo/expo/pull/42910) by [@nishan](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- [iOS] Fix `ColorPicker` `onSelectionChange` callback never firing due to native event name mismatch. ([#43180](https://github.com/expo/expo/pull/43180) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Fix `clipShape` and `mask` modifiers silently falling through to `Rectangle()` for `capsule` and `ellipse` shapes. ([#43158](https://github.com/expo/expo/pull/43158) by [@ramonclaudio](https://github.com/ramonclaudio))
- [iOS] Fix rendering `0` in SwiftUI Text. ([#43036](https://github.com/expo/expo/pull/43036) by [@jakex7](https://github.com/jakex7))
- [iOS] Set initial state in `init` instead of `onAppear` in `DatePicker`, `Section`, `DisclosureGroup`, `Popover`, and `ColorPicker` components. ([#42933](https://github.com/expo/expo/pull/42933) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Fix `foregroundStyle` hierarchical style not being applied correctly. ([#43233](https://github.com/expo/expo/pull/43233) by [@nishan](https://github.com/intergalacticspacehighway))

## 55.0.0-preview.5 — 2026-02-08

### 🐛 Bug fixes

- [iOS] Fixed missing dependency on RCTFabric in ExpoUI podspec. ([#42901](https://github.com/expo/expo/pull/42901) by [@chrfalch](https://github.com/chrfalch))
- [iOS] Fix initial state not being set in `Picker`, `Slider`, `Toggle`, and `List` components. ([#42933](https://github.com/expo/expo/pull/42933) by [@nishan](https://github.com/intergalacticspacehighway))

## 55.0.0-preview.4 — 2026-02-03

### 🛠 Breaking changes

- [iOS] Renamed `ignoreSafeAreaKeyboardInsets` to `ignoreSafeArea` on `Host` component. It now accepts `'all'` or `'keyboard'` instead of a boolean. ([#42598](https://github.com/expo/expo/pull/42598) by [@nishan](https://github.com/intergalacticspacehighway))

### 💡 Others

- [iOS] Remove leftover `Switch` TypeScript exports from swift-ui package. Use `Toggle` instead. ([#42571](https://github.com/expo/expo/pull/42571) by [@shubh73](https://github.com/shubh73))
- Improved Jetpack Compose integration for Expo UI. ([#42450](https://github.com/expo/expo/pull/42450) by [@kudo](https://github.com/kudo))
- [iOS] Added `contentShape` modifier for SwiftUI ([#42813](https://github.com/expo/expo pull/42813) by [@sam-shubham](https://github.com/sam-shubham))

## 55.0.0-beta.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.0-beta.2 — 2026-01-26

### 🎉 New features

- [iOS] Add Markdown support to the Text component. ([#42448](https://github.com/expo/expo/pull/42448) by [@Pflaumenbaum](https://github.com/Pflaumenbaum))

## 55.0.0-beta.1 — 2026-01-22

_This version does not introduce any user-facing changes._

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
- [iOS] Make some views public. ([#41641](https://github.com/expo/expo/pull/41641) by [@jakex7](https://github.com/jakex7))
- [iOS] - Add `Menu` component ([#41664](https://github.com/expo/expo/pull/41664) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] Remove presentation props from `BottomSheet` and add equivalent modifiers ([#42029](https://github.com/expo/expo/pull/42029) by [@nishan](https://github.com/intergalacticspacehighway))
- [iOS] - Nested `Text` support ([#41707](https://github.com/expo/expo/pull/41707) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- [iOS] Add containerRelativeFrame modifier. ([#42237](https://github.com/expo/expo/pull/42237) by [@jakex7](https://github.com/jakex7))
- [iOS] Expose `ViewModifierRegistry.register` and `ViewModifierRegistry.unregister` for custom modifiers. ([#42350](https://github.com/expo/expo/pull/42350) by [@nishan](https://github.com/intergalacticspacehighway))

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

- [Android] Add `label`, and `placeholder` props to TextField component. ([#40452](https://github.com/expo/expo/pull/40452) by [@akshayjadhav4](https://github.com/akshayjadhav4))
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
