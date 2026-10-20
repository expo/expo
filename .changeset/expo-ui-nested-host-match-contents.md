---
'expo-modules-core': patch
'@expo/ui': patch
---

[iOS] Fix community drop-in components, such as `DateTimePicker`, stretching to fill the free space inside a SwiftUI `Row` or `Column`. A nested `matchContents` `Host` now takes its content size.
