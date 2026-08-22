# @expo/platform-metadata

Platform identity metadata shared by Expo tooling. This package has **zero runtime dependencies** so that every layer of the toolchain can consume it — `expo-modules-autolinking`, `@expo/config`, `@expo/metro-config`, and `@expo/cli` — without creating dependency cycles.

It contains pure data and pure functions over platform names:

- The set of platform names Expo tooling recognizes, and which of them are out-of-tree platforms.
- The react-native host package for each platform (for example `tvos` → `react-native-tvos`).
- Metro source-extension fallback chains for out-of-tree platforms (for example `tvos` → `ios` → `native`).

It deliberately contains **no behavior**: no filesystem access, no path resolution, no config plugins. Behavioral platform code lives with its consumers.

## Why

Before this package, each of these tables was duplicated across packages that cannot depend on each other, and the copies drifted. This package is the single source of truth for platform identity.
