---
title: Overview
---

import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

Expo provides a set of APIs and utilities to improve the process of developing native modules for Expo and React Native and expand your app capabilities.

- [Module API](./module-api.md) - Create native modules using Swift and Kotlin (_experimental_).
- [Android Lifecycle Listeners](./android-lifecycle-listeners.md) - Hook into Android Activity and Application lifecycle events.
- [iOS AppDelegate Subscribers](./appdelegate-subscribers.md) — Respond to iOS AppDelegate events.
- [Module Config](./module-config.md) — Configure and opt in to features.

## Create a new module

To create a new Expo module from scratch, run `npx create-expo-module`.

## Use the Expo Module API in an existing React Native library

You may want to use the Expo module API in existing React Native libraries, for example with [AppDelegate Subscribers](./appdelegate-subscribers.md) you can hook into `AppDelegate` methods without requiring developers to copy any code over to their own `AppDelegate`. This is particularly useful to add seamless support for Expo managed projects to a library. The following steps will set up your existing React Native library to have access to the Expo module API.

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

### 3. Add the `expo` peer dependency

Add `expo` package as a peer dependency in your **package.json** — we recommend using `*` as a version range so as not to cause any duplicated packages in user's **node_modules** folder. Depending on `expo-modules-core` is not needed in **package.json** as it's already provided by the `expo` package with the version of core that is compatible with specific SDK.<br/>

<CodeBlocksTable tabs={["package.json"]}>

```json
{
  // ...
  "peerDependencies": {
    "expo": "*"
  }
}
```

</CodeBlocksTable>

You can now use Expo module APIs in your library. You may be interested in referring to the [Android Lifecycle Listeners](./android-lifecycle-listeners.md) and [iOS AppDelegate Subscribers](./appdelegate-subscribers.md) guides next.
