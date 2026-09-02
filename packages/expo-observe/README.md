<p>
  <a href="https://docs.expo.dev/versions/unversioned/sdk/observe/">
    <img
      src="../../.github/resources/expo-observe.svg"
      alt="expo-observe"
      height="64" />
  </a>
</p>

**React Native performance monitoring, from the team that builds Expo.**

`expo-observe` measures how fast your app starts and how fast each screen becomes usable, on real user devices and real networks. It is open source, it speaks OpenTelemetry, and the endpoint is replaceable.

The app you are building is not the app your users are using. They run several versions of it at once, on hundreds of device models, on connections nothing like yours. `expo-observe` measures what each of them actually experiences.

There are two parts, and they are separable:

- **`expo-observe`** (this package) is the open source instrumentation. It collects metrics, events and logs from production apps and transmits them over the OpenTelemetry Protocol.
- **EAS Observe** is the service that stores and analyzes that data. It is also the only destination that can join a metric to the EAS build, the OTA update and the commit behind it, because it is the same system that produced them.

You can use the library without the service. The default endpoint is EAS Observe.

## Platforms supported

Android, iOS, and tvOS.

## Requirements

- Expo SDK 55 or later
- An EAS project (`extra.eas.projectId` in your app config, or run `eas init`)
- A development or production build. `expo-observe` does not run in Expo Go.

## Setup

Three steps.

**1. Install**

```bash
npx expo install expo-observe
```

**2. Wrap your root layout**

```tsx
import { ObserveRoot } from 'expo-observe';

function RootLayout() {
  // your app
}

export default ObserveRoot.wrap(RootLayout);
```

On SDK 55, the export is `AppMetricsRoot.wrap`.

**3. Mark the moment your app is usable**

```tsx
import { useObserve } from 'expo-observe';
import { useEffect } from 'react';

function HomeScreen() {
  const { markInteractive } = useObserve();

  useEffect(() => {
    // after your initialization work finishes
    markInteractive();
  }, [markInteractive]);

  return <Feed />;
}
```

Call it on every entry screen. Only the first call in a session records the measurement. On SDK 55, use `AppMetrics.markInteractive()`.

Then run `eas build`. Instrumentation ships with the binary, and metrics appear in the Observe tab of your EAS dashboard.

Launch, bundle load and render metrics are automatic. The one explicit call exists because only your code knows when your app is genuinely ready for input. Automatic where it can be, explicit where accuracy matters.

## Startup metrics

Cold launch, warm launch, bundle load and time to first render are collected automatically. Time to interactive comes from your `markInteractive()` call. Every TTI event also carries frame, thermal, battery and network params, and a summary of the requests made during launch, so you can tell a slow device from a slow network. Tools built for browsers do not collect these fields, because on the web they do not exist.

Every event carries app, release, device and route context, so you can group the results by version, model or screen.

See [Metrics reference](https://docs.expo.dev/eas/observe/reference/metrics/).

## Per-screen metrics

On SDK 56 and later, the Expo Router and React Navigation integrations record per-route render and interactive timings. Both are opt-in.

See [Expo Router integration](https://docs.expo.dev/eas/observe/integrations/expo-router/) and [React Navigation integration](https://docs.expo.dev/eas/observe/integrations/react-navigation/).

## Update downloads

Apps that use EAS Update report how long each update bundle takes to download. This needs no instrumentation.

See [EAS Update download performance](https://docs.expo.dev/eas/observe/eas-update/).

## User-defined events

Log your own named events with `Observe.logEvent`. They land on the same timeline as the startup metrics, so a business event sits next to the frame drop that happened around it.

See [User-defined events](https://docs.expo.dev/eas/observe/events/).

## Errors

On SDK 57 and later, unhandled JavaScript errors are recorded automatically. Wrap a subtree in `ObserveErrorBoundary` to catch render errors, and call `Observe.reportError` for the errors you handle yourself. This feature is in preview.

See [Error reporting](https://docs.expo.dev/eas/observe/errors/).

## Custom endpoint

`expo-observe` transmits over the OpenTelemetry Protocol (OTLP) over HTTP with a JSON payload. Set `endpointUrl` in your app config to send the data to your own collector instead. The endpoint exists so that there is no lock-in. The reason to keep the default is attribution: EAS is the only collector that already knows which build and which update a session was running.

See [Custom endpoint](https://docs.expo.dev/eas/observe/configuration/#custom-endpoint).

## Configuration

`Observe.configure()` sets the environment label, the sampling rate, dispatching behavior and integrations at runtime. `Observe.dispatchEvents()` flushes pending events manually.

See [Configuration](https://docs.expo.dev/eas/observe/configuration/).

## Command line and agents

Everything the dashboard shows is also available from the terminal through the `eas observe:` commands. They all accept `--json --non-interactive`, so you can pipe them into a script or hand them to a coding agent. The `eas-observe` [Expo Skill](https://docs.expo.dev/skills/) teaches an agent to set the library up and query the results.

See [Querying with EAS CLI](https://docs.expo.dev/eas/observe/eas-cli/).

## Documentation

- [EAS Observe guides](https://docs.expo.dev/eas/observe/): setup, dashboard, configuration, integrations and the metrics reference
- [API reference](https://docs.expo.dev/versions/latest/sdk/observe/): every method, option and type in this package

## Contributing

Contributions are very welcome. Please refer to the guidelines in the [contributing guide](https://github.com/expo/expo#contributing).
