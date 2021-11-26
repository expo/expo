---
title: Module Config
---

- `platforms` — An array of supported platforms.
- `ios` — Config with options specific to iOS platform
  - `modulesClassNames` — Names of Swift native modules classes to put to the generated modules provider file.
  - `appDelegateSubscribers` — Names of Swift classes that hooks into `ExpoAppDelegate` to receive AppDelegate life-cycle events.
- `android` — Config with options specific to Android platform
  - `modulesClassNames` — Full names (package + class name) of Kotlin native modules classes to put to the generated package provider file.
