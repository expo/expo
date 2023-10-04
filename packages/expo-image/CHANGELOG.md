# Changelog

## Unpublished

### 🛠 Breaking changes

- Dropped support for Android SDK 21 and 22. ([#24201](https://github.com/expo/expo/pull/24201) by [@behenate](https://github.com/behenate))

### 🎉 New features

- Added support for the `headers` key in the `source` object on web. ([#24447](https://github.com/expo/expo/pull/24447) by [@aleqsio](https://github.com/aleqsio))
- Add support for setting `tintColor` on SVGs on Android ([#24733](https://github.com/expo/expo/pull/24733) by [@alanjhughes](https://github.com/alanjhughes) and [@kadikraman](https://github.com/kadikraman))

### 🐛 Bug fixes

- Remove `GlideWebpDecoder` until they update their `libwebp` dependency. ([#24656](https://github.com/expo/expo/pull/24656) by [@alanjhughes](https://github.com/alanjhughes))
- [web] Fix content fit not being applied correctly when using hash placeholders. ([#24542](https://github.com/expo/expo/pull/24542) by [@aleqsio](https://github.com/aleqsio))

### 💡 Others

## 1.0.2 — 2023-09-29

### 🐛 Bug fixes

- Remove `GlideWebpDecoder` until they update their `libwebp` dependency. ([#24656](https://github.com/expo/expo/pull/24656) by [@alanjhughes](https://github.com/alanjhughes))

## 1.3.4 — 2023-09-28

### 🐛 Bug fixes

- Remove `GlideWebpDecoder` until they update their `libwebp` dependency. ([#24656](https://github.com/expo/expo/pull/24656) by [@alanjhughes](https://github.com/alanjhughes))

## 1.5.2 — 2023-09-18

_This version does not introduce any user-facing changes._

## 1.3.3 — 2023-09-15

### 🐛 Bug fixes

- Fixed placeholders aren't always replaced by full-size images on Android. ([#23705](https://github.com/expo/expo/pull/23705) by [@lukmccall](https://github.com/lukmccall))
- Fix the image components rendering incorrect assets when the Proguard is enabled on Android. ([#23704](https://github.com/expo/expo/pull/23704) by [@lukmccall](https://github.com/lukmccall))
- Fixed gif and awebp memory leak on Android. ([#24259](https://github.com/expo/expo/pull/24259) by [@jingpeng](https://github.com/jingpeng))
- Suppress "Operation cancelled by user during sending the request" error when the load request is canceled (interrupted) by a new one. ([#24279](https://github.com/expo/expo/pull/24279) by [@tsapeta](https://github.com/tsapeta))

## 1.5.1 — 2023-09-11

### 🐛 Bug fixes

- Suppress "Operation cancelled by user during sending the request" error when the load request is canceled (interrupted) by a new one. ([#24279](https://github.com/expo/expo/pull/24279) by [@tsapeta](https://github.com/tsapeta))
- Fixed gif and awebp memory leak on Android. ([#24259](https://github.com/expo/expo/pull/24259) by [@jingpeng](https://github.com/jingpeng))

## 1.5.0 — 2023-09-04

### 🎉 New features

- Added support for React Native 0.73. ([#24018](https://github.com/expo/expo/pull/24018) by [@kudo](https://github.com/kudo))

### 💡 Others

- On iOS, bump SDWebImage versions. ([#23858](https://github.com/expo/expo/pull/23858) by [@alanjhughes](https://github.com/alanjhughes))

## 1.4.1 — 2023-08-02

_This version does not introduce any user-facing changes._

## 1.4.0 — 2023-07-28

### 🎉 New features

- [Web] Add support for `tintColor` prop on web. ([#23434](https://github.com/expo/expo/pull/23434) by [@aleqsio](https://github.com/aleqsio))
- [Web] Add support for static image responsiveness using `srcset` attributes. ([#22088](https://github.com/expo/expo/pull/22088) by [@aleqsio](https://github.com/aleqsio))

### 🐛 Bug fixes

- Fixed placeholders aren't always replaced by full-size images on Android. ([#23705](https://github.com/expo/expo/pull/23705) by [@lukmccall](https://github.com/lukmccall))
- Fixed the image components rendering incorrect assets when the Proguard is enabled on Android. ([#23704](https://github.com/expo/expo/pull/23704) by [@lukmccall](https://github.com/lukmccall))

### 💡 Others

- [Web] Refactored and split some functions for better readability. ([#23465](https://github.com/expo/expo/pull/23465) by [@aleqsio](https://github.com/aleqsio))

## 1.3.2 - 2023-07-12

### 🐛 Bug fixes

- [iOS] Fixed `tintColor` prop not working for SVGs. ([#23418](https://github.com/expo/expo/pull/23418) by [@tsapeta](https://github.com/tsapeta))

## 1.3.1 - 2023-06-29

### 🐛 Bug fixes

- Fixed an issue where recyclingKey would reset the image source on mount. ([#23187](https://github.com/expo/expo/pull/23187) by [@hirbod](https://github.com/hirbod))

## 1.3.0 — 2023-06-13

### 🎉 New features

- Add prefetch implementation on web. ([#22630](https://github.com/expo/expo/pull/22630) by [@aleqsio](https://github.com/aleqsio))
- Add `ImageBackground` component. ([#22347](https://github.com/expo/expo/pull/22347) by [@alanjhughes](https://github.com/alanjhughes))
- Added support for React Native 0.72. ([#22588](https://github.com/expo/expo/pull/22588) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed styles order breaking layouting on web. ([#22630](https://github.com/expo/expo/pull/22630) by [@aleqsio](https://github.com/aleqsio))
- Uses prop spreading on web to pass all unused props to the native image component ([#22340](https://github.com/expo/expo/pull/22340) by [@makkarMeenu](https://github.com/makkarMeenu))
- Fixed Android build warnings for Gradle version 8. ([#22537](https://github.com/expo/expo/pull/22537), [#22609](https://github.com/expo/expo/pull/22609) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `SDWebImage` to `5.15.8`, `SDWebImageWebPCoder` to `0.11.0` and `SDWebImageSVGCoder` to `1.7.0`. ([#22576](https://github.com/expo/expo/pull/22576) by [@tsapeta](https://github.com/tsapeta))

## 1.2.3 — 2023-05-16

### 🐛 Bug fixes

- Upgrade SDWebImageAVIFCoder to fix compiling issue with libavif < 0.11.0. ([#22491](https://github.com/expo/expo/pull/22491) by [@matinzd](https://github.com/matinzd))

## 1.2.2 — 2023-04-27

### 🐛 Bug fixes

- Fix for the "limited" media library permission. ([#22261](https://github.com/expo/expo/pull/22261) by [@tsapeta](https://github.com/tsapeta))

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

- [Web] Improve transition behavior when switching back and forth two sources. ([#22099](https://github.com/expo/expo/pull/22099) by [@aleqsio](https://github.com/aleqsio))
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
