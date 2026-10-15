---
'@expo/schema-utils': patch
---

Fix `visit` reporting every `oneOf` and `anyOf` branch, and both `then` and `else`, whatever the value. It now visits only the branches that apply to the value. `@expo/schemer`, and so `expo-doctor`, checked each `ios.icon` against both of its branches: a `.icon` directory failed with "cannot access file", and a `.png` failed with "should point to a .icon directory".
