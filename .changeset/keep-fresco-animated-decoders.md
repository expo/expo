---
"expo": patch
---

[Android] Fix animated GIF and WebP images showing only their first frame in release builds minified with R8. Fresco 3.7.0 creates these decoders through reflection, and R8 removed their constructors.
