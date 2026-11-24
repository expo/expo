---
'expo-brownfield': patch
'expo-camera': patch
'expo-contacts': patch
'expo-file-system': patch
'expo-font': patch
'expo-image': patch
'expo-image-manipulator': patch
'expo-live-photo': patch
'expo-location': patch
'expo-maps': patch
'expo-media-library': patch
'expo-print': patch
'expo-video': patch
---

[iOS] Bump the precompiled artifacts because of an ABI break in `expo-modules-core`. The type of `AnyModule._classTypes` changed, and the `SharedObject` hooks of the `@SharedObject` macro have new names. A framework that was built against an earlier `expo-modules-core` fails to load with the new one.
