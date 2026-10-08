---
'babel-preset-expo': patch
'jest-expo': patch
---

Remapped `import.meta.url` under Jest to the module's `file://` URL. `jest-expo` now reports `bundler: 'jest'` to Babel.
