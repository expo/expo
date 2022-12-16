package devmenu.com.swmansion.gesturehandler

import android.os.Handler
import android.view.MotionEvent
import devmenu.com.swmansion.gesturehandler.GestureUtils.getLastPointerX
import devmenu.com.swmansion.gesturehandler.GestureUtils.getLastPointerY
import kotlin.math.abs

class TapGestureHandler : GestureHandler<TapGestureHandler>() {
  private var maxDeltaX = MAX_VALUE_IGNORE
  private var maxDeltaY = MAX_VALUE_IGNORE
  private var maxDistSq = MAX_VALUE_IGNORE
  private var maxDurationMs = DEFAULT_MAX_DURATION_MS
  private var maxDelayMs = DEFAULT_MAX_DELAY_MS
  private var numberOfTaps = DEFAULT_NUMBER_OF_TAPS
  private var minNumberOfPointers = DEFAULT_MIN_NUMBER_OF_POINTERS
  private var currentMaxNumberOfPointers = 1
  private var startX = 0f
  private var startY = 0f
  private var offsetX = 0f
  private var offsetY = 0f
  private var lastX = 0f
  private var lastY = 0f
  private var handler: Handler? = null
  private var tapsSoFar = 0
  private val failDelayed = Runnable { fail() }

  init {
    setShouldCancelWhenOutside(true)
  }

  override fun resetConfig() {
    super.resetConfig()
    maxDeltaX = MAX_VALUE_IGNORE
    maxDeltaY = MAX_VALUE_IGNORE
    maxDistSq = MAX_VALUE_IGNORE
    maxDurationMs = DEFAULT_MAX_DURATION_MS
    maxDelayMs = DEFAULT_MAX_DELAY_MS
    numberOfTaps = DEFAULT_NUMBER_OF_TAPS
    minNumberOfPointers = DEFAULT_MIN_NUMBER_OF_POINTERS
  }

  fun setNumberOfTaps(numberOfTaps: Int) = apply {
    this.numberOfTaps = numberOfTaps
  }

  fun setMaxDelayMs(maxDelayMs: Long) = apply {
    this.maxDelayMs = maxDelayMs
  }

  fun setMaxDurationMs(maxDurationMs: Long) = apply {
    this.maxDurationMs = maxDurationMs
  }

  fun setMaxDx(deltaX: Float) = apply {
    maxDeltaX = deltaX
  }

  fun setMaxDy(deltaY: Float) = apply {
    maxDeltaY = deltaY
  }

  fun setMaxDist(maxDist: Float) = apply {
    maxDistSq = maxDist * maxDist
  }

  fun setMinNumberOfPointers(minNumberOfPointers: Int) = apply {
    this.minNumberOfPointers = minNumberOfPointers
  }

  private fun startTap() {
    if (handler == null) {
      handler = Handler() // TODO: lazy init (handle else branch correctly)
    } else {
      handler!!.removeCallbacksAndMessages(null)
    }
    handler!!.postDelayed(failDelayed, maxDurationMs)
  }

  private fun endTap() {
    if (handler == null) {
      handler = Handler()
    } else {
      handler!!.removeCallbacksAndMessages(null)
    }
    if (++tapsSoFar == numberOfTaps && currentMaxNumberOfPointers >= minNumberOfPointers) {
      activate()
    } else {
      handler!!.postDelayed(failDelayed, maxDelayMs)
    }
  }

  private fun shouldFail(): Boolean {
    val dx = lastX - startX + offsetX
    if (maxDeltaX != MAX_VALUE_IGNORE && abs(dx) > maxDeltaX) {
      return true
    }
    val dy = lastY - startY + offsetY
    if (maxDeltaY != MAX_VALUE_IGNORE && abs(dy) > maxDeltaY) {
      return true
    }
    val dist = dy * dy + dx * dx
    return maxDistSq != MAX_VALUE_IGNORE && dist > maxDistSq
  }

  override fun onHandle(event: MotionEvent) {
    val state = state
    val action = event.actionMasked
    if (state == STATE_UNDETERMINED) {
      offsetX = 0f
      offsetY = 0f
      startX = event.rawX
      startY = event.rawY
    }
    if (action == MotionEvent.ACTION_POINTER_UP || action == MotionEvent.ACTION_POINTER_DOWN) {
      offsetX += lastX - startX
      offsetY += lastY - startY
      lastX = getLastPointerX(event, true)
      lastY = getLastPointerY(event, true)
      startX = lastX
      startY = lastY
    } else {
      lastX = getLastPointerX(event, true)
      lastY = getLastPointerY(event, true)
    }
    if (currentMaxNumberOfPointers < event.pointerCount) {
      currentMaxNumberOfPointers = event.pointerCount
    }
    if (shouldFail()) {
      fail()
    } else if (state == STATE_UNDETERMINED) {
      if (action == MotionEvent.ACTION_DOWN) {
        begin()
      }
      startTap()
    } else if (state == STATE_BEGAN) {
      if (action == MotionEvent.ACTION_UP) {
        endTap()
      } else if (action == MotionEvent.ACTION_DOWN) {
        startTap()
      }
    }
  }

  override fun activate(force: Boolean) {
    super.activate(force)
    end()
  }

  override fun onCancel() {
    handler?.removeCallbacksAndMessages(null)
  }

  override fun onReset() {
    tapsSoFar = 0
    currentMaxNumberOfPointers = 0
    handler?.removeCallbacksAndMessages(null)
  }

  companion object {
    private const val MAX_VALUE_IGNORE = Float.MIN_VALUE
    private const val DEFAULT_MAX_DURATION_MS: Long = 500
    private const val DEFAULT_MAX_DELAY_MS: Long = 200
    private const val DEFAULT_NUMBER_OF_TAPS = 1
    private const val DEFAULT_MIN_NUMBER_OF_POINTERS = 1
  }
}
