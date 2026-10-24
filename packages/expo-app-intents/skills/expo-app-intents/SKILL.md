---
name: expo-app-intents
description: Add or maintain Apple App Intents in existing Expo apps using expo-app-intents. Use for Siri and Shortcuts actions, Swift intent declarations, JavaScript invocation handling, dynamic entity catalogs, intent donations, Spotlight indexing, and on-screen entity associations.
license: MIT
---

# expo-app-intents

Expose actions from the app's existing features. Reuse its business logic, persistence, authentication, and navigation; do not replace them with the counter, restaurant, or mail demo state.

## Inspect the app first

Check the installed `expo` and `expo-app-intents` versions, app config, native build workflow, existing intent Swift files, and where application state becomes ready. This package is alpha: verify that the installed version supports the APIs used below. All integration guidance is bundled in this skill folder; no Expo repository checkout is required.

The runtime supports iOS 16.4+, macOS 13.4+, and tvOS 16.4+. The initializer and examples focus on iOS. Individual Apple APIs need newer SDKs or OS versions. Expo Go cannot run this integration; use a native development build. Android and web have fallback behavior, not App Intents support.

Choose the smallest native surface needed:

- A plain `AppIntent` for an action; add an `AppShortcutsProvider` when launch phrases are wanted.
- An `AppEntity` plus query for parameters selected from existing app records. Read [entities.md](references/entities.md) when implementing record-valued parameters or catalog synchronization.
- A schema intent when the feature matches a schema listed in Apple's [App schema domains](https://developer.apple.com/documentation/appintents/app-schema-domains). Consult the domain's action and entity pages for supported names, required properties, and availability before writing declarations. Follow [advanced-features.md](references/advanced-features.md) to integrate that contract with the app; do not infer schema names or rely on a fixed domain list in this skill.
- Donations, Spotlight, and on-screen associations only when requested or needed for the feature. Read the relevant sections of [advanced-features.md](references/advanced-features.md) for these features or schema intents.

## Understand the native/JavaScript boundary

Intent, entity, query, and shortcut declarations are app-owned Swift compiled into the **app target**. Apple's metadata extraction cannot discover these declarations inside the package's static pod. Expo inline modules connect the app-owned Swift to that target; the package supplies storage and the bridge.

`AppIntentDispatcher.shared.dispatch(name:params:)` records an invocation in native `UserDefaults` storage and emits a live event when JavaScript is observing. It returns the invocation ID without waiting for JavaScript. There is no JavaScript response channel to `perform()`.

Return system-facing values and dialogs from Swift. When an action must finish before Siri reports success, implement the required work natively or adjust the feature's contract. Do not return a success dialog merely because a JavaScript mutation was queued. For actions that need the app's JavaScript immediately, use `openAppWhenRun = true`; dispatch alone does not start a headless JavaScript task. Without opening the app, work can remain queued until a later launch.

## Configure an existing app

Run commands from the application directory, not a monorepo root:

```sh
npx expo install expo-app-intents
npx expo-app-intents init --examples minimal
```

`minimal` creates the setup module without demo intents or a shortcut provider. When a template materially helps, choose `counter`, `restaurant`, or `mail` explicitly, then adapt it to the app. `--examples` avoids the interactive picker. Use `--dir existing-directory` when extending an existing setup.

Merge this configuration into the existing config, preserving its other plugins, experiments, and watched directories:

```json
{
  "expo": {
    "plugins": ["expo-app-intents"],
    "experiments": {
      "inlineModules": {
        "watchedDirectories": ["app-intents"]
      }
    }
  }
}
```

For another directory, use `["expo-app-intents", { "directory": "siri" }]` and ensure the watched directories cover `siri`. Watching an ancestor works recursively. The plugin validates coverage; it does not create intent declarations or configure the watched list for you. If the initializer cannot edit dynamic config, apply its printed changes to the actual config source and verify the evaluated result.

Keep app-owned Swift outside Expo Router's `app/` and `src/app/`, and outside generated `ios/` or `android/` directories in prebuild-managed apps. Do not watch the entire project. Reuse the existing setup directory so autolinking does not compile duplicate setup modules or intent types.

