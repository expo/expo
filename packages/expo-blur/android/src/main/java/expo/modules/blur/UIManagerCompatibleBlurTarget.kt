package expo.modules.blur

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.os.Build
import android.view.View
import eightbitlab.com.blurview.BlurTarget
import expo.modules.kotlin.AppContext

class UIManagerCompatibleBlurTarget(appContext: AppContext, context: Context) : BlurTarget(context) {
  private val pendingBlurViews = mutableSetOf<View>()

  internal fun refreshBlurView(blurView: View) {
    pendingBlurViews.add(blurView)
    invalidate()
  }

  override fun onWindowVisibilityChanged(visibility: Int) {
    super.onWindowVisibilityChanged(visibility)
    if (visibility == VISIBLE && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // Android may discard the separately recorded RenderNode while stopped.
      // Re-record its contents even when React has no new props to commit.
      invalidate()
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    super.dispatchDraw(canvas)
    if (canvas.isHardwareAccelerated) {
      // A blur in another window can draw before this target records its snapshot.
      // Refresh it on the next frame, after the target's display list is ready.
      pendingBlurViews.forEach { it.postInvalidateOnAnimation() }
      pendingBlurViews.clear()
    }
  }

  override fun onDetachedFromWindow() {
    pendingBlurViews.clear()
    super.onDetachedFromWindow()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op since UIManager handles actually laying out children.
  }

  @SuppressLint("MissingSuperCall")
  override fun requestLayout() {
    // No-op, terminate `requestLayout` here, UIManager handles laying out children and
    // `layout` is called on all RN-managed views by `NativeViewHierarchyManager`
  }
}
