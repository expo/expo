<!-- Title -->
<h1 align="center">
👋 Welcome to <br><code>@expo/vitest</code>
</h1>

<p align="center">Vitest presets for testing Expo and React Native packages.</p>

> **Experimental.** This package is the Vitest counterpart of `jest-expo` and the Jest presets in
> `expo-module-scripts`. It is private to the monorepo while packages are migrated one at a time.

## Node-only packages

For CLI tools, config plugins and other packages that never import `react-native`
(the `expo-module-scripts/jest-preset-cli` and `jest-preset-plugin` presets in Jest):

```js
// vitest.config.mjs
import { defineNodeConfig } from '@expo/vitest';

export default defineNodeConfig({ name: '@expo/plist' });
```

```json
{
  "scripts": { "test": "vitest run" },
  "devDependencies": { "@expo/vitest": "workspace:*" }
}
```

Set `"types": ["node", "vitest/globals"]` in the package `tsconfig.json` so `describe`, `it`,
`expect` and `vi` type-check.

## Migrating tests from Jest

- `jest.fn`, `jest.mock`, `jest.spyOn`, `jest.mocked` become `vi.fn`, `vi.mock`, `vi.spyOn`,
  `vi.mocked`. Import `vi` from `vitest`.
- `jest.requireActual(id)` becomes `await vi.importActual(id)`; mock factories that use it must be
  `async`.
- `jest.setTimeout(ms)` becomes `vi.setConfig({ testTimeout: ms })`.
- `vi.mock` is hoisted above imports. A factory can only reference variables declared with
  `vi.hoisted`.
- Vitest does not load `__mocks__` folders automatically. Call `vi.mock('module-name')` in a setup
  file or the test.
