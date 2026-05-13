# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 3.8.0 — 2026-05-13

### 💡 Others

- Bump to `picomatch@^2.3.2` ([#45698](https://github.com/expo/expo/pull/45698) by [@kitten](https://github.com/kitten))

## 3.7.3 — 2026-05-07

### 💡 Others

- Drop automatically setting `node-linker=hoisted` for pnpm ([#45491](https://github.com/expo/expo/pull/45491) by [@kitten](https://github.com/kitten))

## 3.7.2 — 2026-05-06

_This version does not introduce any user-facing changes._

## 3.7.1 — 2026-05-06

_This version does not introduce any user-facing changes._

## 3.7.0 — 2026-05-05

### 🎉 New features

- Generate `AGENTS.md`, `CLAUDE.md`, and `.claude/settings.json` for new projects to provide AI coding agents with Expo-specific guidance and the `expo` skills plugin. Use `--no-agents-md` to skip. ([#44618](https://github.com/expo/expo/pull/44618) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Fixed plugin setup in `.claude/settings.json`. ([#44951](https://github.com/expo/expo/pull/44951) by [@kudo](https://github.com/kudo))

## 3.6.13 - 2026-04-21

### 💡 Others

- Replace tar dependency logic with `multitars` package ([#44764](https://github.com/expo/expo/pull/44764) by [@kitten](https://github.com/kitten))
- Update to `multitars@^1.0.0` ([#44774](https://github.com/expo/expo/pull/44774) by [@kitten](https://github.com/kitten))

## 3.6.12 - 2026-04-13

_This version does not introduce any user-facing changes._

## 3.6.11 - 2026-04-09

_This version does not introduce any user-facing changes._

## 3.6.10 - 2026-04-07

_This version does not introduce any user-facing changes._

## 3.6.9 - 2026-04-02

_This version does not introduce any user-facing changes._

## 3.6.8 - 2026-04-02

_This version does not introduce any user-facing changes._

## 3.6.7 - 2026-03-18

_This version does not introduce any user-facing changes._

## 3.6.6 — 2026-02-25

_This version does not introduce any user-facing changes._

## 3.6.5 — 2026-02-20

_This version does not introduce any user-facing changes._

## 3.6.4 — 2026-02-16

_This version does not introduce any user-facing changes._

## 3.6.3 — 2026-02-03

_This version does not introduce any user-facing changes._

## 3.6.2 — 2026-01-26

_This version does not introduce any user-facing changes._

## 3.6.1 — 2026-01-22

_This version does not introduce any user-facing changes._

## 3.6.0 — 2026-01-21

### 🎉 New features

- Skip initializing git repo if inside another repo ([#42052](https://github.com/expo/expo/pull/42052) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Auto-add missing android/ios npm scripts when they're likely missing ([#41964](https://github.com/expo/expo/pull/41964) by [@kitten](https://github.com/kitten))

## 3.5.10 - 2025-12-04

### 💡 Others

- Update to `glob@^13.0.0` ([#41079](https://github.com/expo/expo/pull/41079) by [@kitten](https://github.com/kitten))
- Update to `tar@^7.5.2` ([#40732](https://github.com/expo/expo/pull/40732) by [@kitten](https://github.com/kitten))

## 3.5.9 - 2025-11-17

_This version does not introduce any user-facing changes._

## 3.5.8 — 2025-09-11

_This version does not introduce any user-facing changes._

## 3.5.7 — 2025-09-02

_This version does not introduce any user-facing changes._

## 3.5.6 — 2025-08-31

_This version does not introduce any user-facing changes._

## 3.5.5 — 2025-08-27

_This version does not introduce any user-facing changes._

## 3.5.4 — 2025-08-25

_This version does not introduce any user-facing changes._

## 3.5.3 — 2025-08-21

### 🐛 Bug fixes

- Modify `_eas`, `_vscode`, `_github`, and `_cursor` parent folders to avoid creating an empty directory. ([#39002](https://github.com/expo/expo/pull/39002) by [@byCedric](https://github.com/byCedric))

## 3.5.2 — 2025-08-16

_This version does not introduce any user-facing changes._

## 3.5.1 — 2025-08-15

### 💡 Others

- Bump `@vercel/ncc` build ([#38801](https://github.com/expo/expo/pull/38801) by [@kitten](https://github.com/kitten))

## 3.5.0 — 2025-08-13

_This version does not introduce any user-facing changes._

## 3.4.3 - 2025-06-26

### 🐛 Bug fixes

- Update to `getenv@2.0.0` to support upper case boolean environment variables ([#36688](https://github.com/expo/expo/pull/36688) by [@stephenlacy](https://github.com/stephenlacy))

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 3.4.2 — 2025-05-01

_This version does not introduce any user-facing changes._

## 3.4.1 — 2025-04-30

### 💡 Others

- add template and example links to the default output ([#36235](https://github.com/expo/expo/pull/36235) by [@vonovak](https://github.com/vonovak))

## 3.4.0 — 2025-04-28

### 🎉 New features

- Add support for `.vscode`, `.eas`, `.github`, `.cursor` directories by using an underscore instead of a dot. ([#36240](https://github.com/expo/expo/pull/36240) by [@EvanBacon](https://github.com/EvanBacon))

## 3.3.3 — 2025-04-14

_This version does not introduce any user-facing changes._

## 3.3.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 3.3.1 — 2025-04-08

_This version does not introduce any user-facing changes._

## 3.3.0 — 2025-03-31

### 🎉 New features

- Support GitHub shorthand for templates ([#33383](https://github.com/expo/expo/pull/33383) by [@satya164](https://github.com/satya164))
- Add support for aliasing and deprecating examples. ([#35717](https://github.com/expo/expo/pull/35717) by [@brentvatne](https://github.com/brentvatne))

### 💡 Others

- Drop `fast-glob` in favor of `glob`. ([#35082](https://github.com/expo/expo/pull/35082) by [@kitten](https://github.com/kitten))
- Upgrade to `tar@6` ([#35315](https://github.com/expo/expo/pull/35315) by [@kitten](https://github.com/kitten))

## 3.1.6 - 2025-02-14

_This version does not introduce any user-facing changes._

## 3.1.5 - 2025-01-10

_This version does not introduce any user-facing changes._

## 3.1.4 - 2025-01-08

_This version does not introduce any user-facing changes._

## 3.1.3 - 2024-11-29

### 🐛 Bug fixes

- Support making templates for React Native macOS, and rename project name inside `contents.xcworkspacedata` files ([#30309](https://github.com/expo/expo/pull/30309) by [@shirakaba](https://github.com/shirakaba))

## 3.1.2 — 2024-11-14

_This version does not introduce any user-facing changes._

## 3.1.1 — 2024-11-11

_This version does not introduce any user-facing changes._

## 3.1.0 — 2024-11-04

### 🎉 New features

- Add log hint for `--template` and `--example` arguments. ([#32519](https://github.com/expo/expo/pull/32519) by [@kitten](https://github.com/kitten))

## 3.0.1 — 2024-10-22

### 💡 Others

- Update `tar` dependency. ([#29663](https://github.com/expo/expo/pull/29663) by [@Simek](https://github.com/Simek))
- Use `npx` for npm examples. ([#31012](https://github.com/expo/expo/pull/31012) by [](@kadikraman)(https://github.com/kadikraman))

## 3.0.0 — 2024-06-10

### 🛠 Breaking changes

- Bump minimum required Node version to `18.13.0`. ([#29422](https://github.com/expo/expo/pull/29422) by [@byCedric](https://github.com/byCedric))
- Removed `node-fetch` in favor of Node's built-in `fetch`. ([#29422](https://github.com/expo/expo/pull/29422) by [@byCedric](https://github.com/byCedric))

### 🎉 New features

### 🐛 Bug fixes

- Update list of available templates ([#29955](https://github.com/expo/expo/pull/29955) by [@kadikraman](https://github.com/kadikraman))

### 💡 Others

- Use proper `create-expo(-app)` reference in `--help` and clean up bun example. ([#29504](https://github.com/expo/expo/pull/29504) by [@byCedric](https://github.com/byCedric))

## 2.3.4 — 2024-05-01

### 🐛 Bug fixes

- Allow templates and examples omitting root `expo:` object in `app.json`. ([#28521](https://github.com/expo/expo/pull/28521) by [@byCedric](https://github.com/byCedric))
- Configure `pnpm` and `yarn` v3+ package managers when providing `--no-install`. ([#28521](https://github.com/expo/expo/pull/28521) by [@byCedric](https://github.com/byCedric))

## 2.3.3 — 2024-04-29

### 🎉 New features

- support GitHub URLs that don't have a protocol. ([#28435](https://github.com/expo/expo/pull/28435) by [@EvanBacon](https://github.com/EvanBacon))

## 2.3.2 — 2024-04-24

_This version does not introduce any user-facing changes._

## 2.3.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 2.2.0 — 2024-04-18

### 🎉 New features

- Add support for GitHub URLs in `--template` option. ([#26554](https://github.com/expo/expo/pull/26554) by [@byCedric](https://github.com/byCedric))
- Add auto-configuration for pnpm and yarn berry. ([#27699](https://github.com/expo/expo/pull/27699) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Document basic assumptions about the templating system. ([#27071](https://github.com/expo/expo/pull/27071) by [@byCedric](https://github.com/byCedric))

## 2.1.4 - 2024-02-06

### 🐛 Bug fixes

- Rename templates post-extraction (rather than whilst extracting) via an internal "rename config", to avoid corrupting binary files ([#27212](https://github.com/expo/expo/pull/27212) by [@shirakaba](https://github.com/shirakaba))
- Mark compressed `.gz` files as binary to avoid corruption when unpacking with `create-expo --template` ([#26741](https://github.com/expo/expo/pull/26741) by [@shirakaba](https://github.com/shirakaba))

## 2.1.3 — 2023-12-12

### 💡 Others

- Replace `@expo/babel-preset-cli` with `expo-module-scripts`. ([#25424](https://github.com/expo/expo/pull/25424) by [@byCedric](https://github.com/byCedric))

## 2.1.2 — 2023-10-17

### 🐛 Bug fixes

- Upgrade `minipass@3.3.6` to use built-in types. ([#24402](https://github.com/expo/expo/pull/24402) by [@byCedric](https://github.com/byCedric))
- Pin `tar@6.1.13` to avoid `minipass` compatibility issues. ([#24402](https://github.com/expo/expo/pull/24402) by [@byCedric](https://github.com/byCedric))

## 2.1.1 — 2023-09-11

### 🎉 New features

- Detect bun package manager. ([#4752](https://github.com/expo/expo-cli/pull/4752) by [@colinhacks](https://github.com/colinhacks))

### 💡 Others

- Bump @expo/package-manager and update changelog. ([80c1f0e7](https://github.com/expo/expo-cli/commit/80c1f0e747615f58d51dfdd9b3e685480fdc4547) by [@brentvatne](https://github.com/brentvatne))

## 2.0.4 — 2023-08-25

### 🐛 Bug fixes

- Allow scoped template package names. ([#4752](https://github.com/expo/expo-cli/pull/4750) by [@takameyer](https://github.com/takameyer)

## 2.0.3 — 2023-06-07

### 💡 Others

- Update snapshots and list of forbidden template names. ([#4717](https://github.com/expo/expo-cli/pull/4717) by [@EvanBacon](https://github.com/EvanBacon))
- Cross deploy `create-expo` to `create-expo-app`. ([#4698](https://github.com/expo/expo-cli/pull/4698) by [@EvanBacon](https://github.com/EvanBacon))
