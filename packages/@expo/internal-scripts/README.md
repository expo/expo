# @expo/internal-scripts

Private development tooling shared by packages in the Expo monorepo. This package is not published to npm.

Add it as a workspace development dependency:

```json
{
  "devDependencies": {
    "@expo/internal-scripts": "workspace:*"
  }
}
```

The package provides:

- `expo-build` for compiling JavaScript and TypeScript with SWC.
- `expo-module` for shared tasks such as configuration, testing, type checking, formatting, and cleaning.
- TypeScript configurations: `@expo/internal-scripts/tsconfig.base`, `tsconfig.node`, and `tsconfig.plugin`.
- The shared lint configuration at `@expo/internal-scripts/oxlint.config.base`.
- Jest presets and helpers for internal module, Node, and config plugin tests.

For module tests, use `@expo/internal-scripts` as the Jest preset. For Node or config plugin tests, use `@expo/internal-scripts/jest-preset-cli` or `@expo/internal-scripts/jest-preset-plugin`. Packages with multiple test targets can use `@expo/internal-scripts/createCompositeJestPreset`.

The internal TypeScript and module Jest presets enable the `expo-source` condition to resolve workspace source files without requiring build outputs.

See [Expo Module Infrastructure](../../../guides/Expo%20Module%20Infrastructure.md) for repository development conventions.
