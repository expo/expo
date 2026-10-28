package expo.modules.kotlin.views

import android.app.Activity
import android.content.Context
import android.os.Looper
import android.widget.FrameLayout
import com.google.common.truth.Truth
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import java.time.Duration

private class AndroidLayoutView(context: Context) : ExpoView(context, mockk(relaxed = true)) {
  override val shouldUseAndroidLayout = true
  var measureCount = 0

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    measureCount += 1
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }
}

// React Native's view groups don't propagate requestLayout, so only ExpoView lays itself out.
private class ReactLikeParent(context: Context) : FrameLayout(context) {
  override fun requestLayout() = Unit
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class ExpoViewLayoutTest {
  private fun attachedView(): Pair<ReactLikeParent, AndroidLayoutView> {
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    val parent = ReactLikeParent(activity)
    val view = AndroidLayoutView(activity)
    parent.addView(view)
    activity.setContentView(parent)
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(1))
    view.measureCount = 0
    return parent to view
  }

  @Test
  fun `lays out once before the next draw`() {
    val (_, view) = attachedView()

    view.requestLayout()
    view.requestLayout()
    view.viewTreeObserver.dispatchOnPreDraw()

    Truth.assertThat(view.measureCount).isEqualTo(1)

    shadowOf(Looper.getMainLooper()).idle()

    Truth.assertThat(view.measureCount).isEqualTo(1)
  }

  @Test
  fun `lays out from the post when no frame follows`() {
    val (_, view) = attachedView()

    view.requestLayout()
    shadowOf(Looper.getMainLooper()).idle()

    Truth.assertThat(view.measureCount).isEqualTo(1)

    view.requestLayout()
    shadowOf(Looper.getMainLooper()).idle()

    Truth.assertThat(view.measureCount).isEqualTo(2)
  }

  @Test
  fun `schedules again after the view detaches before drawing`() {
    val (parent, view) = attachedView()

    view.requestLayout()
    parent.removeView(view)
    shadowOf(Looper.getMainLooper()).idle()
    parent.addView(view)
    view.measureCount = 0

    view.requestLayout()
    view.viewTreeObserver.dispatchOnPreDraw()

    Truth.assertThat(view.measureCount).isEqualTo(1)
  }
}
