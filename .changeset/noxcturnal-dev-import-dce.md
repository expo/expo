---
'@expo/metro-config': patch
---

Drop modules imported only inside `if (__DEV__)` from production bundles when the Noxcturnal transformer runs with minification disabled. Minified Noxcturnal output also removes comments.
