# expo-observe

**React Native performance monitoring, from the team that builds Expo.**

`expo-observe` measures how fast your app starts and how fast each screen becomes usable, on real user devices and real networks. It is open source, it speaks OpenTelemetry, and the endpoint is replaceable.

The app you are building is not the app your users are using. They run several versions of it at once, on hundreds of device models, on connections nothing like yours. `expo-observe` measures what each of them actually experiences.

There are two parts, and they are separable:

- **`expo-observe`** (this package) is the open source instrumentation. It collects metrics, events and logs from production apps and transmits them over the OpenTelemetry Protocol.
- **EAS Observe** is the service that stores and analyzes that data. It is also the only destination that can join a metric to the EAS build, the OTA update and the commit behind it, because it is the same system that produced them.

You can use the library without the service. The default endpoint is EAS Observe.

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

## What it measures

**Startup, automatically:**

| Metric | What it measures |
| --- | --- |
| Cold launch | Process creation to the end of runtime, resource and component initialization, before the UI renders |
| Warm launch | Return to foreground from an already resident process |
| Bundle load | Loading the JavaScript bytecode and evaluating it |
| Time to first render (TTR) | Native launch finish to the root React component's first render |
| Time to interactive (TTI) | Launch to when the user can actually tap and scroll |

**Per screen:** on SDK 56 and later, the Expo Router and React Navigation integrations record per-route render metrics. They are opt-in. Enable one at module scope, before any screen mounts:

```tsx
Observe.configure({ integrations: { 'expo-router': true } });
```

TTI per screen uses `markInteractive()`.

**Device state the web has no concept of.** TTI events carry frozen frames, slow frames, total delay, thermal state, low power mode, battery level and charging state, network type, and whether the connection is metered or constrained. They also summarize the requests the app made during launch: count, failures, bytes, throughput, and facts about the slowest one. Some params are platform-specific, and each is omitted when the OS reports no value. Tools built for browsers do not collect these fields, because on the web they do not exist.

**Context, on every event:** app version and build number, environment, OS and OS version, device model and name, Expo SDK version, React Native version, language tag, app identifier and route. Sessions running an EAS build or an EAS Update also carry the build ID, the update ID and the channel.

Median, average, min, max, p80, p90 and p99 on every metric, alongside the event count. Sampling is off by default, so by default you get everything.

**User-defined events.** Send your own events with any serializable attributes. They land on the same timeline as the startup metrics, so a business event sits next to the frame drop that happened around it.

## Send the data somewhere else

`expo-observe` transmits over the OpenTelemetry Protocol (OTLP) over HTTP with a JSON payload. Point it at your own collector:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "observe": {
          "endpointUrl": "https://your-collector.example.com"
        }
      }
    }
  }
}
```

Metrics post to `<endpointUrl>/<project-id>/v1/metrics` and logs to `<endpointUrl>/<project-id>/v1/logs`.

The endpoint is baked into the native layer at build time. After you change it, run `npx expo prebuild` and create a new build.

The endpoint exists so that there is no lock-in. The reason to keep the default is attribution: EAS is the only collector that already knows which build and which update a session was running.

## Configuration

```tsx
import { Observe } from 'expo-observe';

Observe.configure({
  environment: 'production',
  sampleRate: 0.25,
});
```

| Option | Type | Default | Purpose |
| --- | --- | --- | --- |
| `environment` | string | `process.env.NODE_ENV ?? 'production'` | Environment label on every event |
| `dispatchingEnabled` | boolean | `true` | Whether collected events are sent |
| `dispatchInDebug` | boolean | `false` | Whether metrics from debug builds are sent |
| `sampleRate` | number | undefined | Fraction of installations that dispatch, in [0, 1] |
| `errorHandlingEnabled` | boolean | `true` | Whether unhandled JavaScript errors are recorded |
| `integrations` | object | undefined | Opt-in settings for EAS Observe integrations |

Sampling is deterministic per installation, so you get a stable slice of users rather than a scatter of partial sessions. Values outside [0, 1] are clamped. Percentiles are computed on the slice you keep and are not extrapolated.

`Observe.dispatchEvents()` flushes manually.

## Reading the data from the command line, or from an agent

```bash
eas observe:versions
eas observe:metrics-summary
eas observe:metrics
eas observe:routes
eas observe:session
eas observe:events
```

All six accept `--json --non-interactive`, so you can pipe them into a script or hand them to a coding agent. `--platform` filters every command except `observe:session`, which already targets one session. The `eas-observe` skill covers setup, metrics and queries: https://docs.expo.dev/skills/.

## Contributing

Contributions are very welcome. Please refer to the guidelines in the [contributing guide](https://github.com/expo/expo#contributing).
