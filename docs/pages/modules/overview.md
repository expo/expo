---
title: Overview
---

import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

Expo Modules is a set of APIs and utilities to improve the process of developing native modules for Expo and React Native and expand your app's capabilities.

- [Module API](./module-api.md) — Create native modules using Swift and Kotlin.
- [Autolinking](autolinking) — Link native dependencies automatically.
- [AppDelegate Subscribers](appdelegate-subscribers) — Respond to iOS AppDelegate events.
- [Module Config](module-config) — Configure and opt in to features.

To create a new Expo module from scratch, run `npx create-expo-module`.<br/>
In case you just want to use something from Expo Modules API in your existing React Native library (yes, you can!), follow the steps below.

### 1. Initialize the module config

Create the [module config](module-config) **expo-module.config.json** file just near your **package.json** and start from the empty object `{}` in there.<br/>
### 2. Add the `expo-modules-core` dependency

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

Add `expo` package as a peer dependency in your **package.json** — we recommend using `*` as a version range so as not to cause any duplicated packages in user's **node_modules** folder.<br/>

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

You can now use Expo Modules APIs in your library. A common use case for integrating these APIs in a React Native library is to integrate with [AppDelegateSubscribers](./appdelegate-subscribers.md) and <!-- insert MainActivity thing here -->.
