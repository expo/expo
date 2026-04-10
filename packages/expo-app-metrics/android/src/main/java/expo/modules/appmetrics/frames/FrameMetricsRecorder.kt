package expo.modules.appmetrics.frames

import android.app.Activity

/**
 * A lightweight recorder that accumulates frame rate metrics independently.
 * Multiple recorders can be active simultaneously (e.g., one for app startup, one per screen),
 * each tracking its own metrics. Call [start] to begin recording and [stop] to finish
 * and retrieve the accumulated metrics.
 */
class FrameMetricsRecorder {
  private var record = FrameMetricsRecord()

  /** Starts recording frame metrics for the given activity's window. */
  fun start(activity: Activity) {
    FrameRateMonitor.addRecorder(this, activity)
  }

  /**
   * Stops recording frame metrics and returns the accumulated metrics since the last [start] call.
   * Resets the state so the recorder can be reused for a new recording session.
   */
  fun stop(): FrameMetricsRecord {
    FrameRateMonitor.removeRecorder(this)
    val result = record
    record = FrameMetricsRecord()
    return result
  }

  internal fun processFrame(frameDurationMs: Long) {
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

    record.renderedFrames++
    record.totalDurationMs += frameDurationMs
    record.expectedFrames += currentExpectedFrames
    record.droppedFrames += currentDroppedFrames
    if (frameDurationMs >= FROZEN_FRAME_THRESHOLD_MS) {
      record.frozenFrames++
    }
    if (frameDurationMs >= SLOW_FRAME_THRESHOLD_MS) {
      record.slowFrames++
    }
    record.freezeTimeMs += freezeDurationMs
  }

  companion object {
    private const val SLOW_FRAME_THRESHOLD_MS = 17.0
    private const val FROZEN_FRAME_THRESHOLD_MS = 700.0
    private const val REFRESH_RATE_DURATION_THRESHOLD_MS = 1.0
    private const val TARGET_FRAME_DURATION_MS = 17
  }
}

data class FrameMetricsRecord(
  var totalDurationMs: Long = 0,
  var renderedFrames: Long = 0,
  var expectedFrames: Long = 0,
  var droppedFrames: Long = 0,
  var frozenFrames: Long = 0,
  var slowFrames: Long = 0,
  var freezeTimeMs: Long = 0
)
