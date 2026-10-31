---
'expo-image': patch
---

[Web] Support `transition.skipOnCacheHit`: an image the browser already has in memory shows at once, and its `onLoad` reports `cacheType: 'memory'`. An image shown at once no longer fades in from the transition's starting opacity.
