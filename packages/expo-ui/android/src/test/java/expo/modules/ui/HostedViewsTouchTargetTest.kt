package expo.modules.ui

import android.content.Context
import android.view.View
import android.widget.FrameLayout
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.uimanager.TouchTargetHelper
import com.google.common.truth.Truth.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class HostedViewsTouchTargetTest {
  private val context: Context = ApplicationProvider.getApplicationContext()

  @Test
  fun `touch reaches the hosted view after Compose adds a helper view to the Compose owner view`() {
    // Mirrors Host > ComposeView > Compose owner view > AndroidViewsHandler > hosted React Native view.
    val host = FrameLayout(context).apply { id = HOST_TAG }
    val composeOwnerView = FrameLayout(context)
    val hostedViewsContainer = FrameLayout(context)
    val hostedView = View(context).apply { id = HOSTED_TAG }
    host.addView(composeOwnerView)
    composeOwnerView.addView(hostedViewsContainer)
    hostedViewsContainer.addView(hostedView)

    keepLastForTouchTargeting(composeOwnerView, hostedViewsContainer)

    // A ripple container, added after the first press: zero-size, not clipping, with a full-size
    // child that has no React tag.
    val helper = FrameLayout(context).apply { clipChildren = false }
    val helperChild = View(context)
    composeOwnerView.addView(helper)
    helper.addView(helperChild)

    listOf(host, composeOwnerView, hostedViewsContainer, hostedView, helperChild).forEach {
      it.layout(0, 0, 100, 100)
    }
    helper.layout(0, 0, 0, 0)

    assertThat(TouchTargetHelper.findTargetTagForTouch(50f, 50f, host)).isEqualTo(HOSTED_TAG)
  }

  private companion object {
    const val HOST_TAG = 36
    const val HOSTED_TAG = 60
  }
}
