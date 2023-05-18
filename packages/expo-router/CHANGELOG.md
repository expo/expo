# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
