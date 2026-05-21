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
  <a aria-label="expo api reference" href="https://docs.expo.dev/versions/latest/sdk/expo/">📖 API Reference</a>
  &ensp;•&ensp;
  <a aria-label="expo router" href="https://docs.expo.dev/router/introduction/">🧭 Expo Router</a>
  &ensp;•&ensp;
  <a aria-label="eas" href="https://expo.dev/eas">🚀 EAS</a>
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

Expo is the [officially recommended](https://reactnative.dev/docs/getting-started) framework for building production React Native apps. The `expo` package is its heart — a single dependency that gives you the runtime, the CLI, a curated set of essential modules, and a direct path to [Expo Router](https://docs.expo.dev/router/introduction/), the [Expo Modules API](https://docs.expo.dev/modules/overview/), and [EAS](https://expo.dev/eas). The same project runs on Android, iOS, and the web from a single codebase.

## Quick start

Create a new app and start the dev server:

```
npx create-expo-app@latest my-app
cd my-app
npx expo start
```

Already have a React Native app? Add Expo modules to it:

```
npx install-expo-modules@latest
```

Then install any package from the [Expo SDK](https://docs.expo.dev/versions/latest/) with `npx expo install`:

```
npx expo install expo-camera expo-router
```

## What you get

- **[Expo Router](https://docs.expo.dev/router/introduction/)** — a file-based router for universal navigation across Android, iOS, and the web, with typed routes, deep linking, and server-side rendering built in.
- **[Expo Modules API](https://docs.expo.dev/modules/overview/)** — a modern Swift and Kotlin API for writing native modules, plus a large library of first-party ones: [`expo-camera`](https://docs.expo.dev/versions/latest/sdk/camera/), [`expo-image`](https://docs.expo.dev/versions/latest/sdk/image/), [`expo-notifications`](https://docs.expo.dev/versions/latest/sdk/notifications/), [`expo-file-system`](https://docs.expo.dev/versions/latest/sdk/filesystem/), and [many more](https://docs.expo.dev/versions/latest/).
- **[EAS](https://expo.dev/eas)** — Expo Application Services for cloud builds, app store submissions, over-the-air updates, and CI/CD workflows. Optional, but the fastest path to ship.
- **[`@expo/cli`](https://github.com/expo/expo/blob/main/packages/%40expo/cli/README.md)** — one interface around Metro and the native toolchain (Xcode, Simulator.app, Android Studio, ADB, …). Generate native projects with `npx expo prebuild`, and keep dependency versions aligned with `npx expo install`.
- **Core infrastructure** — [`expo-modules-core`](https://github.com/expo/expo/tree/main/packages/expo-modules-core) and [`expo-modules-autolinking`](https://github.com/expo/expo/tree/main/packages/expo-modules-autolinking) handle the native plumbing so you don't have to. Modules are linked into iOS and Android projects automatically.
- **A minimal essentials bundle** — libraries nearly every app needs, such as [`expo-asset`](https://github.com/expo/expo/tree/main/packages/expo-asset), are included out of the box.
- **Runtime glue** — a JavaScript entry point that wires up your app at startup: registering the root component, loading fonts with `expo-font`, and enabling Expo Go support when applicable.

## Why Expo

- **Universal by default.** One codebase targets Android, iOS, and the web.
- **No ejecting required.** [Config plugins](https://docs.expo.dev/config-plugins/introduction/) let you customize native code without forking it.
- **Production-ready.** Used in tens of thousands of apps on the App Store and Play Store.
- **Open source.** MIT-licensed, actively developed in the open.

## Learn more

- [Documentation](https://docs.expo.dev) — guides, tutorials, and the full SDK reference.
- [Tutorial](https://docs.expo.dev/tutorial/introduction/) — build your first universal app step by step.
- [Examples](https://github.com/expo/examples) — sample projects you can copy from.
- [Snack](https://snack.expo.dev) — try Expo right in your browser, no install needed.
- [Changelog](https://expo.dev/changelog) and [blog](https://expo.dev/blog).
- [Discord & Forums](https://chat.expo.dev) — ask questions and chat with the community.

## Contributing

This is one of the most-installed packages in the Expo ecosystem — every bit of polish helps. Bug reports, fixes, and improvements are very welcome.

See [CONTRIBUTING](./CONTRIBUTING.md) for how to set up the package locally and submit a change, and the repo-wide [contributing guide](https://github.com/expo/expo/blob/main/CONTRIBUTING.md) for general guidelines.
