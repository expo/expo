package expo.modules.ui

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class RNHostViewReuseTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  /**
   * Compose recreates the holder around a hosted view as content scrolls, and the same wrapper is
   * handed to the new one. React Native resolves a touch by walking child views in index order,
   * without consulting the parent's size or draw order, so a wrapper that kept its old bounds
   * answers for a screen area it no longer occupies — which is how a `PagerView` page swallowed
   * presses meant for the page on screen (#46386).
   */
  @Test
  fun `a wrapper keeps no bounds from the holder it left`() {
    val oldHolder = FrameLayout(context)
    val wrapper = View(context)
    oldHolder.addView(wrapper)
    wrapper.layout(48, 313, 1232, 2496)

    assertThat(wrapper.width).isEqualTo(1184)

    detachForReuse(wrapper)

    assertThat(wrapper.parent).isNull()
    assertThat(wrapper.width).isEqualTo(0)
    assertThat(wrapper.height).isEqualTo(0)
  }

  @Test
  fun `detaching a wrapper that has no holder yet is harmless`() {
    val wrapper = View(context)

    detachForReuse(wrapper)

    assertThat(wrapper.parent).isNull()
    assertThat(wrapper.width).isEqualTo(0)
  }
}
