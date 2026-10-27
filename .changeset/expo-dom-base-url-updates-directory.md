---
'expo': patch
---

Resolve the DOM Components base URL from an asset in the updates directory. The first `localAssets` entry can be an embedded asset in the app binary. That made a downloaded update load its DOM HTML from a path that does not exist.
