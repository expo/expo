package expo.modules.image

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Looper
import androidx.core.view.isVisible
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import java.lang.ref.WeakReference
import java.time.Duration

@RunWith(RobolectricTestRunner::class)
class ExpoImageViewTest {
  @Test
  fun recycledViewDoesNotRunStaleAnimationCleanupAfterBeingRebound() {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    var cleanupCalls = 0

    view.animate()
      .alpha(0f)
      .setDuration(100)
      .setListener(object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: Animator) {
          cleanupCalls += 1
          view.recycleView()
        }
      })

    view.recycleView()
    val cleanupCallsAfterRecycle = cleanupCalls

    val replacement = ColorDrawable(Color.RED)
    view.setImageDrawable(replacement)
    view.isVisible = true
    view.alpha = 0f
    view.animate()
      .alpha(1f)
      .setDuration(100)
      .start()

    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(200))

    assertEquals(cleanupCallsAfterRecycle, cleanupCalls)
    assertSame(replacement, view.drawable)
    assertTrue(view.isVisible)
  }

  @Test
  fun staleAnimationCleanupDoesNotRecycleANewerBindingOfTheSameTarget() {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    val target = ImageViewWrapperTarget(WeakReference<ExpoImageViewWrapper>(null))
    view.currentTarget = target
    val previousBindingId = view.targetBindingId
    var cleanupCalls = 0

    view.animate()
      .alpha(0f)
      .setDuration(100)
      .setListener(object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: Animator) {
          cleanupCalls += 1
          view.recycleViewIfBindingMatches(target, previousBindingId)
        }
      })

    val replacement = ColorDrawable(Color.BLUE)
    view.currentTarget = target
    view.setImageDrawable(replacement)
    view.isVisible = true
    view.alpha = 0f
    view.animate()
      .alpha(1f)
      .setDuration(100)
      .start()

    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(200))

    assertEquals(1, cleanupCalls)
    assertSame(replacement, view.drawable)
    assertTrue(view.isVisible)
  }

  @Test
  fun matchingBindingIsRecycledOnlyOnce() {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    val target = ImageViewWrapperTarget(WeakReference<ExpoImageViewWrapper>(null))
    target.isUsed = true
    view.currentTarget = target
    val bindingId = view.targetBindingId
    view.setImageDrawable(ColorDrawable(Color.GREEN))
    view.isVisible = true

    assertSame(target, view.recycleViewIfBindingMatches(target, bindingId))
    assertNull(view.recycleViewIfBindingMatches(target, bindingId))
    assertNull(view.drawable)
    assertFalse(view.isVisible)
    assertFalse(target.isUsed)
  }
}
