package devmenu.com.swmansion.gesturehandler

import android.content.Context
import android.os.Handler
import android.os.SystemClock
import android.view.MotionEvent

class LongPressGestureHandler(context: Context) : GestureHandler<LongPressGestureHandler>() {
  var minDurationMs = DEFAULT_MIN_DURATION_MS
  val duration: Int
    get() = (previousTime - startTime).toInt()
  private val defaultMaxDistSq: Float
  private var maxDistSq: Float
  private var startX = 0f
  private var startY = 0f
  private var startTime: Long = 0
  private var previousTime: Long = 0
  private var handler: Handler? = null

  init {
    setShouldCancelWhenOutside(true)
    defaultMaxDistSq = DEFAULT_MAX_DIST_DP * context.resources.displayMetrics.density
    maxDistSq = defaultMaxDistSq
  }

  override fun resetConfig() {
    super.resetConfig()
    minDurationMs = DEFAULT_MIN_DURATION_MS
    maxDistSq = defaultMaxDistSq
  }

  fun setMaxDist(maxDist: Float): LongPressGestureHandler {
    maxDistSq = maxDist * maxDist
    return this
  }

  override fun onHandle(event: MotionEvent) {
    if (state == STATE_UNDETERMINED) {
      previousTime = SystemClock.uptimeMillis()
      startTime = previousTime
      begin()
      startX = event.rawX
      startY = event.rawY
      handler = Handler()
      if (minDurationMs > 0) {
        handler!!.postDelayed({ activate() }, minDurationMs)
      } else if (minDurationMs == 0L) {
        activate()
      }
    }
    if (event.actionMasked == MotionEvent.ACTION_UP) {
      handler?.let {
        it.removeCallbacksAndMessages(null)
        handler = null
      }
      if (state == STATE_ACTIVE) {
        end()
      } else {
        fail()
      }
    } else {
      // calculate distance from start
      val deltaX = event.rawX - startX
      val deltaY = event.rawY - startY
      val distSq = deltaX * deltaX + deltaY * deltaY
      if (distSq > maxDistSq) {
        if (state == STATE_ACTIVE) {
          cancel()
        } else {
          fail()
        }
      }
    }
  }

  override fun onStateChange(newState: Int, previousState: Int) {
    handler?.let {
      it.removeCallbacksAndMessages(null)
      handler = null
    }
  }

  override fun dispatchStateChange(newState: Int, prevState: Int) {
    previousTime = SystemClock.uptimeMillis()
    super.dispatchStateChange(newState, prevState)
  }

  override fun dispatchHandlerUpdate(event: MotionEvent) {
    previousTime = SystemClock.uptimeMillis()
    super.dispatchHandlerUpdate(event)
  }

  companion object {
    private const val DEFAULT_MIN_DURATION_MS: Long = 500
    private const val DEFAULT_MAX_DIST_DP = 10f
  }
}
