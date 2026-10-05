---
'@expo/metro-file-map': patch
---

Remove the `micromatch` dependency, and with it the transitive dependency on `braces` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)). Watchers now filter changes by extension, file name and file name prefix instead of globs.
