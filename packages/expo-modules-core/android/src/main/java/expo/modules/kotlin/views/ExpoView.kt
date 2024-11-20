package expo.modules.kotlin.views

import android.content.Context
import android.graphics.Canvas
import android.widget.LinearLayout
import androidx.annotation.UiThread
import com.facebook.react.uimanager.BackgroundStyleApplicator
import expo.modules.kotlin.AppContext

/**
 * A base class that should be used by every exported views.
 */
abstract class ExpoView(
  context: Context,
  val appContext: AppContext
) : LinearLayout(context) {

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
   * If [shouldUseAndroidLayout] is set to `true`, this method will be called automatically after [requestLayout].
   */
  @UiThread
  fun measureAndLayout() {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
    )
    layout(left, top, right, bottom)
  }

  override fun requestLayout() {
    super.requestLayout()
    if (shouldUseAndroidLayout) {
      // We need to force measure and layout, because React Native doesn't do it for us.
      post(Runnable { measureAndLayout() })
    }
  }

  override fun dispatchDraw(canvas: Canvas) {
    // When the border radius is set, we need to clip the content to the padding box.
    // This is because the border radius is applied to the background drawable, not the view itself.
    // It is the same behavior as in React Native.
    BackgroundStyleApplicator.clipToPaddingBox(this, canvas)
    super.dispatchDraw(canvas)
  }
}
