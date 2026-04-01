package expo.modules.appmetrics.frames

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.Window
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.utils.TimeUtils

class FrameMetricsManager(
  val activity: Activity,
  val sessionManager: SessionManager
) {
  private var listener: Window.OnFrameMetricsAvailableListener? = null
  private val recordingSessions: MutableMap<String, FrameMetricsRecord> = mutableMapOf()

  companion object {
    private const val SLOW_FRAME_THRESHOLD_MS = 17.0
    private const val FROZEN_FRAME_THRESHOLD_MS = 700.0
    private const val REFRESH_RATE_DURATION_THRESHOLD_MS = 1.0
    private const val TARGET_FRAME_DURATION_MS = 17
  }

  fun startRecording(sessionId: String) {
    check(!recordingSessions.containsKey(sessionId)) {
      "Session with id $sessionId is already being recorded."
    }
    recordingSessions.put(sessionId, FrameMetricsRecord(sessionId = sessionId))
    if (listener == null) {
      listener = Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
        val frameDurationMs =
          (frameMetrics.getMetric(android.view.FrameMetrics.TOTAL_DURATION) / 1_000_000.0).toLong()
        val currentExpectedFrames: Long
        val currentDroppedFrames: Long

        if (frameDurationMs > (TARGET_FRAME_DURATION_MS + REFRESH_RATE_DURATION_THRESHOLD_MS)) {
          currentExpectedFrames = frameDurationMs / TARGET_FRAME_DURATION_MS
          currentDroppedFrames = currentExpectedFrames - 1
        } else {
          currentExpectedFrames = 1
          currentDroppedFrames = 0
        }

        val freezeDurationMs = frameDurationMs - TARGET_FRAME_DURATION_MS

        val isFrozen = frameDurationMs >= FROZEN_FRAME_THRESHOLD_MS
        val isSlow = frameDurationMs >= SLOW_FRAME_THRESHOLD_MS

        recordingSessions.values.forEach {
          it.renderedFrames++
          it.totalDurationMs += frameDurationMs
          it.expectedFrames += currentExpectedFrames
          it.droppedFrames += currentDroppedFrames
          if (isFrozen) {
            it.frozenFrames++
          }
          if (isSlow) {
            it.slowFrames++
          }
          it.freezeTimeMs += freezeDurationMs
        }
      }

      val handler = Handler(Looper.getMainLooper())
      activity.window.addOnFrameMetricsAvailableListener(listener!!, handler)
    }
  }

  suspend fun stopRecording(sessionId: String) {
    val record = recordingSessions.remove(sessionId)
    if (recordingSessions.isEmpty() && listener != null) {
      activity.window?.removeOnFrameMetricsAvailableListener(listener)
      listener = null
    }
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()
//    record?.let { record ->
//      val metrics = listOf(
//        Pair(FrameRateMetric.RenderedFrames, record.renderedFrames),
//        Pair(FrameRateMetric.ExpectedFrames, record.expectedFrames),
//        Pair(FrameRateMetric.DroppedFrames, record.droppedFrames),
//        Pair(FrameRateMetric.FrozenFrames, record.frozenFrames),
//        Pair(FrameRateMetric.SlowFrames, record.slowFrames),
//        Pair(FrameRateMetric.FreezeTime, record.freezeTimeMs / 1000.0),
//        Pair(FrameRateMetric.SessionDuration, record.totalDurationMs / 1000.0)
//      ).map {
//        Metric(
//          sessionId = sessionId,
//          category = FrameRateMetric.category.categoryName,
//          name = it.first.metricName,
//          value = it.second.toDouble(),
//          timestamp = timestamp
//        )
//      }
//      sessionManager.addMetrics(
//        metrics, sessionId = sessionId
//      )
//    }
  }

  suspend fun stopAllRecordings() {
    recordingSessions.keys.forEach {
      stopRecording(it)
    }
  }
}

data class FrameMetricsRecord(
  val sessionId: String,
  var totalDurationMs: Long = 0,
  var renderedFrames: Long = 0,
  var expectedFrames: Long = 0,
  var droppedFrames: Long = 0,
  var frozenFrames: Long = 0,
  var slowFrames: Long = 0,
  var freezeTimeMs: Long = 0
)
