---
'expo-modules-core': patch
---

[iOS] Fix a shared object that two runtimes, such as the main runtime and the worklet UI runtime, pair at the same time. It could get two native states, and then the JS object of one runtime didn't get native events.
