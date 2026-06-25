# expo-app-intents

Expose Apple App Intents (Siri, Shortcuts, Spotlight, Apple Intelligence) from Expo apps.

App Intent types must be compiled into the iOS app target. Apple's build-time metadata extraction does not see code in static pods. This package pairs a runtime pod (JS bridge, invocation queue, entity storage) with app-target Swift that you own, placed in an `app-intents/` directory via [Expo Inline Modules](https://docs.expo.dev/modules/inline-modules-tutorial/).

## Limitations

- Shortcut phrases are compiled at build time and cannot be created from JavaScript at runtime. Only parameter values are dynamic.
- A single classic App Shortcut phrase can interpolate at most one non-array parameter.
- Maximum 10 App Shortcuts per app; every phrase must include `\(.applicationName)`.
- iOS 16.4+.
