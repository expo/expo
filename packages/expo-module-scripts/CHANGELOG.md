# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 4.1.7 — 2025-05-08

### 🎉 New features

- Added base **eslint.config.js** for ESLint 9. ([#36695](https://github.com/expo/expo/pull/36695) by [@kudo](https://github.com/kudo))

## 4.1.6 — 2025-04-30

_This version does not introduce any user-facing changes._

## 4.1.5 — 2025-04-25

### 🎉 New features

- Add TS config base for Node apps. ([#36322](https://github.com/expo/expo/pull/36322) by [@Simek]

## 4.1.4 — 2025-04-23

_This version does not introduce any user-facing changes._

## 4.1.3 — 2025-04-22

_This version does not introduce any user-facing changes._

## 4.1.2 — 2025-04-14

_This version does not introduce any user-facing changes._

## 4.1.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 4.1.0 — 2025-04-04

_This version does not introduce any user-facing changes._

## 4.0.4 - 2025-02-14

_This version does not introduce any user-facing changes._

## 4.0.3 - 2025-01-10

_This version does not introduce any user-facing changes._

## 4.0.2 — 2024-11-11

_This version does not introduce any user-facing changes._

## 4.0.1 — 2024-11-11

_This version does not introduce any user-facing changes._

## 4.0.0 — 2024-10-22

### 🎉 New features

- Add `DOM.Iterable` to TypeScript libs to support `FormData`. ([#31117](https://github.com/expo/expo/pull/31117) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for passing `platform` and `isServer` to the Babel caller to support `process.env.EXPO_OS` and other standard Expo CLI transforms in Jest. ([#29429](https://github.com/expo/expo/pull/29429) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Detect workspace root for monorepos using pnpm. ([#31124](https://github.com/expo/expo/pull/31124) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Show meaningful error when podspecPath is not defined. ([#20789](https://github.com/expo/expo/pull/20789) by [@deggertsen](https://github.com/deggertsen))
- Add experimental `__rsc_tests__` directory to npm ignore. ([#29404](https://github.com/expo/expo/pull/29404) by [@EvanBacon](https://github.com/EvanBacon))
- Update `commander` dependency. ([#29603](https://github.com/expo/expo/pull/29603) by [@Simek](https://github.com/Simek))
- Update `glob@7` to `glob@10`. ([#29931](https://github.com/expo/expo/pull/29931) by [@byCedric](https://github.com/byCedric))
- Add temporary workaround for deprecated `react-test-renderer@19`. ([#30742](https://github.com/expo/expo/pull/30742) by [@byCedric](https://github.com/byCedric))

## 3.5.2 - 2024-05-29

### 🎉 New features

- Add support for building scripts directory (similar to cli, utils, and plugins). ([#29099](https://github.com/expo/expo/pull/29099) by [@brentvatne](https://github.com/brentvatne))

## 3.5.1 — 2024-04-23

_This version does not introduce any user-facing changes._

## 3.5.0 — 2024-04-18

### 🎉 New features

- Add support for package cli and utils subpackages (like plugins). ([#27083](https://github.com/expo/expo/pull/27083) by [@wschurman](https://github.com/wschurman))

### 🐛 Bug fixes

- Use appropriate version of `tsc` when executing `expo-module build` in monorepos with multiple typescript versions installed ([#27779](https://github.com/expo/expo/pull/27779) by [@peter.jozsa](https://github.com/peter.jozsa)

### 💡 Others

- Target Node 18 in the Babel CLI preset. ([#26847](https://github.com/expo/expo/pull/26847) by [@simek](https://github.com/simek))
- Update Babel dependencies to the latest version from `7.23` releases. ([#26525](https://github.com/expo/expo/pull/26525) by [@simek](https://github.com/simek))

## 3.4.1 - 2024-02-01

### 🐛 Bug fixes

- Use `node18` tsconfig in `expo-module-scripts` to match the dependencies. ([#26738](https://github.com/expo/expo/pull/26738)) by ([@krystofwoldrich](https://github.com/krystofwoldrich)) ([#26738](https://github.com/expo/expo/pull/26738) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 3.4.0 — 2023-12-12

### 🎉 New features

- Add Node-specific Babel and Jest configurations. ([#25458](https://github.com/expo/expo/pull/25458) by [@byCedric](https://github.com/byCedric))
- Add Node override in ESLint config for root configuration files. ([#25767](https://github.com/expo/expo/pull/25767) by [@byCedric](https://github.com/byCedric))

## 3.3.0 — 2023-11-14

### 🐛 Bug fixes

- Remove watchPlugins from sub-projects when using multi-project runner. ([#25302](https://github.com/expo/expo/pull/25302) by [@EvanBacon](https://github.com/EvanBacon))
- Default to using jest-preset-plugin when running `yarn test plugin` with no `plugin/jest.config.js` file. ([#25302](https://github.com/expo/expo/pull/25302) by [@EvanBacon](https://github.com/EvanBacon))

## 3.2.0 — 2023-10-17

### 🎉 New features

- Preserve JSX in production exports to support jsx/createElement interception. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Transpile for Node 18 (LTS). ([#24471](https://github.com/expo/expo/pull/24471) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.1 — 2023-09-18

_This version does not introduce any user-facing changes._

## 3.1.0 — 2023-08-02

_This version does not introduce any user-facing changes._

## 3.0.12 — 2023-07-26

_This version does not introduce any user-facing changes._

## 3.0.10 — 2023-06-22

_This version does not introduce any user-facing changes._

## 3.0.9 — 2023-06-02

### 🐛 Bug fixes

- Fixed `npx` script failing when `yarn` is not installed. ([#22582](https://github.com/expo/expo/pull/22582) by [@tsapeta](https://github.com/tsapeta))

## 3.0.8 — 2023-05-08

_This version does not introduce any user-facing changes._

## 3.0.7 — 2023-02-09

_This version does not introduce any user-facing changes._

## 3.0.6 — 2023-02-03

### 📚 3rd party library updates

- Upgrade jest to v29. ([#20832](https://github.com/expo/expo/pull/20832) by [@kudo](https://github.com/kudo))

## 3.0.5 — 2022-12-30

_This version does not introduce any user-facing changes._

## 3.0.3 — 2022-11-02

_This version does not introduce any user-facing changes._

## 3.0.2 — 2022-10-30

### 💡 Others

- Remove Enzyme plugin - it does not work with React 18. Not considered a breaking change because the Enzyme plugin has never worked with React 18 and so is already broken. ([#19777](https://github.com/expo/expo/pull/19777) by [@brentvatne](https://github.com/brentvatne))

## 3.0.1 — 2022-10-28

_This version does not introduce any user-facing changes._

## 3.0.0 — 2022-10-25

### 🛠 Breaking changes

- [plugin] Upgrade minimum runtime requirement to Node 14 (LTS). ([#18204](https://github.com/expo/expo/pull/18204) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Use the correct TSConfig package in dependencies to match one referred in `tsconfig.plugin.json`. ([#19670](https://github.com/expo/expo/pull/19670) by [@Simek](https://github.com/Simek))

## 2.1.1 - 2022-08-22

### 🐛 Bug fixes

- Fixed _with-node.sh_ doesn't keep quotes when passing arguments to Node.js and caused build errors when there are spaces in target name. ([#18741](https://github.com/expo/expo/pull/18741) by [@kudo](https://github.com/kudo))

## 2.1.0 — 2022-08-04

### 🎉 New features

- Add `templates/scripts/source-login-scripts.sh` vendoring tool for node binary resolution in Xcode build phases scripts. ([#15336](https://github.com/expo/expo/pull/15336) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Fixed `source-login-scripts.sh` error when `extendedglob` is enabled in zsh config. ([#17024](https://github.com/expo/expo/pull/17024) by [@kudo](https://github.com/kudo))
- Fixed `expo-module prepare` error if target packages contain temporary kotlin build files. ([#17023](https://github.com/expo/expo/pull/17023) by [@kudo](https://github.com/kudo))
- Improved support of nvm sourcing in iOS shell scripts. ([#17109](https://github.com/expo/expo/pull/17109) by [@liamronancb](https://github.com/liamronancb))
- Fixed `source-login-scripts.sh` ~/zlogin typo. ([#17622](https://github.com/expo/expo/pull/17622) by [@vrgimael](https://github.com/vrgimael))
- Deprecated the unreliable `source-login-scripts.sh` and sourcing the Node.js binary path from `.xcode.env` and `.xcode.env.local`. ([#18330](https://github.com/expo/expo/pull/18330) by [@kudo](https://github.com/kudo))

### 💡 Others

- Updated `@testing-library/react-hooks` to version `7.0.1`. ([#14552](https://github.com/expo/expo/pull/14552)) by [@Simek](https://github.com/Simek))
