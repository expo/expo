package expo.modules.image

import android.app.Activity
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import expo.modules.image.records.ImageTransition
import expo.modules.kotlin.AppContext
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import java.lang.ref.WeakReference
import java.time.Duration

@RunWith(RobolectricTestRunner::class)
class ExpoImageViewWrapperTest {
  @Test
  fun createsTheSecondImageViewOnlyForTheNextImage() {
    val wrapper = createWrapper()
    assertEquals(1, wrapper.imageViews().size)

    wrapper.display(ColorDrawable(Color.RED))
    assertEquals(1, wrapper.imageViews().size)

    val next = ColorDrawable(Color.BLUE)
    wrapper.display(next)
    val imageViews = wrapper.imageViews()
    assertEquals(2, imageViews.size)
    assertSame(next, imageViews.single { it.isVisible }.drawable)
  }

  @Test
  fun fadesInTheFirstImageWithoutASecondImageView() {
    val wrapper = createWrapper()
    wrapper.attach()
    wrapper.transition = ImageTransition(duration = 100)
    val drawable = ColorDrawable(Color.RED)

    wrapper.display(drawable)
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(200))

    val imageView = wrapper.imageViews().single()
    assertSame(drawable, imageView.drawable)
    assertEquals(1f, imageView.alpha)
  }

  private fun createWrapper(): ExpoImageViewWrapper {
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    val appContext = mockk<AppContext>(relaxed = true)
    every { appContext.throwingActivity } returns activity
    return ExpoImageViewWrapper(activity, appContext)
  }

  // Transitions start on the next animation frame, which only comes for an attached view.
  private fun ExpoImageViewWrapper.attach() {
    (context as Activity).setContentView(this)
    shadowOf(Looper.getMainLooper()).idle()
  }

  private fun ExpoImageViewWrapper.display(drawable: Drawable) {
    onResourceReady(ImageViewWrapperTarget(WeakReference(this)), drawable)
    shadowOf(Looper.getMainLooper()).idle()
  }

  private fun View.imageViews(): List<ExpoImageView> = when (this) {
    is ExpoImageView -> listOf(this)
    is ViewGroup -> (0 until childCount).flatMap { getChildAt(it).imageViews() }
    else -> emptyList()
  }
}
