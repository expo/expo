---
'expo-build-properties': minor
---

Deprecate `useHermesV1`. React Native 0.88 and newer always use Hermes V1, so the option has no effect. Prebuild now shows a warning when the option is set and no longer writes `hermesV1Enabled` or `expo.useHermesV1`.
