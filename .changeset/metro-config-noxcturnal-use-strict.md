---
'@expo/metro-config': patch
---

Add the `"use strict"` directive to ES modules and generated asset modules in the native (noxcturnal) transform worker, as the Babel transform worker does. Before this fix, these modules ran in sloppy mode on Hermes.
