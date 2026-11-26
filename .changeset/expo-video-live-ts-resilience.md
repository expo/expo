---
'expo-video': patch
---

[Android] Add `tsExtractorFlags` to `VideoSource` to allow treating H.264 non-IDR I-frames as keyframes in progressive (non-HLS) MPEG-TS streams to start playback faster.
