package expo.modules.kotlin.views

import android.content.Context
import android.graphics.Canvas
import android.widget.LinearLayout
import androidx.annotation.UiThread
import androidx.core.view.OneShotPreDrawListener
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.StateWrapper
import expo.modules.kotlin.AppContext

/**
 * A base class that should be used by every exported views.
 */
abstract class ExpoView(
  context: Context,
  val appContext: AppContext
) : LinearLayout(context) {

  var stateWrapper: StateWrapper? = null

  val shadowNodeProxy: ShadowNodeProxy = ShadowNodeProxy(this)

  /**
   * If set to `true`, the view utilizes the Android layout system rather than React Native's.
   * This simulates rendering the native view by Android outside of React Native's view hierarchy,
   * with parent dimensions enforced by Yoga.
   *
   * Setting it to `true` does not guarantee that the layout calculated by Android will be accurate.
   * In some situations, the content may render outside the bounds defined by Yoga.
   *
   * However, without this setting, React Native will not re-render your view when [requestLayout] is triggered.
   * Read more: [React Native issue #17968](https://github.com/facebook/react-native/issues/17968)
   */
  open val shouldUseAndroidLayout: Boolean = false

  /**
   * Manually trigger measure and layout.
   * If [shouldUseAndroidLayout] is set to `true`, this method will be called automatically after
   * [requestLayout] or [forceLayout].
   */
  @UiThread
  fun measureAndLayout() {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  private var scheduledLayout: OneShotPreDrawListener? = null

  override fun requestLayout() {
    super.requestLayout()
    if (shouldUseAndroidLayout && scheduledLayout == null) {
      // We need to force measure and layout, because React Native doesn't do it for us.
      // Lay out before the next frame draws, so children changed during a mount don't show
      // unlaid-out for one frame. The post covers a request that no frame follows.
      scheduledLayout = OneShotPreDrawListener.add(this) { runScheduledLayout() }
      post { runScheduledLayout() }
    }
  }

  private fun runScheduledLayout() {
    val listener = scheduledLayout ?: return
    scheduledLayout = null
    listener.removeListener()
    measureAndLayout()
  }

  override fun forceLayout() {
    super.forceLayout()
    if (shouldUseAndroidLayout && isAttachedToWindow && isLaidOut) {
      // ViewRootImpl can force-layout the hierarchy without React Native laying out its
      // managed children. Preserve the Android-layout contract at that boundary.
      post {
        if (isAttachedToWindow && isLayoutRequested) {
          measureAndLayout()
        }
      }
    }
  }

  open fun clipToPaddingBox(canvas: Canvas) {
    // When the border radius is set, we need to clip the content to the padding box.
    // This is because the border radius is applied to the background drawable, not the view itself.
    // It is the same behavior as in React Native.
    if (!clipToPadding) {
      return
    }
    BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
  }

  override fun dispatchDraw(canvas: Canvas) {
    clipToPaddingBox(canvas)
    super.dispatchDraw(canvas)
  }
}
