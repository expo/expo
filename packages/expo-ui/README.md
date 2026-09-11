# @expo/ui

A set of native input components that let you build interfaces with Jetpack Compose on Android and SwiftUI on iOS, from React.

## Main features

- Native Android components built with Jetpack Compose, exported from `@expo/ui/jetpack-compose`
- Native iOS components built with SwiftUI, exported from `@expo/ui/swift-ui`
- Universal components that render on Android, iOS, and web from one source, exported from `@expo/ui`
- Modifiers that mirror the native ones, from `@expo/ui/swift-ui/modifiers` and `@expo/ui/jetpack-compose/modifiers`
- Drop-in replacements for several React Native community libraries, from `@expo/ui/community/*`
- The JavaScript API mirrors the native API. Component, prop, and event names match SwiftUI and Jetpack Compose.

## Drop-in replacements

Each of these has an API compatible with the listed library and is backed by `@expo/ui` native components.

|                      Replaces                       |              Import from               |
| :-------------------------------------------------: | :------------------------------------: |
|               `@gorhom/bottom-sheet`                |   `@expo/ui/community/bottom-sheet`    |
|      `@react-native-community/datetimepicker`       |  `@expo/ui/community/datetime-picker`  |
|          `@react-native-community/slider`           |      `@expo/ui/community/slider`       |
|       `@react-native-masked-view/masked-view`       |    `@expo/ui/community/masked-view`    |
|              `@react-native-menu/menu`              |       `@expo/ui/community/menu`        |
|            `@react-native-picker/picker`            |      `@expo/ui/community/picker`       |
| `@react-native-segmented-control/segmented-control` | `@expo/ui/community/segmented-control` |
|              `react-native-pager-view`              |    `@expo/ui/community/pager-view`     |

## Available components

The lists below are not exhaustive. See the [API documentation](https://docs.expo.dev/versions/latest/sdk/ui/) for the full set and for per-component props.

### Universal

Import from `@expo/ui`. These run on Android, iOS, and web.

`Host`, `Column`, `Row`, `Spacer`, `ScrollView`, `Text`, `TextInput`, `Button`, `Switch`, `Slider`, `Checkbox`, `Picker`, `List`, `ListItem`, `BottomSheet`, `Collapsible`, `FieldGroup`, `Icon`

### SwiftUI (iOS)

Import from `@expo/ui/swift-ui`.

- Layout: `HStack`, `VStack`, `ZStack`, `LazyHStack`, `LazyVStack`, `Grid`, `Group`, `Spacer`, `Divider`, `ScrollView`
- Input: `TextField`, `SecureField`, `Toggle`, `Stepper`, `Slider`, `Picker`, `DatePicker`, `ColorPicker`, `Button`
- Navigation: `NavigationStack`, `NavigationLink`, `NavigationDestination`, `TabView`, `Link`, `Toolbar`
- Collections: `List`, `Section`, `Form`, `DisclosureGroup`, `SwipeActions`
- Menus and modals: `Menu`, `ContextMenu`, `ShareLink`, `Popover`, `Alert`, `ConfirmationDialog`, `BottomSheet`
- Feedback: `ProgressView`, `Gauge`, `Chart`, `ContentUnavailableView`
- Content and effects: `Text`, `Image`, `Label`, `LabeledContent`, `Shapes`, `Mask`, `Overlay`, `Background`, `GlassEffectContainer`

### Jetpack Compose (Android)

Import from `@expo/ui/jetpack-compose`.

- Layout: `Column`, `Row`, `Box`, `FlowRow`, `LazyColumn`, `LazyRow`, `Spacer`, `Divider`, `Surface`, `Shape`
- Input: `TextField`, `OutlinedTextField`, `BasicTextField`, `Checkbox`, `Switch`, `Slider`, `RadioButton`, `DatePicker`
- Buttons: `Button`, `IconButton`, `FloatingActionButton`, `SegmentedButton`, `ToggleButton`
- Navigation: `NavigationBar`, `HorizontalPager`, `Carousel`, `HorizontalFloatingToolbar`
- Menus and modals: `DropdownMenu`, `ExposedDropdownMenuBox`, `AlertDialog`, `BasicAlertDialog`, `ModalBottomSheet`, `Tooltip`
- Feedback: `Progress`, `LoadingIndicator`, `Snackbar`, `Badge`, `BadgedBox`, `PullToRefreshBox`
- Content: `Text`, `Icon`, `Image`, `Card`, `Chip`, `ListItem`, `SearchBar`, `DockedSearchBar`, `AnimatedVisibility`

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/ui/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/ui/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install @expo/ui
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional setup necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for notes specific to this package.
