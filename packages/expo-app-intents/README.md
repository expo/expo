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

## Donating intents

Donate an intent when the user performs its action inside your app, so the system can suggest it later on the Lock Screen, in Siri Suggestions, and in Spotlight. Make the intent donatable in Swift and register it in the `OnCreate` of your `AppIntentsSetup` module, under the same name it dispatches:

```swift
extension SaveNoteIntent: DonatableAppIntent {
  init(donationParams: AppIntentParams) {
    self.init()
    if case .string(let text) = donationParams["text"] {
      self.text = text
    }
  }
}

AppIntentDonationRegistry.shared.register("saveNote", as: SaveNoteIntent.self)
```

Then donate it from JavaScript, and delete donations when they no longer apply:

```ts
await AppIntents.donateIntentAsync('saveNote', { text: 'Buy milk' });

await AppIntents.deleteDonationsAsync({ intent: 'saveNote' });
```

## Limitations

- Shortcut phrases are compiled at build time and cannot be created from JavaScript at runtime. Only parameter values are dynamic.
- A single classic App Shortcut phrase can interpolate at most one non-array parameter.
- Maximum 10 App Shortcuts per app; every phrase must include `\(.applicationName)`.
- iOS 16.4+, macOS 13.4+, and tvOS 16.4+.
