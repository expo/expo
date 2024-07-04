package expo.modules.devmenu

import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.ReactRootView
import expo.modules.devmenu.fab.MovableFloatingActionButton

/**
 * We want to hide the FAB behind the feature flag for now.
 */
private const val enableFAB = false

class DevMenuReactRootViewContainer(context: Context) : FrameLayout(context) {
  private val fab by lazy { MovableFloatingActionButton(context) }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    DevMenuManager.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun addView(child: View?, index: Int, params: ViewGroup.LayoutParams?) {
    super.addView(child, index, params)
    if (enableFAB && child is ReactRootView) {
      addView(fab)
    }
  }
}
