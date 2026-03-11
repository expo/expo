# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 55.0.8 — 2026-03-11

### 🐛 Bug fixes

- Fix glass effect not rendering correctly after appearance change while view is off-screen. ([#43771](https://github.com/expo/expo/pull/43771) by [@nishan](https://github.com/intergalacticspacehighway))
- Fix `isInteractive` prop not being dynamically changeable after mount. ([#43771](https://github.com/expo/expo/pull/43771) by [@nishan](https://github.com/intergalacticspacehighway))

## 55.0.7 — 2026-02-25

### 🐛 Bug fixes

- Fix `isInteractive` not applying when `glassEffectStyle` has `animate: true`. ([#43330](https://github.com/expo/expo/pull/43330) by [@nishan](https://github.com/intergalacticspacehighway))
- Fix glass effect not rendering on first visit to a non-initial tab in tab navigator. ([#43330](https://github.com/expo/expo/pull/43330) by [@nishan](https://github.com/intergalacticspacehighway))

## 55.0.6 — 2026-02-16

_This version does not introduce any user-facing changes._

## 55.0.5 — 2026-02-08

### 🎉 New features

- Add animation config to `glassEffectStyle` ([#42005](https://github.com/expo/expo/pull/42005) by [@nishan](https://github.com/intergalacticspacehighway))

## 55.0.4 — 2026-02-03

_This version does not introduce any user-facing changes._

## 55.0.3 — 2026-01-27

_This version does not introduce any user-facing changes._

## 55.0.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 55.0.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 55.0.0 — 2026-01-21

- Add ref prop type to `GlassContainer` and `GlassView` components ([#41799](https://github.com/expo/expo/pull/41799) by [@pchalupa](https://github.com/pchalupa))

### 🎉 New features

- Add `isGlassEffectAPIAvailable` API to prevent some iOS 26 beta version crashes ([#40992](https://github.com/expo/expo/pull/40992) by [@nishan](https://github.com/intergalacticspacehighway))
- Add `tvOS` support ([#41962](https://github.com/expo/expo/pull/41962) by [@nishan](https://github.com/intergalacticspacehighway))
- Add `colorScheme` prop to override user interface style of `GlassView` ([#42164](https://github.com/expo/expo/pull/42164) by [@nishan](https://github.com/intergalacticspacehighway))

## 0.1.8 - 2025-12-05

_This version does not introduce any user-facing changes._

## 0.1.7 - 2025-11-13

_This version does not introduce any user-facing changes._

## 0.1.6 - 2025-11-03

### 🐛 Bug fixes

- Fix `border(Left|Right|Start|End)Radius` ([#40780](https://github.com/expo/expo/pull/40780) by [@nishan](https://github.com/intergalacticspacehighway)) ([#40780](https://github.com/expo/expo/pull/40780) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Fix crash on `UIGlassEffect` initialiser on iOS 26 beta ([#40920](https://github.com/expo/expo/pull/40920) by [@nishan](https://github.com/intergalacticspacehighway)) ([#40920](https://github.com/expo/expo/pull/40920) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### 💡 Others

- Fixed XCode 16.4 compilation ([#40686](https://github.com/expo/expo/pull/40686) by [@nishan](https://github.com/intergalacticspacehighway)) ([#40686](https://github.com/expo/expo/pull/40686) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 0.1.5 - 2025-10-28

### 🎉 New features

- Add non-uniform border radius support to `GlassView` ([#40570](https://github.com/expo/expo/pull/40570) by [@nishan](https://github.com/intergalacticspacehighway)) ([#40570](https://github.com/expo/expo/pull/40570) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## 0.1.4 - 2025-09-17

### 🐛 Bug fixes

- Set default glass style to regular ([#39732](https://github.com/expo/expo/pull/39732) by [@brentvatne](https://github.com/brentvatne))

## 0.1.3 — 2025-09-12

### 🎉 New features

Add child view support to <GlassView />, allowing child views to inherit animations from the parent view. ([#39595](https://github.com/expo/expo/pull/39595) by [@patrikduksin](https://github.com/patrikduksin))

## 0.1.2 — 2025-09-11

_This version does not introduce any user-facing changes._

## 0.1.1 — 2025-09-04

### 💡 Others

- Move `isLiquidGlassAvailable` function to `ExpoGlassEffect` ([#39349](https://github.com/expo/expo/pull/39349) by [@Ubax](https://github.com/Ubax))

## 0.1.0 — 2025-09-03

_This version does not introduce any user-facing changes._
