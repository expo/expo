import AppIntents
@preconcurrency import CoreSpotlight
import ExpoModulesCore
import Foundation
import SwiftUI

/// An `AppEntity` that can be rebuilt from a catalog record published by JavaScript with
/// `setEntityCatalogAsync`. Required for Spotlight indexing, because the package has to turn the
/// stored records back into entities without knowing the concrete type.
public protocol AppIntentEntityRecordConvertible {
  init(record: AppIntentEntityRecord)
}

/// How many entities one Spotlight call carries.
///
/// `indexAppEntities` and `deleteAppEntities` hand their whole array to the Spotlight daemon as one
/// request, and a catalog published from JavaScript has no bound of its own - a mailbox or a photo
/// library is thousands of records, each carrying a title, a subtitle and keywords. Passing the catalog
/// in one call therefore makes a request that grows with the app's data until it is too big to carry.
/// 100 keeps every request far below that even for attribute-heavy entities, and is still large enough
/// that a catalog of several thousand costs tens of calls rather than thousands. The batches are
/// awaited one after another, so a smaller number costs latency, not correctness.
private let spotlightBatchSize = 100

extension Array {
  /// The elements in runs of at most `spotlightBatchSize`, in order.
  ///
  /// Arrays rather than slices because that is what the Spotlight calls take, and in order because a
  /// caller that indexes the batches in sequence should write the catalog in the order it was given.
  fileprivate var spotlightBatches: [[Element]] {
    return stride(from: 0, to: count, by: spotlightBatchSize).map { start in
      Array(self[start..<Swift.min(start + spotlightBatchSize, count)])
    }
  }
}

/// Runs async work one item at a time per key.
///
/// Two Spotlight updates to the same entity kind must not overlap: each one deletes before it indexes,
/// so a delete from the second could wipe what the first had just put in, and the index would end up
/// matching neither catalog. Updates to different kinds touch disjoint parts of the index, so they are
/// free to run at the same time.
internal final class KeyedSerialQueue: @unchecked Sendable {
  private let lock = NSLock()
  private var tails: [String: Task<Void, Never>] = [:]

  /// Runs `work` after every earlier call for `key` has finished, and returns or rethrows what it does.
  ///
  /// Reading the tail and installing the new one happen under a single lock, so two callers cannot both
  /// chain onto the same predecessor and then run at the same time. The work goes in an unstructured
  /// `Task` because that task is the handle the next caller waits on; it also means cancelling a caller
  /// does not abandon an index update half way through a delete.
  ///
  /// The installed tail is a `Task<Void, Never>` that merely awaits this one, so that callers whose work
  /// returns different types can still share a queue. It swallows the failure it waits on because the
  /// next caller ignores it anyway - an earlier failure is not that caller's to report, whoever started
  /// it already has it.
  internal func run<T: Sendable>(
    key: String,
    _ work: @escaping @Sendable () async throws -> T
  ) async throws -> T {
    let task: Task<T, any Error> = lock.withLock {
      let previous = tails[key]
      let next = Task {
        _ = await previous?.value
        return try await work()
      }
      tails[key] = Task { _ = try? await next.value }
      return next
    }
    return try await task.value
  }
}

public final class AppEntityIdentifierRegistry: @unchecked Sendable {
  public static let shared = AppEntityIdentifierRegistry()

  /// Whether the whole index for a kind is being rebuilt, or only the given records are being
  /// refreshed. The distinction matters: replacing deletes everything of that type first, so using
  /// it for a partial refresh would drop every entity the caller did not mention.
  ///
  /// A refresh carries the identifiers it was asked about, not only the records it found for them,
  /// because the records alone cannot name what is gone: an identifier with no record left in the
  /// catalog belongs to a deleted entity, whose index entry has to go with it. A replacement needs no
  /// identifiers, since it starts by deleting every entity of the type.
  private enum IndexUpdate {
    case replaceEverything
    case refreshOnly(requested: [String])
  }

  private typealias EntityIdentifierFactory = (String) -> EntityIdentifier?
  private typealias EntityIndexer = ([AppIntentEntityRecord], IndexUpdate) async throws -> Void

