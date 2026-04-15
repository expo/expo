package expo.modules.appmetrics.frames

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.Window
import java.lang.ref.WeakReference

/**
 * Internal singleton that manages the [Window.OnFrameMetricsAvailableListener].
 * Auto-attaches to the window when the first recorder is added and
 * auto-detaches when the last is removed.
 */
internal object FrameRateMonitor {
  private var listener: Window.OnFrameMetricsAvailableListener? = null
  private var currentActivity: WeakReference<Activity>? = null
  private val recorders = mutableListOf<WeakReference<FrameMetricsRecorder>>()

  fun addRecorder(recorder: FrameMetricsRecorder, activity: Activity) {
    recorders.add(WeakReference(recorder))
    startMonitoringIfNeeded(activity)
  }

  fun removeRecorder(recorder: FrameMetricsRecorder) {
    recorders.removeAll { it.get() === recorder || it.get() == null }
    stopMonitoringIfEmpty()
  }

  private fun startMonitoringIfNeeded(activity: Activity) {
    if (listener != null) return

    currentActivity = WeakReference(activity)
    val newListener = Window.OnFrameMetricsAvailableListener { _, frameMetrics, _ ->
      val frameDurationMs =
        (frameMetrics.getMetric(android.view.FrameMetrics.TOTAL_DURATION) / 1_000_000.0).toLong()

      removeReleasedRecorders()
      for (ref in recorders) {
        ref.get()?.processFrame(frameDurationMs)
      }
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
    recorders.removeAll { it.get() == null }
  }
}
