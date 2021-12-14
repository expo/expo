---
title: Autolinking
---

## Search Options

### `searchPaths`

List of paths to search for Expo Modules. If none is provided, it accumulates all **node_modules** directories found when going up through the path components of the root directory of the package. This default behavior makes workspaces work out-of-the-box without any configurations.

### `exclude`

A list of npm package names to exclude from autolinking.

### `flags` 🍏

An object of custom flags to be passed to each `pod`, such as `inhibit_warnings`, `modular_headers` and `configurations`. See [Podfile Syntax Reference](https://guides.cocoapods.org/syntax/podfile.html#pod) for more informations.

## Commands

### `search`

Searches for Expo Modules to autolink.

```sh
yarn run expo-modules-autolinking search
```

### `resolve`

```sh
yarn run expo-modules-autolinking resolve --platform ios
```
