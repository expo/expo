---
'@expo/cli': patch
---

Fix `expo export` running out of memory on static routes with a `loader` and many pages. The export now evaluates each loader bundle once.
