package com.swmansion.gesturehandler.core

import android.view.MotionEvent

object GestureUtils {
  fun getLastPointerX(event: MotionEvent, averageTouches: Boolean): Float {
    val excludeIndex = if (event.actionMasked == MotionEvent.ACTION_POINTER_UP) event.actionIndex else -1
    return if (averageTouches) {
      var sum = 0f
      var count = 0
      for (i in 0 until event.pointerCount) {
        if (i != excludeIndex) {
          sum += event.getX(i)
          count++
        }
      }
      sum / count
    } else {
      var lastPointerIdx = event.pointerCount - 1
      if (lastPointerIdx == excludeIndex) {
        lastPointerIdx--
      }
      event.getX(lastPointerIdx)
    }
  }

  fun getLastPointerY(event: MotionEvent, averageTouches: Boolean): Float {
    val excludeIndex = if (event.actionMasked == MotionEvent.ACTION_POINTER_UP) event.actionIndex else -1
    return if (averageTouches) {
      var sum = 0f
      var count = 0
      for (i in 0 until event.pointerCount) {
        if (i != excludeIndex) {
          sum += event.getY(i)
          count++
        }
      }
      sum / count
    } else {
      var lastPointerIdx = event.pointerCount - 1
      if (lastPointerIdx == excludeIndex) {
        lastPointerIdx -= 1
      }
      event.getY(lastPointerIdx)
    }
  }
}
