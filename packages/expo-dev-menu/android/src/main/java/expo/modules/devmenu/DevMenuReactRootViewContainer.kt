package expo.modules.devmenu

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.RequiresApi
import androidx.core.view.ViewCompat
import androidx.core.view.doOnLayout
import com.facebook.react.ReactRootView
import expo.modules.devmenu.fab.MovableFloatingActionButton

/**
 * We want to hide the FAB behind the feature flag for now.
 */
private const val enableFAB = false

class DevMenuReactRootViewContainer(context: Context) : FrameLayout(context) {
  private val updateSystemGestureExclusionRects: () -> Unit = {
    val marginLayoutParams = fab.layoutParams as MarginLayoutParams

    // Bounding box for the FAB, with margins included
    val rect = Rect(
      fab.x.toInt() - marginLayoutParams.leftMargin,
      fab.y.toInt() - marginLayoutParams.bottomMargin,
      fab.x.toInt() + fab.width + marginLayoutParams.rightMargin,
      fab.y.toInt() + fab.height + marginLayoutParams.topMargin
    )

    // For some reason, updating the system gesture exclusion rects has to be called on that view
    // instead of calling it on the fab view itself. Probably, because we want to extend the rect by view margins.
    ViewCompat.setSystemGestureExclusionRects(this, listOf(rect))
  }

  private val fab by lazy {
    MovableFloatingActionButton(context) {
      // `setSystemGestureExclusionRects` should be call after the view is laid out
      doOnLayout {
        updateSystemGestureExclusionRects()
      }
    }
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    updateSystemGestureExclusionRects()
  }

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
