# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Allow the file extension to be specified for `renderRouter`'s filepaths ([#26510](https://github.com/expo/expo/pull/26510) by [@marklawlor](https://github.com/marklawlor))
- Add `useNavigationContainerRef` to access the root NavigationContainer ref. ([#26529](https://github.com/expo/expo/pull/26529) by [@EvanBacon](https://github.com/EvanBacon))
- Allow `renderRouter()` to accept an array of strings to quickly mock multiple empty components. ([#26651](https://github.com/expo/expo/pull/26651) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix issue with top-level catch-all not matching client-side routing behavior. ([#26861](https://github.com/expo/expo/pull/26861) by [@EvanBacon](https://github.com/EvanBacon))
- Remove error hiding system. ([#26607](https://github.com/expo/expo/pull/26607) by [@EvanBacon](https://github.com/EvanBacon))
- Make `@testing-library/jest-native` usage optional ([#26650](https://github.com/expo/expo/pull/26650) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Reduce usage of `expo-constants`. ([#26834](https://github.com/expo/expo/pull/26834) by [@EvanBacon](https://github.com/EvanBacon))
- Deprecate `useRootNavigation` in favor of `useNavigationContainerRef`. ([#26529](https://github.com/expo/expo/pull/26529) by [@EvanBacon](https://github.com/EvanBacon))
- Remove duplicate context mocking functions ([#26651](https://github.com/expo/expo/pull/26651) by [@marklawlor](https://github.com/marklawlor))

## 3.4.3 - 2024-01-18

_This version does not introduce any user-facing changes._

## 3.4.2 - 2024-01-10

_This version does not introduce any user-facing changes._

## 3.4.1 - 2023-12-19

### 🐛 Bug fixes

- Fix `<Drawer />` navigator navigation. ([#25985](https://github.com/expo/expo/pull/25985) by [@marklawlor](https://github.com/marklawlor))

## 3.4.0 — 2023-12-15

### 🎉 New features

- Add `router.pushOrPop` and `navigate` to `pushOrPop` ([#24600](https://github.com/expo/expo/pull/24600) by [@marklawlor](https://github.com/marklawlor))
- Add `toHavePathnameWithParams` matcher to `expo-router/testing-library`. ([#25955](https://github.com/expo/expo/pull/25955) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Allow pushing to the same route multiple times. ([#24600](https://github.com/expo/expo/pull/24600) by [@marklawlor](https://github.com/marklawlor))
- Remove `not-found` URL parameter on web `not-found` pages. ([#25955](https://github.com/expo/expo/pull/25955) by [@marklawlor](https://github.com/marklawlor))

## 3.3.1 — 2023-12-12

### 💡 Others

- Change `peerDependencies` for `expo` and remove `metro`. ([#25886](https://github.com/expo/expo/pull/25886) by [@EvanBacon](https://github.com/EvanBacon))

## 3.3.0 — 2023-12-12

- Ensure search parameters are always decoded ([#25589](https://github.com/expo/expo/pull/25589) by [@marklawlor](https://github.com/marklawlor))

### 🛠 Breaking changes

- Change default CSS reset to align with `react-native-web@0.19.8`. ([#25429](https://github.com/expo/expo/pull/25429) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add route-based bundle splitting on web. ([#25627](https://github.com/expo/expo/pull/25627) by [@EvanBacon](https://github.com/EvanBacon))
- Change `unstable_src` to `root` in the Expo Router Config Plugin. ([#25658](https://github.com/expo/expo/pull/25658) by [@EvanBacon](https://github.com/EvanBacon))
- Support linking to `mailto:`, and other common links with the `<Link />` component and `router` API. ([#25486](https://github.com/expo/expo/pull/25486) by [@EvanBacon](https://github.com/EvanBacon))
- Added support for React Native 0.73.0. ([#24971](https://github.com/expo/expo/pull/24971), [#25453](https://github.com/expo/expo/pull/25453) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Warn in development when a path and query parameter with the same name is used. ([#24386](https://github.com/expo/expo/pull/24386) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix traversing `generateStaticParams`. ([#25440](https://github.com/expo/expo/pull/25440) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `state.routes.at is not a function` error on navigation.
- Only mock `react-native-reanimated` if package is installed. ([#25588](https://github.com/expo/expo/pull/25588) by [@marklawlor](https://github.com/marklawlor))
- Import `@expo/metro-runtime` from build dir. ([#25655](https://github.com/expo/expo/pull/25655) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Disable suspense loader in production. ([#25436](https://github.com/expo/expo/pull/25436) by [@EvanBacon](https://github.com/EvanBacon))
- Removed unused `dateModified` field from `MetadataOptions` in the head module. ([#25467](https://github.com/expo/expo/pull/25467) by [@tsapeta](https://github.com/tsapeta))

## 3.2.0 — 2023-11-14

### 🛠 Breaking changes

- Drop support for rendering `<SplashScreen />` as a React component. `SplashScreen` now re-exports `expo-splash-screen`. ([#24893](https://github.com/expo/expo/pull/24893) by [@EvanBacon](https://github.com/EvanBacon))
- The Babel plugin `expo-router/babel` has been moved to `babel-preset-expo` and will be enabled automatically when `expo-router` is installed. ([#24779](https://github.com/expo/expo/pull/24779) by [@EvanBacon](https://github.com/EvanBacon))
- Bumped iOS deployment target to 13.4. ([#25063](https://github.com/expo/expo/pull/25063) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### 🎉 New features

- Include static routes from `generateStaticParams` in server manifest. ([#25003](https://github.com/expo/expo/pull/25003) by [@EvanBacon](https://github.com/EvanBacon))
- Add web-only `target`, `rel`, and `download` props to the `Link` component. ([#24908](https://github.com/expo/expo/pull/24908) by [@EvanBacon](https://github.com/EvanBacon))
- Add `className` prop to `Link` component. ([#24797](https://github.com/expo/expo/pull/24797) by [@EvanBacon](https://github.com/EvanBacon))
- Add `file` to server manifest format to represent the location of the file on disk. ([#24739](https://github.com/expo/expo/pull/24739) by [@EvanBacon](https://github.com/EvanBacon))
- Add new `+not-found` convention for 404s. ([#24528](https://github.com/expo/expo/pull/24528) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix query parameter encoding. ([#25198](https://github.com/expo/expo/pull/25198) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent circular navigation references. ([#24548](https://github.com/expo/expo/pull/24548) by [@EvanBacon](https://github.com/EvanBacon))
- Fix navigating to shared routes. ([#24218](https://github.com/expo/expo/pull/24218) by [@marklawlor](https://github.com/marklawlor))
- Fix navigation target for nested layouts ([#24598](https://github.com/expo/expo/pull/24598) by [@marklawlor](https://github.com/marklawlor))
- Fix `renderRouter` on windows ([#24674](https://github.com/expo/expo/pull/24674) by [@marklawlor](https://github.com/marklawlor))
- Fix relative hrefs when inside a group ([#25111](https://github.com/expo/expo/pull/25111) by [@marklawlor](https://github.com/marklawlor))
- Fix `renderRouter` `Cannot set properties of undefined` error. ([#25110](https://github.com/expo/expo/pull/25110) by [@marklawlor](https://github.com/marklawlor))
- Fix relative hrefs from index routes ([#25309](https://github.com/expo/expo/pull/25309) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Rename experimental `basePath` setting to `baseUrl`. ([#25305](https://github.com/expo/expo/pull/25305) by [@EvanBacon](https://github.com/EvanBacon))
- Move web `AppContainer` alias to `expo/cli`. ([#25148](https://github.com/expo/expo/pull/25148) by [@EvanBacon](https://github.com/EvanBacon))
- Fix build. ([#25005](https://github.com/expo/expo/pull/25005) by [@EvanBacon](https://github.com/EvanBacon))
- Ship untranspiled JSX to support custom handling of `jsx` and `createElement`. ([#24889](https://github.com/expo/expo/pull/24889) by [@EvanBacon](https://github.com/EvanBacon))
- Throw unhandled actions in tests. ([#24525](https://github.com/expo/expo/pull/24525) by [@EvanBacon](https://github.com/EvanBacon))
- Migrate to new standard `URL` support on native. ([#24941](https://github.com/expo/expo/pull/24941) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.2 — 2023-09-18

### 🐛 Bug fixes

- Include `_ctx-html` file in public release. ([#24472](https://github.com/expo/expo/pull/24472) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.1 — 2023-09-15

### 🛠 Breaking changes

- Expo Router no longer automatically injects `react-native-gesture-handler`. Users must now add this in layout routes. ([#24314](https://github.com/expo/expo/pull/24314) by [@EvanBacon](https://github.com/EvanBacon))
- Drop client-side mocking for `__dirname` and `__filename`. ([#24348](https://github.com/expo/expo/pull/24348) by [@EvanBacon](https://github.com/EvanBacon))

### 🎉 New features

- Add server manifest. ([#24429](https://github.com/expo/expo/pull/24429) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Infinite renders when using ErrorBoundary in a nested layout. ([#24317](https://github.com/expo/expo/pull/24317) by [@marklawlor](https://github.com/marklawlor))
- Navigation across nested `_layout` when using `router.replace()` and `<Redirect />` ([#24457](https://github.com/expo/expo/pull/24457) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Ignore root HTML automatically in the context module. ([#24388](https://github.com/expo/expo/pull/24388) by [@EvanBacon](https://github.com/EvanBacon))
- Compile to cjs to support running directly in Node.js. ([#24349](https://github.com/expo/expo/pull/24349) by [@EvanBacon](https://github.com/EvanBacon))
- Fix build. ([#24309](https://github.com/expo/expo/pull/24309) by [@EvanBacon](https://github.com/EvanBacon))

## 3.1.0 — 2023-09-04

- Fix false positive redirect deprecation since version 2.0.1 when using `<Screen />`. ([#23932](https://github.com/expo/expo/pull/23932) by [@sync](https://github.com/sync))

### 🛠 Breaking changes

- Remove `@bacons/react-views` -> the undocumented `hoverStyle` property is no longer supported on `<Link />`. ([#23889](https://github.com/expo/expo/pull/23889) by [@EvanBacon](https://github.com/EvanBacon))
- Remove deprecated hooks `useSearchParams` and `useLink` ([#24219](https://github.com/expo/expo/pull/24219) by [@marklawlor](https://github.com/marklawlor))
- Remove deprecated `<Screen />` prop `redirect` ([#24219](https://github.com/expo/expo/pull/24219) by [@marklawlor](https://github.com/marklawlor))

### 🎉 New features

- Add support for `experiments.basePath` and hosting from sub-paths. ([#23911](https://github.com/expo/expo/pull/23911) by [@EvanBacon](https://github.com/EvanBacon))
- Add types for the `unstable_styles` export of CSS Modules. ([#24244](https://github.com/expo/expo/pull/24244) by [@EvanBacon](https://github.com/EvanBacon))
- Tree shake error symbolication code in production. ([#24215](https://github.com/expo/expo/pull/24215) by [@EvanBacon](https://github.com/EvanBacon))
- Add static font extraction support with `expo-font`. ([#24027](https://github.com/expo/expo/pull/24027) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Support `push` going back to sibling with nested stack from a modal. ([#24166](https://github.com/expo/expo/pull/24166) by [@EvanBacon](https://github.com/EvanBacon))
- Use deeper clone to prevent state leak. ([#24149](https://github.com/expo/expo/pull/24149) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent double renders when pushing stacks. ([#24147](https://github.com/expo/expo/pull/24147) by [@EvanBacon](https://github.com/EvanBacon))
- Patch `react-native-web` AppContainer to prevent adding extra divs. ([#24093](https://github.com/expo/expo/pull/24093) by [@EvanBacon](https://github.com/EvanBacon))
- Allow pushing "sibling" routes by the same name. ([#23833](https://github.com/expo/expo/pull/23833) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent throwing in `canGoBack` before the navigation has mounted. ([#23959](https://github.com/expo/expo/pull/23959) by [@EvanBacon](https://github.com/EvanBacon))
- Fix error overlay not being applied on web. ([#24052](https://github.com/expo/expo/pull/24052) by [@EvanBacon](https://github.com/EvanBacon))
- Add missing `listener` types. ([#24174](https://github.com/expo/expo/pull/24174) by [@muneebahmedayub](https://github.com/muneebahmedayub))

### 💡 Others

- Move entry registration to `expo`. ([#23891](https://github.com/expo/expo/pull/23891) by [@EvanBacon](https://github.com/EvanBacon))
- Drop unused tests. ([#23890](https://github.com/expo/expo/pull/23890) by [@EvanBacon](https://github.com/EvanBacon))
- Fix `yarn tsc` in the repo. ([#23887](https://github.com/expo/expo/pull/23887) by [@EvanBacon](https://github.com/EvanBacon))

## 3.0.0 — 2023-08-02

### 🛠 Breaking changes

- Migrate to expo/expo monorepo. ([#23725](https://github.com/expo/expo/pull/23725) by [@EvanBacon](https://github.com/EvanBacon))
- Change source directory in production to use `build` instead of `src`. ([#23725](https://github.com/expo/expo/pull/23725) by [@EvanBacon](https://github.com/EvanBacon))
- Fold `expo-head` into `expo-router`. ([#23725](https://github.com/expo/expo/pull/23725) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Fix exports. ([#23789](https://github.com/expo/expo/pull/23789) by [@EvanBacon](https://github.com/EvanBacon))
