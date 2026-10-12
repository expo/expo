---
'expo-image-manipulator': patch
---

[Android] Fix `renderAsync()` rejecting with `JobCancellationException` when the context is released while the render is still pending, for example when a component using `useImageManipulator` unmounts mid-render.
