// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.observe

import android.content.Context
import android.util.Log
import expo.modules.appmetrics.storage.SessionManager
import kotlinx.coroutines.CancellationException

internal suspend fun repairCursorIfStale(
  signalName: String,
  readCursor: () -> Long,
  writeCursor: (Long) -> Unit,
  readMaxId: suspend () -> Long?
) {
  val cursor = readCursor()
  if (cursor < 0) return

  val maxId = try {
    readMaxId()
  } catch (error: CancellationException) {
    throw error
  } catch (error: Exception) {
    Log.w(OBSERVE_TAG, "Failed to read max $signalName id while repairing cursor: ${error.message}")
    return
  }
  if (cursor > (maxId ?: -1)) {
    Log.i(
      OBSERVE_TAG,
      "Resetting stale $signalName dispatch cursor (was $cursor, max id is ${maxId ?: "<empty>"})"
    )
    writeCursor(-1)
  }
}

internal suspend fun repairMetricCursorIfStale(
  context: Context,
  sessionManager: SessionManager
) {
  repairCursorIfStale(
    signalName = "metric",
    readCursor = { ObservePreferences.getLastDispatchedMetricId(context) },
    writeCursor = { ObservePreferences.setLastDispatchedMetricId(context, it) },
    readMaxId = sessionManager::getMaxMetricId
  )
}

internal suspend fun repairLogCursorIfStale(
  context: Context,
  sessionManager: SessionManager
) {
  repairCursorIfStale(
    signalName = "log",
    readCursor = { ObservePreferences.getLastDispatchedLogId(context) },
    writeCursor = { ObservePreferences.setLastDispatchedLogId(context, it) },
    readMaxId = sessionManager::getMaxLogId
  )
}
