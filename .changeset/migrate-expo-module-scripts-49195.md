---
"expo-module-scripts": patch
---

Remove the dangling `build-src` command, which `expo-module --help` advertised but which failed with a Commander `'expo-module-build-src' does not exist` error because no such executable has ever existed.

See: [#49195](https://github.com/expo/expo/pull/49195)
