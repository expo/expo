---
'expo-module-scripts': patch
---

[iOS] Publish a headers XCFramework tarball for each product that sets `"headersXCFramework": true` in `spm.config.json`. `prepack` stages it at `prebuilds/output/headers/xcframeworks/<Product>Headers.tar.gz`, and `prepublishOnly` fails if the prebuild did not produce it.
