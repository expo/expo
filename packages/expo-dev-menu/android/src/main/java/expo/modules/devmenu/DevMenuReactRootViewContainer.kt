package expo.modules.devmenu

import android.content.Context
import android.view.MotionEvent
import com.facebook.react.ReactRootView

class DevMenuReactRootViewContainer(context: Context): ReactRootView(context) {
  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    DevMenuManager.onTouchEvent(ev)
    return super.onTouchEvent(ev)
  }
}
