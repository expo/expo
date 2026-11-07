package expo.modules.image

import android.graphics.drawable.Drawable
import android.os.Looper
import androidx.vectordrawable.graphics.drawable.Animatable2Compat
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.gif.GifDrawable
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import java.time.Duration

// Two 8x8 frames. The file has no NETSCAPE2.0 application extension, so it plays once.
private const val GIF_WITHOUT_LOOP_EXTENSION =
  "47494638396108000800810000000000" +
    "00000000000000000021f904040a0000" +
    "002c000000000800080000080f000108" +
    "1c48b0a0c18308132a4c18100021f904" +
    "050a0002002c0000000002000200c100" +
    "0000ffffff0000000000000806000308" +
    "0c1010003b"

@RunWith(RobolectricTestRunner::class)
class ExpoImageViewGifLoopTest {
  @Test
  fun gifWithoutLoopExtensionStopsAfterOnePlayThrough() {
    val view = ExpoImageView(RuntimeEnvironment.getApplication())
    val gif = loadGif(GIF_WITHOUT_LOOP_EXTENSION.hexToByteArray())
    var animationEnds = 0
    gif.registerAnimationCallback(object : Animatable2Compat.AnimationCallback() {
      override fun onAnimationEnd(drawable: Drawable?) {
        animationEnds += 1
      }
    })

    view.setImageDrawable(gif)
    gif.start()

    var displayedFrames = 0
    var lastFrameIndex = gif.frameIndex
    idleMainLooperUntil {
      if (gif.frameIndex != lastFrameIndex) {
        lastFrameIndex = gif.frameIndex
        displayedFrames += 1
      }
      animationEnds > 0 || displayedFrames > 3 * gif.frameCount
    }

    assertSame(gif, view.drawable)
    assertEquals(1, animationEnds)
    assertFalse(gif.isRunning)
  }

  private fun loadGif(bytes: ByteArray): GifDrawable {
    var loaded: Drawable? = null
    Glide.with(RuntimeEnvironment.getApplication())
      .asDrawable()
      .load(bytes)
      .into(object : CustomTarget<Drawable>(8, 8) {
        override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
          loaded = resource
        }

        override fun onLoadCleared(placeholder: Drawable?) = Unit
      })
    idleMainLooperUntil { loaded != null }
    return loaded as GifDrawable
  }

  // Glide decodes and schedules GIF frames on its own threads, so the main looper has to be
  // advanced in small steps while the test waits for those threads.
  private fun idleMainLooperUntil(condition: () -> Boolean) {
    val deadline = System.nanoTime() + Duration.ofSeconds(20).toNanos()
    while (!condition()) {
      check(System.nanoTime() < deadline) { "Timed out waiting for Glide." }
      shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(50))
      Thread.sleep(5)
    }
  }

  private fun String.hexToByteArray() =
    chunked(2).map { it.toInt(16).toByte() }.toByteArray()
}
