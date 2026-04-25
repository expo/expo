# `src/events/` — Structured JSONL Event Logger

Structured JSONL logging for Expo CLI, activated via the `LOG_EVENTS` environment variable. Streams events to a file or file descriptor for automated tooling, debugging, and session documentation.

## Activation

```bash
LOG_EVENTS=events.jsonl npx expo start    # Write to file
LOG_EVENTS=1 npx expo start               # Write to stdout (redirects console to stderr)
LOG_EVENTS=2 npx expo start               # Write to stderr (redirects console to stdout)
```

## Defining events

Create a typed event logger with `events(category, typeDefinition)`:

```ts
import { events } from '../events';

export const event = events('my_module', (t) => [
  t.event<'something_started', {
    platform: string;
  }>(),
  t.event<'something_finished', {
    platform: string;
    duration: number;
  }>(),
]);
```

The type definition callback is never called at runtime — it exists purely for TypeScript inference. Event names and payloads are fully type-checked.

Payload fields must not use `_e` or `_t` — these are reserved for the event name and timestamp.

## Emitting events

```ts
event('something_started', { platform: 'ios' });

// event names and payloads are type-checked:
event('something_started', { wrong: true }); // TS error
event('nonexistent', {});                     // TS error
```

When the logger is inactive (`LOG_EVENTS` not set), `event()` is a no-op.

## Relative paths

Each logger has a `.path()` helper that resolves absolute paths relative to the log target directory:

```ts
event('file_changed', { file: event.path('/Users/me/project/src/App.tsx') });
// logs: { "_e": "my_module:file_changed", "_t": 1713000000000, "file": "src/App.tsx" }
```

## Registering event types

After creating a new event logger, add it to `src/events/types.ts` to collect all event types:

```ts
import type { event as myModuleEvent } from '../path/to/module';

export type Events = collectEventLoggers<[
  // ... existing entries
  typeof myModuleEvent,
]>;
```

## Output format

Each event is a single JSON line:

```jsonl
{"_e":"my_module:something_started","_t":1713000000000,"platform":"ios"}
{"_e":"my_module:something_finished","_t":1713000000500,"platform":"ios","duration":500}
```

- `_e` — fully qualified event name (`category:event_name`)
- `_t` — wall-clock timestamp (`Date.now()`) for cross-process correlation

## Files

| File | Role |
|---|---|
| `index.ts` | Public API: `events()` factory, `installEventLogger()`, `isEventLoggerActive()`, `shouldReduceLogs()` |
| `stream.ts` | `LogStream` write stream and `writeEvent()` serializer |
| `builder.ts` | TypeScript type definitions for the `events()` factory |
| `types.ts` | Central registry of all event logger types |
