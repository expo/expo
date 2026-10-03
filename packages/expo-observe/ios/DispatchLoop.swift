// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics

@AppMetricsActor
internal enum DispatchLoop {
  internal static let defaultChunkSize = 200

  internal static func drain<Row>(
    startCursor: Int64,
    chunkSize: Int = defaultChunkSize,
    fetchBatch: (_ afterId: Int64, _ limit: Int) throws -> [Row],
    rowId: (Row) -> Int64?,
    send: (_ rows: [Row]) async throws -> DispatchResult?,
    onResult: (_ result: DispatchResult, _ batchCount: Int, _ highestId: Int64) -> Void,
    persistCursor: (Int64) -> Void
  ) async {
    var cursor = startCursor

    dispatchLoop: while !Task.isCancelled {
      let fetchedRows: [Row]
      do {
        fetchedRows = try fetchBatch(cursor, chunkSize)
      } catch {
        observeLogger.warn("[EAS Observe] Failed to read pending rows: \(error.localizedDescription)")
        return
      }
      guard !fetchedRows.isEmpty else {
        return
      }

      var rows = fetchedRows
      while !Task.isCancelled {
        guard let lastRow = rows.last else {
          return
        }
        // A missing id must never rewind the cursor, so fall back to the current one.
        let highestId = rowId(lastRow) ?? cursor
        let result: DispatchResult?
        do {
          result = try await send(rows)
        } catch {
          observeLogger.warn("[EAS Observe] Failed to assemble or send pending rows: \(error.localizedDescription)")
          return
        }

        guard let result else {
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          persistCursor(cursor)
          continue dispatchLoop
        }
        onResult(result, rows.count, highestId)

        switch result {
        case .success, .partialSuccess:
          // Stop when the batch cannot advance the cursor — continuing would refetch and
          // re-send the same rows forever.
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          persistCursor(cursor)
          continue dispatchLoop
        case .retryableFailure:
          return
        case .nonRetryableFailure:
          persistCursor(highestId)
          return
        case .payloadTooLarge:
          guard rows.count > 1 else {
            persistCursor(highestId)
            return
          }
          // Unlike Android's re-fetch, slicing can re-send rows deleted during this loop, and event
          // payloads are rebuilt from the session snapshot available on each attempt.
          rows = Array(rows.prefix(max(1, rows.count / 2)))
        }
      }
    }
  }
}
