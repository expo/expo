# Changelog

## 58.0.4

### Patch Changes

- [iOS] Publish the release `arm64-apple-ios-simulator.abi.json` at `prebuilds/abi/<Product>/` for each product that sets `"publishAbiDescriptor": true` in `spm.config.json`. ([#51835](https://github.com/expo/expo/pull/51835) by [@alanjhughes](https://github.com/alanjhughes))
- Updated dependencies. ([#51778](https://github.com/expo/expo/pull/51778))
  - jest-expo@58.0.12

## 58.0.3

### Patch Changes

- [iOS] Publish a headers XCFramework tarball for each product that sets `"headersXCFramework": true` in `spm.config.json`. `prepack` stages it at `prebuilds/output/headers/xcframeworks/<Product>Headers.tar.gz`, and packing fails if the prebuild did not produce it. A product with `customBuild` publishes only its headers tarball, without debug or release binaries or SwiftPM dependency binaries. ([#51243](https://github.com/expo/expo/pull/51243) by [@chrfalch](https://github.com/chrfalch))
- Updated dependencies. ([#51613](https://github.com/expo/expo/pull/51613))
  - jest-expo@58.0.11

## 58.0.2

### Patch Changes

- Updated dependencies. ([#51462](https://github.com/expo/expo/pull/51462))
  - jest-expo@58.0.10

## 58.0.1

### Patch Changes

- Updated dependencies. ([#51215](https://github.com/expo/expo/pull/51215), [#51110](https://github.com/expo/expo/pull/51110))
  - jest-expo@58.0.9

## 58.0.0

- Renamed from `expo-module-scripts` since this is now an internal package and the former is deprecated
