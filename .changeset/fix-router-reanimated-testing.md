---
"expo-router": major
---

Stop mocking `react-native-reanimated` in `expo-router/testing-library` so animated style assertions can use Reanimated's test setup; tests that relied on the mock must follow [Reanimated's Jest setup](https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/), including `setUpTests()` and the resolver required by their Reanimated version.
