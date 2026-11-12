---
'expo-camera': patch
---

[iOS] Scan `code39` with the built-in AVFoundation detector instead of the ZXing fallback. ZXing processed about six frames per second, decoded a single code per frame and returned no `cornerPoints`/`bounds`, so labels with several Code 39 barcodes next to each other took seconds to read and the result could not be located on screen. `code39` results now arrive at the camera frame rate, with `cornerPoints` and `bounds`. `pdf417` and `codabar` still use ZXing.