The initializer **never overwrites existing Swift files**. After extending a setup, read its warnings and merge missing shortcut entries, refresh wiring, entity registrations, or donation registrations into the existing files. Preserve the `AppIntentsSetup` class and module name, and merge into its existing `OnCreate` block.

For apps using prebuild, apply the config and build a new binary:

```sh
npx expo prebuild -p ios
npx expo run:ios
```

For a manually maintained native project, follow its native integration workflow and verify inline-module app-target membership instead of regenerating it blindly. Avoid `prebuild --clean` as a default in an existing app. Native declarations, phrases, registrations, and config changes require rebuilding; an OTA JavaScript update cannot add Swift intent types or phrases.

## Declare the action and optional phrases

Adapt this custom intent's dispatch name and parameters to an existing app action. The example demonstrates the bridge; it does not adopt an Apple domain schema.

```swift
import AppIntents
internal import ExpoAppIntents

struct SaveItemIntent: AppIntent {
  static let title: LocalizedStringResource = "Save Item"
  static let openAppWhenRun = true

  @Parameter(title: "Text")
  var text: String

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    await AppIntentDispatcher.shared.dispatch(
      name: "saveItem",
      params: ["text": .string(text)]
    )
    return .result(dialog: "Opening the app to save your item.")
  }
}
```

`params` uses JSON-compatible `AppIntentValue`: `.string`, `.int`, `.double`, `.bool`, `.array`, `.object`, and `.null`. Pass stable record IDs rather than serializing native objects. Keep the dispatch name and parameter keys identical on both sides of the bridge.

Trace each declared parameter through native validation, any dispatched payload, and the operation that consumes it. A supplied value must affect the intended behavior or produce an explicit unsupported-input error before mutation. Define what omission means for optional inputs; do not silently drop a value at the Swift/JavaScript boundary. Verify observable behavior for each input, including explicit empty values and `false` where applicable.

Treat changes to existing intent identities and parameter names or types as saved-shortcut compatibility changes. Preserve them when possible; changing a display label is different from replacing an action's identity. When an incompatible change is necessary, check the SDK's migration support and provide a deliberate transition instead of assuming existing shortcuts will update. Separately preserve or migrate JavaScript dispatch names and payloads so pending invocations from an older binary remain understandable.

When phrases are required, add entries to the app's existing provider, or create one if absent:

```swift
import AppIntents

struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: SaveItemIntent(),
      phrases: ["Save an item in \(.applicationName)"],
      shortTitle: "Save Item",
      systemImageName: "square.and.pencil"
    )
  }
}
```

Use builder syntax, not an array literal or explicit `return`. Every phrase includes `\(.applicationName)`. A classic phrase can interpolate at most one non-array parameter; required parameters omitted from the phrase can be collected through follow-up questions. Apps can define at most 10 App Shortcuts. Do not create an empty provider: Apple's metadata extractor rejects it.

When a provider exists, add this to `AppIntentsSetup.definition()`'s `OnCreate` body, using the actual provider type name:

```swift
Task {
  await AppIntentDispatcher.shared.setShortcutsRefreshHandler {
    AppShortcuts.updateAppShortcutParameters()
  }
  AppShortcuts.updateAppShortcutParameters()
}
```

The `minimal` scaffold does not include this wiring. Do not reference a nonexistent provider in schema-only apps.

## Handle invocations through the app's existing services

Mount one stable `useAppIntents` consumer near the application root, below the providers it needs. Gate mounting until required storage, authentication, and navigation are ready, or explicitly re-drain the pending queue when those dependencies become ready. A changed handler or rerender alone does not trigger another pending snapshot.

