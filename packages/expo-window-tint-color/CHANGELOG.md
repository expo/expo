# Changelog

## 0.1.0 — 2025-01-17

### 🎉 New features

- Initial release of `expo-window-tint-color` ([#40457](https://github.com/expo/expo/pull/40457) by [@dngrhm](https://github.com/dngrhm))
- Adds config plugin to set iOS `window.tintColor` from `app.json`
- Supports three configuration methods: `ios.windowTintColor`, plugin props, and shorthand string
- Works around iOS 26 bug where inline tab bar layout ignores per-item tint colors
- Full TypeScript support with type definitions
- Compatible with Expo SDK 50+ and React Native 0.74+
