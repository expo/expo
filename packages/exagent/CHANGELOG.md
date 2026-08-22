# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Initial `exagent` package: `skills` command (sync/list/show/clean) ported from the `@expo/cli` proof-of-concept. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add `exagent start --plan` and `exagent start --smart`: decide between `expo start`, `expo prebuild`, and `expo run:*` from the project state, emit the plan with time-class estimates, then optionally run it. ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))
- Add the project-state probe with the Expo Go compatibility check, the `exagent context` command (`--json` for the machine-readable project brief), and the post-install impact report of `exagent install` (`--no-impact` to skip it). ([#49229](https://github.com/expo/expo/pull/49229) by [@expo-tuft[bot]](https://github.com/apps/expo-tuft))

### 🐛 Bug fixes

### 💡 Others
