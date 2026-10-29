package expo.modules.camera

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Looper
import android.view.View
import android.widget.FrameLayout
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import java.time.Duration

@RunWith(RobolectricTestRunner::class)
class FlashShutterTest {
  private val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
  private val container = FrameLayout(activity)
  private val cameraView = View(activity)

  init {
    container.addView(cameraView)
    activity.setContentView(container)
  }

  private fun advanceBy(millis: Long) {
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(millis))
  }

  @Test
  fun `flashes the window white and then clears it`() {
    val decorView = activity.window.decorView

    flashShutter(cameraView)
    advanceBy(ANIMATION_SLOW_MILLIS)
    assertEquals(Color.WHITE, (decorView.foreground as ColorDrawable).color)

    advanceBy(ANIMATION_FAST_MILLIS)
    assertNull(decorView.foreground)
  }

  @Test
  fun `clears the window when the camera view detaches during the flash`() {
    val decorView = activity.window.decorView

    flashShutter(cameraView)
    advanceBy(ANIMATION_SLOW_MILLIS)
    container.removeView(cameraView)
    advanceBy(ANIMATION_FAST_MILLIS)

    assertNull(decorView.foreground)
  }
}
