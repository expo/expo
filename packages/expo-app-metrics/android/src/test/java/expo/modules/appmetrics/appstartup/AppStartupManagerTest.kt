package expo.modules.appmetrics.appstartup

import expo.modules.appmetrics.AppStartupMetric
import expo.modules.appmetrics.storage.Metric
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AppStartupManagerTest {
  @Test
  fun `takeUnsavedMetrics returns each metric once`() {
    // Drop anything left by other tests.
    AppStartupManager.takeUnsavedMetrics()

    AppStartupManager.addMetric(AppStartupMetric.ColdLaunchTime, valueInMs = 100)
    assertEquals(
      listOf(AppStartupMetric.ColdLaunchTime.metricName),
      AppStartupManager.takeUnsavedMetrics().map { it.name }
    )
    assertEquals(emptyList<Metric>(), AppStartupManager.takeUnsavedMetrics())

    // For example TTI recorded after an update download already saved the launch time.
    AppStartupManager.addMetric(AppStartupMetric.TimeToInteractive, valueInMs = 200)
    assertEquals(
      listOf(AppStartupMetric.TimeToInteractive.metricName),
      AppStartupManager.takeUnsavedMetrics().map { it.name }
    )
  }

  @Test
  fun `concurrent add and iterate on _metrics does not throw`() {
    // Drive _metrics directly: the public mutators (markInteractive / markFirstRender)
    // are one-shot guards, so they can't reliably reproduce sustained churn against
    // a single iterator. Reflection lets us prove the underlying field is safe.
    val field = AppStartupManager::class.java.getDeclaredField("_metrics").apply {
      isAccessible = true
    }

    @Suppress("UNCHECKED_CAST")
    val backing = field.get(AppStartupManager) as MutableList<Metric>
    backing.clear()

    val sample = Metric(
      sessionId = "test",
      timestamp = "2026-01-01T00:00:00Z",
      category = "test",
      name = "test",
      value = 0.0
    )

    val running = AtomicBoolean(true)
    val errors = ConcurrentLinkedQueue<Throwable>()

    val readerThread = Thread({
      while (running.get()) {
        try {
          // Iterate through the public getter, the same way the module reads it.
          for (m in AppStartupManager.metrics) {
            m.name.length
          }
        } catch (t: Throwable) {
          errors.add(t)
        }
      }
    }, "metrics-reader-thread")

    val writerThread = Thread({
      while (running.get()) {
        try {
          backing.add(sample)
        } catch (t: Throwable) {
          errors.add(t)
        }
      }
    }, "metrics-writer-thread")

    readerThread.start()
    writerThread.start()
    Thread.sleep(500)
    running.set(false)
    readerThread.join()
    writerThread.join()

    backing.clear()

    assertTrue(
      "Expected no exceptions, got ${errors.size}; first: ${errors.firstOrNull()?.let { "${it.javaClass.simpleName}: ${it.message}" }}",
      errors.isEmpty()
    )
  }
}
