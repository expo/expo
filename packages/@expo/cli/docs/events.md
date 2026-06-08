# Structured Event Logging (`2g`)

Expo CLI emits structured JSONL events through [`2g`](https://github.com/kitten/2g). The package writes low-overhead session logs that automated tooling and agents can discover, replay, tail, and export. The CLI relies on the library directly — there is no in-tree wrapper.

## Activation

Logging is installed once when a command starts. Most commands (`start`, `serve`, `export`, `run:*`) call `installEventLogger({ command, version })`, which creates a bounded session under the system temp directory. `src/index.ts` also calls `installEventLogger()` early so that the `LOG_EVENTS` environment variable and child-process IPC are honored before any output.

The `LOG_EVENTS` environment variable overrides the destination:

```bash
LOG_EVENTS=events.jsonl npx expo start    # Write to a file
LOG_EVENTS=1 npx expo start               # Write to stdout (redirects console to stderr)
LOG_EVENTS=2 npx expo start               # Write to stderr (redirects console to stdout)
```

The first activated destination wins; subsequent `installEventLogger` calls are no-ops.

## Defining events

Create a logger with `events(category)` and declare its event payloads by augmenting the `EventRegistry` interface from `2g` via declaration merging:

```ts
import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'my_module:something_started': {
      platform: string;
    };
    'my_module:something_finished': {
      platform: string;
      duration: number;
    };
  }
}

export const event = events('my_module');
```

Registry keys are fully-qualified `category:event_name` strings. Event names and payloads are type-checked against the merged registry — there is no central registry file to update.

Payload fields must not use the reserved keys `_e`, `_t`, `_d`, `_l`, or `_w` (the event name, timestamp, span duration, log level, and worker id).

## Emitting events

```ts
event('something_started', { platform: 'ios' });

// event names and payloads are type-checked:
event('something_started', { wrong: true }); // TS error
event('nonexistent', {}); // TS error
```

When the logger is inactive, `event()` is a cheap no-op.

## Spans

Use `event.span()` to record a start/end pair with a measured duration (`_d`, in milliseconds):

```ts
const done = event.span('something_started', { platform: 'ios' });
// ...work...
done('something_finished', { platform: 'ios', duration: 500 });
```

## Relative paths

Each logger has a `.path()` helper that resolves absolute paths relative to the log target directory:

```ts
event('file_changed', { file: event.path('/Users/me/project/src/App.tsx') });
// logs: { "_e": "my_module:file_changed", "_t": 1713000000000, "file": "src/App.tsx" }
```

## Output format

Each event is a single JSON line:

```jsonl
{"_e":"my_module:something_started","_t":1713000000000,"platform":"ios"}
{"_e":"my_module:something_finished","_t":1713000000500,"platform":"ios","duration":500,"_d":500}
```

- `_e` — fully qualified event name (`category:event_name`)
- `_t` — wall-clock timestamp for cross-process correlation
- `_d` — span duration in milliseconds (only on span-end events)
- `_l` — log level (only on debug-level events, surfaced when debug logging is enabled)
- `_w` — worker id (only on events emitted from worker threads/child processes)

## Inspecting logs

The package ships a `2g` CLI to discover and read sessions:

```sh
2g ps --json                                       # list sessions
2g tap "expo start" --filter metro:* --tail        # replay + follow live events
2g export "expo start" --format chrome-trace -o trace.json
```

## CLI helpers

`src/utils/interactive.ts` adds `shouldReduceLogs()`, used across the CLI: it returns `true` when the logger is active and `EXPO_UNSTABLE_HEADLESS` is set, to quiet interactive/noisy terminal output in favour of the event log. It also backs `isInteractive()`.
