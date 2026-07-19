package expo.modules.video

import android.os.Handler
import android.os.Looper
import expo.modules.video.delegates.IgnoreSameSet
import java.lang.ref.WeakReference

fun interface IntervalUpdateEmitter {
  fun emitTimeUpdate()
}

class IntervalUpdateClock(emitter: IntervalUpdateEmitter) {
  private val emitter: WeakReference<IntervalUpdateEmitter> = WeakReference(emitter)
  private var handler: Handler = Handler(Looper.getMainLooper())

  // TODO: @behenate - Once the Player instance is available in OnStartObserving we can automatically start/stop the clock.
  var interval by IgnoreSameSet(0L) { new: Long, _: Long? ->
    if (new <= 0) {
      stop()
    } else {
      startOrUpdate()
    }
  }

  private var isRunning: Boolean = false

  private fun stop() {
    handler.removeCallbacksAndMessages(null)
    isRunning = false
  }

  private fun startOrUpdate() {
    if (!isRunning) {
      emitter.get()?.emitTimeUpdate()
    } else {
      handler.removeCallbacksAndMessages(null)
    }
    isRunning = true
    scheduleNextUpdate()
  }

  private fun scheduleNextUpdate() {
    if (interval <= 0L) {
      return
    }

    val update = {
      emitter.get()?.emitTimeUpdate()
      scheduleNextUpdate()
    }

    handler.postDelayed(update, interval)
  }
}
