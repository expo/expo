// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// The single sink for completed span rows. Every producer (the network request producer, the
/// JS spans API, future navigation spans) hands finished rows here instead of talking to the
/// database, so the persistence concerns live in one place: the actor hop, the row cap applied
/// by the insert, and failure swallowing — recording telemetry must never break a producer.
@AppMetricsActor
final class SpanWriter: Sendable {
  /// Test seam: a database injected at construction wins over the shared one. `nil` in
  /// production, where the shared database is resolved lazily on the actor — that keeps the
  /// `AppMetrics.spanWriter` static constructible from nonisolated contexts (the JS thread).
  private let databaseOverride: MetricsDatabase?

  nonisolated init() {
    self.databaseOverride = nil
  }

  /// `database` is optional so a failed database open degrades to dropped rows instead of
  /// blocking the producers.
  init(database: MetricsDatabase?) {
    self.databaseOverride = database
  }

  /// Writes one completed row. Callers already on `AppMetricsActor` (the network producer's
  /// synchronous record path) use this directly.
  func write(_ row: SpanRow) {
    guard let database = databaseOverride ?? AppMetrics.database else {
      return
    }
    do {
      try database.insert(span: row)
    } catch {
      logger.warn("[AppMetrics] Failed to persist span \"\(row.name)\": \(error.localizedDescription)")
    }
  }

  /// Fire-and-forget write from any isolation (the JS spans API calls this from the JS thread).
  nonisolated func schedule(_ row: SpanRow) {
    Task { @AppMetricsActor in
      self.write(row)
    }
  }
}
