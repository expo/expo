---
'expo-camera': patch
---

[iOS] Fixed blurry close-up photos on iPhones with an ultra-wide camera. The default back camera is now the virtual multi-lens device, which switches to the ultra-wide for macro like the system Camera app, and `zoom: 0` keeps the 1x wide-lens framing.
