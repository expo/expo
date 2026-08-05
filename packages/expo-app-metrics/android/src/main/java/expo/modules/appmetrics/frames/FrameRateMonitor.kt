package expo.modules.appmetrics.frames

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.Window
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Internal singleton that manages the [Window.OnFrameMetricsAvailableListener].
 * Auto-attaches to the window when the first recorder is added and
 * auto-detaches when the last is removed.
 *
 * The frame callback runs on the main thread while [addRecorder] / [removeRecorder]
 * are typically invoked from the JS thread, so [recorders] must be safe for
 * concurrent iteration. [CopyOnWriteArrayList] gives lock-free iteration on the
 * hot frame path; writes are rare (per record start/stop).
 */
internal object FrameRateMonitor {
  private var listener: Window.OnFrameMetricsAvailableListener? = null
  private var currentActivity: WeakReference<Activity>? = null
  private val recorders = CopyOnWriteArrayList<WeakReference<FrameMetricsRecorder>>()

  @Synchronized
  fun addRecorder(recorder: FrameMetricsRecorder, activity: Activity) {
    recorders.add(WeakReference(recorder))
    startMonitoringIfNeeded(activity)
  }

  @Synchronized
  fun removeRecorder(recorder: FrameMetricsRecorder) {
    // Use CopyOnWriteArrayList's atomic removeIf — Kotlin's removeAll { } extension
    // uses an indexed iterator that is not safe against concurrent add().
    recorders.removeIf { ref -> ref.get().let { it === recorder || it == null } }
    stopMonitoringIfEmpty()
  }

  private fun startMonitoringIfNeeded(activity: Activity) {
    if (listener != null) return

    currentActivity = WeakReference(activity)
    val newListener = Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
      val frameDurationMs =
        (frameMetrics.getMetric(android.view.FrameMetrics.TOTAL_DURATION) / 1_000_000.0).toLong()
      dispatchFrame(frameDurationMs)
    }
    listener = newListener

    val handler = Handler(Looper.getMainLooper())
    activity.window.addOnFrameMetricsAvailableListener(newListener, handler)
  }

  private fun stopMonitoringIfEmpty() {
    removeReleasedRecorders()
    if (recorders.isNotEmpty()) return

    listener?.let { l ->
      currentActivity?.get()?.window?.removeOnFrameMetricsAvailableListener(l)
    }
    listener = null
    currentActivity = null
  }

  private fun removeReleasedRecorders() {
    recorders.removeIf { it.get() == null }
  }

  internal fun dispatchFrame(frameDurationMs: Long) {
    removeReleasedRecorders()
    for (ref in recorders) {
      ref.get()?.processFrame(frameDurationMs)
    }
  }
}