  /// Guards everything below. The registry is reached from the main actor - `register` from the setup
  /// module's `OnCreate`, `identifier(for:id:)` from a SwiftUI `body` - and from arbitrary async
  /// contexts at the same time: `setEntityCatalogAsync` off the module queue, and the
  /// `IndexedEntityQuery` witnesses on the system's own schedule. A `Dictionary` mutated from one
  /// while another reads it is a data race, not just a stale read.
  ///
  /// A lock rather than an actor because `identifier(for:id:)` is called from a view's `body`, which
  /// cannot await, and because registration has to take effect synchronously: an `await` in
  /// `registerIndexed` would let a catalog published moments after launch find no indexer yet. Same
  /// reason `AppEntityIdentifierModifierClaims` uses one a layer down.
  private let lock = NSLock()
  private var factories: [String: EntityIdentifierFactory] = [:]
  private var indexers: [String: EntityIndexer] = [:]
  private let indexing = KeyedSerialQueue()

  /// Where the "this kind's Spotlight index does not match its catalog" flag is kept.
  ///
  /// On disk rather than in memory because the drift outlives the process that caused it: indexing
  /// fails, the app is killed, and the next launch republishes the same catalog — which the entity store
  /// short-circuits, because the catalog itself did not change. An in-memory flag would be gone by
  /// then, and the index would stay stale until something called `reindexEntitiesAsync`.
  ///
  /// A key of the registry's own, not one `AppIntentEntityStore` hands out, because staleness is a fact
  /// about the Spotlight index and the store knows nothing about Spotlight. It does mean that moving
  /// the store to an App Group suite has to move this too.
  private let defaults = UserDefaults.standard

  private func staleIndexKey(kind: String) -> String {
    return "dev.expo.appintents.index.stale.\(kind)"
  }

  private init() {}

  public func register<Entity: AppEntity>(_ entity: String, as entityType: Entity.Type) {
    let factory: EntityIdentifierFactory = { rawIdentifier in
      guard let identifier = Entity.ID.entityIdentifier(for: rawIdentifier) else {
        return nil
      }
      return EntityIdentifier(for: entityType, identifier: identifier)
    }
    lock.withLock { factories[entity] = factory }
  }

  /// Registers an entity that is also Spotlight-indexable. On top of what `register(_:as:)` does,
  /// the catalog published from JavaScript is mirrored into the Spotlight index, so the two cannot
  /// drift apart.
  ///
  /// This is a separate method rather than an overload of `register(_:as:)` on purpose: overloads
  /// that differ only by an extra conformance resolve by specificity, and picking the wrong one
  /// would silently mean no indexing.
  @available(iOS 18.0, *)
  public func registerIndexed<Entity>(_ entity: String, as entityType: Entity.Type)
  where Entity: AppEntity & IndexedEntity & AppIntentEntityRecordConvertible, Entity.ID == String {
    register(entity, as: entityType)

    let indexer: EntityIndexer = { records, update in
      let index = CSSearchableIndex.default()
      let indexable = records.filter { !$0.hideInSpotlight }

      switch update {
      case .replaceEverything:
        // Everything of this type goes, so records marked hidden simply never come back.
        try await index.deleteAppEntities(ofType: entityType)
      case .refreshOnly(let requested):
        // A partial refresh leaves the rest of the index alone, so every entry it is not about to
        // write again has to be removed by hand: the entity was deleted from the catalog, or it
        // asked to be hidden. Both look the same from here - an identifier the system asked about
        // with no indexable record behind it - and either one left alone is an entry that outlives
        // the entity it stands for.
        let indexed = Set(indexable.map(\.id))
        let removed = requested.filter { !indexed.contains($0) }
        for batch in removed.spotlightBatches {
          try await index.deleteAppEntities(identifiedBy: batch, ofType: entityType)
        }
      }

      for batch in indexable.map(Entity.init(record:)).spotlightBatches {
        try await index.indexAppEntities(batch)
      }
    }
    lock.withLock { indexers[entity] = indexer }
  }

  public func unregister(_ entity: String) {
    lock.withLock {
      factories.removeValue(forKey: entity)
      indexers.removeValue(forKey: entity)
    }
    // Nothing left to index, so there is nothing left to retry either.
    clearIndexStale(kind: entity)
  }

  func identifier(for entity: String, id: String) -> EntityIdentifier? {
    lock.withLock { factories[entity] }?(id)
  }

