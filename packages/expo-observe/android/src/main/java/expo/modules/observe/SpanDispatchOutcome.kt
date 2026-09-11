// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.observe

/**
 * What the span dispatch loop does with a chunk once the server has answered. Mirrors the iOS
 * `SpanDispatchLoop.Disposition`.
 *
 * Spans deliberately do not reuse the metrics and logs loop: that one owns a persisted cursor and
 * stops after a batch it cannot advance past, whereas spans have no cursor (the table is the
 * queue) and delete a dropped chunk before continuing with the next one.
 */
internal enum class SpanDispatchDisposition {
  /** Delete the chunk's rows and continue with the next chunk. */
  DELETE_AND_CONTINUE,

  /** Leave every remaining row in place and stop, so the next dispatch retries them. */
  KEEP_AND_STOP,

  /** Too large to send but still splittable: retry the halves before anything after them. */
  HALVE_AND_RETRY
}

/**
 * Maps a send outcome onto what the loop does next. Pure, so every branch is assertable without
 * a database, a network, or a coroutine scope.
 *
 * @param chunkCount how many spans were in the chunk that produced [result].
 */
internal fun spanDispatchDisposition(result: DispatchResult, chunkCount: Int): SpanDispatchDisposition =
  when (result) {
    DispatchResult.Success, is DispatchResult.PartialSuccess ->
      SpanDispatchDisposition.DELETE_AND_CONTINUE
    is DispatchResult.RetryableFailure -> SpanDispatchDisposition.KEEP_AND_STOP
    is DispatchResult.NonRetryableFailure -> SpanDispatchDisposition.DELETE_AND_CONTINUE
    // A single row cannot be split, so it is dropped: keeping it would block every span behind
    // it on every future dispatch.
    DispatchResult.PayloadTooLarge -> if (chunkCount > 1) {
      SpanDispatchDisposition.HALVE_AND_RETRY
    } else {
      SpanDispatchDisposition.DELETE_AND_CONTINUE
    }
  }
