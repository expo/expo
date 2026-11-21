package expo.modules.lineargradient

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.uimanager.PointerEvents
import com.facebook.react.uimanager.ReactPointerEventsView
import com.facebook.react.uimanager.TouchTargetHelper
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class LinearGradientViewTest {
  private val context: Context = RuntimeEnvironment.getApplication()

  // Stands in for the wrapper `View` that `NativeLinearGradient.android.tsx` renders around the
  // native gradient view and that receives the `pointerEvents` prop.
  private class WrapperView(
    context: Context,
    override val pointerEvents: PointerEvents
  ) : FrameLayout(context), ReactPointerEventsView

  @Test
  fun `touches pass through a box-none gradient to the view behind it`() {
    val root = FrameLayout(context).apply { id = 1 }
    val viewBehind = View(context).apply { id = 2 }
    val wrapper = WrapperView(context, PointerEvents.BOX_NONE).apply { id = 3 }
    val gradient = LinearGradientView(context).apply { id = 4 }

    wrapper.addView(gradient)
    root.addView(viewBehind)
    root.addView(wrapper)
    layout(root, viewBehind, wrapper, gradient)

    assertEquals(viewBehind.id, findTouchTarget(root))
  }

  @Test
  fun `the wrapper still receives touches when pointerEvents is auto`() {
    val root = FrameLayout(context).apply { id = 1 }
    val viewBehind = View(context).apply { id = 2 }
    val wrapper = WrapperView(context, PointerEvents.AUTO).apply { id = 3 }
    val gradient = LinearGradientView(context).apply { id = 4 }

    wrapper.addView(gradient)
    root.addView(viewBehind)
    root.addView(wrapper)
    layout(root, viewBehind, wrapper, gradient)

    assertEquals(wrapper.id, findTouchTarget(root))
  }

  private fun layout(vararg views: View) {
    views.forEach { it.layout(0, 0, 100, 100) }
  }

  private fun findTouchTarget(root: FrameLayout): Int =
    TouchTargetHelper.findTargetTagForTouch(50f, 50f, root)
}
