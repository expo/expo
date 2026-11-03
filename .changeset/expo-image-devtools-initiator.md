---
'expo-image': patch
---

[iOS] Remote image loads report a React Native DevTools initiator. `Image.loadAsync` shows the function that called it. `<Image>` and `useImage` show the library frame, because the component that rendered them is no longer on the stack.
