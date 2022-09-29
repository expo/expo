# Changelog

## Unpublished

### 🛠 Breaking changes

- Drop support for copying `index.js` and removing `main` field in `package.json` during `expo prebuild` in favor of native build scripts which resolve the user-defined entry file. ([#18381](https://github.com/expo/expo/pull/18381) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Added middleware for creating files. ([#19231](https://github.com/expo/expo/pull/19231) by [@EvanBacon](https://github.com/EvanBacon))
- Enable `require.context` by default. ([#19257](https://github.com/expo/expo/pull/19257) by [@EvanBacon](https://github.com/EvanBacon))
- Handle all development session errors. ([#18499](https://github.com/expo/expo/pull/18499) by [@EvanBacon](https://github.com/EvanBacon))
- Add `EXPO_NO_DEFAULT_PORT` to skip proxy port. ([#18464](https://github.com/expo/expo/pull/18464) by [@EvanBacon](https://github.com/EvanBacon))
- Disable interactive prompts in non TTY processes. ([#18300](https://github.com/expo/expo/pull/18300) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Resolve bundle identifier / package from native project and then fallback to `app.json` when launching redirect page. ([#19260](https://github.com/expo/expo/pull/19260) by [@brentvatne](https://github.com/brentvatne))
- Resolve bundle identifier from `app.json` correctly when using `npx expo start --dev-client --ios` with no local `ios` directory. ([#18747](https://github.com/expo/expo/pull/18747) by [@EvanBacon](https://github.com/EvanBacon))
- Add web support check to metro web in `expo start`. ([#18428](https://github.com/expo/expo/pull/18428) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent development session bad gateway from ending long running `expo start` processes. ([#18451](https://github.com/expo/expo/pull/18451) by [@EvanBacon](https://github.com/EvanBacon))
- Speed up native device opening for iOS and Android. ([#18385](https://github.com/expo/expo/pull/18385) by [@EvanBacon](https://github.com/EvanBacon))
- Drop support for experimental Webpack native symbolication. ([#18439](https://github.com/expo/expo/pull/18439) by [@EvanBacon](https://github.com/EvanBacon))
- Implement getApplicationIdFromBundle fixing iOS app launch issue with SDK 46. ([#18537](https://github.com/expo/expo/pull/18537) by [@Anthony Mittaz](https://github.com/Anthony Mittaz))
- Change `UNAUTHORIZED_ERROR` to `UNAUTHORIZED` to handle unauthorized errors. ([#18751](https://github.com/expo/expo/pull/18751) by [@EvanBacon](https://github.com/EvanBacon))
- Catch error thrown when trying to launch redirect page without an application ID defined in `app.json`. ([#19312](https://github.com/expo/expo/pull/19312) by [@esamelson](https://github.com/esamelson))

### 💡 Others

- Change asset registry redirect for Metro web to point to the shared alias in `react-native`. ([#19234](https://github.com/expo/expo/pull/19234) by [@EvanBacon](https://github.com/EvanBacon))
- Hide server rate limiting warning during `npx expo start`. ([#19038](https://github.com/expo/expo/pull/19038) by [@EvanBacon](https://github.com/EvanBacon))
- Update the README file. ([#18663](https://github.com/expo/expo/pull/18663) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `prebuild` e2e tests. ([#18612](https://github.com/expo/expo/pull/18612) by [@EvanBacon](https://github.com/EvanBacon))
- Add warning about malformed project when running prebuild in non-interactive mode. ([#18436](https://github.com/expo/expo/pull/18436) by [@wkozyra95](https://github.com/wkozyra95))
- [Interstitial page] Capture missing analytics event when user opens development build. ([#18792](https://github.com/expo/expo/pull/18792) by [@esamelson](https://github.com/esamelson))
- [Interstitial page] Ensure that the development build is installed when opening the interstitial page. ([#18836](https://github.com/expo/expo/pull/18836) by [@esamelson](https://github.com/esamelson))
- [Interstitial page] Point QR code to interstitial page when enabled. ([#18838](https://github.com/expo/expo/pull/18838) by [@esamelson](https://github.com/esamelson))
- [Interstitial page] Minor improvements to page; try to detect if deep link succeeded. ([#18839](https://github.com/expo/expo/pull/18839) by [@esamelson](https://github.com/esamelson))
- [Interstitial page] Flip value and change name of env flag to EXPO_NO_REDIRECT_PAGE. ([#18840](https://github.com/expo/expo/pull/18840) by [@esamelson](https://github.com/esamelson))

## 0.2.6 — 2022-07-25

### 🎉 New features

- Add telemetry event tracking a command run. ([#17948](https://github.com/expo/expo/pull/17948) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Ensure `expo build:web` recommends running `expo export:web` in the migration warning. ([#18312](https://github.com/expo/expo/pull/18312) by [@EvanBacon](https://github.com/EvanBacon))

## 0.2.5 — 2022-07-19

_This version does not introduce any user-facing changes._

## 0.2.4 — 2022-07-19

### 🐛 Bug fixes

- Add mock `--non-interactive` flag to hide `eas update` errors. ([#18299](https://github.com/expo/expo/pull/18299) by [@EvanBacon](https://github.com/EvanBacon))

## 0.2.3 — 2022-07-19

### 🎉 New features

- Add `EXPO_EDITOR` environment variable for overriding the `EDITOR` variable. This is used in the `expo start` Terminal UI when pressing `o`. ([#18285](https://github.com/expo/expo/pull/18285) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix bug preventing the installation of beta clients. ([#18298](https://github.com/expo/expo/pull/18298) by [@EvanBacon](https://github.com/EvanBacon))

## 0.2.2 — 2022-07-18

_This version does not introduce any user-facing changes._

## 0.2.1 — 2022-07-11

### 💡 Others

- Drop hardcoded web package versions in prerequisite. ([#18172](https://github.com/expo/expo/pull/18172) by [@EvanBacon](https://github.com/EvanBacon))

## 0.2.0 — 2022-07-07

### 🛠 Breaking changes

- Change `expo` to `expo-internal` (DO NOT USE) for `@expo/cli`. ([#17468](https://github.com/expo/expo/pull/17468) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Validate Android SDK configuration before using ([#17259](https://github.com/expo/expo/pull/17259) by [@byCedric](https://github.com/byCedric))
- Add CI context to telemetry to help determine support on used CI providers ([#17284](https://github.com/expo/expo/pull/17284) by [@byCedric](https://github.com/byCedric))
- add `--pnpm` option to `install` command. ([#17366](https://github.com/expo/expo/pull/17366) by [@EvanBacon](https://github.com/EvanBacon))
- Added `export:web` command. ([#17363](https://github.com/expo/expo/pull/17363) by [@EvanBacon](https://github.com/EvanBacon))
- Bail out on missing web dependencies. ([#17448](https://github.com/expo/expo/pull/17448) by [@EvanBacon](https://github.com/EvanBacon))
- Add info about using the `--clear` flag when the `babel.config.js` file changes during `expo start`. ([#17560](https://github.com/expo/expo/pull/17560) by [@EvanBacon](https://github.com/EvanBacon))
- Automatically enable `DEBUG` when `EXPO_DEBUG` is enabled. ([#17856](https://github.com/expo/expo/pull/17856) by [@EvanBacon](https://github.com/EvanBacon))
- add migration warning for old commands. ([#17882](https://github.com/expo/expo/pull/17882) by [@EvanBacon](https://github.com/EvanBacon))
- Add web support for Metro bundler. ([#17927](https://github.com/expo/expo/pull/17927) by [@EvanBacon](https://github.com/EvanBacon))
- Add multi-platform bundle logging during `expo export`. ([#17992](https://github.com/expo/expo/pull/17992) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade react-native to 0.69. ([#18006](https://github.com/expo/expo/pull/18006) by [@kudo](https://github.com/kudo))

### 🐛 Bug fixes

- Remove hanging `emulator` process on exit. ([#17273](https://github.com/expo/expo/pull/17273) by [@EvanBacon](https://github.com/EvanBacon))
- Fix bug where autocomplete prompts crash when escape characters are used. ([#17271](https://github.com/expo/expo/pull/17271) by [@EvanBacon](https://github.com/EvanBacon))
- add missing `--platform` flag to `export` command. ([#17338](https://github.com/expo/expo/pull/17338) by [@EvanBacon](https://github.com/EvanBacon))
- Fix ADB device name filtering for windows. ([#17286](https://github.com/expo/expo/pull/17286) by [@byCedric](https://github.com/byCedric))
- Fix `export` bug failing when no assets are included. ([#17414](https://github.com/expo/expo/pull/17414) by [@EvanBacon](https://github.com/EvanBacon))
- Add correct packages (`expo-splash-screen`) and drop incorrect required packages (`react-native-unimodules`, `expo-updates`) in prebuild. ([#17447](https://github.com/expo/expo/pull/17447) by [@EvanBacon](https://github.com/EvanBacon))
- Fix tunnel on web breaking native. ([#17666](https://github.com/expo/expo/pull/17666) by [@EvanBacon](https://github.com/EvanBacon))
- Add no-op `--experimental-bundle` flag to `expo export`. ([#17886](https://github.com/expo/expo/pull/17886) by [@EvanBacon](https://github.com/EvanBacon))
- Fix auto TypeScript version check. ([#17911](https://github.com/expo/expo/pull/17911) by [@EvanBacon](https://github.com/EvanBacon))
- Fix ignored existing plugins on expo install. ([#17936](https://github.com/expo/expo/pull/17936) by [@kbrandwijk](https://github.com/kbrandwijk))

### 💡 Others

- Bump `@expo/xcpretty` to link to the troubleshooting guide. ([#17576](https://github.com/expo/expo/pull/17576) by [@EvanBacon](https://github.com/EvanBacon))
- deduplicate asMock helper function. ([#17294](https://github.com/expo/expo/pull/17294) by [@wschurman](https://github.com/wschurman))
- Use `nxp expo install` for recommended missing dependency check. ([#17665](https://github.com/expo/expo/pull/17665) by [@EvanBacon](https://github.com/EvanBacon))
- Make bundler implementation more bundler agnostic. ([#17575](https://github.com/expo/expo/pull/17575) by [@EvanBacon](https://github.com/EvanBacon))
- Add debug log about unversioned packages. ([#17664](https://github.com/expo/expo/pull/17664) by [@EvanBacon](https://github.com/EvanBacon))
- Update test fixtures to SDK 45. ([#17934](https://github.com/expo/expo/pull/17934) by [@EvanBacon](https://github.com/EvanBacon))
- Bump `@expo/xcpretty` with support for `react-native@0.69` build errors. ([#17986](https://github.com/expo/expo/pull/17986) by [@EvanBacon](https://github.com/EvanBacon))

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
- Added `expo run:ios` command. ([#16662](https://github.com/expo/expo/pull/16662) by [@EvanBacon](https://github.com/EvanBacon))
- Fixed type errors. ([#16724](https://github.com/expo/expo/pull/16724) by [@EvanBacon](https://github.com/EvanBacon))
- Disable watch mode in CI. ([#16730](https://github.com/expo/expo/pull/16730) by [@EvanBacon](https://github.com/EvanBacon))
- Added `install` command. ([#16756](https://github.com/expo/expo/pull/16756) by [@EvanBacon](https://github.com/EvanBacon))
- Serve modern manifests in multipart format. ([#16804](https://github.com/expo/expo/pull/16804) by [@wschurman](https://github.com/wschurman))
- Add development code signing. ([#16845](https://github.com/expo/expo/pull/16845) by [@wschurman](https://github.com/wschurman))
- Added `export` command. ([#17034](https://github.com/expo/expo/pull/17034) by [@EvanBacon](https://github.com/EvanBacon))
- Add `--fix` and `--check` arguments to `install` command. ([#17048](https://github.com/expo/expo/pull/17048) by [@EvanBacon](https://github.com/EvanBacon))
- Added `customize` command. ([#17186](https://github.com/expo/expo/pull/17186) by [@EvanBacon](https://github.com/EvanBacon))

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
- Migrate to using `DEBUG=expo:*` instead of `EXPO_DEBUG`. ([#17084](https://github.com/expo/expo/pull/17084) by [@EvanBacon](https://github.com/EvanBacon))
- Lazily evaluate all environment variables. ([#17082](https://github.com/expo/expo/pull/17082) by [@EvanBacon](https://github.com/EvanBacon))
