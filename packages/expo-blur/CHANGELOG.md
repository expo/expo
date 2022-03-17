# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Fixed the component not rendering correctly when the border radius style is set.

### 💡 Others

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
