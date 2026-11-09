package expo.modules.image

import android.os.Handler
import android.os.Looper
import android.os.SystemClock

internal object SharedAnimationTick {
  const val INTERVAL_MS = 50L

  private val handler = Handler(Looper.getMainLooper())
  private val pendingViews = LinkedHashSet<ExpoImageView>()
  private var isScheduled = false

  private val flush = Runnable {
    isScheduled = false
    val views = pendingViews.toList()
    pendingViews.clear()
    views.forEach { it.onSharedAnimationTick() }
  }

  fun request(view: ExpoImageView) {
    pendingViews.add(view)
    if (isScheduled) {
      return
    }
    isScheduled = true
    val now = SystemClock.uptimeMillis()
    handler.postAtTime(flush, now + INTERVAL_MS - now % INTERVAL_MS)
  }
}
