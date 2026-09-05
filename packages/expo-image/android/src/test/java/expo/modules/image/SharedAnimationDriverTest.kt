package expo.modules.image

import com.github.penfeizhou.animation.FrameAnimationDrawable
import com.github.penfeizhou.animation.decode.FrameSeqDecoder
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.shadows.ShadowSystemClock
import java.time.Duration

/**
 * A drawable whose decoder reports the frame we tell it to and records pauses and resumes,
 * so the driver can be exercised without decoding anything.
 */
private class FakeAnimatable(frameCount: Int) {
  val decoder: FrameSeqDecoder<*, *> = mockk(relaxed = true)
  val drawable: FrameAnimationDrawable<*> = mockk(relaxed = true)

  private val listeners = mutableListOf<FrameSeqDecoder.RenderListener>()

  var frame = 0
  var isPaused = false
    private set
  var isRunning = true

  init {
    every { drawable.frameSeqDecoder } returns decoder
    every { drawable.isRunning } answers { isRunning }
    every { drawable.isPaused } answers { isPaused }
    every { decoder.frameCount } returns frameCount
    every { decoder.frameIndex } answers { frame }
    every { decoder.isPaused } answers { isPaused }
    every { decoder.addRenderListener(any()) } answers { listeners.add(firstArg()) }
    every { decoder.removeRenderListener(any()) } answers { listeners.remove(firstArg<FrameSeqDecoder.RenderListener>()) }
    every { decoder.pause() } answers { isPaused = true }
    every { decoder.resume() } answers { isPaused = false }
  }

  val listenerCount: Int
    get() = listeners.size

  /**
   * Shows [frame] and notifies the driver the way the decoder's worker thread does.
   */
  fun render(frame: Int = this.frame) {
    this.frame = frame
    listeners.toList().forEach { it.onRender(null) }
  }
}

@RunWith(RobolectricTestRunner::class)
class SharedAnimationDriverTest {
  private val key = "https://example.com/${System.nanoTime()}.gif"
  private val animatables = mutableListOf<FakeAnimatable>()

  @After
  fun tearDown() {
    animatables.forEach { SharedAnimationDriver.onAnimatableReleased(it.drawable) }
  }

  /**
   * Registers a drawable and moves the clock on, so members registered later are followers.
   */
  private fun display(frameCount: Int = 10, key: String = this.key): FakeAnimatable {
    val animatable = FakeAnimatable(frameCount).also(animatables::add)
    SharedAnimationDriver.onAnimatableDisplayed(animatable.drawable, key)
    ShadowSystemClock.advanceBy(Duration.ofMillis(10))
    return animatable
  }

  @Test
  fun `the leader plays untouched`() {
    val leader = display()
    display()

    leader.render(4)

    verify(exactly = 0) { leader.decoder.pause() }
    verify(exactly = 0) { leader.decoder.resume() }
  }

  @Test
  fun `a follower on the same frame is left alone`() {
    val leader = display()
    val follower = display()
    leader.frame = 4

    follower.render(4)

    verify(exactly = 0) { follower.decoder.pause() }
    verify(exactly = 0) { follower.decoder.resume() }
  }

  @Test
  fun `a follower behind the leader renders the next frame right away`() {
    val leader = display()
    val follower = display()
    leader.frame = 5

    follower.render(3)

    verify(exactly = 1) { follower.decoder.pause() }
    verify(exactly = 1) { follower.decoder.resume() }
    assertFalse(follower.isPaused)
  }

  @Test
  fun `a follower ahead of the leader waits for it`() {
    val leader = display()
    val follower = display()
    leader.frame = 3

    follower.render(5)

    verify(exactly = 1) { follower.decoder.pause() }
    verify(exactly = 0) { follower.decoder.resume() }
    assertTrue(follower.isPaused)
  }

  @Test
  fun `a waiting follower resumes once the leader reaches its frame`() {
    val leader = display()
    val follower = display()
    leader.frame = 3
    follower.render(5)
    assertTrue(follower.isPaused)

    // Resuming renders frame 6, so the leader showing frame 5 is still too early.
    leader.render(5)
    assertTrue(follower.isPaused)

    leader.render(6)
    assertFalse(follower.isPaused)
  }

  @Test
  fun `a follower far behind takes the shorter way round the loop`() {
    val leader = display(frameCount = 10)
    val follower = display(frameCount = 10)
    leader.frame = 1

    // 9 -> 1 is two frames ahead, not eight behind.
    follower.render(9)

    verify(exactly = 1) { follower.decoder.pause() }
    verify(exactly = 1) { follower.decoder.resume() }
  }

