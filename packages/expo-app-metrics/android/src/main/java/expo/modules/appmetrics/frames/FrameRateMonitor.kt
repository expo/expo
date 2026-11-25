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
    // Don't use `removeIf`: on API 24-25 CopyOnWriteArrayList has no override, so it falls back to
    // Collection.removeIf, whose iterator.remove() throws UnsupportedOperationException. The override
    // only exists from API 26. `removeAll(Collection)` is a real synchronized implementation on both.
    // API 24: https://android.googlesource.com/platform/libcore/+/refs/tags/android-7.0.0_r1/luni/src/main/java/java/util/concurrent/CopyOnWriteArrayList.java
    //   (`removeAll` at line 362; no `removeIf`)
    // API 26: https://android.googlesource.com/platform/libcore/+/refs/tags/android-8.0.0_r1/ojluni/src/main/java/java/util/concurrent/CopyOnWriteArrayList.java
    //   (both implemented)
    val matches = recorders.filter { ref -> ref.get().let { it === recorder || it == null } }
    if (matches.isNotEmpty()) recorders.removeAll(matches)
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
    val stale = recorders.filter { it.get() == null }
    if (stale.isNotEmpty()) recorders.removeAll(stale)
  }

  internal fun dispatchFrame(frameDurationMs: Long) {
    removeReleasedRecorders()
    for (ref in recorders) {
      ref.get()?.processFrame(frameDurationMs)
    }
  }
}
