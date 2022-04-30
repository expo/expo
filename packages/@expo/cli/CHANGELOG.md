# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Remove hanging `emulator` process on exit. ([#17273](https://github.com/expo/expo/pull/17273) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bug where autocomplete prompts crash when escape characters are used. ([#17271](https://github.com/expo/expo/pull/17271) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- deduplicate asMock helper function. ([#17294](https://github.com/expo/expo/pull/17294) by [@wschurman](https://github.com/wschurman))

## 0.1.3 — 2022-04-28

### 🐛 Bug fixes

- add missing `pretty-bytes` dependency. ([#17235](https://github.com/expo/expo/pull/17235) by [@EvanBacon](https://github.com/EvanBacon))

## 0.1.2 — 2022-04-27

_This version does not introduce any user-facing changes._

## 0.1.1 — 2022-04-27

### 🎉 New features

- Unify help prompts. ([#17223](https://github.com/expo/expo/pull/17223) by [@EvanBacon](https://github.com/EvanBacon))
- Added `expo run:android` command. ([#17187](https://github.com/expo/expo/pull/17187) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Add support for `react-native@0.68` dev server API. ([#17189](https://github.com/expo/expo/pull/17189) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Downgrade `fs-extra` to `8.1.0`. ([#17234](https://github.com/expo/expo/pull/17234) by [@EvanBacon](https://github.com/EvanBacon))

## 0.1.0 — 2022-04-25

### 🎉 New features

- [cli] Added modules for interacting with Apple and Android platforms. ([#16516](https://github.com/expo/expo/pull/16516) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added middleware for showing the interstitial page and redirecting users to dev clients. ([#16560](https://github.com/expo/expo/pull/16560) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added middleware for dev servers to host Expo manifests. ([#16559](https://github.com/expo/expo/pull/16559) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added module for starting host tunnels with Ngrok. ([#16556](https://github.com/expo/expo/pull/16556) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added module for updating the "development session" API. ([#16555](https://github.com/expo/expo/pull/16555) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added modules for creating dev server URLs, akin to `UrlUtils` in `xdl`. ([#16557](https://github.com/expo/expo/pull/16557) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added shim for `expo start` command and option resolvers. ([#16587](https://github.com/expo/expo/pull/16587) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added module for interacting with Metro bundler. ([#16631](https://github.com/expo/expo/pull/16631) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added Terminal UI to `expo start`. ([#16518](https://github.com/expo/expo/pull/16518) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added a custom terminal logger for Metro dev server. ([#16658](https://github.com/expo/expo/pull/16658) by [@EvanBacon](https://github.com/EvanBacon))
- [cli] Added module for interacting with Webpack bundler. ([#16659](https://github.com/expo/expo/pull/16659) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed type errors. ([#16724](https://github.com/expo/expo/pull/16724) by [@EvanBacon](https://github.com/EvanBacon))
- Disable watch mode in CI. ([#16730](https://github.com/expo/expo/pull/16730) by [@EvanBacon](https://github.com/EvanBacon))
- Added `install` command. ([#16756](https://github.com/expo/expo/pull/16756) by [@EvanBacon](https://github.com/EvanBacon))
- Serve modern manifests in multipart format. ([#16804](https://github.com/expo/expo/pull/16804) by [@wschurman](https://github.com/wschurman))
- Add development code signing. ([#16845](https://github.com/expo/expo/pull/16845) by [@wschurman](https://github.com/wschurman))
- Added `export` command. ([#17034](https://github.com/expo/expo/pull/17034) by [@EvanBacon](https://github.com/EvanBacon))
- Add `--fix` and `--check` arguments to `install` command. ([#17048](https://github.com/expo/expo/pull/17048) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix process memory leak warning in `expo start`. ([#16753](https://github.com/expo/expo/pull/16753) by [@EvanBacon](https://github.com/EvanBacon))
- Fix build watcher. ([#16754](https://github.com/expo/expo/pull/16754) by [@EvanBacon](https://github.com/EvanBacon))
- Allow bailing out of Terminal UI during long processes. ([#16818](https://github.com/expo/expo/pull/16818) by [@EvanBacon](https://github.com/EvanBacon))
- Fix web imports and dependency resolution. ([#16820](https://github.com/expo/expo/pull/16820) by [@EvanBacon](https://github.com/EvanBacon))
- [test] Update login error message to reflect server change. ([#16932](https://github.com/expo/expo/pull/16932) by [@EvanBacon](https://github.com/EvanBacon))
- Fix webpack imports and server timeouts. ([#17006](https://github.com/expo/expo/pull/17006) by [@EvanBacon](https://github.com/EvanBacon))
- Skip font parsing on prebuild. ([#17184](https://github.com/expo/expo/pull/17184) by [@EvanBacon](https://github.com/EvanBacon))
- [ci] Fix `typecheck`. ([#17145](https://github.com/expo/expo/pull/17145) by [@EvanBacon](https://github.com/EvanBacon))
- Close development session when CLI is stopped ([#17170](https://github.com/expo/expo/pull/17170) by [@FiberJW](https://github.com/FiberJW))

### 💡 Others

- Improve contributing. ([#16917](https://github.com/expo/expo/pull/16917) by [@EvanBacon](https://github.com/EvanBacon))
- Reduce mock clearing and add `Log` import/export. ([#17046](https://github.com/expo/expo/pull/17046) by [@EvanBacon](https://github.com/EvanBacon))
- Lazily evaluate all environment variables. ([#17082](https://github.com/expo/expo/pull/17082) by [@EvanBacon](https://github.com/EvanBacon))
