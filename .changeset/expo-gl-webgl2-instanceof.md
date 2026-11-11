---
'expo-gl': patch
---

Fix WebGL 2 contexts being `instanceof WebGLRenderingContext`, which made three.js r163 and later reject them as WebGL 1.
