# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Initial agent-cli work. ([#49654](https://github.com/expo/expo/pull/49654) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- `smoke` no longer trusts an installed Expo Go without checking it: an Expo Go from a different SDK release line than the project cannot load its bundle, so the run is `inconclusive` rather than `passed` and names `npx expo start --<platform>`. An older patch of the same line is reported and decides nothing. The expected release comes from the `expo-go` CLI as a subprocess. ([#49654](https://github.com/expo/expo/pull/49654) by [@kudo](https://github.com/kudo))
- `smoke` and `navigate` no longer target Expo Go for a project that cannot run in it. The deep-link decision now reads the same Expo Go compatibility the plan engine and `status` read, and `smoke` will not report `passed` when the app that answered is an Expo Go the project's native code is not in. ([#49654](https://github.com/expo/expo/pull/49654) by [@kudo](https://github.com/kudo))

- `smoke` now reloads an app that was already running onto the code on disk before it reads it, so the gate no longer passes an app whose error window and screenshot are from before the edit. A reload it cannot prove is `inconclusive` rather than `passed`, and `--no-reload` opts out. ([#49654](https://github.com/expo/expo/pull/49654) by [@kudo](https://github.com/kudo))
- `dev --detach` no longer reports a detached dev server for a plan step that opens the app and is then refused by macOS after the lock appeared. The grace window that catches that refusal no longer requires `--wait-ready`, so a `dev --detach --ios` now spends it before reporting. ([#49654](https://github.com/expo/expo/pull/49654) by [@kudo](https://github.com/kudo))

### 💡 Others
