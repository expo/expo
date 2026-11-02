# The ML Kit scanner libraries are `compileOnly` when `expo.camera.barcode-scanner-enabled` or
# `expo.camera.document-scanner-enabled` is `false`. `CameraUtils` checks for them at runtime.
-dontwarn com.google.mlkit.vision.**
-dontwarn com.google.android.gms.tasks.**

# ML Kit creates its registrars by reflection. The firebase-components 16.1.0 rule that ML Kit
# pulls in keeps the classes but not their constructors, which R8 full mode then removes.
-keep class * implements com.google.firebase.components.ComponentRegistrar { void <init>(); }
