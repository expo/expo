# Changelog

## Unpublished

### 🛠 Breaking changes

- Set `NODE_ENV` and `BABEL_ENV` environment variables to `development` or `production` in `start`, `export`, `customize`, `install`, `run:ios`, `run:android`, `config`, `prebuild` commands based on the input mode. ([#21337](https://github.com/expo/expo/pull/21337) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add internal `expo export:embed` command to replace `npx react-native bundle` in production builds. ([#21396](https://github.com/expo/expo/pull/21396) by [@EvanBacon](https://github.com/EvanBacon))
- Automatically install TypeScript dependencies when TypeScript files are added during `expo start`. ([#21475](https://github.com/expo/expo/pull/21475) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for `compilerOptions.baseUrl` from `tsconfig.json` and `jsconfig.json` files to Metro. ([#21262](https://github.com/expo/expo/pull/21262) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for `compilerOptions.paths` aliases from `tsconfig.json` and `jsconfig.json` files to Metro. ([#21262](https://github.com/expo/expo/pull/21262) by [@EvanBacon](https://github.com/EvanBacon))
- Reduce install prompt. ([#21264](https://github.com/expo/expo/pull/21264) by [@EvanBacon](https://github.com/EvanBacon))
- Improve multi-target iOS scheme resolution for `expo run:ios`. ([#21240](https://github.com/expo/expo/pull/21240) by [@EvanBacon](https://github.com/EvanBacon))
- Added experimental react-devtools integration. ([#21462](https://github.com/expo/expo/pull/21462) by [@kudo](https://github.com/kudo))
- Add experimental static rendering for Metro web in Expo Router. ([#21572](https://github.com/expo/expo/pull/21572) by [@EvanBacon](https://github.com/EvanBacon))
- Add experimental inspector proxy to handle more CDP requests. ([#21449](https://github.com/expo/expo/pull/21449) by [@byCedric](https://github.com/byCedric))
- Set node env for metro config in `expo export:embed`. ([#21644](https://github.com/expo/expo/pull/21644) by [@EvanBacon](https://github.com/EvanBacon))
- Add inspector proxy workarounds for known issues with vscode debugger and Hermes CDP messages. ([#21560](https://github.com/expo/expo/pull/21560) by [@byCedric](https://github.com/byCedric))
- Add inspector support for `Page.reload` CDP message. ([#21827](https://github.com/expo/expo/pull/21827) by [@byCedric](https://github.com/byCedric))
- Add Node.js rendering to Metro bundler and Node.js external imports. ([#21886](https://github.com/expo/expo/pull/21886) by [@EvanBacon](https://github.com/EvanBacon))
- Add support for emitting static CSS files when exporting web projects with `expo export`. ([#21941](https://github.com/expo/expo/pull/21941) by [@EvanBacon](https://github.com/EvanBacon))


### 🐛 Bug fixes

- Respond to `Debugger.getScriptSource` CDP messages when using lan or tunnel. ([#21825](https://github.com/expo/expo/pull/21825) by [@byCedric](https://github.com/byCedric))
- Fix main field resolution for metro web. ([#21939](https://github.com/expo/expo/pull/21939) by [@EvanBacon](https://github.com/EvanBacon))
- Fix legacy accept signature parsing. ([#21970](https://github.com/expo/expo/pull/21970) by [@wschurman](https://github.com/wschurman))


### 💡 Others

- Switch `EXPO_USE_PATH_ALIASES` to `expo.experiments.tsconfigPaths`. ([#21897](https://github.com/expo/expo/pull/21897) by [@EvanBacon](https://github.com/EvanBacon))
- Fallback on latest `@expo/metro-config` when local version isn't available (effects testing locally). ([#21643](https://github.com/expo/expo/pull/21643) by [@EvanBacon](https://github.com/EvanBacon))
- Update fixtures. ([#21397](https://github.com/expo/expo/pull/21397) by [@EvanBacon](https://github.com/EvanBacon))
- Upgrade e2e tests to SDK 47. ([#21335](https://github.com/expo/expo/pull/21335) by [@EvanBacon](https://github.com/EvanBacon))
- Update `metro.config.js` template file to match new template. ([#21898](https://github.com/expo/expo/pull/21898) by [@EvanBacon](https://github.com/EvanBacon))
- Fix node rendering. ([#21902](https://github.com/expo/expo/pull/21902) by [@EvanBacon](https://github.com/EvanBacon))
- Update migration map to suggest standalone npx expo doctor instead of expo-cli doctor. ([#21931](https://github.com/expo/expo/pull/21931) by [@keith-kurak](https://github.com/keith-kurak))
- Add graphql-codegen. ([#21980](https://github.com/expo/expo/pull/21980) by [@wschurman](https://github.com/wschurman))
- Add graphql generated file to eslintignore. ([#22001](https://github.com/expo/expo/pull/22001) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 0.6.1 — 2023-02-15

_This version does not introduce any user-facing changes._

## 0.6.0 — 2023-02-14

### 🎉 New features

- Implement new package manager API in CLI. ([#19343](https://github.com/expo/expo/pull/19343) by [@byCedric](https://github.com/byCedric))
- Add `EXPO_USE_METRO_WORKSPACE_ROOT` to enable using the workspace root for serving files. ([#21088](https://github.com/expo/expo/pull/21088) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Close config file watchers to ensure process can exit. ([#21199](https://github.com/expo/expo/pull/21199) by [@EvanBacon](https://github.com/EvanBacon))
- Fix log format when modifying `tsconfig.json`. ([#21166](https://github.com/expo/expo/pull/21166) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `devDependencies` when running `npx expo install --fix`. ([#19344](https://github.com/expo/expo/pull/19344) by [@byCedric](https://github.com/byCedric))

## 0.5.1 — 2023-02-09

### 💡 Others

- Add telemetry for experimental Metro config options. ([#20885](https://github.com/expo/expo/pull/20885) by [@byCedric](https://github.com/byCedric))

## 0.5.0 — 2023-02-03

### 🛠 Breaking changes

- Remove `EXPO_NO_DEFAULT_PORT` to skip extraneous tunnel port. ([#18475](https://github.com/expo/expo/pull/18475) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Support Hermes debugger on native when Metro web is running. ([#21068](https://github.com/expo/expo/pull/21068) by [@EvanBacon](https://github.com/EvanBacon))
- Skip uninstalling Expo Go when running in UNVERSIONED (internal). ([#20754](https://github.com/expo/expo/pull/20754) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Add react-native-web alias for metro web that doesn't rely on Babel. ([#20828](https://github.com/expo/expo/pull/20828) by [@EvanBacon](https://github.com/EvanBacon))
- Allow chained Metro resolvers to resolve when the predecessor resolver throws a Metro resolution error. ([#20704](https://github.com/expo/expo/pull/20704) by [@EvanBacon](https://github.com/EvanBacon))
- Escape ampersands in URLs sent to adb. ([#20398](https://github.com/expo/expo/pull/20398) by [@EvanBacon](https://github.com/EvanBacon))
- Fix web assets not loading in Metro for web on Windows. ([#19935](https://github.com/expo/expo/pull/19935) by [@EvanBacon](https://github.com/EvanBacon))
- Fix getting UDID for network connected iOS devices. ([#20279](https://github.com/expo/expo/pull/20279) by [@Simek](https://github.com/Simek))
- Send Exponent-Server header as JSON string for classic manifests. ([#20409](https://github.com/expo/expo/pull/20409) by [@byCedric](https://github.com/byCedric))
- Use known Expo schemes when starting with dev clients. ([#20888](https://github.com/expo/expo/pull/20888) by [@byCedric](https://github.com/byCedric))
- Fix sourcemap generation errors when exporting Hermes bundle. ([#21022](https://github.com/expo/expo/pull/21022) by [@kudo](https://github.com/kudo))
- Avoid fixing secure Apple device socket connections to a single TLS method. ([#21169](https://github.com/expo/expo/pull/21169) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Bump `@expo/json-file`, `@expo/plist`. ([#20720](https://github.com/expo/expo/pull/20720) by [@EvanBacon](https://github.com/EvanBacon))
- Fix ngrok error message format. ([#19822](https://github.com/expo/expo/pull/19822) by [@EvanBacon](https://github.com/EvanBacon))
- Tweak warning about metro config. ([#20066](https://github.com/expo/expo/pull/20066) by [@kbrandwijk](https://github.com/kbrandwijk))
- Remove `uuid` dependency. ([#20479](https://github.com/expo/expo/pull/20479) by [@LinusU](https://github.com/LinusU))
- Do not show `error.stack` for `ConfigError`s. ([#19248](https://github.com/expo/expo/pull/19248) by [@Simek](https://github.com/Simek))
- Fix tests. ([#20510](https://github.com/expo/expo/pull/20510) by [@EvanBacon](https://github.com/EvanBacon))
- Simplify the Xcode warnings. ([#20512](https://github.com/expo/expo/pull/20512) by [@EvanBacon](https://github.com/EvanBacon))
- Simply Metro watch mode detection to `CI=true`, and log when disabled. ([#20939](https://github.com/expo/expo/pull/20939) by [@byCedric](https://github.com/byCedric))

## 0.4.10 - 2022-11-22

### 🐛 Bug fixes

- Upgrade @expo/code-signing-certificates dependency. ([#20078](https://github.com/expo/expo/pull/20078) by [@wschurman](https://github.com/wschurman))

## 0.4.9 - 2022-11-14

_This version does not introduce any user-facing changes._

## 0.4.8 - 2022-11-08

### 🐛 Bug fixes

- Fix Hermes debugger `TypeError: Only HTTP(S) protocols are supported` error when starting server with `--dev-client` parameter. ([#19919](https://github.com/expo/expo/pull/19919) by [@kudo](https://github.com/kudo))

## 0.4.7 - 2022-11-07

### 🐛 Bug fixes

- Fix Expo Go download loading bar. ([#19817](https://github.com/expo/expo/pull/19817) by [@EvanBacon](https://github.com/EvanBacon))
- Fix Hermes debugger errors on Windows and Linux. ([#19872](https://github.com/expo/expo/pull/19872) by [@kudo](https://github.com/kudo))

## 0.4.6 — 2022-11-02

### 🎉 New features

- Display the debug option more prominently in the UI. ([#19793](https://github.com/expo/expo/pull/19793) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Resolve `metadata.json` file path absolutely for `npx expo export`. ([#19802](https://github.com/expo/expo/pull/19802) by [@EvanBacon](https://github.com/EvanBacon))

## 0.4.5 — 2022-10-30

_This version does not introduce any user-facing changes._

## 0.4.4 — 2022-10-30

_This version does not introduce any user-facing changes._

## 0.4.3 — 2022-10-28

_This version does not introduce any user-facing changes._

## 0.4.2 — 2022-10-28

### 🛠 Breaking changes

- Revert [#18381](https://github.com/expo/expo/pull/18381) (custom entry support).

### 🎉 New features

- Add `-p` to `npx expo export`. ([#19715](https://github.com/expo/expo/pull/19715) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Prevent extraneous `Found multiple AppDelegate file paths` warnings when using CLI commands with a multi-target iOS app. ([#18890](https://github.com/expo/expo/pull/18890) by [@EvanBacon](https://github.com/EvanBacon))

## 0.4.1 — 2022-10-27

### 🐛 Bug fixes

- Don't print source map size in `npx expo export` when the source maps are not written. ([#19710](https://github.com/expo/expo/pull/19710) by [@EvanBacon](https://github.com/EvanBacon))

## 0.4.0 — 2022-10-25

### 🛠 Breaking changes

- Drop support for copying `index.js` and removing `main` field in `package.json` during `expo prebuild` in favor of native build scripts which resolve the user-defined entry file. ([#18381](https://github.com/expo/expo/pull/18381) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add proxy support across all Expo CLI commands. ([#19592](https://github.com/expo/expo/pull/19592) by [@EvanBacon](https://github.com/EvanBacon))
- Added ability to open tunnel URLs with Metro web. ([#19504](https://github.com/expo/expo/pull/19504) by [@EvanBacon](https://github.com/EvanBacon))
- Added prompt for signing simulator builds that use entitlements that work on simulator builds like associated domains. ([#19505](https://github.com/expo/expo/pull/19505) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Skip ADB reverse when Android SDK is missing (allowing `npx expo start --tunnel`). ([#19593](https://github.com/expo/expo/pull/19593) by [@EvanBacon](https://github.com/EvanBacon))
- Make Expo Metro config for web resolve projects using same `package.json` main fields as Expo Webpack. Behavior can be disabled with `EXPO_METRO_NO_MAIN_FIELD_OVERRIDE`. ([#19529](https://github.com/expo/expo/pull/19529) by [@EvanBacon](https://github.com/EvanBacon))
- Add web support check to metro web in `expo start`. ([#18428](https://github.com/expo/expo/pull/18428) by [@EvanBacon](https://github.com/EvanBacon))
- Drop support for experimental Webpack native symbolication. ([#18439](https://github.com/expo/expo/pull/18439) by [@EvanBacon](https://github.com/EvanBacon))
- Implement getApplicationIdFromBundle fixing iOS app launch issue with SDK 46. ([#18537](https://github.com/expo/expo/pull/18537) by [@Anthony Mittaz](https://github.com/Anthony Mittaz))
- Change `UNAUTHORIZED_ERROR` to `UNAUTHORIZED` to handle unauthorized errors. ([#18751](https://github.com/expo/expo/pull/18751) by [@EvanBacon](https://github.com/EvanBacon))
- Catch error thrown when trying to launch redirect page without an application ID defined in `app.json`. ([#19312](https://github.com/expo/expo/pull/19312) by [@esamelson](https://github.com/esamelson))
- Present intended variadic argument when asserting flags in `npx expo install`. ([#19396](https://github.com/expo/expo/pull/19396) by [@bycedric](https://github.com/bycedric))
- Add "none" platform when running `--dev-client`. ([#19319](https://github.com/expo/expo/pull/19319) by [@jonsamp](https://github.com/jonsamp))
- Fix development code signing for dev client. ([#19557](https://github.com/expo/expo/pull/19557) by [@wschurman](https://github.com/wschurman))

### 💡 Others

- Change asset registry redirect for Metro web to point to the shared alias in `react-native`. ([#19234](https://github.com/expo/expo/pull/19234) by [@EvanBacon](https://github.com/EvanBacon))
- Update the README file. ([#18663](https://github.com/expo/expo/pull/18663) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `prebuild` e2e tests. ([#18612](https://github.com/expo/expo/pull/18612) by [@EvanBacon](https://github.com/EvanBacon))
- [Interstitial page] Capture missing analytics event when user opens development build. ([#18792](https://github.com/expo/expo/pull/18792) by [@esamelson](https://github.com/esamelson))

## 0.3.2 - 2022-10-13

### 🎉 New features

- Handle all development session errors. ([#18499](https://github.com/expo/expo/pull/18499) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Disable API interaction when running in offline mode. ([#19418](https://github.com/expo/expo/pull/19418) by [@byCedric](https://github.com/byCedric))

### 💡 Others

- Hide server rate limiting warning during `npx expo start`. ([#19038](https://github.com/expo/expo/pull/19038) by [@EvanBacon](https://github.com/EvanBacon))

## 0.3.1 - 2022-09-26

_This version does not introduce any user-facing changes._

## 0.3.0 - 2022-09-26

### 🎉 New features

- Added middleware for creating files. ([#19231](https://github.com/expo/expo/pull/19231) by [@EvanBacon](https://github.com/EvanBacon))
- Enable `require.context` by default. ([#19257](https://github.com/expo/expo/pull/19257) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Resolve bundle identifier / package from native project and then fallback to `app.json` when launching redirect page. ([#19260](https://github.com/expo/expo/pull/19260) by [@brentvatne](https://github.com/brentvatne))

## 0.2.11 - 2022-08-22

### 🐛 Bug fixes

- Resolve bundle identifier from `app.json` correctly when using `npx expo start --dev-client --ios` with no local `ios` directory. ([#18747](https://github.com/expo/expo/pull/18747) by [@EvanBacon](https://github.com/EvanBacon))

## 0.2.10 - 2022-08-18

_This version does not introduce any user-facing changes._

## 0.2.8 - 2022-08-12

_This version does not introduce any user-facing changes._

## 0.2.7 - 2022-08-10

### 🎉 New features

- Add `EXPO_NO_DEFAULT_PORT` to skip proxy port. ([#18464](https://github.com/expo/expo/pull/18464) by [@EvanBacon](https://github.com/EvanBacon))
- Disable interactive prompts in non TTY processes. ([#18300](https://github.com/expo/expo/pull/18300) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Prevent development session bad gateway from ending long running `expo start` processes. ([#18451](https://github.com/expo/expo/pull/18451) by [@EvanBacon](https://github.com/EvanBacon))
- Speed up native device opening for iOS and Android. ([#18385](https://github.com/expo/expo/pull/18385) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Add warning about malformed project when running prebuild in non-interactive mode. ([#18436](https://github.com/expo/expo/pull/18436) by [@wkozyra95](https://github.com/wkozyra95))
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
