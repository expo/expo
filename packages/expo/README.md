<!-- Title -->

<p align="center">
  <a href="https://expo.dev/">
    <img alt="Expo" height="96" src="../../.github/resources/expo.svg">
  </a>
</p>

<p align="center">The open-source framework for universal React Native apps — one codebase for Android, iOS, and the web.</p>

<p align="center">
  <a aria-label="expo documentation" href="https://docs.expo.dev">📚 Documentation</a>
  &ensp;•&ensp;
  <a aria-label="expo api reference" href="https://docs.expo.dev/versions/latest/">📖 API Reference</a>
  &ensp;•&ensp;
  <a aria-label="expo router" href="https://docs.expo.dev/router/introduction/">🧭 Expo Router</a>
  &ensp;•&ensp;
  <a aria-label="eas" href="https://expo.dev/eas">🚀 EAS</a>
  &ensp;•&ensp;
  <a aria-label="expo blog" href="https://expo.dev/blog">📝 Blog</a>
  &ensp;•&ensp;
  <a aria-label="contribute to expo" href="#contributing">👏 Contribute</a>
</p>

<p align="center">
  <a aria-label="npm version" href="https://www.npmjs.com/package/expo" target="_blank">
    <img alt="npm version" src="https://img.shields.io/npm/v/expo.svg?style=for-the-badge&label=npm&labelColor=000000&color=4630EB" />
  </a>
  <a aria-label="npm downloads" href="https://www.npmtrends.com/expo" target="_blank">
    <img alt="downloads" src="https://img.shields.io/npm/dm/expo.svg?style=for-the-badge&labelColor=000000&color=33CC12&label=downloads" />
  </a>
  <a aria-label="License: MIT" href="https://github.com/expo/expo/blob/main/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-success.svg?style=for-the-badge&labelColor=000000&color=33CC12" />
  </a>
  <a aria-label="Join the Expo Discord" href="https://chat.expo.dev" target="_blank">
    <img alt="Discord" src="https://img.shields.io/discord/695411232856997968.svg?style=for-the-badge&color=5865F2&logo=discord&logoColor=FFFFFF" />
  </a>
  <a aria-label="GitHub stars" href="https://github.com/expo/expo/stargazers" target="_blank">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/expo/expo.svg?style=for-the-badge&logo=github&label=stars&labelColor=000000&color=FFD700" />
  </a>
  <a aria-label="GitHub contributors" href="https://github.com/expo/expo/graphs/contributors" target="_blank">
    <img alt="GitHub contributors" src="https://img.shields.io/github/contributors-anon/expo/expo.svg?style=for-the-badge&logo=github&label=contributors&labelColor=000000&color=4630EB" />
  </a>
</p>

<p align="center">
  <a aria-label="Follow @expo on X" href="https://x.com/intent/follow?screen_name=expo" target="_blank">
    <img alt="Expo on X" src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on GitHub" href="https://github.com/expo" target="_blank">
    <img alt="Expo on GitHub" src="https://img.shields.io/badge/GitHub-222222?style=for-the-badge&logo=github&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on Reddit" href="https://www.reddit.com/r/expo/" target="_blank">
    <img alt="Expo on Reddit" src="https://img.shields.io/badge/Reddit-FF4500?style=for-the-badge&logo=reddit&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on Bluesky" href="https://bsky.app/profile/expo.dev" target="_blank">
    <img alt="Expo on Bluesky" src="https://img.shields.io/badge/Bluesky-1DA1F2?style=for-the-badge&logo=bluesky&logoColor=white" target="_blank" />
  </a>&nbsp;
  <a aria-label="Follow @expo on LinkedIn" href="https://www.linkedin.com/company/expo-dev" target="_blank">
    <img alt="Expo on LinkedIn" src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=LinkedIn&logoColor=white" target="_blank" />
  </a>

  <p align="center">⭐️ Be sure to star the Expo GitHub repo if you enjoy using the project! ⭐️</p>
</p>

---

