# Advanced App Intents features

Read only the sections needed for the requested feature. Core setup and invocation handling are in [SKILL.md](../SKILL.md).

## Donations

Donate after the user successfully performs the corresponding action inside the app. A donation records an action for possible system suggestions; it does not execute the action or guarantee a suggestion. Keep donation failure separate from the already successful business operation.

For the `SaveItemIntent` in [SKILL.md](../SKILL.md), add app-target Swift:

```swift
import AppIntents
internal import ExpoAppIntents
internal import ExpoModulesCore

extension SaveItemIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field(.required) var text: String = ""
  }

  init(donationParams: DonationParams) {
    self.init()
    self.text = donationParams.text
  }
}
```

Use `Record` with `@Field`, not the `@Record` macro, which is unavailable in the app target. Parameterless intents can simply conform to `DonatableAppIntent`. For entity parameters, use the query pattern in [entities.md](entities.md) and a required string ID field in `DonationParams`, resolve it with `try await ItemQuery().entities(for: [donationParams.itemId]).first` in an `async throws` initializer, and throw an app-defined error if the record is missing. Assign the resolved entity to the intent's parameter; do not donate a fabricated entity the query cannot resolve.

Merge registration into the existing `AppIntentsSetup` module's `OnCreate`:

```swift
AppIntentDonationRegistry.shared.register("saveItem", as: SaveItemIntent.self)
```

Then call `await AppIntents.donateIntentAsync('saveItem', { text })`. The name must match registration; it need not match dispatch, but using one name simplifies the contract. Missing or incorrectly typed required fields reject. Publish any referenced entities before donating.

Remove obsolete donations using exactly one filter:

```ts
await AppIntents.deleteDonationsAsync({ ids: [donationId] });
await AppIntents.deleteDonationsAsync({ intent: 'saveItem' });
await AppIntents.deleteDonationsAsync({ entity: 'item', id: itemId });
```

The entity filter requires `AppEntityIdentifierRegistry` registration. Deleting by intent applies to the Swift intent type, including donations made through other names for that type. IDs returned by donation are opaque and may stop decoding after an OS update; prefer intent/entity cleanup when long-lived IDs are unnecessary. Deleting multiple IDs can partially succeed before rejecting, so inspect the reported successes and failures rather than assuming rollback. Include cleanup when the underlying content disappears or the user signs out.

`init --examples counter --donations` demonstrates scaffolding. The flag adds extensions to selected examples, not arbitrary existing intents; it is invalid with only `minimal`. Rerunning it preserves setup files, so merge missing registrations manually.

## Spotlight indexing and on-screen content

These are related but distinct integrations:

| Need | Native setup | JavaScript |
| --- | --- | --- |
| Associate visible content with an entity | `AppEntityIdentifierRegistry.shared.register("item", as: ItemEntity.self)` | `AppEntityView` or `appEntityIdentifier` |
| Also synchronize a catalog into Spotlight | `registerIndexed("item", as: ItemEntity.self)` with `IndexedEntity` and `AppIntentEntityRecordConvertible` conformance | Publish with `setEntityCatalogAsync` |

Register in `AppIntentsSetup.OnCreate`, with availability guards for the concrete entity. `registerIndexed` requires iOS 18+/macOS 15+, is unavailable on tvOS, and requires the entity's `ID` to be `String`. It includes the identifier registration; a second `register` is unnecessary. `AppIntentEntityRecordConvertible` requires `init(record: AppIntentEntityRecord)`. Provide suitable Spotlight attributes, and keep the catalog kind, registered kind, and UI entity kind identical.

The `ItemEntity` in [entities.md](entities.md) already implements the required record initializer. To make its catalog indexable, add:

```swift
import AppIntents
@preconcurrency import CoreSpotlight
internal import ExpoAppIntents
import UniformTypeIdentifiers

extension ItemEntity: AppIntentEntityRecordConvertible {}

@available(iOS 18.0, macOS 15.0, *)
@available(tvOS, unavailable)
extension ItemEntity: IndexedEntity {
  var attributeSet: CSSearchableItemAttributeSet {
    let attributes = CSSearchableItemAttributeSet(contentType: .text)
    attributes.title = title
    attributes.displayName = title
    attributes.keywords = synonyms
    return attributes
  }
}
```

In an iOS app's setup module, register it inside `if #available(iOS 18.0, *) { ... }` using `AppEntityIdentifierRegistry.shared.registerIndexed("item", as: ItemEntity.self)`. Exclude this registration from tvOS targets. For only on-screen association, use `register` without the indexed conformance.

The current package requires iOS 18.4+ and a build compiled with Xcode 27+ for on-screen association. Older builds/platforms still render children without attaching the association. Check these gates independently of `isAvailable()`, which only detects the native module.

For React Native content:

```tsx
import { AppEntityView } from 'expo-app-intents';

<AppEntityView entity="item" entityId={item.id}>
  <ItemCard item={item} />
</AppEntityView>
```

For an existing `@expo/ui` SwiftUI view, add `AppIntents.appEntityIdentifier('item', item.id)` to its `modifiers`. Do not pass the modifier to a React Native `View`. Publish the record so its query can resolve the same stable ID; a wrapper alone does not create a native entity or implement an open action.

`setEntityCatalogAsync()` synchronizes registered indexed catalogs, including removed records. Index/refresh work is best-effort: successful publication does not prove Spotlight completed indexing. Use `await AppIntents.reindexEntitiesAsync('item')` for explicit recovery after index eviction or changes to native indexing attributes; it rejects on failure. Omitting the kind rebuilds all indexed kinds. Do not reindex on every render.

