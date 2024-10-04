# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 12.4.1 — 2023-06-23

_This version does not introduce any user-facing changes._

## 12.4.0 — 2023-06-21

### 🛠 Breaking changes

- Enable blurring by default when static rendering. ([#23000](https://github.com/expo/expo/pull/23000) by [@EvanBacon](https://github.com/EvanBacon))

## 12.3.2 — 2023-06-13

### 🐛 Bug fixes

- [iOS] Fixed Detox tests hanging when `BlurView` is present ([#22439](https://github.com/expo/expo/pull/22439) by [@behenate](https://github.com/behenate))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

## 12.3.1 — 2023-05-08

_This version does not introduce any user-facing changes._

## 12.3.0 — 2023-04-17

### 🎉 New features

- Add Android support for `BlurView`. ([#21744](https://github.com/expo/expo/pull/21744) by [@behenate](https://github.com/behenate))

## 12.2.2 — 2023-02-14

### 🐛 Bug fixes

- Add `WebkitBackdropFilter` to support `react-native-web` styling. ([#21146](https://github.com/expo/expo/pull/21146) by [@EvanBacon](https://github.com/EvanBacon))

## 12.2.1 — 2023-02-09

_This version does not introduce any user-facing changes._

## 12.2.0 — 2023-02-03

### 🐛 Bug fixes

- Add `-webkit-backdrop-filter` to support blurring on Safari. ([#21003](https://github.com/expo/expo/pull/21003) by [@EvanBacon](https://github.com/EvanBacon))

## 12.1.0 — 2022-12-30

### 🎉 New features

- Migrated iOS codebase to Swift and the new Expo modules API. ([#19786](https://github.com/expo/expo/pull/19786) by [@tsapeta](https://github.com/tsapeta))

## 12.0.1 — 2022-11-02

_This version does not introduce any user-facing changes._

## 12.0.0 — 2022-10-25

### 🛠 Breaking changes

- Bumped iOS deployment target to 13.0 and deprecated support for iOS 12. ([#18873](https://github.com/expo/expo/pull/18873) by [@tsapeta](https://github.com/tsapeta))

## 11.2.0 — 2022-07-07

_This version does not introduce any user-facing changes._

## 11.1.0 — 2022-04-18

### 🐛 Bug fixes

- Fixed the component not rendering correctly when the border radius style is set. ([#16671](https://github.com/expo/expo/pull/16671) by [@tsapeta](https://github.com/tsapeta))

## 11.0.0 — 2021-12-03

### 🛠 Breaking changes

- On iOS replaced non-working `alpha`-based blur mechanism with a new one basing on `UIViewPropertyAnimator`. ([#14946](https://github.com/expo/expo/pull/14946) by [@bbarthec](https://github.com/bbarthec))
- Renamed `BlurProps` to `BlurViewProps` to align with React Native's types naming convention. ([#14946](https://github.com/expo/expo/pull/14946) by [@bbarthec](https://github.com/bbarthec))

### 🐛 Bug fixes

- On iOS fixed `intensity` property not blurring text content properly. ([#14946](https://github.com/expo/expo/pull/14946) by [@bbarthec](https://github.com/bbarthec))

## 10.0.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 10.0.0 — 2021-09-28

### 🛠 Breaking changes

- Dropped support for iOS 11.0 ([#14383](https://github.com/expo/expo/pull/14383) by [@cruzach](https://github.com/cruzach))

### 🐛 Bug fixes

- Web: Cap `intensity` value at `100`, update the tint color values. ([#14112](https://github.com/expo/expo/pull/14112) by [@Simek](https://github.com/Simek))
- Fix building errors from use_frameworks! in Podfile. ([#14523](https://github.com/expo/expo/pull/14523) by [@kudo](https://github.com/kudo))

### 💡 Others

- Migrated from `@unimodules/core` to `expo-modules-core`. ([#13757](https://github.com/expo/expo/pull/13757) by [@tsapeta](https://github.com/tsapeta))

## 9.0.3 — 2021-03-30

_This version does not introduce any user-facing changes._

## 9.0.2 — 2021-03-23

### 🐛 Bug fixes

- Fix types - tint now a string union `'dark' | 'light' | 'default'` rather than any string. ([#12264](https://github.com/expo/expo/pull/12264) by [@brentvatne](https://github.com/brentvatne))

## 9.0.1 — 2021-03-10

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 9.0.0 — 2021-01-15

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 8.2.2 — 2020-12-04

### 🐛 Bug fixes

- Explicitly pass down only the expected props on iOS. ([#10648](https://github.com/expo/expo/pull/10648) by [@cruzach](https://github.com/cruzach))

## 8.2.1 — 2020-11-17

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-08-18

### 🎉 New features

- Delete `prop-types` in favor of TypeScript. ([#8676](https://github.com/expo/expo/pull/8676) by [@EvanBacon](https://github.com/EvanBacon))
- Convert Android and web to class components. ([#8856](https://github.com/expo/expo/pull/8856) by [@EvanBacon](https://github.com/EvanBacon))

## 8.1.2 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.1.1 — 2020-05-27

_This version does not introduce any user-facing changes._
