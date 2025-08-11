# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

- Add modal component ([#37365](https://github.com/expo/expo/pull/37365) by [@Ubax](https://github.com/Ubax))
- Add experimental link preview (iOS only) ([#37336](https://github.com/expo/expo/pull/37336) by [@Ubax](https://github.com/Ubax))
- Allow for multiple children in Link.Trigger ([#37700](https://github.com/expo/expo/pull/37700) by [@Ubax](https://github.com/Ubax))
- Add icon prop to Link.MenuAction ([#37783](https://github.com/expo/expo/pull/37783) by [@Ubax](https://github.com/Ubax))
- Add submenus to link preview context menu ([#37784](https://github.com/expo/expo/pull/37784) by [@Ubax](https://github.com/Ubax))
- [web] Add styled modals and sheets on web with a custom modal stack using vaul ([#37767](https://github.com/expo/expo/pull/37767) by [@hirbod](https://github.com/hirbod))
- [web] Add transparent modal support and allow modal stacking ([#37856](https://github.com/expo/expo/pull/37856) by [@hirbod](https://github.com/hirbod))
- [web] Use web modal in `Modal` ([#37732](https://github.com/expo/expo/pull/37732) by [@Ubax](https://github.com/Ubax))
- Support external URLs with static redirects ([#38041](https://github.com/expo/expo/pull/38041) by [@hassankhan](https://github.com/hassankhan))
- Add closeOnNavigation prop to modal ([#38198](https://github.com/expo/expo/pull/38198) by [@Ubax](https://github.com/Ubax))
- Add `location.origin`, Expo SDK version and Hermes version to sitemap UI ([#38201](https://github.com/expo/expo/pull/38201) by [@hassankhan](https://github.com/hassankhan))
- Add option to show only Link menu actions without preview ([#38398](https://github.com/expo/expo/pull/38398) by [@Ubax](https://github.com/Ubax))
- Add more customization options to Link.Preview menu ([#38401](https://github.com/expo/expo/pull/38401) by [@Ubax](https://github.com/Ubax))
- Native bottom tabs ([#37912](https://github.com/expo/expo/pull/37912) by [@Ubax](https://github.com/Ubax))
- Allow running server middleware with `+middleware.ts` ([#38330](https://github.com/expo/expo/pull/38330) by [@hassankhan](https://github.com/hassankhan))
- NativeTabs dynamic options ([#38581](https://github.com/expo/expo/pull/38581) by [@Ubax](https://github.com/Ubax))

### 🐛 Bug fixes

- use boxShadow style props to reduce warnings. ([#38022](https://github.com/expo/expo/pull/38022) by [@EvanBacon](https://github.com/EvanBacon))
- fix link with preview on web and Android ([#37800](https://github.com/expo/expo/pull/37800) by [@Ubax](https://github.com/Ubax))
- fix <Stack.Screen> in HrefPreview ([#37830](https://github.com/expo/expo/pull/37830) by [@Ubax](https://github.com/Ubax))
- fix white screen when opening preview too fast ([#37858](https://github.com/expo/expo/pull/37858) by [@Ubax](https://github.com/Ubax))
- fix screen freeze after preview navigation ([#37881](https://github.com/expo/expo/pull/37881) by [@Ubax](https://github.com/Ubax))
- fix detents in Modal ([#37981](https://github.com/expo/expo/pull/37981) by [@Ubax](https://github.com/Ubax))
- fix(web): a11y focus trap issues in web modals ([#38026](https://github.com/expo/expo/pull/38026) by [@hirbod](https://github.com/hirbod))
- Fix web modal styling ([#38040](https://github.com/expo/expo/pull/38040) by [@Ubax](https://github.com/Ubax))
- fix(web): fitToContents modal support on desktop, aligned default styles more with iOS ([#38028](https://github.com/expo/expo/pull/38028) by [@hirbod](https://github.com/hirbod))
- fix navigation from preview to modal ([#37832](https://github.com/expo/expo/pull/37832) by [@Ubax](https://github.com/Ubax))
- Fix children update in modal ([#38064](https://github.com/expo/expo/pull/38064) by [@Ubax](https://github.com/Ubax))
- Add static rewrites support to export and server-side handling ([#37930](https://github.com/expo/expo/pull/37930) by [@hassankhan](https://github.com/hassankhan))
- Fix old arch build with LinkPreview code ([#38305](https://github.com/expo/expo/pull/38305) by [@Ubax](https://github.com/Ubax))
- [web] fix modal INP lag and upgraded Vaul to 1.1.2 ([#38444](https://github.com/expo/expo/pull/38444) by [@hirbod](https://github.com/hirbod))
- [iOS] Add compiler flags for new arch to expo router ([#38397](https://github.com/expo/expo/pull/38397) by [@Ubax](https://github.com/Ubax))
- Fix modal with detents fixToContents on Android ([#38440](https://github.com/expo/expo/pull/38440) by [@Ubax](https://github.com/Ubax))
- Fix detents in web modal ([#38446](https://github.com/expo/expo/pull/38446) by [@Ubax](https://github.com/Ubax))
- Fix Link Preview between two separate stacks ([#38299](https://github.com/expo/expo/pull/38299) by [@Ubax](https://github.com/Ubax))
- Fix preloading of Unmatched screen ([#38556](https://github.com/expo/expo/pull/38556) by [@Ubax](https://github.com/Ubax))
- Fix context menu updates ([#38561](https://github.com/expo/expo/pull/38561) by [@Ubax](https://github.com/Ubax))
- Fix issues with link preview in heavy views ([#38534](https://github.com/expo/expo/pull/38534) by [@Ubax](https://github.com/Ubax))
- Fix Link Preview navigation in NativeTabs ([#38283](https://github.com/expo/expo/pull/38283) by [@Ubax](https://github.com/Ubax))
- add option to hide label and show empty badge ([#38668](https://github.com/expo/expo/pull/38668) by [@Ubax](https://github.com/Ubax))
- add unstable-native-tabs to files in package.json ([#38742](https://github.com/expo/expo/pull/38742) by [@Ubax](https://github.com/Ubax))

### 💡 Others

- Fix web modal code being imported on native. ([#38553](https://github.com/expo/expo/pull/38553) by [@EvanBacon](https://github.com/EvanBacon))
- Create href preview component ([#37335](https://github.com/expo/expo/pull/37335) by [@Ubax](https://github.com/Ubax))
- Add formsheet warning ([#37982](https://github.com/expo/expo/pull/37982) by [@Ubax](https://github.com/Ubax))
- Extract screen search logic to swift ([#38320](https://github.com/expo/expo/pull/38320) by [@Ubax](https://github.com/Ubax))
- Throw error when Stack.Screen is used with name outside of layout ([#38116](https://github.com/expo/expo/pull/38116) by [@Ubax](https://github.com/Ubax))
- Update dependencies and peer dependencies to align with transitive dependencies and missing optional peers ([#38530](https://github.com/expo/expo/pull/38530) by [@kitten](https://github.com/kitten))
- Update doctor checks to not assume project has a `@react-navigation/native` direct dependency ([#38547](https://github.com/expo/expo/pull/38547) by [@kitten](https://github.com/kitten))
- Upgrade rnscreens to nigthly version and remove RNSDismissibleModalProtocol patch ([#38522](https://github.com/expo/expo/pull/38522) by [@Ubax](https://github.com/Ubax))
- Move not-found and site map to root stack navigator ([#38417](https://github.com/expo/expo/pull/38417) by [@Ubax](https://github.com/Ubax))
- Hide standalone Modal export ([#38648](https://github.com/expo/expo/pull/38648) by [@Ubax](https://github.com/Ubax))
- Refactor link preview to show components in docs ([#38696](https://github.com/expo/expo/pull/38696) by [@Ubax](https://github.com/Ubax))
- refactor tabs for docs export ([#38684](https://github.com/expo/expo/pull/38684) by [@Ubax](https://github.com/Ubax))
- Use `@expo/server/private` for RSC Middleware imports ([#38717](https://github.com/expo/expo/pull/38717) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 5.1.4 - 2025-07-18

### 🐛 Bug fixes

- Unhandled rejections due to missing SplashModule internal functions in Expo Go ([#38045](https://github.com/expo/expo/pull/38045)) by [@krystofwoldrich](https://github.com/krystofwoldrich)) ([#38045](https://github.com/expo/expo/pull/38045) by [@krystofwoldrich](https://github.com/krystofwoldrich))

## 5.1.3 - 2025-07-03

### 🐛 Bug fixes

- fix web back/forward buttons ([#37747](https://github.com/expo/expo/pull/37747) by [@Ubax](https://github.com/Ubax))

## 5.1.1 - 2025-06-26

### 🐛 Bug fixes

- Fork StackRouter getStateFromAction to fix freezing screens ([#37086](https://github.com/expo/expo/pull/37086) by [@marklawlor](https://github.com/marklawlor))
- Fix inconsistent global param decoding ([#36973](https://github.com/expo/expo/pull/36973) by [@marklawlor](https://github.com/marklawlor))
- Prevent error when using `<Screen options />` with prefetching ([#36866](https://github.com/expo/expo/pull/36866) by [@marklawlor](https://github.com/marklawlor))
- Fix static redirects ([#36962](https://github.com/expo/expo/pull/36962) by [@marklawlor](https://github.com/marklawlor))
- Fix typed routes generation for dynamic routes with query params ([#37340](https://github.com/expo/expo/pull/37340) by [@titozzz](https://github.com/titozzz))

## 5.1.0 - 2025-06-11

### 🎉 New features

- Headless useSitemap() hook. ([#36895](https://github.com/expo/expo/pull/36895) by [@douglowder](https://github.com/douglowder))
- Add Tabs.Protected ([#37085](https://github.com/expo/expo/pull/37085) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix RSC middleware not requiring output modules from a stable base path resulting in missing modules ([#36819](https://github.com/expo/expo/pull/36819) by [@kitten](https://github.com/kitten))
- Prioritize static routes over dynamic routes within same group ([#36765](https://github.com/expo/expo/pull/36765) by [@marklawlor](https://github.com/marklawlor))
- Fix deep linking showing incorrect screen ([#36864](https://github.com/expo/expo/pull/36864) by [@marklawlor](https://github.com/marklawlor))
- Fix useRootNavigationState() error when used in root layout ([#37023](https://github.com/expo/expo/pull/37023) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))
- Remove internal routes from sitemap and add unit tests for this screen ([#36856](https://github.com/expo/expo/pull/36856) by [@Ubax](https://github.com/Ubax))
- Refactor sitemap file item to separate components for layout and standard route ([#36870](https://github.com/expo/expo/pull/36870) by [@Ubax](https://github.com/Ubax))
- Collapse nested routes in Sitemap ([#36882](https://github.com/expo/expo/pull/36882) by [@Ubax](https://github.com/Ubax))
- Update matching patterns for pathname groups and parameters ([#36961](https://github.com/expo/expo/pull/36961) by [@kitten](https://github.com/kitten))

## 5.0.7 — 2025-05-13

### 🐛 Bug fixes

- Flush state before imperative navigation ([#36699](https://github.com/expo/expo/pull/36699) by [@marklawlor](https://github.com/marklawlor))
- Fix web url from updating during initial load with nested navigators ([#36690](https://github.com/expo/expo/pull/36690) by [@marklawlor](https://github.com/marklawlor))
- Esacpe unsafe property characters when generating params in typed routes output ([#36824](https://github.com/expo/expo/pull/36824) by [@kitten](https://github.com/kitten))
- Fix useLocalSearchParams returning "undefined" for deleted params ([#36811](https://github.com/expo/expo/pull/36811) by [@marklawlor](https://github.com/marklawlor))
- Fix `DefaultNavigator` insets being too large when the app is running in edge-to-edge mode. ([#36855](https://github.com/expo/expo/pull/36855) by [@behenate](https://github.com/behenate))

## 5.0.6 — 2025-05-06

### 🐛 Bug fixes

- Fix <Tabs /> behaviour with replace and backHistory=order ([#36481](https://github.com/expo/expo/pull/36481) by [@marklawlor](https://github.com/marklawlor))

## 5.0.5 — 2025-05-02

### 🐛 Bug fixes

- Fix incorrect route info for nested tabs when navigating via touch ([#36558](https://github.com/expo/expo/pull/36558) by [@marklawlor](https://github.com/marklawlor))
- Prevent incorrect warning when using custom navigators ([#36508](https://github.com/expo/expo/pull/36508) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Switch useContext to use ([#36414](https://github.com/expo/expo/pull/36414) by [@marklawlor](https://github.com/marklawlor))
- Include tests in typecheck. Use seperate build tsconfig ([#36485](https://github.com/expo/expo/pull/36485) by [@marklawlor](https://github.com/marklawlor))

## 5.0.4 — 2025-05-01

### 🐛 Bug fixes

- Fix useNavigation() retrieving the incorrect parent for nested navigator ([#36509](https://github.com/expo/expo/pull/36509) by [@marklawlor](https://github.com/marklawlor))

## 5.0.3 — 2025-04-28

### 💡 Others

- Remove dev-only stack trace view from default error boundary. ([#36409](https://github.com/expo/expo/pull/36409) by [@EvanBacon](https://github.com/EvanBacon))

## 5.0.2 — 2025-04-28

### 🎉 New features

- Add <Screen.Protected /> ([#36243](https://github.com/expo/expo/pull/36243) by [@marklawlor](https://github.com/marklawlor))

## 5.0.2-preview.6 — 2025-04-25

### 💡 Others

- bump e2e tests to React 19 and fix lint ([#36344](https://github.com/expo/expo/pull/36344) by [@EvanBacon](https://github.com/EvanBacon))
- Refactor route state to utilize useStateForPath() ([#36199](https://github.com/expo/expo/pull/36199) by [@marklawlor](https://github.com/marklawlor))
- Cleanup router store after #36199 ([#36383](https://github.com/expo/expo/pull/36383) by [@marklawlor](https://github.com/marklawlor))
- Fix require cycle in router store ([#36386](https://github.com/expo/expo/pull/36386) by [@marklawlor](https://github.com/marklawlor))

## 5.0.2-preview.5 — 2025-04-22

_This version does not introduce any user-facing changes._

## 5.0.2-preview.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 5.0.2-preview.3 — 2025-04-11

### 💡 Others

- bump @radix-ui/react-slot ([#36089](https://github.com/expo/expo/pull/36089) by [@leonhh](https://github.com/leonhh))

## 5.0.2-preview.2 — 2025-04-11

_This version does not introduce any user-facing changes._

## 5.0.2-preview.1 — 2025-04-09

_This version does not introduce any user-facing changes._

## 5.0.2-preview.0 — 2025-04-08

_This version does not introduce any user-facing changes._

## 5.0.1-preview.1 — 2025-04-08

### 🐛 Bug fixes

- Unpack default exports correctly from server actions using `expo-router/_async-server-import` ([#35948](https://github.com/expo/expo/pull/35948) by [@byCedric](https://github.com/byCedric))

## 5.0.1-preview.0 — 2025-04-05

_This version does not introduce any user-facing changes._

## 5.0.0-preview.0 — 2025-04-04

### 🛠 Breaking changes

- Wrap app in root `<Slot />` navigator ([#35613](https://github.com/expo/expo/pull/35613) by [@marklawlor](https://github.com/marklawlor))
- Use UNSTABLE_router & add 'dangerouslySingular' prop ([#35595](https://github.com/expo/expo/pull/35595) by [@marklawlor](https://github.com/marklawlor))

### 🎉 New features

- Add static redirects to config plugin. ([#34734](https://github.com/expo/expo/pull/34734) by [@marklawlor](https://github.com/marklawlor))
- Add `router.preload(<href>)` and `<Link preload href={}>` to error boundary. ([#34558](https://github.com/expo/expo/pull/34558) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix initial URL when using Expo Go ([#34596](https://github.com/expo/expo/pull/34596) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Improve route `displayName` for debugging component stacks. ([#35867](https://github.com/expo/expo/pull/35867) by [@EvanBacon](https://github.com/EvanBacon))
- Temporarily Remove RSC dependency. ([#34505](https://github.com/expo/expo/pull/34505) by [@EvanBacon](https://github.com/EvanBacon))
- Use `expo-linking` to synchronously get the initial URL. This fixes App Clips and improves RSC support. ([#34328](https://github.com/expo/expo/pull/34328) by [@EvanBacon](https://github.com/EvanBacon))
- Polyfill relative fetch requests and `window.location` by default. ([#34169](https://github.com/expo/expo/pull/34169) by [@EvanBacon](https://github.com/EvanBacon))
- Fix linting errors ([#34033](https://github.com/expo/expo/pull/34033) by [@marklawlor](https://github.com/marklawlor))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))
- Add Sitemap to exported views ([#34144](https://github.com/expo/expo/pull/34144) by [@davidavz](https://github.com/davidavz))
- Fix tests after dependency update ([#35035](https://github.com/expo/expo/pull/35035) by [@marklawlor](https://github.com/marklawlor))
- Update TypeScript for React 19 ([#35217](https://github.com/expo/expo/pull/35217) by [@marklawlor](https://github.com/marklawlor))
- Removed vendored `react-helmet-async` package.json ([#35746](https://github.com/expo/expo/pull/35746) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix regex on `expo-router/matcher` `matchLastGroupName` allows to use it on `IOS < 16.4` ([#33350](https://github.com/expo/expo/pull/33350) by [@antonio-serrat](https://github.com/Antonio-Serat))
- Fix pushing the same route multiple times and `__EXPO_ROUTER_key` incorrectly showing up in query parameters ([#33430](https://github.com/expo/expo/pull/33430) by [@stephentuso](https://github.com/stephentuso))

## 4.0.20 - 2025-04-02

_This version does not introduce any user-facing changes._

## 4.0.20-rc.0 - 2025-04-02

### 🐛 Bug fixes

- Fix `this.config` crash on startup. ([#35833](https://github.com/expo/expo/pull/35833) by [@marklawlor](https://github.com/marklawlor))

## 4.0.19 - 2025-03-14

_This version does not introduce any user-facing changes._

## 4.0.18 - 2025-03-11

### 🐛 Bug fixes

- Fix Fast Refresh not detecting file system updates. ([#34509](https://github.com/expo/expo/pull/34509) by [@marklawlor](https://github.com/marklawlor))
- Fix getPathFromState generating an invalid path for hoisted index routes. ([#34668](https://github.com/expo/expo/pull/34668) by [@marklawlor](https://github.com/marklawlor))

## 4.0.17 - 2025-01-19

### 🎉 New features

- Add partial support for `generateStaticParams` in React Server Components router. ([#34093](https://github.com/expo/expo/pull/34093) by [@EvanBacon](https://github.com/EvanBacon))
- Add server error handling to error boundary. ([#33971](https://github.com/expo/expo/pull/33971) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.16 - 2025-01-08

### 🐛 Bug fixes

- Fix error 'WeakSet key must be an object' in fast-refresh for invalid exports like cpp host objects. ([#34026](https://github.com/expo/expo/pull/34026) by [@chrfalch](https://github.com/chrfalch))
- Fix render store (unstable_headers) on native platforms. ([#33978](https://github.com/expo/expo/pull/33978) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Add less aggressive babel plugin migration warning. ([#33640](https://github.com/expo/expo/pull/33640) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.15 - 2024-12-24

### 💡 Others

- Bump react-navigation versions. ([#33758](https://github.com/expo/expo/pull/33758) by [@marklawlor](https://github.com/marklawlor))
- Add `withLayoutContext` example. ([#34346](https://github.com/expo/expo/pull/34346) by [@keith-kurak](https://github.com/keith-kurak))

## 4.0.14 - 2024-12-19

### 🐛 Bug fixes

- Prevent base url from being appended to external links. ([#31420](https://github.com/expo/expo/pull/31420) by [@6TELOIV](https://github.com/6teloiv)) ([#31420](https://github.com/expo/expo/pull/31420) by [@6teloiv](https://github.com/6teloiv))
- Fix baseURL being removed when refreshing the app on web. ([#33481](https://github.com/expo/expo/pull/33481) by [@marklawlor](https://github.com/marklawlor))
- Fix navigation when using browser back/forward ([#33524](https://github.com/expo/expo/pull/33524) by [@stephentuso](https://github.com/stephentuso))
- Fix `useNavigation` hook unable to find parent navigator for hoisted routes and relative hrefs ([#33035](https://github.com/expo/expo/pull/33035) by [@marklawlor](https://github.com/marklawlor))

## 4.0.13 - 2024-12-16

_This version does not introduce any user-facing changes._

## 4.0.12 - 2024-12-10

### 🐛 Bug fixes

- Fix `fileURLtoFilePath` returning valid UNIX os paths to resolve client and server boundary entries on Windows. ([#33540](https://github.com/expo/expo/pull/33540) by [@byCedric](https://github.com/byCedric))

## 4.0.10 - 2024-11-29

_This version does not introduce any user-facing changes._

## 4.0.9 — 2024-11-22

### 🐛 Bug fixes

- Fix using style arrays on `expo-router/ui` `<Tab>` components ([#32887](https://github.com/expo/expo/pull/32887) by [@marklawlor](https://github.com/marklawlor))

## 4.0.8 — 2024-11-22

### 🐛 Bug fixes

- Fix typed route using `\` instead of `/` in windows ([#33146](https://github.com/expo/expo/pull/33146) by [@imranbarbhuiya](https://github.com/imranbarbhuiya))
- Fix hash links causing page reload when there is no history with a starting hash ([#33161](https://github.com/expo/expo/pull/33161) by [@marklawlor](https://github.com/marklawlor))
- Change `react-native-screens` to have its version managed by the SDK ([#33167](https://github.com/expo/expo/pull/33167) by [@marklawlor](https://github.com/marklawlor))
- Change CLI doctor integration to only validate `@react-navigation/*` packages ([#33168](https://github.com/expo/expo/pull/33168) by [@marklawlor](https://github.com/marklawlor))

## 4.0.7 — 2024-11-19

### 🐛 Bug fixes

- Fix `<Link>` using a hash href causing a full page reload on web. ([#32645](https://github.com/expo/expo/pull/32645) by [@marklawlor](https://github.com/marklawlor))

## 4.0.6 — 2024-11-15

### 🎉 New features

- Add `withAnchor` and `relativeToDirectory` options to `<Redirect />`. ([#32847](https://github.com/expo/expo/pull/32847) by [@marklawlor](https://github.com/marklawlor))
- Add `router.dismissTo(<href>)` and `<Link dismissTo href={} />` ([#32933](https://github.com/expo/expo/pull/32933) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Add missing dependency for React Server environments. ([#33121](https://github.com/expo/expo/pull/33121) by [@EvanBacon](https://github.com/EvanBacon))
- Fix Typed Routes incorrectly collapsing group index routes ([#32890](https://github.com/expo/expo/pull/32890) by [@marklawlor](https://github.com/marklawlor))
- Fix relative Hrefs not including search params ([#32931](https://github.com/expo/expo/pull/32931) by [@marklawlor](https://github.com/marklawlor))

## 4.0.5 — 2024-11-13

- Prevent from disabling edge-to-edge ([#32854](https://github.com/expo/expo/pull/32854) by [@zoontek](https://github.com/zoontek))

## 4.0.4 — 2024-11-13

_This version does not introduce any user-facing changes._

## 4.0.3 — 2024-11-13

### 💡 Others

- Rename `experiments.reactServerActions` -> `experiments.reactServerFunctions` and other RSC flags. ([#32791](https://github.com/expo/expo/pull/32791) by [@EvanBacon](https://github.com/EvanBacon))
- Appearance tweaks for the Unmatched route internal page. ([#32817](https://github.com/expo/expo/pull/32817) by [@Simek](https://github.com/Simek))

## 4.0.2 — 2024-11-11

_This version does not introduce any user-facing changes._

## 4.0.1 — 2024-11-11

_This version does not introduce any user-facing changes._

## 4.0.0 — 2024-11-10

### 🎉 New features

- Add `expo-router` integration with `@expo/cli install` command. ([#32679](https://github.com/expo/expo/pull/32679) by [@marklawlor](https://github.com/marklawlor))

## 4.0.0-preview.14 — 2024-11-07

### 💡 Others

- Tweaks and fixes for the internal Sitemap page. ([#29756](https://github.com/expo/expo/pull/29756) by [@Simek](https://github.com/Simek))
- Appearance tweaks for the Onboard welcome page. ([#32620](https://github.com/expo/expo/pull/32620), [#32653](https://github.com/expo/expo/pull/32653)) by [@Simek](https://github.com/Simek)

## 4.0.0-preview.13 — 2024-11-05

### 🎉 New features

- Add RSC support for `Stack.Screen`, `Tabs.Screen`, and `Drawer.Screen` components. ([#32607](https://github.com/expo/expo/pull/32607) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Remove `expo-splash-screen` dependency without changing behavior ([#32610](https://github.com/expo/expo/pull/32610) by [@brentvatne](https://github.com/brentvatne))

## 4.0.0-preview.12 — 2024-11-04

### 🛠 Breaking changes

- Remove generic from `Href` type, navigation hooks and functions ([#31764](https://github.com/expo/expo/pull/31764) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Move server action env to `@expo/metro-runtime`. ([#32597](https://github.com/expo/expo/pull/32597) by [@EvanBacon](https://github.com/EvanBacon))
- Don't assume reanimated exists when testing expo-router ([#27548](https://github.com/expo/expo/pull/27548)) by [@henrymoulton](https://github.com/henrymoulton)
- Add `anchor` to `unstable_settings` ([#28644](https://github.com/expo/expo/pull/28644) by [@marklawlor](https://github.com/marklawlor))

## 4.0.0-preview.11 — 2024-10-31

_This version does not introduce any user-facing changes._

## 4.0.0-preview.10 — 2024-10-31

### 🐛 Bug fixes

- Support protocol hrefs on native. ([#31646](https://github.com/expo/expo/pull/31646) by [@marklawlor](https://github.com/marklawlor))

## 4.0.0-preview.9 — 2024-10-31

_This version does not introduce any user-facing changes._

## 4.0.0-preview.8 — 2024-10-30

_This version does not introduce any user-facing changes._

## 4.0.0-preview.7 — 2024-10-30

### 🎉 New features

- Add server action-only mode. ([#32432](https://github.com/expo/expo/pull/32432) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0-preview.6 — 2024-10-29

### 🐛 Bug fixes

- Update `@react-navigation/core` imports to `@react-navigation/native` ([#32391](https://github.com/expo/expo/pull/32391) by [@marklawlor](https://github.com/marklawlor))

## 4.0.0-preview.5 — 2024-10-29

### 🐛 Bug fixes

- Fix deep links to apps that use unusual characters in their schemes. ([#32424](https://github.com/expo/expo/pull/32424) by [@marklawlor](https://github.com/marklawlor))

## 4.0.0-preview.4 — 2024-10-28

_This version does not introduce any user-facing changes._

## 4.0.0-preview.3 — 2024-10-26

### 🎉 New features

- Add support for DOM components. ([#32338](https://github.com/expo/expo/pull/32338) by [@EvanBacon](https://github.com/EvanBacon))

### 🐛 Bug fixes

- Include `expo-router/ui` in public export. ([#32362](https://github.com/expo/expo/pull/32362) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0-preview.2 — 2024-10-25

### 🎉 New features

- Document `router.reload()` for RSC mode. ([#32246](https://github.com/expo/expo/pull/32246) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0-preview.1 — 2024-10-24

### 💡 Others

- Remove unused console log. ([#32249](https://github.com/expo/expo/pull/32249) by [@EvanBacon](https://github.com/EvanBacon))

## 4.0.0-preview.0 — 2024-10-22

### 🛠 Breaking changes

- Bumped iOS deployment target to 15.1. ([#30840](https://github.com/expo/expo/pull/30840) by [@tsapeta](https://github.com/tsapeta))
- Update to React Navigation v7 ([#28109](https://github.com/expo/expo/pull/28109) by [@marklawlor](https://github.com/marklawlor))

### 🎉 New features

- Add `expo-router/rsc/headers` for accessing request headers in server components. ([#32099](https://github.com/expo/expo/pull/32099) by [@EvanBacon](https://github.com/EvanBacon))
- Add aliases for bridge modules in RSC. ([#32095](https://github.com/expo/expo/pull/32095) by [@EvanBacon](https://github.com/EvanBacon))
- Add experimental support for React Server Actions in Expo Router. ([#31959](https://github.com/expo/expo/pull/31959) by [@EvanBacon](https://github.com/EvanBacon))
- server routing and static exports ([#31500](https://github.com/expo/expo/pull/31500) by [@EvanBacon](https://github.com/EvanBacon))
- Added `expo-router/link` export. ([#31174](https://github.com/expo/expo/pull/31174) by [@EvanBacon](https://github.com/EvanBacon))
- Added production exports for experimental server renderer. ([#30850](https://github.com/expo/expo/pull/30850) by [@EvanBacon](https://github.com/EvanBacon))
- Added experimental server renderer. ([#30334](https://github.com/expo/expo/pull/30334) by [@EvanBacon](https://github.com/EvanBacon))
- Add virtual client boundary. ([#30534](https://github.com/expo/expo/pull/30534) by [@EvanBacon](https://github.com/EvanBacon))
- Add better errors and warnings for malformed route exports. ([#30332](https://github.com/expo/expo/pull/30332) by [@EvanBacon](https://github.com/EvanBacon))
- Added `client-only` and `server-only` dependencies. ([#29646](https://github.com/expo/expo/pull/29646) by [@EvanBacon](https://github.com/EvanBacon))
- Add `relativeToDirectory` option to `<Link />` and imperative navigation. ([#30675](https://github.com/expo/expo/pull/30675) by [@marklawlor](https://github.com/marklawlor))
- Fix parsing URLs hash on the web after location update ([#31375](https://github.com/expo/expo/pull/31375) by [@marklawlor](https://github.com/marklawlor))
- Add `routerOptions` prop and improved types of `<Navigator />`. ([#31289](https://github.com/expo/expo/pull/31289) by [@marklawlor](https://github.com/marklawlor))
- Render the default StatusBar before screens are rendered. ([#31624](https://github.com/expo/expo/pull/31624) by [@marklawlor](https://github.com/marklawlor))
- Add `expo-router/ui` with new `Tabs` component ([#30767](https://github.com/expo/expo/pull/30767) by [@marklawlor](https://github.com/marklawlor))
- Add `withAnchor` to navigation options and `<Link />`. ([#31763](https://github.com/expo/expo/pull/31763) by [@marklawlor](https://github.com/marklawlor))
- Add `sitemap` option to `expo-router` config plugin to disable sitemap. ([#31701](https://github.com/expo/expo/pull/31701) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix Head module in dev clients. ([#32019](https://github.com/expo/expo/pull/32019) by [@EvanBacon](https://github.com/EvanBacon))
- Fix styling bug in native production error boundary. ([#31791](https://github.com/expo/expo/pull/31791) by [@EvanBacon](https://github.com/EvanBacon))
- Fix search params in RSC. ([#31641](https://github.com/expo/expo/pull/31641) by [@EvanBacon](https://github.com/EvanBacon))
- Fix reloading RSC requests in production. ([#31491](https://github.com/expo/expo/pull/31491) by [@EvanBacon](https://github.com/EvanBacon))
- Use empty cache requests to support loading RSC fresh on each request in native production builds. ([#31491](https://github.com/expo/expo/pull/31491) by [@EvanBacon](https://github.com/EvanBacon))
- Fix RSC errors when a missing module is loaded. ([#31491](https://github.com/expo/expo/pull/31491) by [@EvanBacon](https://github.com/EvanBacon))
- Fix nested server actions. ([#31019](https://github.com/expo/expo/pull/31019) by [@EvanBacon](https://github.com/EvanBacon))
- Add client boundary callback for production exports. ([#30747](https://github.com/expo/expo/pull/30747) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent duplicated `NSUserActivityTypes` strings in prebuild. ([#25114](https://github.com/expo/expo/pull/25114) by [@yjose](https://github.com/yjose))
- Fix Fash Refresh on \_layout files that export unstable_settings ([#29977](https://github.com/expo/expo/pull/29977) by [@marklawlor](https://github.com/marklawlor))
- Fix creating/parsing URLs with array search params. ([#30268](https://github.com/expo/expo/pull/30268) by [@marklawlor](https://github.com/marklawlor))
- Fix incorrect routing sorting for static paths ([#30909](https://github.com/expo/expo/pull/30909) by [@marklawlor](https://github.com/marklawlor))
- Fix hoisted index routes being incorrectly sorted. ([#31212](https://github.com/expo/expo/pull/31212) by [@marklawlor](https://github.com/marklawlor))
- Fix Typed Routes crashing on folder rename. ([#31221](https://github.com/expo/expo/pull/31221) by [@marklawlor](https://github.com/marklawlor))
- Fix incorrect initialRouteName for nested groups. ([#31025](https://github.com/expo/expo/pull/31025) by [@marklawlor](https://github.com/marklawlor))
- Ensure `router.replace()` falls back correctly on `<Drawer />` navigators. ([#26381](https://github.com/expo/expo/pull/26381) by [@jleem99](https://github.com/jleem99))
- Fix passing style array to `<Link />` when using `asChild`. ([#31373](https://github.com/expo/expo/pull/31373) by [@marklawlor](https://github.com/marklawlor))
- Add `legacy_subscribe` to `+native-intent`. ([#31765](https://github.com/expo/expo/pull/31765) by [@marklawlor](https://github.com/marklawlor))
- Fix `<Slot />` inside headless `<Tabs />` causing invalid navigation state. ([#32114](https://github.com/expo/expo/pull/32114) by [@marklawlor](https://github.com/marklawlor))
- Ensure generated screens do not appear in default `<Tabs />`. ([#32180](https://github.com/expo/expo/pull/32180) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Enable location polyfill by default with RSC enabled. ([#32188](https://github.com/expo/expo/pull/32188) by [@EvanBacon](https://github.com/EvanBacon))
- Add comments. ([#31543](https://github.com/expo/expo/pull/31543) by [@EvanBacon](https://github.com/EvanBacon))
- Drop `expo-status-bar`. ([#31097](https://github.com/expo/expo/pull/31097) by [@EvanBacon](https://github.com/EvanBacon))
- Support RSC only being hosted at platform subpaths. ([#30875](https://github.com/expo/expo/pull/30875) by [@EvanBacon](https://github.com/EvanBacon))
- Add basic RSC tests for views. ([#30589](https://github.com/expo/expo/pull/30589) by [@EvanBacon](https://github.com/EvanBacon))
- Import `@expo/metro-runtime` internals from `src` directory. ([#30300](https://github.com/expo/expo/pull/30300) by [@EvanBacon](https://github.com/EvanBacon))
- Prevent creating params object with null prototype ([#30009](https://github.com/expo/expo/pull/30009) by [@marklawlor](https://github.com/marklawlor))
- Fix Typed Routes clashing types and allow strict types for hooks. ([#29612](https://github.com/expo/expo/pull/29612) by [@marklawlor](https://github.com/marklawlor))
- Update `setParams` types to be a `Partial<>` ([#30570](https://github.com/expo/expo/pull/30570) by [@marklawlor](https://github.com/marklawlor))
- Remove `act` when running `runOnlyPendingTimers` in testing library. ([#30635](https://github.com/expo/expo/pull/30635) by [@marklawlor](https://github.com/marklawlor))
- Remove debugger code ([#30686](https://github.com/expo/expo/pull/30686) by [@marklawlor](https://github.com/marklawlor))
- Fix project linting errors ([#30687](https://github.com/expo/expo/pull/30687) by [@marklawlor](https://github.com/marklawlor))
- Fix useGlobalSearchParams returning a string value for params ([#30415](https://github.com/expo/expo/pull/30415) by [@marklawlor](https://github.com/marklawlor))

## 3.5.23 - 2024-08-14

_This version does not introduce any user-facing changes._

## 3.5.22 - 2024-08-14

_This version does not introduce any user-facing changes._

## 3.5.21 - 2024-08-07

### 🐛 Bug fixes

- Ensure navigation keeps within the closest group. ([#30266](https://github.com/expo/expo/pull/30266) by [@marklawlor](https://github.com/marklawlor))
- Fix Typed Routes with hoisted routes and groups. ([#30810](https://github.com/expo/expo/pull/30810) by [@marklawlor](https://github.com/marklawlor))

## 3.5.19 - 2024-07-29

### 🐛 Bug fixes

- Fix deep linking to Expo Go. ([#30283](https://github.com/expo/expo/pull/30283) by [@EvanBacon](https://github.com/EvanBacon))
- Fix pushing multiple hashes on web. ([#29990](https://github.com/expo/expo/pull/29990) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Update TypeScript types for Screen options function ([#30074](https://github.com/expo/expo/pull/30074) by [@vilnytskyi](https://github.com/vilnytskyi))

## 3.5.18 - 2024-07-11

### 🐛 Bug fixes

- Ensure initial route is created with params ([#27223](https://github.com/expo/expo/pull/27223) by [@marklawlor](https://github.com/marklawlor))

## 3.5.17 - 2024-06-27

### 🐛 Bug fixes

- Fix server hosting root html in a group with a layout. ([#29948](https://github.com/expo/expo/pull/29948) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Update URL params docblocks ([#29799](https://github.com/expo/expo/pull/29799) by [@aaron-mota](https://github.com/aaron-mota))

## 3.5.16 - 2024-06-10

### 💡 Others

- Split up getRoutes method for SSR. ([#29232](https://github.com/expo/expo/pull/29232) by [@EvanBacon](https://github.com/EvanBacon))

## 3.5.15 - 2024-06-03

### 🐛 Bug fixes

- Fix generating types in a loop ([#29157](https://github.com/expo/expo/pull/29157) by [@kadikraman](https://github.com/kadikraman))

## 3.5.14 — 2024-05-15

### 🐛 Bug fixes

- Additional fixes for deep links from expo.dev QR codes ([#28882](https://github.com/expo/expo/pull/28882) by [@marklawlor](https://github.com/marklawlor))

## 3.5.13 — 2024-05-14

### 🐛 Bug fixes

- Fix deep links from expo.dev QR codes ([#28881](https://github.com/expo/expo/pull/28881) by [@marklawlor](https://github.com/marklawlor))

## 3.5.12 — 2024-05-13

### 🐛 Bug fixes

- Fix Sitemap crashing when `UIViewControllerBasedStatusBarAppearance` is set to `YES` ([#28724](https://github.com/expo/expo/pull/28665) by [@hirbod](https://github.com/hirbod))

## 3.5.11 — 2024-05-09

### 🐛 Bug fixes

- Fix Typed Routes generating incorrect routes and crashing when moving files ([#28665](https://github.com/expo/expo/pull/28665) by [@marklawlor](https://github.com/marklawlor))
- Fix `_layout` files with platform extensions incorrectly registering as a route ([#28699](https://github.com/expo/expo/pull/28699) by [@marklawlor](https://github.com/marklawlor))

## 3.5.10 — 2024-05-07

### 🐛 Bug fixes

- Fix `useMemo` crash when adding new routes.

## 3.5.9 — 2024-05-06

### 💡 Others

- Use `ReactDOMServer.renderToString` to support React 19 beta. ([#28592](https://github.com/expo/expo/pull/28592) by [@EvanBacon](https://github.com/EvanBacon))

## 3.5.8 — 2024-05-03

_This version does not introduce any user-facing changes._

## 3.5.7 — 2024-05-02

_This version does not introduce any user-facing changes._

## 3.5.6 — 2024-05-01

### 🎉 New features

- Allow platform extensions for layout and route files ([#27408](https://github.com/expo/expo/pull/27408) by [@marklawlor](https://github.com/marklawlor))
- Add `linking` prop to `<ExpoRoot />` ([#27757](https://github.com/expo/expo/pull/27757) by [@marklawlor](https://github.com/marklawlor))
- Add `+native-intent` file support. ([#28113](https://github.com/expo/expo/pull/28113) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Fix missing types for Link when using Typed Routes ([#28467](https://github.com/expo/expo/pull/28467) by [@marklawlor](https://github.com/marklawlor))
- Prevent crash when `EXPO_ROUTER_APP_ROOT` directory does not exist ([#28466](https://github.com/expo/expo/pull/28466) by [@marklawlor](https://github.com/marklawlor))

## 3.5.5 — 2024-04-29

### 🐛 Bug fixes

- Fix `useLocalSearchParams` not passing all parameters to nested navigators. ([#28468](https://github.com/expo/expo/pull/28468) by [@marklawlor](https://github.com/marklawlor))
- Fix incorrect require.context regex for Android ([#28490](https://github.com/expo/expo/pull/28490) by [@marklawlor](https://github.com/marklawlor))
- Switch to react-native-helmet-async (fork of react-helmet-async) in order remove react-dom peer dependency. ([#28532](https://github.com/expo/expo/pull/28532) by [@brentvatne](https://github.com/brentvatne))

## 3.5.4 — 2024-04-26

### 🎉 New features

- Allow platform extensions for layout and route files ([#27408](https://github.com/expo/expo/pull/27408) by [@marklawlor](https://github.com/marklawlor))

## 3.5.3 — 2024-04-25

_This version does not introduce any user-facing changes._

## 3.5.2 — 2024-04-23

### 🐛 Bug fixes

- Fix support loading abstract Expo Go URLs with multiple segments. ([#28376](https://github.com/expo/expo/pull/28376) by [@EvanBacon](https://github.com/EvanBacon))

## 3.5.1 — 2024-04-22

_This version does not introduce any user-facing changes._

## 3.5.0 — 2024-04-18

### 🎉 New features

- Mark React client components with "use client" directives. ([#27300](https://github.com/expo/expo/pull/27300) by [@EvanBacon](https://github.com/EvanBacon))
- Add URL hash support ([#27105](https://github.com/expo/expo/pull/27105) by [@marklawlor](https://github.com/marklawlor))
- Type `Href` is no longer generic ([#27690](https://github.com/expo/expo/pull/27690) by [@marklawlor](https://github.com/marklawlor))

### 🐛 Bug fixes

- Ensure navigation events target the correct navigator ([#27485](https://github.com/expo/expo/pull/27485) by [@marklawlor](https://github.com/marklawlor))
- Fix using array syntax `(a,b)` with server output. ([#27462](https://github.com/expo/expo/pull/27462) by [@EvanBacon](https://github.com/EvanBacon))
- Fix issue with skipping all imports. ([#27238](https://github.com/expo/expo/pull/27238) by [@EvanBacon](https://github.com/EvanBacon))
- Include search parameters in the default Screen.getId() function. ([#26710](https://github.com/expo/expo/pull/26710) by [@marklawlor](https://github.com/marklawlor))
- Fix sitemap missing paths ([#26507](https://github.com/expo/expo/pull/26507) by [@marklawlor](https://github.com/marklawlor))
- API routes incorrectly reporting duplicate routes ([#26507](https://github.com/expo/expo/pull/26507) by [@marklawlor](https://github.com/marklawlor))
- Invalid nested +html routes ([#26507](https://github.com/expo/expo/pull/26507) by [@marklawlor](https://github.com/marklawlor))
- Routes under shared routes using the wrong layout ([#26507](https://github.com/expo/expo/pull/26507) by [@marklawlor](https://github.com/marklawlor))
- Update typed route generation ([#26578](https://github.com/expo/expo/pull/26578) by [@marklawlor](https://github.com/marklawlor))
- Fix `push` navigation not adding to history while inside a group ([#26678](https://github.com/expo/expo/pull/26678) by [@marklawlor](https://github.com/marklawlor))
- Fix using parenthesis in urls ([#27120](https://github.com/expo/expo/pull/27120) by [@marklawlor](https://github.com/marklawlor))
- Fix `push` navigation not pushing the same route multiple times ([#27307](https://github.com/expo/expo/pull/27307) by [@marklawlor](https://github.com/marklawlor))
- Fix router.navigate will only push when path parameters change ([#27285](https://github.com/expo/expo/pull/27285) by [@marklawlor](https://github.com/marklawlor))
- Fix incorrect route generation of array shared groups with brackets ([#27459](https://github.com/expo/expo/pull/27459) by [@marklawlor](https://github.com/marklawlor))
- Fix incorrect initial URL on web when using baseUrl ([#27287](https://github.com/expo/expo/pull/27287) by [@marklawlor](https://github.com/marklawlor))
- Cancel ExpoRouter SplashScreen during test teardown ([#27620](https://github.com/expo/expo/pull/27620) by [@marklawlor](https://github.com/marklawlor))
- Export `toHaveRouterState` and other matcher types from `expo-router/testing-library` ([#27646](https://github.com/expo/expo/pull/27646) by [@marklawlor](https://github.com/marklawlor))
- Fix missing types from typed routes ([#27412](https://github.com/expo/expo/pull/27412) by [@marklawlor](https://github.com/marklawlor))
- Fork NavigationContainer on web to use custom linking context ([#27712](https://github.com/expo/expo/pull/27712) by [@marklawlor](https://github.com/marklawlor))
- Fix relative navigation on hoisted routes ([#27778](https://github.com/expo/expo/pull/27778) by [@marklawlor](https://github.com/marklawlor))
- Fix setting an initial location to a hoisted index router in a group ([#27935](https://github.com/expo/expo/pull/27935) by [@marklawlor](https://github.com/marklawlor))
- Flush test timers after each navigation ([#27981](https://github.com/expo/expo/pull/27981) by [@marklawlor](https://github.com/marklawlor))

### 💡 Others

- Enable Jest tests for all platforms ([#27407](https://github.com/expo/expo/pull/27407) by [@marklawlor](https://github.com/marklawlor))

## 3.4.8 - 2024-02-29

### 🎉 New features

- Allow the file extension to be specified for `renderRouter`'s filepaths ([#26510](https://github.com/expo/expo/pull/26510) by [@marklawlor](https://github.com/marklawlor))
- Allow `renderRouter()` to accept an array of strings to quickly mock multiple empty components. ([#26651](https://github.com/expo/expo/pull/26651) by [@marklawlor](https://github.com/marklawlor))
- Add `.dismiss(), .dismissAll() and .canDismiss()` to `router` APIs. ([#26711](https://github.com/expo/expo/pull/26711) by [@marklawlor](https://github.com/marklawlor))

## 3.4.7 - 2024-02-06

### 🐛 Bug fixes

- Fix issue with top-level catch-all not matching client-side routing behavior. ([#26861](https://github.com/expo/expo/pull/26861) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Reduce usage of `expo-constants`. ([#26834](https://github.com/expo/expo/pull/26834) by [@EvanBacon](https://github.com/EvanBacon))

## 3.4.6 - 2024-01-26

_This version does not introduce any user-facing changes._

## 3.4.5 - 2024-01-23

### 🐛 Bug fixes

- Remove error hiding system. ([#26607](https://github.com/expo/expo/pull/26607) by [@EvanBacon](https://github.com/EvanBacon))
- Make `@testing-library/jest-native` usage optional ([#26650](https://github.com/expo/expo/pull/26650) by [@marklawlor](https://github.com/marklawlor))

## 3.4.4 - 2024-01-20

### 🎉 New features

- Add `useNavigationContainerRef` to access the root NavigationContainer ref. ([#26529](https://github.com/expo/expo/pull/26529) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

- Deprecate `useRootNavigation` in favor of `useNavigationContainerRef`. ([#26529](https://github.com/expo/expo/pull/26529) by [@EvanBacon](https://github.com/EvanBacon))
- Remove duplicate context mocking functions ([#26651](https://github.com/expo/expo/pull/26651) by [@marklawlor](https://github.com/marklawlor))
- Update to remove `ExpoRequest`/`ExpoResponse` imports from `@expo/server`. ([#27261](https://github.com/expo/expo/pull/27261) by [@kitten](https://github.com/kitten))

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