`hideInSpotlight: true` excludes a record from the catalog-managed Spotlight index while leaving it resolvable and available to Siri. It is not an access-control or Siri opt-out flag. Omit an entity from the catalog when it should no longer resolve through that catalog; retain app authorization checks when processing invocations.

To let the system enumerate entities, make the query conform to `EnumerableEntityQuery` and implement `allEntities() async throws -> [ItemEntity]` by reading and mapping the whole `item` catalog. Keep identifier resolution and enumeration separate from suggestion filtering. For opening a selected result, implement an intent with an `ItemEntity` parameter and `openAppWhenRun = true`, dispatch its stable ID, and navigate through the app's ready root handler. On-screen association alone does not implement opening or exporting. Add `Transferable` only when the feature calls for exporting content, with representations containing the app's actual data.

`init --examples mail --visual-intelligence` can scaffold a mail-specific demonstration of these features. It does not add intelligence support to arbitrary app entities. Avoid carrying its default mail account or export behavior into unrelated features.

## Schema intents and availability

A schema is Apple's contract for an action or entity, separate from the JavaScript dispatch name and the app's data model. Choose one only when the app can implement its meaning. A custom `AppIntent` does not need a schema to expose an action through Shortcuts or a compiled launch phrase.

### Verify the contract before writing declarations

Start with Apple's [App schema domains](https://developer.apple.com/documentation/appintents/app-schema-domains), then read the specific action and entity pages for the desired feature. Verify the symbols against the installed SDK when documentation differs or an API is new. Do not generate schema names by combining a domain with a plausible verb; an app feature may use another domain's schema or have no matching schema at all.

Treat documentation snippets as partial illustrations, not complete integrations. They may omit imports, queries, parameter metadata, related types, or implementation bodies. Complete those pieces from the verified contract and validate the combined declarations through the app target's metadata extraction; copying a snippet or passing Swift type checking is not sufficient.

For each selected action, establish:

| Contract | What to verify |
| --- | --- |
| Availability | Minimum OS and SDK for the specific action and each related entity, not just the framework or domain. |
| Action parameters | Exact property names, Swift types, optionality, defaults, and required parameter metadata. |
| Result | Required result conformances and the concrete entity or value the action must return. |
| Entity properties | Exact names and types, including required declarations whose values may be optional. |
| Relationships | The schema and query for every referenced entity, following nested relationships until the graph is complete. |
| Behavior | Authentication, confirmation, execution timing, and what success means for the action. |

Entity state and action input are different contracts. Do not copy an entity's properties into every action. Creation may require values that an update makes optional. For updates, preserve the distinction between omission and explicit empty text, an empty array, or `false`; apply only the requested changes. Do not replace required attributed text with `String`, or remove a required property because the app has no value for it.

File-valued parameters can require explicit supported-type metadata. Check the SDK's `@Parameter` initializer and extraction output; `supportedContentTypes` is the modern API, while older code and diagnostics may refer to `supportedTypeIdentifiers`. Declare the types the integration handles and validate supplied files before committing changes. A file count or filename does not transfer the actual contents through the JSON bridge.

### Map limited app capabilities honestly

Keep the schema representation faithful to the existing app:

- Use stable entities for real records or collections. A single local collection can be represented as one entity if that is the app's actual model; unknown identifiers must not resolve to it.
- Represent absent optional relationships with `nil`. If the schema requires a concrete related type even though the app has no instances, define the type with a query returning no instances. Do not create fictional accounts, containers, or records to satisfy extraction.
- Distinguish unknown values from known empty values. Keep unknown optional dates absent instead of fabricating timestamps. An empty collection is accurate only when there are no stored members.
- Implement supplied parameters, or reject unsupported nondefault inputs with a user-readable error before mutation. Do not accept files, requested state changes, or destination selections and silently ignore them.
- When a schema cannot describe the supported feature honestly, expose a narrower custom intent. Do not expand the app's product model solely to satisfy a schema.

### Complete and validate the integration

Use `@AppIntent(schema:)` and `@AppEntity(schema:)` with verified symbols and implement their complete contracts. Schema entities need an `EntityStringQuery` or indexing so the system can resolve them; a plain `EntityQuery` can fail metadata extraction. Preserve required authentication and confirmation behavior, including confirmations supplied by the schema itself.

When returning a completed action result, finish the required native work before returning it. An entity result uses `.result(value: entity)` with the required `ReturnsValue<EntityType>` conformance. Resolve current authoritative data when mutating an entity; a previously supplied entity may be a stale snapshot. If Swift has already performed the mutation, dispatch to JavaScript for state refresh or navigation, and do not repeat the mutation there. The one-way bridge cannot wait for JavaScript to produce a synchronous schema result.

Gate declarations and registrations together for the verified SDK and OS versions. Preserve compiler guards for symbols unavailable in older SDKs; runtime availability checks alone cannot make an older compiler recognize a new symbol. Do not raise the whole app's deployment target merely to adopt an optional schema. Shortcut provider entries cannot be added conditionally with runtime availability checks; a provider referencing gated intents needs compatible availability, or a separate plain wrapper intent.

Build the app target and run **ExtractAppIntentsMetadata** as soon as the action and its related entities are declared. Treat missing-field, type, availability, and parameter-metadata diagnostics as contract failures to fix, not as reasons to add dummy data or suppress extraction. Then test omitted versus explicit update values, unsupported inputs, stale identifiers, and cold execution. Report compilation and metadata validation separately from device discovery and actual action execution.

Schema conformance does not need an `AppShortcut` phrase entry. Primary domains can be discovered by Apple Intelligence and Siri; Shortcuts-specific domains are limited to Shortcuts. Neither conformance nor a successful build guarantees system discovery on an unsupported OS or device.
