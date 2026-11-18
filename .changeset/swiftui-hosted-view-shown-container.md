---
'expo-modules-core': patch
---

[iOS] Fix React Native content in a SwiftUI `List` row going blank. When SwiftUI builds more than one instance of a row, the instance it displays now holds the hosted view.
