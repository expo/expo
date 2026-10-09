# expo-hinge

## 58.0.1

### Patch Changes

- Add Android support. `isAvailable()`, `getHinge()`, `addHingeListener()` and `useHinge()` report the hinge on Android 11 and later, with the angle from the hinge angle sensor and the status from Jetpack WindowManager. ([#51201](https://github.com/expo/expo/pull/51201) by [@azizbecha](https://github.com/azizbecha))

## 58.0.0

- [iOS] Added `expo-hinge`, an app-wide API for the iPhone Duo hinge: `getHinge()`, `isAvailable()`, `addHingeListener()` and the `useHinge()` hook (iOS 27.1+). ([#50912](https://github.com/expo/expo/pull/50912) by [@huntie](https://github.com/huntie))
