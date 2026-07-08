# Structured Event Logging (`2g`)

Expo CLI emits structured JSONL events through [`2g`](https://github.com/kitten/2g), a
low-overhead session logger that automated tooling and agents can discover, replay, tail,
and export. The CLI uses the library directly — there is no in-tree wrapper. This doc covers
how we define and emit events; to _read_ sessions, run `2g --help`, which is self-describing.

## Activation

`installEventLogger()` runs once per process. `src/index.ts` calls it early (so `LOG_EVENTS`
and child-process IPC are honored before any output), and most commands (`start`, `serve`,
`export`, `run:*`) call `installEventLogger({ command, version })` to open a bounded session
under the system temp dir. The first activated destination wins; later calls are no-ops.

`LOG_EVENTS` overrides the destination — a file, or `1`/`2` for stdout/stderr:

```bash
LOG_EVENTS=events.jsonl npx expo start    # write to a file
LOG_EVENTS=1 npx expo start               # stdout (console → stderr)
```

## Defining events

Create a logger with `events(category)` and declare its payloads by augmenting `2g`'s
`EventRegistry` via declaration merging. Keys are fully-qualified `category:event_name`
strings; there is no central registry file.

```ts
import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'my_module:something_started': { platform: string };
    'my_module:something_finished': { platform: string; duration: number };
  }
}

export const event = events('my_module');
```

Payload fields must not use the reserved wire keys `_e`, `_t`, `_d`, `_l`, or `_w`.

## Emitting events

Names and payloads are type-checked against the merged registry; when the logger is inactive,
`event()` is a cheap no-op.

```ts
event('something_started', { platform: 'ios' });
event('something_started', { wrong: true }); // TS error
```

Use `event.span()` for a start/end pair with a measured duration (recorded as `_d`, ms):

```ts
const done = event.span('something_started', { platform: 'ios' });
done('something_finished', { platform: 'ios', duration: 500 });
```

### `events` vs `events.debug`

`events.debug(category)` creates a logger for chatty, debug-level events (marked `_l: 1`). A
session records them only when the process runs with `LOG_DEBUG` set, and `2g` reads them back
only with `--debug`. Use `events()` for events worth keeping in the bounded history;
`events.debug()` for high-volume diagnostics.

Diagnostic logging is organized one category per sub-feature (`devserver`, `tunnel`, `metro`,
`resolve`, `hmr`, `inspector`, `manifest`, `middleware`, `ssr`, `rsc`, `router`, `atlas`,
`typegen`, `devtools`, `interface`, `platform`, `run`, `prebuild`, `export`, `install`,
`doctor`, `api`, `utils`, `telemetry`, …) so `LOG_DEBUG=<category>:*` targets a single
subsystem — the structured successor to the old `DEBUG=expo:<area>:*` namespaces. `src/index.ts`
bridges the legacy switches: `EXPO_DEBUG=1` (or `DEBUG=expo:*`) sets `LOG_DEBUG=*`.

The CLI's diagnostic logging is organized into one category per sub-feature (`devserver`,
`tunnel`, `metro`, `resolve`, `hmr`, `inspector`, `manifest`, `middleware`, `ssr`, `rsc`,
`router`, `atlas`, `typegen`, `devtools`, `interface`, `platform`, `run`, `prebuild`, `export`,
`install`, `doctor`, `api`, `utils`, `telemetry`, …) so `LOG_DEBUG=<category>:*` targets a
single subsystem — the structured successor to the old `DEBUG=expo:<area>:*` namespaces.

`src/index.ts` bridges the legacy switches: `EXPO_DEBUG=1` (or `DEBUG=expo:*`) sets `LOG_DEBUG=*`,
so existing muscle memory keeps surfacing debug events on stderr.

## Deferred payload helpers

`event.path(absolutePath)` and `event.error(error)` return `Serialized<T>` wrappers
(`{ toJSON(): T }`) that only do their work when an event is actually written, so inactive
loggers skip the cost. Payloads accept `Serialized<T>` wherever the declared type expects `T`.

- `event.path(p)` — logs a path relative to the log target (e.g.
  `event('config', { serverRoot: event.path(serverRoot) })`).
- `event.error(err)` — serializes an error to `{ name, message, code, stack, cause }`, with
  cause chains resolved recursively.

## Reading logs

Run `2g --help`. It covers everything — selectors, filters, formats, and which command to
use (follow a live session, save a Chrome/OTLP trace, or run and trace a one-off command).
Read it before reaching for a recipe; it is the source of truth, and duplicating it here
would only go stale.

## Testing

Capture a subprocess's events with `captureEvents` from `2g/api`, which hands the child a pipe
as its `LOG_EVENTS` target (the same mechanism `2g record` uses):

```ts
import { spawn } from 'node:child_process';
import { captureEvents } from '2g/api';

const capture = captureEvents({ filter: 'metro:*' });
const child = spawn('expo', ['export'], capture.spawnOptions({ env: process.env }));
const events = await capture.attach(child).collect();
```

Events flush on natural exit; child code that calls `process.exit()` should
`await flushEventLogger()` first, or trailing events may be lost.

## Reducing terminal noise

`src/utils/interactive.ts` exposes `shouldReduceLogs()` — true when the logger is active and
`EXPO_UNSTABLE_HEADLESS` is set — used to quiet interactive/noisy terminal output in favor of
the event log. It also backs `isInteractive()`.
