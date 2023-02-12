package devmenu.com.swmansion.gesturehandler

import android.view.MotionEvent

class ManualGestureHandler : GestureHandler<ManualGestureHandler>() {
  override fun onHandle(event: MotionEvent) {
    if (state == STATE_UNDETERMINED) {
      begin()
    }
  }
}
