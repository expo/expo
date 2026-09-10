// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoAppMetrics

/// The chunk-by-chunk send loop behind span dispatch, with its collaborators injected so the
/// outcome handling can be tested without a database, a network, or the module's globals.
///
/// Spans deliberately do not reuse `DispatchLoop`: that loop owns a persisted cursor and stops
/// after a batch it cannot advance past, whereas spans have no cursor (the table is the queue)
/// and delete a dropped chunk before continuing with the next one.
@AppMetricsActor
internal enum SpanDispatchLoop {
  /// What the loop should do with a chunk it has finished with.
  internal enum Disposition {
    /// Delete the chunk's rows and continue with the next chunk.
    case deleteAndContinue
    /// Leave every remaining row in place and stop, so the next dispatch retries them.
    case keepAndStop
  }

  /// Sends pending spans one server-sized chunk at a time, halving any chunk the server rejects
  /// as too large.
  ///
  /// Rows are re-read after each delivered chunk rather than materialized up front: each row
  /// carries attribute and event JSON, this runs on resign-active and terminate, and re-reading
  /// also picks up spans inserted while a long drain was in flight. Mirrors the Android loop.
  ///
  /// - Parameters:
  ///   - chunkSize: maximum spans per POST, and per read.
  ///   - fetchChunk: reads up to `limit` rows with an id greater than `afterId`, in id order.
  ///   - send: performs one request. Returning `nil` means the chunk had nothing to send (every
  ///     session row was pruned), which still deletes the rows: they are unrecoverable.
  ///   - deleteUpTo: deletes every row through the given id.
  internal static func drain(
    chunkSize: Int,
    fetchChunk: (_ afterId: Int64, _ limit: Int) throws -> [SpanRow],
    send: (_ chunk: [SpanRow]) async throws -> DispatchResult?,
    deleteUpTo: (Int64?) -> Void
  ) async {
    var readCursor: Int64 = -1
    var chunks: [[SpanRow]] = []

    while !Task.isCancelled {
      if chunks.isEmpty {
        let nextChunk: [SpanRow]
        do {
          nextChunk = try fetchChunk(readCursor, chunkSize)
        } catch {
          observeLogger.warn("[EAS Observe] Failed to read pending spans: \(error.localizedDescription)")
          return
        }
        guard !nextChunk.isEmpty else {
          return
        }
        // A row with no id cannot advance the cursor, and re-reading from the same place would
        // loop on it forever.
        guard let lastId = nextChunk.last?.id, lastId > readCursor else {
          observeLogger.warn("[EAS Observe] Pending spans carry no usable id; stopping")
          return
        }
        readCursor = lastId
        chunks.append(nextChunk)
      }

      let chunk = chunks.removeFirst()
      let result: DispatchResult?
      do {
        result = try await send(chunk)
      } catch {
        // Assembly failed rather than the request. A transient cause (a busy database) resolves
        // on the next dispatch, but a persistent one would pin these rows until the insert cap
        // evicted them, blocking every span behind them, so the chunk is dropped. Android
        // collapses the same condition into a non-retryable failure, which also drops.
        observeLogger.warn(
          "[EAS Observe] Dropping batch of \(chunk.count) span(s): failed to assemble trace events "
            + "(\(error.localizedDescription))"
        )
        deleteUpTo(chunk.last?.id)
        continue
      }
      guard let result else {
        deleteUpTo(chunk.last?.id)
        continue
      }
      switch disposition(for: result, chunkCount: chunk.count) {
      case .keepAndStop:
        return
      case .deleteAndContinue:
        deleteUpTo(chunk.last?.id)
      case nil:
        // Too large to send and still splittable, so retry the halves before anything after them.
        chunks.insert(Array(chunk[(chunk.count / 2)...]), at: 0)
        chunks.insert(Array(chunk[..<(chunk.count / 2)]), at: 0)
      }
    }
  }

  /// Maps a send outcome onto what the loop does next, or `nil` when the chunk must be halved
  /// and retried. Pure, so every branch is assertable on its own.
  internal static func disposition(for result: DispatchResult, chunkCount: Int) -> Disposition? {
    switch result {
    case .success, .partialSuccess:
      return .deleteAndContinue
    case .retryableFailure:
      return .keepAndStop
    case .nonRetryableFailure:
      return .deleteAndContinue
    case .payloadTooLarge:
      // A single row cannot be split, so it is dropped: keeping it would block every span
      // behind it on every future dispatch.
      return chunkCount > 1 ? nil : .deleteAndContinue
    }
  }
}
