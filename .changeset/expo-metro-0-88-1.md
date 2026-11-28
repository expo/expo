---
'expo': patch
'@expo/cli': patch
'@expo/metro-config': patch
---

Upgrade Metro to 0.88.1 (`@expo/metro@~58.1.0`). Expo's default Metro config sets `transformer.unstable_shareTransformResults: false`, since Metro's new shared transform results don't work with Expo's CSS and tree shaking yet. It also sets `resolver.unstable_resolveExportsFromPackageRoot` and `resolver.unstable_applyBrowserSpecAfterExports` to `false`, which opts out of Metro 0.88's breaking changes to package resolution. Custom resolvers still get `context.redirectModulePath` and `context.doesFileExist`, `resolver.emptyModulePath` stays a file path, and a config that uses `expo/metro-config` still works under `react-native start` with React Native's Metro 0.87.
