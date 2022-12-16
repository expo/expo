package devmenu.com.swmansion.gesturehandler

import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import devmenu.com.swmansion.gesturehandler.react.RNGestureHandlerButtonViewManager

class NativeViewGestureHandler : GestureHandler<NativeViewGestureHandler>() {
  private var shouldActivateOnStart = false
  private var disallowInterruption = false

  init {
    setShouldCancelWhenOutside(true)
  }

  override fun resetConfig() {
    super.resetConfig()
    shouldActivateOnStart = false
    disallowInterruption = false
  }

  fun setShouldActivateOnStart(shouldActivateOnStart: Boolean) = apply {
    this.shouldActivateOnStart = shouldActivateOnStart
  }

  /**
   * Set this to `true` when wrapping native components that are supposed to be an exclusive
   * target for a touch stream. Like for example switch or slider component which when activated
   * aren't supposed to be cancelled by scrollview or other container that may also handle touches.
   */
  fun setDisallowInterruption(disallowInterruption: Boolean) = apply {
    this.disallowInterruption = disallowInterruption
  }

  override fun shouldRecognizeSimultaneously(handler: GestureHandler<*>): Boolean {
    if (handler is NativeViewGestureHandler) {
      // Special case when the peer handler is also an instance of NativeViewGestureHandler:
      // For the `disallowInterruption` to work correctly we need to check the property when
      // accessed as a peer, because simultaneous recognizers can be set on either side of the
      // connection.
      val nativeWrapper = handler
      if (nativeWrapper.state == STATE_ACTIVE && nativeWrapper.disallowInterruption) {
        // other handler is active and it disallows interruption, we don't want to get into its way
        return false
      }
    }
    val canBeInterrupted = !disallowInterruption
    val otherState = handler.state
    return if (state == STATE_ACTIVE && otherState == STATE_ACTIVE && canBeInterrupted) {
      // if both handlers are active and the current handler can be interrupted it we return `false`
      // as it means the other handler has turned active and returning `true` would prevent it from
      // interrupting the current handler
      false
    } else state == STATE_ACTIVE && canBeInterrupted
    // otherwise we can only return `true` if already in an active state
  }

  override fun shouldBeCancelledBy(handler: GestureHandler<*>): Boolean {
    return !disallowInterruption
  }

  private fun canStart(): Boolean {
    val view = view
    if (view is StateChangeHook) {
      return view.canStart()
    }

    return true
  }

  private fun afterGestureEnd() {
    val view = view
    if (view is StateChangeHook) {
      view.afterGestureEnd()
    }
  }

  override fun onHandle(event: MotionEvent) {
    val view = view!!
    if (event.actionMasked == MotionEvent.ACTION_UP) {
      view.onTouchEvent(event)
      if ((state == STATE_UNDETERMINED || state == STATE_BEGAN) && view.isPressed) {
        activate()
      }
      end()
      afterGestureEnd()
    } else if (state == STATE_UNDETERMINED || state == STATE_BEGAN) {
      when {
        shouldActivateOnStart -> {
          tryIntercept(view, event)
          view.onTouchEvent(event)
          activate()
        }
        tryIntercept(view, event) -> {
          view.onTouchEvent(event)
          activate()
        }
        state != STATE_BEGAN -> {
          if (canStart()) {
            begin()
          } else {
            cancel()
          }
        }
      }
    } else if (state == STATE_ACTIVE) {
      view.onTouchEvent(event)
    }
  }

  override fun onCancel() {
    val time = SystemClock.uptimeMillis()
    val event = MotionEvent.obtain(time, time, MotionEvent.ACTION_CANCEL, 0f, 0f, 0).apply {
      action =  MotionEvent.ACTION_CANCEL
    }
    view!!.onTouchEvent(event)
  }

  companion object {
    private fun tryIntercept(view: View, event: MotionEvent) =
      view is ViewGroup && view.onInterceptTouchEvent(event)
  }

  interface StateChangeHook {
    fun canStart(): Boolean
    fun afterGestureEnd()
  }
}
