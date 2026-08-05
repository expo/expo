package expo.modules.appmetrics.frames

import android.app.Activity
import android.view.Window
import io.mockk.every
import io.mockk.mockk
import org.junit.After
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class FrameRateMonitorTest {
  private val seed = FrameMetricsRecorder()

  @After
  fun tearDown() {
    FrameRateMonitor.removeRecorder(seed)
  }

  @Test
  fun `concurrent recorder churn during frame dispatch does not throw`() {
    val window = mockk<Window>(relaxed = true)
    val activity = mockk<Activity>(relaxed = true)
    every { activity.window } returns window

    // Seed with a long-lived recorder so the monitor attaches and stays attached
    // throughout the test (otherwise the churn thread might briefly empty the list).
    seed.start(activity)

    val running = AtomicBoolean(true)
    val errors = ConcurrentLinkedQueue<Throwable>()

    val frameThread = Thread({
      while (running.get()) {
        try {
          FrameRateMonitor.dispatchFrame(16L)
        } catch (t: Throwable) {
          errors.add(t)
        }
      }
    }, "frame-dispatch-thread")

    val recorderThread = Thread({
      while (running.get()) {
        try {
          val r = FrameMetricsRecorder()
          r.start(activity)
          r.stop()
        } catch (t: Throwable) {
          errors.add(t)
        }
      }
    }, "recorder-churn-thread")

    frameThread.start()
    recorderThread.start()
    Thread.sleep(500)
    running.set(false)
    frameThread.join()
    recorderThread.join()

    assertTrue(
      "Expected no exceptions, got ${errors.size}; first: ${errors.firstOrNull()?.let { "${it.javaClass.simpleName}: ${it.message}" }}",
      errors.isEmpty()
    )
  }
}