  @Test
  fun `drawables of different images are independent`() {
    val leader = display(key = "$key-a")
    val other = display(key = "$key-b")
    leader.frame = 7

    other.render(1)

    verify(exactly = 0) { other.decoder.pause() }
    verify(exactly = 0) { other.decoder.resume() }
  }

  @Test
  fun `images with a different frame count are not aligned`() {
    val leader = display(frameCount = 10)
    val follower = display(frameCount = 12)
    leader.frame = 7

    follower.render(1)

    verify(exactly = 0) { follower.decoder.pause() }
  }

  @Test
  fun `single frame images are not aligned`() {
    val leader = display(frameCount = 1)
    val follower = display(frameCount = 1)
    leader.frame = 0

    follower.render(0)

    verify(exactly = 0) { follower.decoder.pause() }
  }

  @Test
  fun `a paused member cannot lead`() {
    val first = display()
    val second = display()
    first.isRunning = false
    second.frame = 6

    // With the first member stopped, the second leads and nothing pushes it around.
    second.render(6)
    verify(exactly = 0) { second.decoder.pause() }

    // Starting again puts the first member back on the clock behind the second one.
    first.isRunning = true
    SharedAnimationDriver.onAnimatableDisplayed(first.drawable, key)
    first.render(2)
    verify(exactly = 1) { first.decoder.pause() }
    verify(exactly = 1) { first.decoder.resume() }
  }

  @Test
  fun `a resumed drawable follows until it has caught up`() {
    val first = display()
    val second = display()

    SharedAnimationDriver.onAnimatableResumed(first.drawable)
    second.frame = 6

    first.render(2)

    verify(exactly = 1) { first.decoder.pause() }
    verify(exactly = 1) { first.decoder.resume() }
    verify(exactly = 0) { second.decoder.pause() }
  }

  @Test
  fun `resuming a waiting drawable clears its wait`() {
    val leader = display()
    val follower = display()
    leader.frame = 3
    follower.render(5)
    assertTrue(follower.isPaused)

    SharedAnimationDriver.onAnimatableResumed(follower.drawable)

    // The leader reaching the frame no longer resumes it, the caller already did.
    leader.render(6)
    verify(exactly = 0) { follower.decoder.resume() }
  }

  @Test
  fun `displaying the same drawable again does not register it twice`() {
    val animatable = display()

    SharedAnimationDriver.onAnimatableDisplayed(animatable.drawable, key)

    assertEquals(1, animatable.listenerCount)
  }

  @Test
  fun `displaying a drawable under a new key moves it between groups`() {
    val leader = display(key = "$key-a")
    val moved = display(key = "$key-a")
    leader.frame = 7

    SharedAnimationDriver.onAnimatableDisplayed(moved.drawable, "$key-b")
    moved.render(1)

    assertEquals(1, moved.listenerCount)
    verify(exactly = 0) { moved.decoder.pause() }
  }

  @Test
  fun `releasing a drawable stops listening to it`() {
    val animatable = display()

    SharedAnimationDriver.onAnimatableReleased(animatable.drawable)

    assertEquals(0, animatable.listenerCount)
  }

  @Test
  fun `releasing a waiting drawable resumes it`() {
    val leader = display()
    val follower = display()
    leader.frame = 3
    follower.render(5)
    assertTrue(follower.isPaused)

    SharedAnimationDriver.onAnimatableReleased(follower.drawable)

    assertFalse(follower.isPaused)
  }

  @Test
  fun `releasing the last playing member resumes the waiting ones`() {
    val leader = display()
    val follower = display()
    leader.frame = 3
    follower.render(5)
    assertTrue(follower.isPaused)

    SharedAnimationDriver.onAnimatableReleased(leader.drawable)

    assertFalse(follower.isPaused)
  }

  @Test
  fun `releasing the leader leaves the waiting members to the next leader`() {
    val leader = display()
    val next = display()
    val follower = display()
    leader.frame = 3
    next.frame = 3
    follower.render(5)
    assertTrue(follower.isPaused)

    SharedAnimationDriver.onAnimatableReleased(leader.drawable)
    assertTrue(follower.isPaused)

    next.render(6)
    assertFalse(follower.isPaused)
  }

  @Test
  fun `releasing an unknown drawable is a no-op`() {
    val stranger = FakeAnimatable(10)

    SharedAnimationDriver.onAnimatableReleased(stranger.drawable)
    SharedAnimationDriver.onAnimatableResumed(stranger.drawable)

    verify(exactly = 0) { stranger.decoder.resume() }
  }
}
