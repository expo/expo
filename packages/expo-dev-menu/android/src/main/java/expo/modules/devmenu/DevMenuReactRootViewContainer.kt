package expo.modules.devmenu

import android.content.Context
import android.view.MotionEvent
import android.widget.FrameLayout

class DevMenuReactRootViewContainer(context: Context) : FrameLayout(context) {
  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    DevMenuManager.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }
}
