package com.swmansion.gesturehandler.core

import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import com.swmansion.gesturehandler.react.RNViewConfigurationHelper

class HoverGestureHandler : GestureHandler<HoverGestureHandler>() {
  private var handler: Handler? = null
  private var finishRunnable = Runnable { finish() }

  private infix fun isAncestorOf(other: GestureHandler<*>): Boolean {
    var current: View? = other.view

    while (current != null) {
      if (current == this.view) {
        return true
      }

      current = current.parent as? View
    }

    return false
  }

  private fun isViewDisplayedOverAnother(view: View, other: View, rootView: View = view.rootView): Boolean? {
    // traverse the tree starting on the root view, to see which view will be drawn first
    if (rootView == other) {
      return true
    }

    if (rootView == view) {
      return false
    }

    if (rootView is ViewGroup) {
      for (i in 0 until rootView.childCount) {
        val child = viewConfigHelper.getChildInDrawingOrderAtIndex(rootView, i)
        return isViewDisplayedOverAnother(view, other, child) ?: continue
      }
    }

    return null
  }

  override fun shouldBeCancelledBy(handler: GestureHandler<*>): Boolean {
    if (handler is HoverGestureHandler && !(handler isAncestorOf this)) {
      return isViewDisplayedOverAnother(handler.view!!, this.view!!)!!
    }

    return super.shouldBeCancelledBy(handler)
  }

  override fun shouldRequireToWaitForFailure(handler: GestureHandler<*>): Boolean {
    if (handler is HoverGestureHandler) {
      if (!(this isAncestorOf handler) && !(handler isAncestorOf this)) {
        isViewDisplayedOverAnother(this.view!!, handler.view!!)?.let {
          return it
        }
      }
    }

    return super.shouldRequireToWaitForFailure(handler)
  }

  override fun shouldRecognizeSimultaneously(handler: GestureHandler<*>): Boolean {
    if (handler is HoverGestureHandler && (this isAncestorOf handler || handler isAncestorOf this)) {
      return true
    }

    return super.shouldRecognizeSimultaneously(handler)
  }

  override fun onHandle(event: MotionEvent, sourceEvent: MotionEvent) {
    if (event.action == MotionEvent.ACTION_DOWN) {
      handler?.removeCallbacksAndMessages(null)
      handler = null
    } else if (event.action == MotionEvent.ACTION_UP) {
      if (!isWithinBounds) {
        finish()
      }
    }
  }

  override fun onHandleHover(event: MotionEvent, sourceEvent: MotionEvent) {
    when {
      event.action == MotionEvent.ACTION_HOVER_EXIT -> {
        if (handler == null) {
          handler = Handler(Looper.getMainLooper())
        }

        handler!!.postDelayed(finishRunnable, 4)
      }

      !isWithinBounds -> {
        finish()
      }

      this.state == STATE_UNDETERMINED &&
        (event.action == MotionEvent.ACTION_HOVER_MOVE || event.action == MotionEvent.ACTION_HOVER_ENTER) -> {
        begin()
        activate()
      }
    }
  }

  private fun finish() {
    when (this.state) {
      STATE_UNDETERMINED -> cancel()
      STATE_BEGAN -> fail()
      STATE_ACTIVE -> end()
    }
  }

  companion object {
    private val viewConfigHelper = RNViewConfigurationHelper()
  }
}
