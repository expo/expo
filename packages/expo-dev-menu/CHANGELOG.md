# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

- Build Android code using Java 8 to fix Android instrumented test build error. ([#12939](https://github.com/expo/expo/pull/12939) by [@kudo](https://github.com/kudo))

## 0.5.1 — 2021-05-12

### 🐛 Bug fixes

- Fixed compatibility with React Native 0.64.X. ([#12909](https://github.com/expo/expo/pull/12909) by [@lukmccall](https://github.com/lukmccall))

## 0.5.0 — 2021-05-11

### 🎉 New features

- [plugin] Prevent plugin from running multiple times in a single process. ([#12715](https://github.com/expo/expo/pull/12715) by [@EvanBacon](https://github.com/EvanBacon))
- [plugin] Added AppDelegate tests. ([#12651](https://github.com/expo/expo/pull/12651) by [@EvanBacon](https://github.com/EvanBacon))
- Float dev menu above RedBox on iOS. ([#12632](https://github.com/expo/expo/pull/12632) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Account for rubocop formatting in plugin. ([#12480](https://github.com/expo/expo/pull/12480) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed `isAvailable` option in `DevMenuAction` having no effect. ([#12703](https://github.com/expo/expo/pull/12703) by [@lukmccall](https://github.com/lukmccall))
- Enable kotlin in all modules. ([#12716](https://github.com/expo/expo/pull/12716) by [@wschurman](https://github.com/wschurman))
- Remove test screens. ([#12850](https://github.com/expo/expo/pull/12850) by [@lukmccall](https://github.com/lukmccall))
- Fixed compilation error on older versions of the Kotlin compiler. ([#12853](https://github.com/expo/expo/pull/12853) by [@lukmccall](https://github.com/lukmccall))
- Fixed XCode warnings. ([#12798](https://github.com/expo/expo/pull/12798) by [@lukmccall](https://github.com/lukmccall))
- Fixed the `SafeAreaView` color wasn't applied correctly while using the dark mode. ([#12851](https://github.com/expo/expo/pull/12851) by [@lukmccall](https://github.com/lukmccall))
- [plugin] Removed unused menu initialization if expo-dev-launcher is installed on iOS. ([#12875](https://github.com/expo/expo/pull/12875) by [@lukmccall](https://github.com/lukmccall))

## 0.4.1 — 2021-03-30

### 🐛 Bug fixes

- Fix misspellings in READMEs. ([#12346](https://github.com/expo/expo/pull/12346) by [@wschurman](https://github.com/wschurman))
- Fixed "Safari cannot open the page because the address is invalid" on iOS. ([#12319](https://github.com/expo/expo/pull/12319) by [@lukmccall](https://github.com/lukmccall))

## 0.4.0 — 2021-03-24

### 🎉 New features

- Extensions from now can export their own screen. ([#11384](https://github.com/expo/expo/pull/11384) by [@lukmccall](https://github.com/lukmccall))
- Added option to sign in using an Expo account. ([#11915](https://github.com/expo/expo/pull/11915) by [@lukmccall](https://github.com/lukmccall))
- Made menu appearing faster on Android by re-using the react root view. ([#12275](https://github.com/expo/expo/pull/12275) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 0.3.1 — 2021-02-03

_This version does not introduce any user-facing changes._

## 0.3.0 — 2021-02-01

### 🎉 New features

- Updated Android build configuration to target Android 11 (added support for Android SDK 30). ([#11647](https://github.com/expo/expo/pull/11647) by [@bbarthec](https://github.com/bbarthec))

## 0.2.2 — 2021-01-25

_This version does not introduce any user-facing changes._

## 0.2.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 0.2.0 — 2021-01-15

_This version does not introduce any user-facing changes._

## 0.1.2 — 2020-12-28

_This version does not introduce any user-facing changes._

## 0.1.1 — 2020-12-22

### 🛠 Breaking changes

- Dropped support for iOS 10.0 ([#11344](https://github.com/expo/expo/pull/11344) by [@tsapeta](https://github.com/tsapeta))

## 0.1.0 — 2020-12-14

_This version does not introduce any user-facing changes._

## 0.0.4 — 2020-12-02

_This version does not introduce any user-facing changes._

## 0.0.3 — 2020-11-10

_This version does not introduce any user-facing changes._

## 0.0.2 — 2020-09-25

_This version does not introduce any user-facing changes._

## 0.0.1 — 2020-08-27

### 🎉 New features

- Upgrade react-navigation. ([#9555](https://github.com/expo/expo/pull/9555) by [@EvanBacon](https://github.com/EvanBacon))
