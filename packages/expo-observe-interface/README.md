# expo-observe-interface

Interface for libraries that report to [EAS Observe](https://docs.expo.dev/eas/observe/) without a dependency on `expo-observe`. A library registers an integration with this package. When the app installs `expo-observe` and enables the integration in `Observe.configure`, `expo-observe` sets up the integration and gives it a client that reports for it. When the app does not install `expo-observe`, the integration never starts.

The client applies the same rules to every integration:

- A report whose `code` is in the `ignoredCodes` option of the integration config is not recorded.
- Nothing is recorded while the user has not granted consent to Observe.
- The client does nothing after the integration is torn down.

The client does not limit how often an integration reports. Deduplicate a message that your library can log many times, for example once per frame.

The integration key in `Observe.configure({ integrations })` is the integration name. Use the npm package name of the library.

> **Note:** Integrations work only on iOS for now. On Android, the integrations never start.

## JavaScript

Add the package to the `dependencies` of the library. Then register the integration when the library is imported:

```ts
import { registerObserveIntegration } from 'expo-observe-interface';

type MyLibraryObserveConfig = { reportWarnings?: boolean };

declare module 'expo-observe-interface' {
  interface ObserveIntegrationsConfig {
    'my-library'?: boolean | MyLibraryObserveConfig;
  }
}

registerObserveIntegration<MyLibraryObserveConfig>({
  name: 'my-library',
  setup({ config, observe }) {
    const subscription = addLogListener((log) => {
      if (log.level === 'error') {
        observe.reportError({ type: 'my-library.error', message: log.message, code: log.code });
      } else if (config.reportWarnings) {
        observe.reportWarning({ name: 'my-library.warning', message: log.message });
      }
    });
    return () => subscription.remove();
  },
});
```

`setup` runs when `Observe.configure` enables the integration. When a later `configure` call changes the config, the teardown runs, and then `setup` runs again with the new config. When a later `configure` call turns the integration off, only the teardown runs. After the app reloads, `setup` runs again after the next `configure` call.

## Swift

Add `ExpoObserveInterface` to the dependencies of the library pod:

```ruby
s.dependency 'ExpoObserveInterface'
```

Then implement the integration:

```swift
import ExpoObserveInterface

final class MyLibraryObserveIntegration: ObserveIntegration {
  let name = "my-library"

  func setup(config: [String: Any], observe: any ObserveClient) throws -> (() -> Void)? {
    let reportWarnings = config["reportWarnings"] as? Bool ?? false
    let listener = MyLibraryLogs.addListener { log in
      if log.isError {
        observe.reportError(ObserveErrorReport(type: "my-library.error", message: log.message, code: log.code))
      } else if reportWarnings {
        observe.reportWarning(ObserveWarningReport(name: "my-library.warning", message: log.message))
      }
    }
    return { MyLibraryLogs.removeListener(listener) }
  }
}
```

Register the integration once per process, as early as possible. An integration registered early starts at launch with the config of the last `configure` call, so it reports what the library logs before `configure` runs. For example, register it from an app delegate subscriber, and add the subscriber to `apple.appDelegateSubscribers` in the `expo-module.config.json` of the library:

```swift
import ExpoModulesCore
import ExpoObserveInterface

public class MyLibraryAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func subscriberDidRegister() {
    ObserveIntegrationRegistry.shared.register(MyLibraryObserveIntegration())
  }
}
```

A library can have a native integration and a JavaScript integration with the same name. Both get the same config.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