  /// Kinds registered as indexable.
  var indexedKinds: [String] {
    return lock.withLock { Array(indexers.keys) }
  }

  /// Whether a kind's Spotlight index is known not to match its catalog.
  ///
  /// `setEntityCatalogAsync` reads this so that republishing an unchanged catalog retries an indexing
  /// attempt that failed, instead of short-circuiting on the catalog and leaving the index stale until
  /// something calls `reindexEntitiesAsync`.
  func isIndexStale(kind: String) -> Bool {
    return defaults.bool(forKey: staleIndexKey(kind: kind))
  }

  private func markIndexStale(kind: String) {
    defaults.set(true, forKey: staleIndexKey(kind: kind))
  }

  private func clearIndexStale(kind: String) {
    defaults.removeObject(forKey: staleIndexKey(kind: kind))
  }

  /// Stores a catalog and brings the kind's Spotlight index in line with it, and returns whether the
  /// stored catalog actually changed.
  ///
  /// The write and the index update are one operation on purpose. Serializing them separately is not
  /// enough: the store orders the writes, but the index update is only enqueued after the `await` on
  /// that write has resumed, so two publishes racing here could store v1 then v2 while indexing v2 then
  /// v1 - leaving Spotlight holding a catalog the store has already replaced, and with nothing marked
  /// stale to prompt a retry.
  ///
  /// An index failure is reported rather than thrown, because the catalog write has already succeeded by
  /// then and failing the call would report a write that did happen as an error. The kind stays marked
  /// stale instead, so the next publish rebuilds the index even if it carries the same records.
  func publishCatalog(kind: String, records: [AppIntentEntityRecord]) async throws -> Bool {
    return try await indexing.run(key: kind) {
      let didChangeCatalog = try await AppIntentEntityStore.shared.setCatalog(
        kind: kind,
        entities: records
      )

      // An unchanged catalog still has to be indexed when the last attempt to index it failed. The
      // catalog is committed before the index is built, so otherwise the index would stay stale for
      // as long as JavaScript kept republishing the same records - and republishing an identical
      // catalog on every app start is the normal case.
      guard didChangeCatalog || self.isIndexStale(kind: kind) else {
        return didChangeCatalog
      }

      do {
        try await self.performIndex(kind: kind, records: records, update: .replaceEverything)
      } catch {
        log.error("expo-app-intents: could not update the Spotlight index for '\(kind)': \(error)")
      }
      return didChangeCatalog
    }
  }

  /// Rebuilds the whole Spotlight index for a kind from the stored catalog.
  ///
  /// Call this from `IndexedEntityQuery.reindexAllEntities(indexDescription:)`: the system asks the
  /// app to reindex on its own schedule, and that requirement lives on your query type, so it cannot
  /// be served from inside the package.
  ///
  /// Throws when the catalog cannot be read or the index cannot be written. Swallowing that would
  /// report success to the system for work that did not happen, and the system would never ask again.
  public func replaceIndexFromCatalog(kind: String) async throws {
    let records = try await catalogRecords(kind: kind)
    try await runIndexer(kind: kind, records: records, update: .replaceEverything)
  }

  /// Refreshes only the given entities in the Spotlight index, leaving the rest of the index alone. An
  /// identifier the catalog has no record for is taken to be a deleted entity and is removed from the
  /// index.
  ///
  /// Call this from `IndexedEntityQuery.reindexEntities(for:indexDescription:)`. Throws for the same
  /// reason `replaceIndexFromCatalog` does.
  public func updateIndexFromCatalog(kind: String, matching identifiers: [String]) async throws {
    let records = try await catalogRecords(kind: kind, matching: identifiers)
    try await runIndexer(kind: kind, records: records, update: .refreshOnly(requested: identifiers))
  }

  /// Reads the catalog a reindex is to be built from.
  ///
  /// Reindexing from an unreadable catalog would delete the index and put nothing back, so the failure
  /// stops the update before it deletes anything, and the existing index is left alone. It is logged as
  /// well as thrown: the system discards what an `IndexedEntityQuery` throws, so a log line is the only
  /// place a developer can see why their entities stopped being indexed.
  private func catalogRecords(
    kind: String,
    matching identifiers: [String]? = nil
  ) async throws -> [AppIntentEntityRecord] {
    do {
      if let identifiers {
        return try await AppIntentEntityStore.shared.entities(ofKind: kind, matching: identifiers)
      }
      return try await AppIntentEntityStore.shared.entities(ofKind: kind)
    } catch {
      markIndexStale(kind: kind)
      log.error("expo-app-intents: could not read the '\(kind)' entity catalog to reindex: \(error)")
      throw error
    }
  }

