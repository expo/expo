---
'expo-image': patch
---

[iOS] Keep the rendered image when only the view's size changes and the image has the pixels that the new size needs. Before, the view loaded and downscaled the image again for each size change.
