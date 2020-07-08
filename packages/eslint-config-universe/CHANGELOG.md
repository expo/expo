# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 4.0.0 — 2020-07-08

### 🐛 Bug fixes

# 4.0.0 - 2020-07-08

### 🛠 Breaking changes

- Upgraded `@typescript-eslint/eslint-plugin` to 3.3.0 and `@typescript-eslint/parser` to 3.3.0. [See the v3 changelog for `typescript-eslint`.](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v3.0.0)
- Removed the React linting configuration from `eslint-config-universe/node`. If you want to lint React, extend `['universe/node', 'universe/shared/react']`.

### 🎉 New features

- Added `react-hooks/rules-of-hooks` (`react-hooks/exhaustive-deps` is turned off; enable it in your own project if desired).
- Disable `react/style-prop-object` lint rule.
- Support ESLint v7.

## 3.0.2 — 2020-05-27

# Breaking changes

- Removed Flow support (`eslint-plugin-flowtype`)
- Added `prefer-const` setting (notes)[https://github.com/expo/expo/blob/66af3ddc987bda0b88d5fc7ed86204a975f068c3/guides/Expo%20JavaScript%20Style%20Guide.md#let-and-const]

# Minor changes

- Upgraded minor versions of dependencies
