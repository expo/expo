# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 2.1.1 — 2022-08-22

### 🐛 Bug fixes

- Fixed *with-node.sh* doesn't keep quotes when passing arguments to Node.js and caused build errors when there are spaces in target name. ([#18741](https://github.com/expo/expo/pull/18741) by [@kudo](https://github.com/kudo))

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
