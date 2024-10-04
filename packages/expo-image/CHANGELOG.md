# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 1.2.1 — 2023-04-17

### 🐛 Bug fixes

- [Android] Fix `url` property returned by the `onLoad` event. ([#22161](https://github.com/expo/expo/pull/22161) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fix images not loading after the app was foregrounded. ([#22159](https://github.com/expo/expo/pull/22159) by [@lukmccall](https://github.com/lukmccall))
- [Android] Fixed image was loaded event if the view dimensions were 0. ([#22157](https://github.com/expo/expo/pull/22157) by [@lukmccall](https://github.com/lukmccall))
- Fix generating the image from ThumbHash that starts with a slash character. ([#22160](https://github.com/expo/expo/pull/22160) by [@tsapeta](https://github.com/tsapeta))

## 1.2.0 — 2023-04-14

### 🎉 New features

- [Web] Add support for `require()` assets. ([#21798](https://github.com/expo/expo/pull/21798) by [@aleqsio](https://github.com/aleqsio))
- Add `alt` prop as an alias to `accessibilityLabel`. ([#21884](https://github.com/expo/expo/pull/21884) by [@EvanBacon](https://github.com/EvanBacon))
- [Web] Add `accessibilityLabel` support on web. ([#21884](https://github.com/expo/expo/pull/21884) by [@EvanBacon](https://github.com/EvanBacon))
- Added `ThumbHash` support for Android, iOS and Web. ([#21952](https://github.com/expo/expo/pull/21952) by [@behenate](https://github.com/behenate))

### 🐛 Bug fixes

- [Web] Prevent breaking in static rendering environments. ([#21883](https://github.com/expo/expo/pull/21883) by [@EvanBacon](https://github.com/EvanBacon))
- [Android] Fixed image disappearing before navigation animation is complete. ([#22066](https://github.com/expo/expo/pull/22066) by [@sallen450](https://github.com/sallen450))
- [Web] Fixed monorepo asset resolution in production for Metro web. ([#22094](https://github.com/expo/expo/pull/22094) by [@EvanBacon](https://github.com/EvanBacon))

## 1.1.0 — 2023-03-25

### 🎉 New features

- [Android] Add automatic asset downscaling to improve performance. ([#21628](https://github.com/expo/expo/pull/21628) by [@lukmccall](https://github.com/lukmccall))

### 🐛 Bug fixes

- Fixed the `tintColor` not being passed to native view. ([#21576](https://github.com/expo/expo/pull/21576) by [@andrew-levy](https://github.com/andrew-levy))
- Fixed `canvas: trying to use a recycled bitmap` on Android. ([#21658](https://github.com/expo/expo/pull/21658) by [@lukmccall](https://github.com/lukmccall))
- Fixed crashes caused by empty placeholder or source on Android. ([#21695](https://github.com/expo/expo/pull/21695) by [@lukmccall](https://github.com/lukmccall))
- Fixes `shouldDownscale` don't respect the scale factor on iOS. ([#21839](https://github.com/expo/expo/pull/21839) by [@ouabing](https://github.com/ouabing))
- Fixes cache policy not being correctly applied when set to `none` on iOS. ([#21840](https://github.com/expo/expo/pull/21840) by [@ouabing](https://github.com/ouabing))

## 1.0.0 — 2023-02-21

_This version does not introduce any user-facing changes._

## 1.0.0-rc.2 — 2023-02-20

### 🎉 New features

- Added `recyclingKey` prop that allows reseting the image view content when the view is recycled. ([#21297](https://github.com/expo/expo/pull/21297) & [#21309](https://github.com/expo/expo/pull/21309) by [@tsapeta](https://github.com/tsapeta) & [@lukmccall](https://github.com/lukmccall))

## 1.0.0-rc.1 — 2023-02-14

### 🐛 Bug fixes

- Fixed `You can't start or clear loads in RequestListener or Target callbacks` on Android. ([#21192](https://github.com/expo/expo/pull/21192) by [@lukmccall](https://github.com/lukmccall))
- Fixed SVGs are not rendered in the release mode on Android. ([#21214](https://github.com/expo/expo/pull/21214) by [@lukmccall](https://github.com/lukmccall))
- Stop sending `onProgress` event when the asset size is unknown which led to diving by zero and a crash. ([#21215](https://github.com/expo/expo/pull/21215) by [@tsapeta](https://github.com/tsapeta))

## 1.0.0-rc.0 — 2023-02-09

### 🎉 New features

- Added `placeholderContentFit` prop implementation on the web. ([#21106](https://github.com/expo/expo/pull/21106) by [@aleqsio](https://github.com/aleqsio))

## 1.0.0-beta.6 — 2023-02-06

### 🎉 New features

- Added new prop `placeholderContentFit` to specify custom content fit on the placeholder. ([#21096](https://github.com/expo/expo/pull/21096) by [@magrinj](https://github.com/magrinj))

### 🐛 Bug fixes

- [iOS] Fixed possible freezes by processing images concurrently off the main thread. ([#21086](https://github.com/expo/expo/pull/21086) by [@tsapeta](https://github.com/tsapeta))

## 1.0.0-beta.5 — 2023-02-03

_This version does not introduce any user-facing changes._

## 1.0.0-beta.4 — 2023-01-31

### 🐛 Bug fixes

- Fixed a crash on Android where `isScreenReaderFocusable` crashes devices below api 28. ([#21012](https://github.com/expo/expo/pull/21012) by [@alanhughes](https://github.com/alanjhughes))

## 1.0.0-beta.3 — 2023-01-30

### 🐛 Bug fixes

- Fixed a crash on iOS below 16.0 introduced by the Live Text interaction feature. ([#20987](https://github.com/expo/expo/pull/20987) by [@tsapeta](https://github.com/tsapeta))

## 1.0.0-beta.2 — 2023-01-25

### 🎉 New features

- Added support for Live text interaction. ([#20915](https://github.com/expo/expo/pull/20915) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### 🐛 Bug fixes

- `ImageProps` now extends `ViewProps`. ([#20942](https://github.com/expo/expo/pull/20942) by [@appden](https://github.com/appden))

## 1.0.0-beta.1 — 2023-01-20

### 🐛 Bug fixes

- Use `SDImageAWebPCoder` on iOS 14+ to speed up loading WebP images. ([#20897](https://github.com/expo/expo/pull/20897) by [@tsapeta](https://github.com/tsapeta))

### 💡 Others

- On Android bump `compileSdkVersion` and `targetSdkVersion` to `33`. ([#20721](https://github.com/expo/expo/pull/20721) by [@lukmccall](https://github.com/lukmccall))
- Upgraded `SDWebImage` to `5.15.0` and `SDWebImageAVIFCoder` to `0.9.4`. ([#20898](https://github.com/expo/expo/pull/20898) by [@tsapeta](https://github.com/tsapeta))

## 1.0.0-beta.0 — 2023-01-19

### 🎉 New features

- Added support for crossfade transition on Android. ([#20784](https://github.com/expo/expo/pull/20784) by [@lukmccall](https://github.com/lukmccall))
- Added web support for the `blurRadius` prop. ([#20845](https://github.com/expo/expo/pull/20845) by [@aleqsio](https://github.com/aleqsio))
- Support for `accessible` and `accessibilityLabel` props on Android. ([#20801](https://github.com/expo/expo/pull/20801) by [@lukmccall](https://github.com/lukmccall))
- Support for `accessible` and `accessibilityLabel` props on iOS. ([#20892](https://github.com/expo/expo/pull/20892) by [@alanhughes](https://github.com/alanjhughes))

## 1.0.0-alpha.6 — 2023-01-10

### 🎉 New features

- Introduced the `source.cacheKey` parameter to customize the key used for caching the source image. ([#20772](https://github.com/expo/expo/pull/20772) by [@tsapeta](https://github.com/tsapeta), [#20776](https://github.com/expo/expo/pull/20776) by [@lukmccall](https://github.com/lukmccall))

## 1.0.0-alpha.5 — 2023-01-04

### 🎉 New features

- Added support for assets from the iOS Photo Library (`ph://` urls). ([#20700](https://github.com/expo/expo/pull/20700) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fixed `ImageProps` type not allowing an array of styles. ([#20701](https://github.com/expo/expo/pull/20701) by [@tsapeta](https://github.com/tsapeta))

## 1.0.0-alpha.4 — 2022-12-30

### 🐛 Bug fixes

- Fixed compatibility with `react-native-shared-element` on iOS. ([#20592](https://github.com/expo/expo/pull/20592) by [@IjzerenHein](https://github.com/ijzerenhein))

## 1.0.0-alpha.3 — 2022-12-21

### 🎉 New features

- Initial release 🥳
