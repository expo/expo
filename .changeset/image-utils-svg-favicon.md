---
"@expo/image-utils": patch
---

Support SVG source images, such as an SVG `web.favicon`, by rasterizing them to PNG with `sharp`. Without `sharp`, SVG sources now fail with an error that explains how to install `sharp-cli`.
