package expo.modules.image

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.graphics.Color
import android.graphics.Picture
import android.graphics.drawable.ColorDrawable
import android.os.Looper
import android.view.View
import androidx.core.view.isVisible
import expo.modules.image.svg.SVGPictureDrawable
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
import org.robolectric.annotation.Config
import java.lang.ref.WeakReference
import java.time.Duration

@RunWith(RobolectricTestRunner::class)
class ExpoImageViewTest {
  @Test
  @Config(sdk = [26, 27])
  fun svgUsesSoftwareLayerOnAndroidEightAndResetsWhenReused() {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    val picture = Picture().apply {
      beginRecording(24, 24).drawColor(Color.RED)
      endRecording()
    }

    view.setImageDrawable(SVGPictureDrawable(picture, 24, 24))
    assertEquals(View.LAYER_TYPE_SOFTWARE, view.layerType)

    view.setImageDrawable(ColorDrawable(Color.BLUE))
    assertEquals(View.LAYER_TYPE_NONE, view.layerType)

    view.setImageDrawable(SVGPictureDrawable(picture, 24, 24))
    view.recycleView()
    assertEquals(View.LAYER_TYPE_NONE, view.layerType)
  }

  @Test
  @Config(sdk = [28])
  fun svgKeepsDefaultLayerOnAndroidNine() {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    val picture = Picture().apply {
      beginRecording(24, 24).drawColor(Color.RED)
      endRecording()
    }

    view.setImageDrawable(SVGPictureDrawable(picture, 24, 24))
    assertEquals(View.LAYER_TYPE_NONE, view.layerType)
  }

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
