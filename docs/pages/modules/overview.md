---
title: Overview
---

import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';

Expo Modules is a set of APIs and utils to improve the process of developing native modules for React Native and increase its capabilities. The entire ecosystem consists of the following parts, each one described in details on the dedicated pages:

- [Module API](module-api) — Allows creating native modules in a modern way, using Swift and Kotlin.
- [Autolinking](autolinking) — The mechanism that automatically links native dependencies.
- [AppDelegate Subscribers](appdelegate-subscribers) — Allows reacting to iOS AppDelegate events.
- [Module Config](module-config) — The module config file to configure and opt into some features.

If you would like to create a new Expo module from scratch, we have prepared a dedicated command for this: `npx create-expo-module`.<br/>
In case you just want to use something from Expo Modules API in your existing React Native library (yes, you can!), follow the steps below.

1️⃣ Create the [module config](module-config) **expo-module.config.json** file just near your **package.json** and start from the empty object `{}` in there.<br/>
2️⃣ Add `expo-modules-core` as a dependency in your podspec and **build.gradle** files.<br/>

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

3️⃣ Add `expo` package as a peer dependency in your **package.json** — we recommend using `*` as a version range so as not to cause any duplicated packages in user's **node_modules** folder.<br/>

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

And Voilà! To set up and opt into some specific features go into the other pages in this section and follow the steps listed there.
