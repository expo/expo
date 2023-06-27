package abi49_0_0.com.swmansion.gesturehandler.core

import android.view.MotionEvent

class ManualGestureHandler : GestureHandler<ManualGestureHandler>() {
  override fun onHandle(event: MotionEvent, sourceEvent: MotionEvent) {
    if (state == STATE_UNDETERMINED) {
      begin()
    }
  }
}
