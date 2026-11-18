---
'expo-image': patch
---

[Web] Render the image in the first render when there is no placeholder, so that server rendering and static rendering output the `<img>` element. While hydrating, the image is shown as it is instead of hiding until its `load` event, which React does not get when the browser loaded the image first. Its `onLoad` and `onError` are then called once hydrated.
