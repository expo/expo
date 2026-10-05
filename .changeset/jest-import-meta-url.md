---
'babel-preset-expo': patch
'jest-expo': patch
---

Fixed `import.meta.url` being `null` under Jest, or throwing with the `jest-expo/node` preset. It now returns the module's `file://` URL ([#51057](https://github.com/expo/expo/issues/51057)).
