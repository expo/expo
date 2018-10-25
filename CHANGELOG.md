# Changelog

This is the log of notable changes to the Expo client that are developer-facing.

## 31.0.0

### Breaking changes

- The default export from the expo package is deprecated in favor of named exports to pave the way for static analysis tools (#2387)
- upgrade `react-native-svg` to `8.0.5` ([#2492](https://github.com/expo/expo/pull/2492))

### New features

### Bug fixes

- fix `react-native-svg` `toDataURL()` method throwing error (`undefined is not an object (evaluating 'RNSVGSvgViewManager.toDataURL')`) on Android ([#2492](https://github.com/expo/expo/pull/2492/files#diff-e7d5853f05c039302116a6f919672972))
