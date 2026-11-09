package expo.modules.image

import android.graphics.Color
import android.graphics.drawable.Animatable
import android.graphics.drawable.ColorDrawable
import android.os.Looper
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import java.time.Duration

@RunWith(RobolectricTestRunner::class)
class SharedAnimationTickTest {
  @After
  fun flushPendingTick() {
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(SharedAnimationTick.INTERVAL_MS))
  }

  @Test
  fun runningAnimationsRedrawTogetherOnTheNextTick() {
    val first = animatedView()
    val second = animatedView()

    first.drawable.invalidateSelf()
    second.drawable.invalidateSelf()

    assertFalse(shadowOf(first).wasInvalidated())
    assertFalse(shadowOf(second).wasInvalidated())

    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(SharedAnimationTick.INTERVAL_MS))

    assertTrue(shadowOf(first).wasInvalidated())
    assertTrue(shadowOf(second).wasInvalidated())
  }

  private fun animatedView(): ExpoImageView {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    view.sharedAnimationTick = true
    view.setImageDrawable(FakeAnimatedDrawable())
    shadowOf(view).clearWasInvalidated()
    return view
  }

  private class FakeAnimatedDrawable :
    ColorDrawable(Color.RED),
    Animatable {
    override fun start() = Unit

    override fun stop() = Unit

    override fun isRunning() = true
  }
}
