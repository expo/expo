---
'expo-codemod': patch
---

Fix `sdk-56-expo-router-react-navigation-replace` silently skipping named re-exports (`export { A } from '@react-navigation/...'`), which are now rewritten like named imports. Re-export styles that cannot be rewritten (`export *`, `export * as ns from`, `export v from`, `export { default as X } from`), `jest` module calls (`mock`, `doMock`, `unmock`, `setMock`, `requireActual`, `requireMock`, `createMockFromModule`), and inline `import("...")` types outside call type arguments referencing `@react-navigation/*` modules are reported for manual migration.
