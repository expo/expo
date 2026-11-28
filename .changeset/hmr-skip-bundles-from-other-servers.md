---
'expo': patch
---

Fix the development server exiting when an app loads a bundle from another server. The HMR client now registers only the bundles that the development server serves.
