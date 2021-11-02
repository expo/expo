---
title: Migrating from "expo build"
---

The purpose of this reference page is to call out some of the practical differences that you may need to account for when migrating your Expo managed app from `expo build` ("classic builds") to EAS Build. If this is your first time using EAS Build, you can use this page as a companion to ["Creating your first build"](/build/setup.md).

One of the goals with EAS Build is to make it as easy as possible to migrate from `expo build`; for example, your app signing credentials will be automatically re-used, and the Expo SDK and your **app.json** configuration will all work the same as before. That said, there are some differences in the build process that may require additional configuration or small code changes.

### SDK 41+ apps are supported

EAS Build only supports SDK 41+ managed projects. You must upgrade your project to migrate to EAS Build.

### Only libraries included in your package.json are included in the resulting standalone app

This often results in massive reductions in app size; managed apps built with EAS Build can be in the order of 10x smaller than the same app built with `expo build` ([learn why](https://blog.expo.dev/expo-managed-workflow-in-2021-5b887bbf7dbb)). The tradeoff here is that you need to be careful when publishing updates in order to avoid publishing an incompatible JavaScript bundle. Learn more in [updates](/build/updates.md).

### The `--config` flag is not supported

You may be using `expo build:[ios|android] --config app.production.json` to switch app configuration files used by your project &mdash; this is not supported in EAS Build, but it's easy to migrate to an alternative. Read more: ["Migrating away from the `--config` flag in Expo CLI"](https://expo.fyi/config-flag-migration).

### No more automatic publishing before building

With classic builds, the default behavior is to automatically publish your app bundle as an update prior to running a build. This had some unintended consequences; for example, sometimes developers would run a build and be surprised to learn that their existing app was updated as a side effect.

With EAS Build, `expo publish` is not run as part of the build process. Instead, the JavaScript bundle is generated locally on EAS Build at build time and directly embedded in the app.

Because we no longer publish at build time, `postPublish` hooks in **app.json** will not be executed on build. If you use Sentry, be sure to update `sentry-expo` to the latest version and follow the updated instructions [in the README](https://github.com/expo/sentry-expo). If you have other custom `postPublish` hooks, you can follow the same approach used in `sentry-expo` to support `postPublish` hook type of behavior.

### `Constants.manifest` does not include update related fields until updated

Given that we no longer publish the app prior to builds, there is no update manifest available until the app has download an update. Usually this means that at least for the first launch of the app you won't have some fields available. If you are using `Constants.manifest` to access update fields, in particular `Constants.manifest.releaseChannel`, you should switch to `Updates.releaseChannel` instead.

### `Constants.appOwnership` will be `null` in the resulting standalone app

The `Constants.appOwnership` field no longer exists in standalone apps produced by EAS Build. If you were previously testing the environment with something like `const isStandaloneApp = Constants.appOwnership === "standalone"` then you can invert the logic: `const isStandaloneApp = Constants.appOwnership !== "expo"`.

### All assets referenced in source code are bundled

With classic builds, `assetBundlePatterns` serves two purposes:

1. Assets that match the given patterns are bundled in the binary at build time.
2. Assets that match the given patterns determine the contents of an "atomic" update bundle. All of the files matching `assetBundlePatterns` need to be downloaded before an update is considered ready to launch.

Only the second purpose applies with the new build system. All assets referenced in your app source code are bundled into your app binary at build time, the same as in a default React Native app &mdash; `assetBundlePatterns` is not used to determine what assets to bundle in the binary, it's only used for update bundles.

### Custom `"main"` entry point in **package.json** is not yet supported

If your app depends on a custom `"main"` entry point, you will need to remove that field from **package.json** and then create **index.js** in the root of your project and use [registerRootComponent](/versions/latest/sdk/register-root-component/) to register your root component. For example, if your app root component lives in **src/App.tsx**, your **index.js** should look like the following:

```
import { registerRootComponent } from 'expo';
import App from './src/App';

registerRootComponent(App);
```

Support for custom entry points is in progress and is coming soon.

### Monorepos may require additional setup

Classic builds had no knowledge of your repository set up, you could use a monorepo or birepo or trirepo, the service was entirely indifferent. As long as you were able to publish a bundle, that's all that was needed. EAS Build needs to be able to install all of your project dependencies and essentially set up your development environment inside of a worker, so in some cases that will require some additional configuration. Learn more: ["How to set up EAS Build with a monorepo"](/build-reference/how-tos.md#how-to-set-up-eas-build-with).

> Work is in progress to improve monorepo support for EAS Build managed projects. We recommend using [expo-yarn-workspaces](https://github.com/expo/expo/blob/master/packages/expo-yarn-workspaces/README.md).

### Environment variables used by your app need to be defined for EAS Build

If you use environment variables in your **app.config.js** or in your app source code (eg: with `babel-plugin-inline-dotenv`), you need to define these variables for your build profiles or in secrets, as described in ["Environment variables and secrets"](/build-reference/variables.md). With classic builds this was not necessary because your app JavaScript was always built on your development machine (when you publish the app bundle prior to building), but now the app JavaScript is built in an EAS Build worker.

### Additional configuration is required to access private npm packages

Learn more about how to securely store your `NPM_TOKEN` on EAS Build: ["Using private npm packages"](/build-reference/private-npm-packages).

### `expo-branch` is not supported on EAS Build

You will need to remove `expo-branch` from your app to build it with EAS Build. The plan is to add support to [react-native-branch](https://www.npmjs.com/package/react-native-branch), the library maintained by engineers at [Branch](https://branch.io/). If Branch support is a blocker for you, you can try to build your own [config plugin](https://docs.expo.dev/guides/config-plugins/) to add `react-native-branch` to your app today.

### **metro.config.js** must export the entire default config from `@expo/metro-config`

Previously, with classic builds, your **metro.config.js** might have looked something like:

```js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'db'],
  },
};
```

In the example above, you're only exporting _part_ of the default config, but EAS Build requires the _full_ config. To do that, you should modify `defaultConfig` directly, and then return the resulting object, like this:

```js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.assetExts.push('db');

module.exports = defaultConfig;
```

If you don't set up your **metro.config.js** file properly, your assets could fail to load in release builds.

<hr />

<div style={{ marginTop: 20 }} />

> 🆘 Having trouble migrating? [Join us in the #eas channel on the Expo Discord](https://discord.com/invite/4gtbPAdpaE) and let us know, we'll do our best to help.

<div style={{ marginTop: 20 }} />
