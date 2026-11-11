---
'expo-camera': patch
---

Fix Android release builds with R8 when the barcode scanner or the document scanner is disabled. R8 stopped with `Missing class com.google.mlkit...` errors because the app does not include the disabled ML Kit libraries. This happened with `barcodeScannerEnabled: false` in the config plugin, or with `expo.camera.document-scanner-enabled=false` in `gradle.properties`.
