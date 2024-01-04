package com.swmansion.gesturehandler.core

import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.widget.ScrollView
import com.facebook.react.views.scroll.ReactScrollView
import com.facebook.react.views.swiperefresh.ReactSwipeRefreshLayout
import com.facebook.react.views.textinput.ReactEditText

class NativeViewGestureHandler : GestureHandler<NativeViewGestureHandler>() {
  private var shouldActivateOnStart = false
  var disallowInterruption = false
    private set

  private var hook: NativeViewGestureHandlerHook = defaultHook

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
    // if the gesture is marked by user as simultaneous with other or the hook return true
    if (super.shouldRecognizeSimultaneously(handler) || hook.shouldRecognizeSimultaneously(handler)) {
      return true
    }

    if (handler is NativeViewGestureHandler) {
      // Special case when the peer handler is also an instance of NativeViewGestureHandler:
      // For the `disallowInterruption` to work correctly we need to check the property when
      // accessed as a peer, because simultaneous recognizers can be set on either side of the
      // connection.
      if (handler.state == STATE_ACTIVE && handler.disallowInterruption) {
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
    } else state == STATE_ACTIVE && canBeInterrupted && (!hook.shouldCancelRootViewGestureHandlerIfNecessary() || handler.tag > 0)
    // otherwise we can only return `true` if already in an active state
  }

  override fun shouldBeCancelledBy(handler: GestureHandler<*>): Boolean {
    return !disallowInterruption
  }

  override fun onPrepare() {
    when (val view = view) {
      is NativeViewGestureHandlerHook -> this.hook = view
      is ReactEditText -> this.hook = EditTextHook(this, view)
      is ReactSwipeRefreshLayout -> this.hook = SwipeRefreshLayoutHook(this, view)
      is ReactScrollView -> this.hook = ScrollViewHook()
    }
  }

  override fun onHandle(event: MotionEvent, sourceEvent: MotionEvent) {
    val view = view!!
    if (event.actionMasked == MotionEvent.ACTION_UP) {
      view.onTouchEvent(event)
      if ((state == STATE_UNDETERMINED || state == STATE_BEGAN) && view.isPressed) {
        activate()
      }
      end()
      hook.afterGestureEnd(event)
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
        hook.wantsToHandleEventBeforeActivation() -> {
          hook.handleEventBeforeActivation(event)
        }
        state != STATE_BEGAN -> {
          if (hook.canBegin()) {
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
      action = MotionEvent.ACTION_CANCEL
    }
    view!!.onTouchEvent(event)
    event.recycle()
  }

  override fun onReset() {
    this.hook = defaultHook
  }

  companion object {
    private fun tryIntercept(view: View, event: MotionEvent) =
      view is ViewGroup && view.onInterceptTouchEvent(event)

    private val defaultHook = object : NativeViewGestureHandlerHook {}
  }

  interface NativeViewGestureHandlerHook {
    /**
     * Called when gesture is in the UNDETERMINED state, shouldActivateOnStart is set to false,
     * and both tryIntercept and wantsToHandleEventBeforeActivation returned false.
     *
     * @return Boolean value signalling whether the handler can transition to the BEGAN state. If false
     * the gesture will be cancelled.
     */
    fun canBegin() = true

    /**
     * Called after the gesture transitions to the END state.
     */
    fun afterGestureEnd(event: MotionEvent) = Unit

    /**
     * @return Boolean value signalling whether the gesture can be recognized simultaneously with
     * other (handler). Returning false doesn't necessarily prevent it from happening.
     */
    fun shouldRecognizeSimultaneously(handler: GestureHandler<*>) = false

    /**
     * shouldActivateOnStart and tryIntercept have priority over this method
     *
     * @return Boolean value signalling if the hook wants to handle events passed to the handler
     * before it activates (after that the events are passed to the underlying view).
     */
    fun wantsToHandleEventBeforeActivation() = false

    /**
     * Will be called with events if wantsToHandleEventBeforeActivation returns true.
     */
    fun handleEventBeforeActivation(event: MotionEvent) = Unit

    /**
     * @return Boolean value indicating whether the RootViewGestureHandler should be cancelled
     * by this one.
     */
    fun shouldCancelRootViewGestureHandlerIfNecessary() = false
  }

  private class EditTextHook(
    private val handler: NativeViewGestureHandler,
    private val editText: ReactEditText
  ) : NativeViewGestureHandlerHook {
    private var startX = 0f
    private var startY = 0f
    private var touchSlopSquared: Int

    init {
      val vc = ViewConfiguration.get(editText.context)
      touchSlopSquared = vc.scaledTouchSlop * vc.scaledTouchSlop
    }

    override fun afterGestureEnd(event: MotionEvent) {
      if ((event.x - startX) * (event.x - startX) + (event.y - startY) * (event.y - startY) < touchSlopSquared) {
        editText.requestFocusFromJS()
      }
    }

    // recognize alongside every handler besides RootViewGestureHandler, which is a private inner class
    // of RNGestureHandlerRootHelper so no explicit type checks, but its tag is always negative
    // also if other handler is NativeViewGestureHandler then don't override the default implementation
    override fun shouldRecognizeSimultaneously(handler: GestureHandler<*>) =
      handler.tag > 0 && handler !is NativeViewGestureHandler

    override fun wantsToHandleEventBeforeActivation() = true

    override fun handleEventBeforeActivation(event: MotionEvent) {
      handler.activate()
      editText.onTouchEvent(event)

      startX = event.x
      startY = event.y
    }

    override fun shouldCancelRootViewGestureHandlerIfNecessary() = true
  }

  private class SwipeRefreshLayoutHook(
    private val handler: NativeViewGestureHandler,
    private val swipeRefreshLayout: ReactSwipeRefreshLayout
  ) : NativeViewGestureHandlerHook {
    override fun wantsToHandleEventBeforeActivation() = true

    override fun handleEventBeforeActivation(event: MotionEvent) {
      // RefreshControl from GH is set up in a way that ScrollView wrapped with it should wait for
      // it to fail. This way the RefreshControl is not canceled by the scroll handler.
      // The problem with this approach is that the RefreshControl handler stays active all the time
      // preventing scroll from activating.
      // This is a workaround to prevent it from happening.

      // First get the ScrollView under the RefreshControl, if there is none, return.
      val scroll = swipeRefreshLayout.getChildAt(0) as? ScrollView ?: return

      // Then find the first NativeViewGestureHandler attached to it
      val scrollHandler = handler.orchestrator
        ?.getHandlersForView(scroll)
        ?.first {
          it is NativeViewGestureHandler
        }

      // If handler was found, it's active and the ScrollView is not at the top, fail the RefreshControl
      if (scrollHandler != null && scrollHandler.state == STATE_ACTIVE && scroll.scrollY > 0) {
        handler.fail()
      }

      // The drawback is that the smooth transition from scrolling to refreshing in a single swipe
      // is impossible this way and two swipes are required:
      // - one to go back to top
      // - one to actually refresh
      // oh well  ¯\_(ツ)_/¯
    }
  }

  private class ScrollViewHook : NativeViewGestureHandlerHook {
    override fun shouldCancelRootViewGestureHandlerIfNecessary() = true
  }
}
