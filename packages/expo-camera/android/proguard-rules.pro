# The ML Kit scanner libraries are `compileOnly` when `expo.camera.barcode-scanner-enabled` or
# `expo.camera.document-scanner-enabled` is `false`. `CameraUtils` checks for them at runtime.
-dontwarn com.google.mlkit.vision.**
-dontwarn com.google.android.gms.tasks.**
