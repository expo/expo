# expo-app-intents

Expose Apple App Intents (Siri, Shortcuts, Spotlight, Apple Intelligence) from Expo apps.

App Intent types must be compiled into the iOS app target. Apple's build-time metadata extraction does not see code in static pods. This package pairs a runtime pod (JS bridge, invocation queue, entity storage) with app-target Swift that you own, placed in an `app-intents/` directory via [Expo Inline Modules](https://docs.expo.dev/modules/inline-modules-tutorial/).

## Getting started

```sh
npx expo install expo-app-intents
npx expo-app-intents init
npx expo prebuild -p ios
npx expo run:ios
```

Use `npx expo-app-intents init --examples counter restaurant` to scaffold specific examples, or run it interactively to choose from the available examples. See the [documentation](https://docs.expo.dev/versions/latest/sdk/app-intents) for the full guide.

In Swift `AppIntent.perform()` implementations, hand work to JavaScript with the actor-backed dispatcher:

```swift
await AppIntentDispatcher.shared.dispatch(
  name: "orderFood",
  params: [
    "dishId": .string("margherita-pizza"),
    "dishName": .string("Margherita Pizza")
  ]
)
```

In JavaScript, use `useAppIntents` to handle both invocations captured while JS was cold and
new invocations received while the app is running:

```tsx
import * as AppIntents from 'expo-app-intents';

export function AppIntentHandler() {
  AppIntents.useAppIntents(async (pendingIntents, newIntent) => {
    for (const invocation of pendingIntents) {
      console.log('[expo-app-intents]', invocation, newIntent?.id === invocation.id);
      await AppIntents.removePendingInvocationAsync(invocation.id);
    }
  });

  return null;
}
```

## Config-driven shortcuts

For simple intents that dispatch a name to JavaScript, declare `intents` in the config
plugin. No Swift files or `init` command are needed:

```json
{
  "expo": {
    "plugins": [["expo-app-intents", {
      "intents": [{
        "name": "orderFood",
        "title": "Order Food",
        "phrases": ["Order food in {appName}"],
        "dialog": "Order requested.",
        "systemImageName": "fork.knife"
      }]
    }]]
  }
}
```

Run `npx expo prebuild -p ios` and rebuild the app. The plugin adds its `directory`
(default `app-intents`) to the watched Inline Modules directories and writes
`GeneratedIntents.swift`, including the shortcut-refresh setup. Handle invocations
with `useAppIntents` as above. This requires an Expo version supporting Inline Modules;
this feature targets the development package, not an SDK 57 documented App Intents API.

Each entry needs `name` and non-empty `phrases`, with `{appName}` in every phrase.
`title` defaults to a humanized name, `shortTitle` to the title, `systemImageName` to
`sparkles`, and `openAppWhenRun` to `true`. Optional `dialog` is a static acknowledgement
of dispatch: it does **not** confirm the JavaScript operation succeeded. Dispatch
persists an invocation and notifies JS when running; `openAppWhenRun: false` does not
guarantee that JS starts or handles the invocation immediately.

For advanced handwritten intents, use `{ "swiftType": "TrackOrderIntent",
"shortTitle": "Track Order", "phrases": ["Track in {appName}"] }`. The Swift type
must conform to `AppIntent` and support initialization without arguments. Parameters,
entities, custom results and schemas remain configured in Swift. At most 10 entries
are supported; an empty array produces no provider.

Config mode owns the shortcuts provider. When migrating an existing scaffold, remove
its `AppShortcutsProvider` and the old `setShortcutsRefreshHandler` wiring, then move
the shortcut entries into config. Preserve other setup code such as entity registration.
The plugin conservatively checks Swift files in its configured directory for conflicts;
comments can also trigger these checks. Providers and conflicting types elsewhere in
the app target must be resolved by the developer.

Generated files are updated only during iOS prebuild. Removing `intents` while keeping
the plugin and watched-directory configuration removes the managed file. Removing the
plugin entirely or changing `directory` requires removing the old generated file
manually. User-owned files at the generated path are never overwritten or deleted.

## Limitations

- Shortcut phrases are compiled at build time and cannot be created from JavaScript at runtime. Only parameter values are dynamic.
- A single classic App Shortcut phrase can interpolate at most one non-array parameter.
- Maximum 10 App Shortcuts per app; every phrase must include `\(.applicationName)`.
- iOS 16.4+, macOS 13.4+, and tvOS 16.4+.
