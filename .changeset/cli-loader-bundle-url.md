---
'@expo/cli': patch
'@expo/require-utils': patch
---

Fix server stack traces in development pointing at the wrong source file on Node 24.22 and later. Server bundle source maps are now read before their temporary files are removed, and loader bundles are marked in their bundle URL so Metro symbolicates them against the right bundle.
