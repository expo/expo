// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics

/**
 Resets a dispatch cursor to `-1` if it has fallen past the largest id currently in its source
 table. The cursors live in UserDefaults; their source tables can be wiped from underneath them
 (notably on a schema-version mismatch in `expo-app-metrics`). Without this check the cursor would
 skip every new row until enough accumulated to pass the stale value.

 - `signalName`: short human-readable label ("metric" / "log") for log messages.
 - `readCursor`: returns the persisted cursor value.
 - `writeCursor`: persists a new cursor value.
 - `readMaxId`: returns the largest id in the source table, or nil when empty.
 */
@AppMetricsActor
internal func repairCursorIfStale(
  signalName: String,
  readCursor: () -> Int64,
  writeCursor: (Int64) -> Void,
  readMaxId: () throws -> Int64?
) {
  let cursor = readCursor()
  let maxId: Int64?
  do {
    maxId = try readMaxId()
  } catch {
    observeLogger.warn("[Observe] Failed to read max \(signalName) id while repairing cursor: \(error.localizedDescription)")
    return
  }
  if cursor > (maxId ?? -1) {
    observeLogger.info("[Observe] Resetting stale \(signalName) dispatch cursor (was \(cursor), max id is \(maxId.map(String.init) ?? "<empty>"))")
    writeCursor(-1)
  }
}

@AppMetricsActor
internal func repairMetricCursorIfStale() {
  repairCursorIfStale(
    signalName: "metric",
    readCursor: { ObserveUserDefaults.lastDispatchedMetricId },
    writeCursor: { ObserveUserDefaults.lastDispatchedMetricId = $0 },
    readMaxId: { try AppMetrics.getMaxMetricId() }
  )
}

@AppMetricsActor
internal func repairLogCursorIfStale() {
  repairCursorIfStale(
    signalName: "log",
    readCursor: { ObserveUserDefaults.lastDispatchedLogId },
    writeCursor: { ObserveUserDefaults.lastDispatchedLogId = $0 },
    readMaxId: { try AppMetrics.getMaxLogId() }
  )
}
