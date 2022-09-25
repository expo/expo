---
title: Overview
---

import { Callout } from '~/ui/components/Callout';
import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

<Callout type="warning">Expo Modules APIs are in beta and subject to breaking changes.</Callout>
<br />

Expo provides a set of APIs and utilities to improve the process of developing native modules for Expo and React Native and expand your app capabilities.

- [Native Modules](./module-api.md) - Create native modules using Swift and Kotlin.
- [Android Lifecycle Listeners](./android-lifecycle-listeners.md) - Hook into Android Activity and Application lifecycle events.
- [iOS AppDelegate Subscribers](./appdelegate-subscribers.md) — Respond to iOS AppDelegate events.
- [Module Config](./module-config.md) — Configure and opt in to features.

## Create a new module

To create a new Expo module from scratch, just run `yarn create expo-module` or `npm create expo-module`.
The script will ask you a few questions and then generate the native Expo module along with the example app for iOS and Android that uses your new module.

## Use the Expo Modules API in an existing React Native library

You may want to use the Expo Modules API in existing React Native libraries, for example with [AppDelegate Subscribers](./appdelegate-subscribers.md) you can hook into `AppDelegate` methods without requiring developers to copy any code over to their own `AppDelegate`. This is particularly useful to add seamless support for Expo managed projects to a library. The following steps will set up your existing React Native library to have access to the Expo Modules API.

### 1. Initialize the module config

Create the [module config](module-config) **expo-module.config.json** file just near your **package.json** and start from the empty object `{}` in there. We will fill it in later to enable specific features. <br/>

### 2. Add the `expo-modules-core` native dependency

Add `expo-modules-core` as a dependency in your podspec and **build.gradle** files.<br/>

<CodeBlocksTable tabs={["*.podspec", "build.gradle"]}>

```ruby
# ...
Pod::Spec.new do |s|
  # ...
  s.dependency 'ExpoModulesCore'
end
```

```groovy
// ...
dependencies {
  // ...
  implementation project(':expo-modules-core')
}
```

</CodeBlocksTable>

### 3. Add Expo packages to dependencies

Add `expo` package as a peer dependency in your **package.json** — we recommend using `*` as a version range so as not to cause any duplicated packages in user's **node_modules** folder. Your library also needs to depend on `expo-modules-core` but only as a dev dependency — it's already provided in the projects depending on your library by the `expo` package with the version of core that is compatible with the specific SDK used in the project.<br/>

<CodeBlocksTable tabs={["package.json"]}>

```json
{
  // ...
  "devDependencies": {
    "expo-modules-core": "^X.Y.Z"
  },
  "peerDependencies": {
    "expo": "*"
  }
}
```

</CodeBlocksTable>

You can now use Expo Modules APIs in your library. You may be interested in referring to the [Android Lifecycle Listeners](./android-lifecycle-listeners.md) and [iOS AppDelegate Subscribers](./appdelegate-subscribers.md) guides next.
