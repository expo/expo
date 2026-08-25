# expo-observe

**React Native performance monitoring, from the team that builds Expo.**

`expo-observe` measures how fast your app starts and how fast each screen becomes usable, on real user devices and real networks. It is open source, it speaks OpenTelemetry, and the endpoint is replaceable.

The app you are building is not the app your users are using. They run several versions of it at once, on hundreds of device models, on connections nothing like yours. `expo-observe` measures what each of them actually experiences.

There are two parts, and they are separable:

- **`expo-observe`** (this package) is the open source instrumentation. It collects metrics, events and logs from production apps and transmits them over the OpenTelemetry Protocol.
- **EAS Observe** is the service that stores and analyses that data. It is also the only destination that can join a metric to the EAS build, the OTA update and the commit behind it, because it is the same system that produced them.

You can use the library without the service. The default endpoint is EAS Observe.

## Requirements

- Expo SDK 55 or later
- An EAS project (`extra.eas.projectId` in your app config, or run `eas init`)
- A development or production build. `expo-observe` does not run in Expo Go.
- Bare React Native is not supported today. It is on the roadmap.

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

function HomeScreen() {
  const { markInteractive } = useObserve();

  useEffect(() => {
    // after your initialisation work finishes
    markInteractive();
  }, []);
}
```

Call it on every entry screen. Only the first call in a session records the measurement. On SDK 55, use `AppMetrics.markInteractive()`.

Then run `eas build`. Instrumentation ships with the binary, and metrics appear in the Observe tab of your EAS dashboard.

Launch, bundle load and render metrics are automatic. The one explicit call exists because only your code knows when your app is genuinely ready for input. Automatic where it can be, explicit where accuracy matters.

## What it measures

**Startup, automatically:**

| Metric | What it measures |
| --- | --- |
| Cold launch | Process creation to the system finishing memory allocation |
| Warm launch | Return to foreground from an already resident process |
| Bundle load | Loading the JavaScript bytecode and evaluating it |
| Time to render (TTR) | Native launch finish to the root React component's first render |
| Time to interactive (TTI) | Launch to when the user can actually tap and scroll |

**Per screen:** route render time is automatic on SDK 56 and later through the Expo Router or React Navigation integration. TTI per screen uses `markInteractive()`.

**Device state the web has no concept of.** Every TTI event carries frozen frames, slow frames, total delay, thermal state, low power mode, network type and network connected. Tools built for browsers do not collect these fields, because on the web they do not exist.

**Context, on every event:** app version and build number, environment, country, OS and OS version, device model, Expo SDK version, React Native version, language tag, app identifier and route.

Median, average, min, max, p90 and p99 on every metric. Sampling is off by default, so by default you get everything.

**User-defined events.** Send your own events with any serialisable attributes. They land on the same timeline as the startup metrics, so a business event sits next to the frame drop that happened around it.

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
| `environment` | string | `process.env.NODE_ENV` | Environment label on every event |
| `dispatchingEnabled` | boolean | `true` | Whether collected events are sent |
| `dispatchInDebug` | boolean | `false` | Whether metrics from debug builds are sent |
| `sampleRate` | number | undefined | Fraction of installations that dispatch, in [0, 1] |
| `integrations` | object | undefined | Opt-in settings for EAS Observe integrations |

Sampling is deterministic per installation, so you get a stable slice of users rather than a scatter of partial sessions. Values outside [0, 1] are clamped. Percentiles are computed on the slice you keep and are not extrapolated.

`Observe.dispatchEvents()` flushes manually.

## Reading the data from the command line, or from an agent

```bash
eas observe:versions
eas observe:metrics-summary
eas observe:metrics
eas observe:events
```

All four accept `--json --non-interactive`, so you can pipe them into a script or hand them to a coding agent. Three published skills cover setup, metrics and queries: expo.dev/expo-skills.

## Contributing

Contributions are very welcome. Please refer to the guidelines in the contributing guide.

---
