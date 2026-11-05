---
'@expo/ui': patch
---

[iOS] Fix the content of `RNHostView` snapping to its final size during an animated SwiftUI resize, such as a frame whose width animates. The hosted tree now follows the animation frame by frame.