  /// Runs the kind's indexer, one update to a kind at a time.
  private func runIndexer(
    kind: String,
    records: [AppIntentEntityRecord],
    update: IndexUpdate
  ) async throws {
    try await indexing.run(key: kind) {
      try await self.performIndex(kind: kind, records: records, update: update)
    }
  }

  /// Runs the kind's indexer and records whether the index now matches the catalog.
  ///
  /// Only ever called from inside the kind's `indexing` section, because the flag has to be maintained
  /// there too and not merely around it. Marking outside the section lets two updates interleave their
  /// mark/clear pairs, so a short update that succeeds can clear the flag a long one that failed had
  /// set - reporting a half-written index as matching its catalog, permanently, because an unchanged
  /// catalog short-circuits every later publish.
  ///
  /// The kind is marked stale before the work starts rather than after a failure, so that a process
  /// killed part way through an update - after the delete, before the index - is caught on the next
  /// launch as well.
  private func performIndex(
    kind: String,
    records: [AppIntentEntityRecord],
    update: IndexUpdate
  ) async throws {
    guard let indexer = lock.withLock({ indexers[kind] }) else {
      return
    }

    let wasStale = isIndexStale(kind: kind)
    markIndexStale(kind: kind)
    try await indexer(records, update)

    // A partial refresh only wrote the identifiers it was asked about, so it cannot vouch for the
    // rest of the index. Where a rebuild had already failed, the rest is still wrong and the flag
    // stays set for the next publish to act on; where nothing was wrong, this update is complete and
    // the flag it set itself is cleared.
    switch update {
    case .replaceEverything:
      clearIndexStale(kind: kind)
    case .refreshOnly:
      if !wasStale {
        clearIndexStale(kind: kind)
      }
    }
  }
}

/// One-shot logging for `appEntityIdentifier()` calls that cannot do anything.
///
/// A view's `body` is re-evaluated on every render, so logging from there unconditionally would repeat
/// the same line for as long as the view is on screen.
internal enum AppEntityIdentifierDiagnostics {
  private static let lock = NSLock()
  private static var reportedKeys: Set<String> = []

  /// Logs `message` the first time `key` is reported, and returns whether it logged.
  ///
  /// The logger belongs to the caller so that it can pass `AppContext.jsLogger`, which reaches the
  /// JavaScript console and therefore Metro and LogBox. The global `log` writes to OSLog only, where
  /// the developer whose `appEntityIdentifier()` call did nothing would never see the report — the
  /// same reason `AppIntentEntityStore` throws instead of logging. It stays the fallback for a caller
  /// that has no `AppContext` at hand.
  @discardableResult
  internal static func reportOnce(key: String, to logger: Logger = log, _ message: String) -> Bool {
    lock.lock()
    let isFirstReport = reportedKeys.insert(key).inserted
    lock.unlock()

    guard isFirstReport else {
      return false
    }
    logger.warn(message)
    return true
  }
}

/// The live claims on the process-wide `appEntityIdentifier` modifier registration.
///
/// One shared instance stands behind every `AppContext`. It is injectable so that a test can count in
/// a set of its own: the shared set is process-wide, and every context created anywhere in the process
/// takes a claim in it.
internal final class AppEntityIdentifierModifierClaims: @unchecked Sendable {
  internal static let shared = AppEntityIdentifierModifierClaims()

  private let lock = NSLock()
  private var count = 0

  /// Takes a claim, reporting whether it is the first one and so has to install the factory.
  internal func claim() -> Bool {
    lock.lock()
    defer { lock.unlock() }
    count += 1
    return count == 1
  }

  /// Gives up a claim, reporting whether the last one is now gone.
  internal func release() -> Bool {
    lock.lock()
    defer { lock.unlock() }
    count -= 1
    return count == 0
  }
}

