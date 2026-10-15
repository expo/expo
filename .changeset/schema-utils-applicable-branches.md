---
'@expo/schema-utils': patch
---

Only visit the `anyOf`/`oneOf` branches and the `then`/`else` branch that a present value matches, so `expo-doctor` no longer validates a `.icon` directory in `ios.icon` as a PNG image ("cannot access file at './assets/expo.icon'").
