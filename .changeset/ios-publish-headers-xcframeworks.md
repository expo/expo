---
'@expo/internal-scripts': patch
---

[iOS] Publish a headers XCFramework tarball for each product that sets `"headersXCFramework": true` in `spm.config.json`. `prepack` stages it at `prebuilds/output/headers/xcframeworks/<Product>Headers.tar.gz`, and packing fails if the prebuild did not produce it. A product with `customBuild` publishes only its headers tarball, without debug or release binaries or SwiftPM dependency binaries.
