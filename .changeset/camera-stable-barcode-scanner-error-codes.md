---
'expo-camera': patch
---

[Android] Fix `CameraView.launchScanner()` rejecting with an obfuscated error code in release builds minified by R8. A cancelled scan now always rejects with `ERR_BARCODE_SCANNING_CANCELLED`, and a failed scan with `ERR_BARCODE_SCANNING_FAILED`.
