// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.spans

import android.util.Log
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.Span
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

private const val TAG = "ExpoAppMetrics"

/**
 * The single sink for completed span rows. Every producer (the network request producer, the
 * JS spans API, future navigation spans) hands finished rows here instead of talking to the
 * database, so the persistence concerns live in one place: the coroutine hop off the caller's
 * thread, the session-FK ordering, the row cap applied by the insert, and failure swallowing —
 * recording telemetry must never break a producer. Mirrors the iOS `SpanWriter`.
 */
class SpanWriter(
  private val database: MetricsDatabase,
  private val scope: CoroutineScope,
  /**
   * Awaited before each insert so a row never races the session row it references. The main
   * session persist is idempotent, so this is a cheap no-op after the first write.
   */
  private val awaitSessionPersisted: suspend () -> Unit = {}
) {
  /**
   * Writes one completed row on `scope`, so callers (OkHttp dispatcher threads, the JS thread)
   * never block on the database.
   */
  fun write(span: Span) {
    scope.launch {
      try {
        awaitSessionPersisted()
        database.spanDao().insertCapped(span)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to persist span \"${span.name}\"", e)
      }
    }
  }

  /**
   * Writes a batch produced lazily inside the write coroutine. The producer runs off the
   * caller's thread, so a large batch (the network producer's startup backfill) doesn't pay
   * its conversion cost on the thread that scheduled it. Rows fail independently — one bad
   * insert doesn't drop the rest of the batch.
   */
  fun writeAll(produce: () -> List<Span>) {
    scope.launch {
      try {
        awaitSessionPersisted()
      } catch (e: Exception) {
        Log.w(TAG, "Failed to persist a span batch", e)
        return@launch
      }
      for (span in produce()) {
        try {
          database.spanDao().insertCapped(span)
        } catch (e: Exception) {
          Log.w(TAG, "Failed to persist span \"${span.name}\"", e)
        }
      }
    }
  }
}
