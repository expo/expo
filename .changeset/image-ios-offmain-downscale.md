---
"expo-image": patch
---

[iOS] Downscale images to the view's size off the main thread. Every bounds change reloads the image, and on a cache hit the resize ran synchronously on the main thread for each image on screen, which held the UI back on rotation and when a foldable switches screens.