/// One `AppContext`'s claim on the process-wide `appEntityIdentifier` modifier registration.
///
/// `ViewModifierRegistry` is a singleton keyed by modifier name, so neither registering nor
/// unregistering is scoped to the context that did it, and a dev-client reload has the new context
/// alive before the old one is destroyed. Naming a single owner cannot work in either direction: an
/// unconditional `unregister` in `OnDestroy` strips the factory the new context depends on, and
/// letting only the newest claim unregister leaves an older context — still running — without a factory
/// as soon as the newer one goes away. So every context takes a claim, and the registration lives for
/// as long as any claim does. That is the rule `AppIntentDispatcher` applies to invocation streams one
/// layer down, where every subscriber has an entry of its own and only its own is ever removed.
///
/// A single registration serves every context because the factory keeps no context of its own:
/// `ViewModifierRegistry` hands it the `AppContext` on each call.
internal final class AppEntityIdentifierModifierRegistration: @unchecked Sendable {
  private let claims: AppEntityIdentifierModifierClaims
  private let lock = NSLock()
  private var isReleased = false

  /// Whether this claim is the one that has to install the factory. It is false while another context
  /// still holds a claim, and registering again then would only make `ViewModifierRegistry` log
  /// "Overwriting existing modifier" on every reload.
  internal let isFirstClaim: Bool

  internal init(claims: AppEntityIdentifierModifierClaims = .shared) {
    self.claims = claims
    isFirstClaim = claims.claim()
  }

  /// Gives up this claim and reports whether the factory has to be removed, which only the last claim
  /// standing does. Releasing the same claim twice changes nothing, so a context torn down in two
  /// steps cannot take the factory away from another one.
  internal func release() -> Bool {
    lock.lock()
    defer { lock.unlock() }
    guard !isReleased else {
      return false
    }
    isReleased = true
    return claims.release()
  }
}

@available(iOS 18.4, *)
struct AppEntityIdentifierModifier: ViewModifier, Record {
  @Field var entity: String = ""
  @Field var id: String = ""

  /// Where a report from `body` goes, so that it reaches the developer: this is the `AppContext`'s
  /// `jsLogger`, which writes to the JavaScript console. It is optional because `Record` requires an
  /// `init()` that takes nothing, and reporting falls back to the global `log`.
  var jsLogger: Logger?

  init() {}

  init(from params: Dict, appContext: AppContext, jsLogger: Logger) throws {
    try self = .init(from: params, appContext: appContext)
    self.jsLogger = jsLogger
  }

  @ViewBuilder
  func body(content: Content) -> some View {
    if let identifier = AppEntityIdentifierRegistry.shared.identifier(for: entity, id: id) {
      content.appEntityIdentifier(identifier)
        .appEntityUIElements { context in
          return [
            AppEntityUIElement(
              identifier: identifier,
              bounds: context.bounds
            )
          ]
        }
    } else {
      unregistered(content)
    }
  }

  /// The view, unchanged, plus a report that it carries no entity identifier. An unknown kind cannot be
  /// reported to the system, and the modifier would otherwise be a no-op that looks like it worked.
  ///
  /// The reporting happens here rather than in `body` because a `ViewBuilder` block takes views and
  /// declarations, not a bare call.
  private func unregistered(_ content: Content) -> Content {
    AppEntityIdentifierDiagnostics.reportOnce(
      key: "unregisteredEntity:\(entity)",
      to: jsLogger ?? log,
      "expo-app-intents: appEntityIdentifier() did nothing for the entity kind '\(entity)', "
        + "because no App Entity type is registered under that name. The kind has to match the "
        + "string passed to AppEntityIdentifierRegistry.shared.register(_:as:) or "
        + "registerIndexed(_:as:) in your app target's AppIntentsSetup module. Check the spelling "
        + "on both sides, and make sure the registration runs in that module's OnCreate."
    )
    return content
  }
}

/// Registered in place of `AppEntityIdentifierModifier` below iOS 18.4, where the on-screen entity API
/// does not exist. A modifier name with no factory is dropped by `ViewModifierRegistry` without a
/// word, so this reports the version requirement instead of leaving the call looking effective.
internal struct UnavailableAppEntityIdentifierModifier: ViewModifier {
  internal func body(content: Content) -> some View {
    return content
  }
}
