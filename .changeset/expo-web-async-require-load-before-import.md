---
'expo': patch
---

On web, a dynamic `import()` of a split chunk that isn't on the page yet now loads the chunk before requiring the module. Previously it required the module first, so a global `ErrorUtils` handler received a fatal `Requiring unknown module` error before the chunk loaded.
