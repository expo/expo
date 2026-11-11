---
'expo-build-properties': minor
---

Deprecate `useHermesV1`. React Native 0.88 and newer always use Hermes V1 and ignore this option. Prebuild now shows a warning when the option is set, and `useHermesV1: false` no longer requires `buildReactNativeFromSource`.
