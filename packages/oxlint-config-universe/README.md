# oxlint-config-universe

Shared [oxlint](https://oxc.rs/) configs for Expo projects. This is the oxlint equivalent of [eslint-config-universe](../eslint-config-universe).

## Installation

```sh
npm install --save-dev oxlint-config-universe oxlint
```

## Usage

Create an `oxlint.config.ts` (or `.js`) in your project root:

```ts
import { defineConfig } from 'oxlint';
import native from 'oxlint-config-universe/native';

export default defineConfig({
  extends: [native],
  // your overrides here
});
```

### Available presets

| Preset                           | Use for                     |
| -------------------------------- | --------------------------- |
| `oxlint-config-universe/default` | General TypeScript projects |
| `oxlint-config-universe/native`  | React Native / Expo apps    |
| `oxlint-config-universe/node`    | Node.js projects            |
| `oxlint-config-universe/web`     | Web / React projects        |

You can also import all presets from the main entry:

```ts
import { native } from 'oxlint-config-universe';
```

## Type-aware TypeScript rules

For type-aware linting (rules that use the TypeScript type checker, like `no-floating-promises`), import the `typescript-analysis` shared config:

```ts
import { defineConfig } from 'oxlint';
import native from 'oxlint-config-universe/native';
import typescriptAnalysis from 'oxlint-config-universe/typescript-analysis';

export default defineConfig({
  extends: [native, typescriptAnalysis],
});
```

This enables `typeAware: true` and adds rules like `await-thenable`, `no-floating-promises`, `no-misused-promises`, `prefer-nullish-coalescing`, etc. This requires [type-aware linting](https://oxc.rs/docs/guide/usage/type-aware-linting.html).

## Formatting

This config intentionally omits all formatting/style rules (spacing, semicolons, indentation, commas, etc.). Use [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for code formatting.

## Rules not covered by oxlint

The following rules from `eslint-config-universe` do not have oxlint equivalents. If you need them, you'll need to keep ESLint running alongside oxlint for these specific rules, or accept the gap.

### Core ESLint rules

| Rule              | Notes                                                            |
| ----------------- | ---------------------------------------------------------------- |
| `no-dupe-args`    | Not implemented in oxlint                                        |
| `no-implied-eval` | Only available as `typescript/no-implied-eval`, not for plain JS |
| `no-new-symbol`   | oxlint has `no-new-native-nonconstructor` as a successor         |
| `no-octal`        | Not implemented                                                  |
| `no-octal-escape` | Not implemented                                                  |

### Import rules

| Rule           | Notes                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `import/order` | Not implemented — use [oxfmt `sortImports`](https://oxc.rs/docs/guide/usage/formatter.html) instead |

Recommended oxfmt config to match eslint-config-universe import/order configuration fairly closely:

```json
"sortImports": {
  "groups": [
    ["builtin", "external"],
    ["internal", "subpath"],
    ["parent", "sibling", "index"],
    "unknown"
  ],
  "ignoreCase": false
}
```

### TypeScript rules

These ESLint rules have TypeScript-specific overrides that don't exist in oxlint. The base ESLint versions are included in core and may work adequately for TypeScript files, but lack TypeScript-aware handling (e.g., understanding type-only imports):

| Rule                                        | Notes                                     |
| ------------------------------------------- | ----------------------------------------- |
| `@typescript-eslint/no-dupe-class-members`  | Core `no-dupe-class-members` is included  |
| `@typescript-eslint/no-redeclare`           | Core `no-redeclare` is included           |
| `@typescript-eslint/no-unused-expressions`  | Core `no-unused-expressions` is included  |
| `@typescript-eslint/no-unused-vars`         | Core `no-unused-vars` is included         |
| `@typescript-eslint/no-useless-constructor` | Core `no-useless-constructor` is included |

### React rules

| Rule                                | Notes                                 |
| ----------------------------------- | ------------------------------------- |
| `react/jsx-no-bind`                 | Not implemented                       |
| `react/jsx-uses-react`              | Obsolete with React 17+ JSX transform |
| `react/jsx-uses-vars`               | Handled inherently by oxlint          |
| `react/no-access-state-in-setstate` | Not implemented                       |
| `react/no-did-update-set-state`     | Not implemented                       |

### Node rules

| Rule                    | Notes           |
| ----------------------- | --------------- |
| `no-buffer-constructor` | Not implemented |

### Prettier integration

The `prettier/prettier` rule and eslint-config-prettier are not applicable. Use [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting instead.