Expo is the [officially recommended](https://reactnative.dev/docs/getting-started) framework for building production React Native apps. It gives you everything you need to design, develop, and ship universal apps for Android, iOS, and the web from a single codebase — the SDK, the router, the build and update infrastructure, and the tooling — all open source and production-tested.

You write your app in React with TypeScript or JavaScript; Expo handles the rest: a Metro-powered dev server with fast refresh, file-based routing that works the same on every platform, a curated SDK of native modules you can drop in, and a path to the App Store and Play Store that doesn't require Xcode or Android Studio on your machine.

Built and maintained in the open by [the Expo team](https://expo.dev/about) and a community of [thousands of contributors](https://github.com/expo/expo/graphs/contributors).

## Quick start

Create a new app and start the dev server:

```
npx create-expo-app@latest my-app
cd my-app
npx expo start
```

Then open the app on a simulator, a device with [Expo Go](https://expo.dev/go), or the web. See the [official Quick Start guide](https://docs.expo.dev/get-started/create-a-project/) for a full walkthrough.

Already have a React Native app? Add Expo to it with [`install-expo-modules`](https://docs.expo.dev/bare/installing-expo-modules/):

```
npx install-expo-modules@latest
```

## The Expo ecosystem

Expo is a collection of tools and services that work together, but each piece is independently useful.

### Expo SDK

A large library of first-party, cross-platform modules covering everything from camera and notifications to file system and sensors — [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/), [`expo-image`](https://docs.expo.dev/versions/latest/sdk/image/), [`expo-notifications`](https://docs.expo.dev/versions/latest/sdk/notifications/), [`expo-file-system`](https://docs.expo.dev/versions/latest/sdk/filesystem/), and [many more](https://docs.expo.dev/versions/latest/). Install any of them with `npx expo install`.

### Expo Router

A [file-based router](https://docs.expo.dev/router/introduction/) for universal navigation across Android, iOS, and the web — with typed routes, deep linking, and server-side rendering built in. Layouts, modals, and tabs work the same on every platform.

### Expo Modules API

A modern Swift and Kotlin [API for writing native modules](https://docs.expo.dev/modules/overview/). It's what powers the entire Expo SDK and a growing ecosystem of third-party libraries. If you can write Swift or Kotlin, you can extend your app with native code — no Objective-C, no Java, no C++, no JNI.

### Expo UI

[`@expo/ui`](https://docs.expo.dev/versions/latest/sdk/ui/) — a set of truly native UI components backed by SwiftUI on iOS and Jetpack Compose on Android. Use platform controls (pickers, switches, sliders, menus, …) that look and feel exactly like the rest of the OS, from React.

### DOM components

Mark a React component with `"use dom"` and Expo will render it as web content inside your native app — perfect for incrementally migrating web code or reusing a React web component on mobile. [Learn more](https://docs.expo.dev/guides/dom-components/).

### Continuous Native Generation

Your `ios/` and `android/` folders are generated, not maintained. Describe your native config in `app.json` and [config plugins](https://docs.expo.dev/config-plugins/introduction/); run `npx expo prebuild` to materialize the projects on demand. Upgrades, package additions, and native customizations all flow through the same declarative pipeline — no more merge conflicts in native code.

### EAS

[Expo Application Services](https://expo.dev/eas) — hosted infrastructure for shipping React Native apps:

- **[EAS Build](https://docs.expo.dev/build/introduction/)** — cloud builds for iOS and Android, no local Xcode or Android Studio setup required.
- **[EAS Submit](https://docs.expo.dev/submit/introduction/)** — one command to submit to the App Store and Play Store.
- **[EAS Update](https://docs.expo.dev/eas-update/introduction/)** — over-the-air JavaScript and asset updates, with channels and rollbacks.
- **[EAS Workflows](https://docs.expo.dev/eas-workflows/get-started/)** — CI/CD for building, testing, and releasing your app.
- **[EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)** — host your web app and API routes on Expo's edge.
- **[Expo Launch](https://launch.expo.dev/)** — a guided, browser-based path to ship to the web and App Store without touching configuration. Built on top of EAS.

EAS is optional, but the fastest path from `git push` to the store.

### Tooling

- **[`@expo/cli`](https://github.com/expo/expo/blob/main/packages/%40expo/cli/README.md)** — one interface around Metro and the native toolchain (Xcode, Simulator.app, Android Studio, ADB, …). Keep dependency versions aligned with `npx expo install`.
- **[Expo Go](https://expo.dev/go)** and **[development builds](https://docs.expo.dev/develop/development-builds/introduction/)** — preview your app on a device in seconds.
- **[Snack](https://snack.expo.dev)** — try Expo right in your browser, no install needed.

## Why Expo

- **Universal by default.** One codebase targets Android, iOS, and the web.
- **Production-ready.** Used in tens of thousands of apps on the App Store and Play Store.
- **Customizable all the way down.** Config plugins and the Expo Modules API let you reach the metal when you need to.
- **Open source.** MIT-licensed, actively developed in the open.

## Learn more

- [Documentation](https://docs.expo.dev) — guides, tutorials, and the full SDK reference.
- [Tutorial](https://docs.expo.dev/tutorial/introduction/) — build your first universal app step by step.
- [Examples](https://github.com/expo/examples) — sample projects you can copy from.
- [Changelog](https://expo.dev/changelog) and [blog](https://expo.dev/blog).
- [Discord & Forums](https://chat.expo.dev) — ask questions and chat with the community.
- [Support](https://expo.dev/support) — community, enterprise, and partner-agency options all in one place.

## Contributing

Bug reports, fixes, and improvements are very welcome. See [CONTRIBUTING](./CONTRIBUTING.md) for how to set up this package locally, and the repo-wide [contributing guide](https://github.com/expo/expo/blob/main/CONTRIBUTING.md) for general guidelines.

## License

The Expo source code is made available under the [MIT License](https://github.com/expo/expo/blob/main/LICENSE).
