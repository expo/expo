# expo-display-features

Query reserved display regions (such as a hinge or a front-facing camera cutout) and hinge state on foldable and dual-display devices, starting with iPhone Duo.

## Status

This is an initial, iOS-only module modeled on the reserved regions and hinge status described in Apple's [Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) Human Interface Guidelines and Tech Talks [111463](https://developer.apple.com/videos/play/tech-talks/111463/) and [111464](https://developer.apple.com/videos/play/tech-talks/111464/).

The underlying iOS 27.1 APIs (`UIView.reservedRegions(kind:)`, `UIHingeInteraction`) are not part of any Xcode release publicly available as of 2026-09-10 — Apple lists Xcode 27.1 beta, which ships them, as "coming later this month". Every function in this module resolves to an empty/`null` result today; the native query is gated behind an `EXPO_IPHONE_DUO_SDK` Swift compilation flag (off by default) so the module compiles cleanly against current Xcode and starts reporting real data once someone builds with `-DEXPO_IPHONE_DUO_SDK` on a toolchain that has the symbols. See `ios/DisplayFeaturesModule.swift`.

## API

```ts
import {
  getDisplayFeaturesAsync,
  getHingeAsync,
  useDisplayFeatures,
  useHinge,
  DisplayFeatureType,
} from 'expo-display-features';

const displayFeatures = await getDisplayFeaturesAsync();
const hinge = await getHingeAsync();

function App() {
  const displayFeatures = useDisplayFeatures();
  const isFolded = displayFeatures.some((f) => f.type === DisplayFeatureType.HINGE);
  // ...
}
```

## Why a new module rather than extending `expo-constants` or `expo-device`

Both of those report static device information. Reserved regions and hinge state change while the app is running (as the device folds and unfolds), which is closer to `expo-screen-orientation`'s event-driven shape — this module follows that package's structure.
