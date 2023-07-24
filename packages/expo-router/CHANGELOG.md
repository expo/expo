# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## [Fri, 21 Jul 2023 16:23:54 -0500](https://github.com/expo/router/commit/747b479918584692b978a8d4f6ed0ce86d83ea7d)

### 🎉 New features

- View controller based status bar appearance ([#773](https://github.com/expo/router/issues/773))
- Allow nullish params ([#782](https://github.com/expo/router/issues/782))
- Add full expo style reset to SSG ([#751](https://github.com/expo/router/issues/751))

### 🐛 Bug fixes

- Fix infinite loop when using invalid initialRouteName ([#780](https://github.com/expo/router/issues/780))
- Fix initial route modal being presented instantly ([#781](https://github.com/expo/router/issues/781))
- Memoize useRouter ([#753](https://github.com/expo/router/issues/753))

### 💡 Others

- Deprecate <Screen /> redirect prop ([#677](https://github.com/expo/router/issues/677))

## [Wed, 5 Jul 2023 10:41:30 -0700](https://github.com/expo/router/commit/5610b2c68a5b58f250e2789e49a9fc76dbac0097)

## [Wed, 5 Jul 2023 10:24:47 -0700](https://github.com/expo/router/commit/103a4637d2980d7642c1ac4bdf40586e1941b537)

### 🎉 New features

- expose canGoBack function on router ([#712](https://github.com/expo/router/issues/712))
- add custom getId ([#713](https://github.com/expo/router/issues/713))

### 💡 Others

- remove duplicate `sortRoutes` declaration ([#705](https://github.com/expo/router/issues/705))
- set sdk 49 compatible splash screen version explicitly ([#711](https://github.com/expo/router/issues/711))

## [Thu, 29 Jun 2023 22:27:08 -0700](https://github.com/expo/router/commit/44ca98dfe9dea5d533badf368ce3374e50873196)

### 🐛 Bug fixes

- Improve mounting error message ([#703](https://github.com/expo/router/issues/703))
- Strip hashes before navigating ([#702](https://github.com/expo/router/issues/702))

## [Wed, 28 Jun 2023 15:53:41 -0700](https://github.com/expo/router/commit/11bb4476807dd98eebd2c9052abdc50ddac34f6a)

### 🐛 Bug fixes

- disable setting the document.title with React Navigation ([#693](https://github.com/expo/router/issues/693))
- fix moving from modal to tab ([#696](https://github.com/expo/router/issues/696))

## [Tue, 27 Jun 2023 16:44:04 -0700](https://github.com/expo/router/commit/8dbfc405ba2b85da98d34936fce829ec22b63d9f)

### 🐛 Bug fixes

- fix initial router info regression ([#689](https://github.com/expo/router/issues/689))

## [Tue, 27 Jun 2023 11:20:24 -0700](https://github.com/expo/router/commit/94c285ff3b3862a50bfb70d4fda688cedb91f244)

### 🐛 Bug fixes

- add hasUrlProtocolPrefix ([#691](https://github.com/expo/router/issues/691))
- expect more optionals ([#685](https://github.com/expo/router/issues/685))

## [Thu, 22 Jun 2023 20:16:45 -0500](https://github.com/expo/router/commit/88637e027771608f8f163c7a8240ce84ef23f3ad)

### 🐛 Bug fixes

- Fix async routes in static web.
- Fix `react-native-gesture-handler` optional import.
- Make `origin` optional in config plugin.

## [Thu, 22 Jun 2023 17:12:26 -0500](https://github.com/expo/router/commit/a83e1cd3bb15bccb83fc5c31bc4706260cba49b0)

### 🎉 New features

- Allow +html file to use hooks ([#672](https://github.com/expo/router/issues/672))

### 🐛 Bug fixes

- Fix Unmatched rendering in static rendering ([#669](https://github.com/expo/router/issues/669))

### 💡 Others

- Manifest is deprecated in SDK 49, use expoConfig instead ([#679](https://github.com/expo/router/issues/679))
- Additional tests ([#635](https://github.com/expo/router/issues/635))

## [Thu, 15 Jun 2023 22:44:54 -0500](https://github.com/expo/router/commit/ac12133d0179dd1b2ec170b75ee04fae4456f2d6)

### 🐛 Bug fixes

- Fix tutorial style ([#662](https://github.com/expo/router/issues/662))
- Fix create entry when run outside of monorepos ([#660](https://github.com/expo/router/issues/660))

## [Tue, 13 Jun 2023 19:03:46 -0500](https://github.com/expo/router/commit/10bfe14151b2a89190bde4a371a4c6039d8f354d)

### 🐛 Bug fixes

- Fix react refresh for web with `output: single` ([#658](https://github.com/expo/router/issues/658))

## [Mon, 12 Jun 2023 17:06:50 -0500](https://github.com/expo/router/commit/460ad5e7f5de87e7abd8b20762bcdda0d38c8c2b)

## [Mon, 12 Jun 2023 16:33:50 -0500](https://github.com/expo/router/commit/de3387b677ec5a6089e4d7b980334616a8a4a296)

### 🛠 Breaking changes

### 🎉 New features

- Add support for the src directory to expo router ([#629](https://github.com/expo/router/issues/629))
- Update async routes for metro@0.76.3 ([#622](https://github.com/expo/router/issues/622))
- Add support for imperative API that works without hooks ([#600](https://github.com/expo/router/issues/600))
- Implement better splash imperative API ([#620](https://github.com/expo/router/issues/620))
- Add SafeAreaView to the default navigator ([#623](https://github.com/expo/router/issues/623))

### 🐛 Bug fixes

- Do not reset `isReady` during Fast Refresh ([#653](https://github.com/expo/router/issues/653))
- Fix splash screen invocations ([#654](https://github.com/expo/router/issues/654))

### 💡 Others

## [Thu, 1 Jun 2023 16:16:35 -0500](https://github.com/expo/router/commit/c75864b0bc2d05bde4c6f1cf409e2a7dd26a2248)

### 🛠 Breaking changes

- Remove `useHref` ([#602](https://github.com/expo/router/issues/602))

### 🎉 New features

- Symbolicate ErrorBoundary stack ([#617](https://github.com/expo/router/issues/617))
- Encode query parameter values when resolving href ([#608](https://github.com/expo/router/issues/608))

### 🐛 Bug fixes

- Fix fast refresh on web. ([#606](https://github.com/expo/router/issues/606))
- Fix showing tutorial page when no app directory is found. ([#605](https://github.com/expo/router/issues/605))
- Prevent root rerender. ([#612](https://github.com/expo/router/issues/612))

### 💡 Others

- Move the context stubs into a new file ([#599](https://github.com/expo/router/issues/599))

## [Fri, 19 May 2023 11:10:36 -0500](https://github.com/expo/router/commit/590b4c8c0ce18ae701ae0509181679ebcbc3a5de)

### 🛠 Breaking changes

### 🎉 New features

- rename `useSearchParams` to `useGlobalSearchParams` and deprecate the `useSearchParams` function. ([#578](https://github.com/expo/router/issues/578))
- automatically urlencode path params ([#553](https://github.com/expo/router/issues/553))

### 🐛 Bug fixes

- fix ssg warning ([#589](https://github.com/expo/router/issues/589))
- fix: isMovingToSiblingRoute incorrectly detecting parent as sibling ([#532](https://github.com/expo/router/issues/532))
- inifinite rerenders due to default prop value ([#531](https://github.com/expo/router/issues/531))
- remove navigation store ([#527](https://github.com/expo/router/issues/527))

### 💡 Others

## [Thu, 27 Apr 2023 19:28:53 -0500](https://github.com/expo/router/commit/100817c4e91eac21cd2416827144bd8da963f8af)

### 🛠 Breaking changes

### 🎉 New features

- Add Expo Config Plugin for configuring API.

### 🐛 Bug fixes

### 💡 Others

## [Wed, 26 Apr 2023 19:13:52 -0500](https://github.com/expo/router/commit/7ab776facb0fb26427a7891e4a5c98ac431105a4)

### 🛠 Breaking changes

### 🎉 New features

- feat: testing utils for jest ([#447](https://github.com/expo/router/issues/447))

### 🐛 Bug fixes

### 💡 Others

## [Thu, 13 Apr 2023 21:13:59 -0500](https://github.com/expo/router/commit/8d8ece6dc5f73d824c0e3a7b44fb71b57ad24536)

### 🛠 Breaking changes

### 🎉 New features

- refactor: consolidate providers into a central store ([#466](https://github.com/expo/router/issues/466))
- feat: expo-env.d.ts ([#477](https://github.com/expo/router/issues/477))

### 🐛 Bug fixes

- fix: Convert react-native-web types to an ambient module ([#481](https://github.com/expo/router/issues/481))

### 💡 Others

## [Sun, 9 Apr 2023 16:42:18 -0500](https://github.com/expo/router/commit/ec6f6ecf15063bccf062307b0fcd350933956479)

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- fix nested deep dynamic route colliding with generated 404 ([#473](https://github.com/expo/router/issues/473))

### 💡 Others

## [Wed, 5 Apr 2023 12:31:34 -0500](https://github.com/expo/router/commit/ad5d734485e00468d39955d16b4af0e2ac1a6fbf)

### 🛠 Breaking changes

### 🎉 New features

- feat(router): add hack to temporarily support `expo-development-client`. ([#461](https://github.com/expo/router/issues/461))

### 🐛 Bug fixes

### 💡 Others

## [Sun, 2 Apr 2023 14:51:24 -0500](https://github.com/expo/router/commit/02141fa8a06cbeaa165565a58de4d0727c0f8990)

### 🛠 Breaking changes

### 🎉 New features

- feat(router, runtime): Development bundle splitting ([#449](https://github.com/expo/router/issues/449))

### 🐛 Bug fixes

### 💡 Others

## [Wed, 29 Mar 2023 20:23:33 -0500](https://github.com/expo/router/commit/217bb34d40e3c62d2aaf08042ac3ecdb63a40807)

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- fix Node.js rendering by locking the server context ([#440](https://github.com/expo/router/issues/440))
- fix loading useLayoutEffect in non-browser environment. ([#439](https://github.com/expo/router/issues/439))
- fix improve "going back" from an unmatched route. ([#437](https://github.com/expo/router/issues/437))
- fix `generateStaticParams` with clone syntax. ([#438](https://github.com/expo/router/issues/438))

### 💡 Others

- upgrade metro to 0.76.0 in monorepo ([#418](https://github.com/expo/router/issues/418))
- ignore tests in publish

## [Mon, 27 Mar 2023 17:42:06 -0500](https://github.com/expo/router/commit/52deb844568548eb6be0a217b7f0c7cbdf97ba89)

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## [Mon, 27 Mar 2023 17:28:01 -0500](https://github.com/expo/router/commit/8e9123dbe0b6b817f49be87e1f7215bcb8bbe368)

### 🛠 Breaking changes

### 🎉 New features

- feat(router): public root HTML file with `app/+html.js` ([#404](https://github.com/expo/router/issues/404))
- fake hiding the generated drawer items using `display: none`. ([#413](https://github.com/expo/router/issues/413))
- add `generateStaticParams` export which can be used to generate a list of static pages to export with `EXPO_USE_STATIC=1 yarn expo export -p web` (on main). ([#425](https://github.com/expo/router/issues/425))
- feat: expo-env.d.ts types ([#419](https://github.com/expo/router/issues/419))

### 🐛 Bug fixes

- fix initial linking in Expo Go production projects or EAS Update projects. ([#432](https://github.com/expo/router/issues/432))
- fix deep linking on native.

### 💡 Others

## [Mon, 20 Mar 2023 11:23:51 -0500](https://github.com/expo/router/commit/ebba591b2e1cc30279da1309a8a77ce044dc18b9)

### 🛠 Breaking changes

### 🎉 New features

- feat: upgrade to TypeScript 5 ([#385](https://github.com/expo/router/issues/385))
- feat: update <Link /> types for @expo/cli typed routes ([#377](https://github.com/expo/router/issues/377))
- refactor tsconfig & publishing of declaration files ([#372](https://github.com/expo/router/issues/372))
- stricter type for `useFocusEffect` ([#391](https://github.com/expo/router/issues/391))

### 🐛 Bug fixes

- fix: fix problematic ts-expect-error ([#369](https://github.com/expo/router/issues/369))

### 💡 Others

## [Wed, 8 Mar 2023 13:44:31 -0600](https://github.com/expo/router/commit/847d4e0e958af928a8ed679ae7df8e352ffa00cb)

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- Use `createElement` for static `div`. ([#358](https://github.com/expo/router/issues/358))
- refactor: remove ts-expect-error from link ([#356](https://github.com/expo/router/issues/356))
- refactor: remove ts-expect-error from getPathFromState ([#354](https://github.com/expo/router/issues/354))
- refactor: remove ts-expect-error from error-overlay ([#355](https://github.com/expo/router/issues/355))

### 💡 Others

## [Tue, 28 Feb 2023 12:13:09 -0600](https://github.com/expo/router/commit/a61fe6dfed89f52d69fdd226278f58ec3a8dfa19)

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- fix types ([#330](https://github.com/expo/router/issues/330))

### 💡 Others

## [Mon, 27 Feb 2023 17:48:01 -0600](https://github.com/expo/router/commit/3b757523236e2f2f23d7c5b874155c806313eadc)

### 🛠 Breaking changes

### 🎉 New features

- Upgrade to Expo SDK 48.
- Parse any URL prefix to enable automatic Android App Links handling.
- Support replacement to nested initial screens.

### 🐛 Bug fixes

- Drop legacy `Linking.removeEventListener` method.

### 💡 Others

- Make `react-native-gesture-handler` non-optional as Metro doesn't support optional dependencies correctly.
