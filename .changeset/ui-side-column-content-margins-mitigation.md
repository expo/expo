---
'@expo/ui': patch
---

[iOS] Fix `Form` and `List` sections in a `Host` starting 20pt inside the large title beside the iPhone Duo's rail, where iOS drops its content margin. This works around a SwiftUI bug and applies only on an edge where the inset comes from a bar beside the content.
