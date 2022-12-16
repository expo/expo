package devmenu.com.swmansion.gesturehandler

import android.os.Handler
import android.view.MotionEvent

class FlingGestureHandler : GestureHandler<FlingGestureHandler>() {
  var numberOfPointersRequired = DEFAULT_NUMBER_OF_TOUCHES_REQUIRED
  var direction = DEFAULT_DIRECTION

  private val maxDurationMs = DEFAULT_MAX_DURATION_MS
  private val minAcceptableDelta = DEFAULT_MIN_ACCEPTABLE_DELTA
  private var startX = 0f
  private var startY = 0f
  private var handler: Handler? = null
  private var maxNumberOfPointersSimultaneously = 0
  private val failDelayed = Runnable { fail() }

  override fun resetConfig() {
    super.resetConfig()
    numberOfPointersRequired = DEFAULT_NUMBER_OF_TOUCHES_REQUIRED
    direction = DEFAULT_DIRECTION
  }

  private fun startFling(event: MotionEvent) {
    startX = event.rawX
    startY = event.rawY
    begin()
    maxNumberOfPointersSimultaneously = 1
    if (handler == null) {
      handler = Handler() // lazy delegate?
    } else {
      handler!!.removeCallbacksAndMessages(null)
    }
    handler!!.postDelayed(failDelayed, maxDurationMs)
  }

  private fun tryEndFling(event: MotionEvent) = if (
    maxNumberOfPointersSimultaneously == numberOfPointersRequired &&
    (direction and DIRECTION_RIGHT != 0 &&
      event.rawX - startX > minAcceptableDelta ||
      direction and DIRECTION_LEFT != 0 &&
      startX - event.rawX > minAcceptableDelta ||
      direction and DIRECTION_UP != 0 &&
      startY - event.rawY > minAcceptableDelta ||
      direction and DIRECTION_DOWN != 0 &&
      event.rawY - startY > minAcceptableDelta)) {
    handler!!.removeCallbacksAndMessages(null)
    activate()
    true
  } else {
    false
  }

  override fun activate(force: Boolean) {
    super.activate(force)
    end()
  }

  private fun endFling(event: MotionEvent) {
    if (!tryEndFling(event)) {
      fail()
    }
  }

  override fun onHandle(event: MotionEvent) {
    val state = state
    if (state == STATE_UNDETERMINED) {
      startFling(event)
    }
    if (state == STATE_BEGAN) {
      tryEndFling(event)
      if (event.pointerCount > maxNumberOfPointersSimultaneously) {
        maxNumberOfPointersSimultaneously = event.pointerCount
      }
      val action = event.actionMasked
      if (action == MotionEvent.ACTION_UP) {
        endFling(event)
      }
    }
  }

  override fun onCancel() {
    handler?.removeCallbacksAndMessages(null)
  }

  override fun onReset() {
    handler?.removeCallbacksAndMessages(null)
  }

  companion object {
    private const val DEFAULT_MAX_DURATION_MS: Long = 800
    private const val DEFAULT_MIN_ACCEPTABLE_DELTA: Long = 160
    private const val DEFAULT_DIRECTION = DIRECTION_RIGHT
    private const val DEFAULT_NUMBER_OF_TOUCHES_REQUIRED = 1
  }
}
