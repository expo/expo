# Why

Enable `noUncheckedIndexedAccess` in TypeScript configs to catch potential `undefined` access on arrays and index signatures at compile time, improving type safety across packages.

# How

- Added `noUncheckedIndexedAccess: true` to `tsconfig.base.json`, `tsconfig.plugin.json`, and `tsconfig.node.json` in `expo-module-scripts`
- Fixed all resulting TS errors across ~50 source files in packages (excluding `expo-router` and `@expo`)
- Common fix patterns: `for...of` instead of indexed loops on `Uint8Array`/`string`, `?? fallback` for numeric array access, nullish guards before using indexed values, default values in destructuring

# Test Plan

- Ran `tsc --noEmit` on every package extending `tsconfig.base` and `tsconfig.plugin` — all pass with 0 errors (except pre-existing unrelated issues in `eslint-config-*` test configs and `expo-dev-launcher`)

# Checklist

- [ ] I added a `changelog.md` entry and rebuilt the package sources according to [this short guide](https://github.com/expo/expo/blob/main/CONTRIBUTING.md#-before-submitting)
- [ ] This diff will work correctly for `npx expo prebuild` & EAS Build (eg: updated a module plugin).
- [ ] Conforms with the [Documentation Writing Style Guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md)
