---
'expo-image': patch
---

[iOS] Keep the rendered image when the view's size changes and the image is still suitable for display at the new size. Also round the downscaled image size to the nearest pixel. This helps scaled images keep their aspect ratio as best as possible.
