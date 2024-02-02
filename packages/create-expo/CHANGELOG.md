# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add support for GitHub URLs in `--template` option. ([#26554](https://github.com/expo/expo/pull/26554) by [@byCedric](https://github.com/byCedric))

### 🐛 Bug fixes

- Mark compressed `.gz` files as binary to avoid corruption when unpacking with `create-expo --template` ([#26741](https://github.com/expo/expo/pull/26741) by [@shirakaba](https://github.com/shirakaba))

### 💡 Others

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