- The handler receives `(pendingIntents, newIntent)`. The initial call has `newIntent === null`; later calls receive a pending snapshot and the triggering invocation. Process the pending snapshot, not only `newIntent`.
- The hook serializes awaited callbacks within that subscription. Return or await the work; avoid unawaited `forEach(async ...)` handlers. Multiple mounted hooks are independent consumers, not a shared work queue.
- `AppIntentInvocation` has `id`, `name`, `params: Record<string, unknown>`, and `createdAt` in Unix milliseconds. Validate parameters before invoking the domain service, including record existence and the active account's access.
- Delivery is **at least once**. For mutations, use the invocation ID as a persistent idempotency key through the existing storage or backend. A React ref or in-memory `Set` does not protect against app termination between committing the action and removing the invocation. Where possible, commit a local mutation and its processed-ID record atomically.
- After successful processing, `await removePendingInvocationAsync(invocation.id)`. On replay of an already committed action, skip the mutation but retry removal. Do not mark an action processed before it succeeds or dequeue from `finally`.
- Handle errors per invocation when actions are independent. Retain transient failures for an explicit retry path, the next live event, or a later mount; the hook logs rejected handlers but does not schedule retries. Define how permanently invalid or retired actions are reported and discarded so they cannot remain pending forever.
- Do not clear the entire queue at startup or acknowledge unknown actions as successful. `clearPendingInvocationsAsync()` deliberately discards all pending work. The queue holds at most 100 entries and drops the oldest on overflow.

For example, connect the handler to an app-provided operation with the following contract, rather than implementing a second item store in the handler:

```tsx
import * as AppIntents from 'expo-app-intents';

type Props = {
  // Persist idempotencyKey with the mutation; resolve on an already completed replay.
  saveItemOnce: (input: { text: string; idempotencyKey: string }) => Promise<void>;
};

export function ItemIntentHandler({ saveItemOnce }: Props) {
  AppIntents.useAppIntents(async (pendingIntents) => {
    for (const invocation of pendingIntents) {
      if (invocation.name !== 'saveItem') continue;
      try {
        const text = invocation.params.text;
        if (typeof text !== 'string' || !text.trim()) {
          // This known action is permanently invalid; report and discard it.
          console.warn('Discarding invalid saveItem invocation', invocation.id);
          await AppIntents.removePendingInvocationAsync(invocation.id);
          continue;
        }
        await saveItemOnce({ text, idempotencyKey: invocation.id });
        await AppIntents.removePendingInvocationAsync(invocation.id);
      } catch (error) {
        console.warn('App Intent remains pending', invocation.id, error);
      }
    }
  });
  return null;
}
```

Extend a single consumer to route all supported names. If using `addAppIntentListener` instead, it delivers live events only: subscribe before reading `getPendingInvocationsAsync()`, handle overlap by ID, serialize processing, and remove the subscription on cleanup. Prefer the hook unless the existing architecture needs manual ownership.

## Verify the integration

Run the app's relevant type/lint checks and build iOS to validate Swift and metadata extraction. For schema integrations, run the app target's ExtractAppIntentsMetadata phase early: Swift type checking alone does not validate the full schema contract. Test the action through Shortcuts and Siri on a suitable device, both with the app running and with JavaScript cold. Confirm the actual stored mutation or navigation, then confirm the pending invocation is removed.

For mutating actions, verify replay by ID, a failed action retained for retry, and a removal failure after a successful mutation. For entities, check startup before data loads, rename/delete, a genuinely empty catalog, and account changes. Exercise advanced features only when implemented. Report separately what was checked in code, compiled, and exercised on device.

When changing an existing integration, save a shortcut with populated parameters in the previous build, then upgrade and run that same shortcut. Confirm it still selects the intended records and performs the intended action; recreating it only tests the new metadata, not compatibility.

Common diagnoses:

| Symptom | Check |
| --- | --- |
| Intent absent after a change | Rebuilt binary, app-target Swift membership, metadata build errors, OS availability. |
| Action exists but launch phrase is missing | Provider entry, required application-name token, preserved scaffold warnings. |
| Parameter cannot be found | Published catalog, matching kind/ID, all query methods, refresh wiring. Old pre-filled Shortcuts tiles may need recreation after metadata changes. |
| Action waits until the app is opened | One-way dispatch, `openAppWhenRun`, mounted and ready consumer. |
| Action repeats | Dequeue failures, multiple consumers, missing durable idempotency. |

On unsupported platforms, `isAvailable()` is false; the hook calls once with `[]` and `null`, queue/catalog reads return `[]`, and their writes are no-ops. `refreshShortcutsAsync()` rejects, donations return `null`, and donation deletion returns `[]`. Guard feature-specific UI appropriately; JavaScript import success does not prove the native integration is installed.
