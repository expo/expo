# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 7.0.1 — 2021-01-15

_This version does not introduce any user-facing changes._

## 7.0.0 - 2021-01-05

### 🛠 Breaking changes

- Warn when `var` is used by enabling the eslint `no-var` rule.
- Upgraded `@typescript-eslint/eslint-plugin` to 4.12.0 and `@typescript-eslint/parser` to 4.12.0. [See the changelog for `typescript-eslint`.](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v4.12.0).

## 6.0.1 — 2020-10-21

### 🐛 Bug fixes

Make `@babel/core` an optional peer dependency since pure TypeScript projects don't need it

## 6.0.0 — 2020-10-19

### 🛠 Breaking changes

- Replaced `babel-eslint` (now deprecated) with `@babel/eslint-parser`. This fixes a peer dependency warning. See [`babel-eslint` v11's readme](https://github.com/babel/babel-eslint/blob/b5b9a09edbac4350e4e51033a4608dd95dad1f67/README.md#breaking-changes-in-v11xx) for information about the main breaking change. Namely, Babel config files are now loaded. See [the `@babel/eslint-parser` readme](https://github.com/babel/babel/tree/main/eslint/babel-eslint-parser) for further information.
- Removed support for parsing legacy decorators in JS files. Decorators are likely still a few years away from completion and we don't use them anymore.

## 5.0.0 — 2020-10-01

### 🛠 Breaking changes

- Upgraded `@typescript-eslint/eslint-plugin` to 4.2.0 and `@typescript-eslint/parser` to 4.2.0. [See the changelog for `typescript-eslint`.](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v4.2.0). Notably undeclared variables are no longer linted in TypeScript files and this is now the responsibility of `tsc`.

### 🎉 New features

- Upgraded `eslint` to 7.9.0. [See the changelog for `eslint`.](https://eslint.org/blog/)

### 🐛 Bug fixes

- Override `no-unused-expressions` and `semi` with `@babel/no-unused-expressions` and `@babel/semi` to fix a bug with optional chaining. Upgraded the minor version of various dependecies.

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
