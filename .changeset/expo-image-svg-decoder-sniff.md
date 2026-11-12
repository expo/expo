---
"expo-image": patch
---

[Android] Fix the SVG decoder claiming every image source, which made sources that the other decoders couldn't handle (for example, a video `content://` URI) be read into memory in full before failing, causing `OutOfMemoryError`s and ANRs. The SVG decoders now only accept data that starts like an SVG document.
