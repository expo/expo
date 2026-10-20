package expo.modules.appmetrics.appstartup

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.AppStartupMetric
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils.getCurrentTimeInMillis
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class AppStartupManagerTest {
  @Before
  fun resumeRecording() {
    // The manager is a singleton shared across tests, so undo a stop from an earlier test.
    AppStartupManager::class.java.getDeclaredField("isRecordingStopped").apply {
      isAccessible = true
    }.setBoolean(AppStartupManager, false)
  }

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
  fun `metrics added after stopRecording are never returned`() {
    // Drop anything left by other tests.
    AppStartupManager.takeUnsavedMetrics()

    AppStartupManager.addMetric(AppStartupMetric.ColdLaunchTime, valueInMs = 100)
    AppStartupManager.stopRecording()
    AppStartupManager.addMetric(AppStartupMetric.TimeToInteractive, valueInMs = 200)
    assertEquals(
      listOf(AppStartupMetric.ColdLaunchTime.metricName),
      AppStartupManager.takeUnsavedMetrics().map { it.name }
    )

    AppStartupManager.addMetric(AppStartupMetric.TimeToFirstRender, valueInMs = 300)
    assertEquals(emptyList<Metric>(), AppStartupManager.takeUnsavedMetrics())
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

  private val context: Context = ApplicationProvider.getApplicationContext()

  private fun setField(name: String, value: Any?) {
    AppStartupManager::class.java.getDeclaredField(name).apply {
      isAccessible = true
    }.set(AppStartupManager, value)
  }

  // Simulates a launch that finished `durationInMs` ago and is still in progress.
  private fun startLaunch(durationInMs: Long, hasRendered: Boolean = false) {
    AppStartupManager.takeUnsavedLogs()
    setField("launchTimeInMillis", getCurrentTimeInMillis() - durationInMs)
    setField("hasRecordedFirstRender", hasRendered)
    AppStartupManager.startupState = StartupState.LAUNCHING
  }

  @Test
  fun `markEnteredBackground records the backgrounded event during startup`() {
    startLaunch(durationInMs = 5_000, hasRendered = true)

    AppStartupManager.markEnteredBackground(context)

    assertEquals(StartupState.INTERRUPTED, AppStartupManager.startupState)
    val log = AppStartupManager.takeUnsavedLogs().single()
    assertEquals("expo.app_startup.backgrounded", log.name)
    val attributes = JsonAny.decodeJsonStringToMap(log.attributes!!)!!
    assertEquals(5.0, attributes["expo.app_startup.duration"] as Double, 1.0)
    assertEquals(true, attributes["expo.app_startup.hasRendered"])
    assertEquals(false, attributes["expo.app_startup.hasMarkedInteractive"])
    // Called again from the other `onPause` listener.
    AppStartupManager.markEnteredBackground(context)
    assertEquals(emptyList<Any>(), AppStartupManager.takeUnsavedLogs())
  }

  @Test
  fun `markEnteredBackground skips the event when the startup is no longer in progress`() {
    startLaunch(durationInMs = 5_000)
    AppStartupManager.startupState = StartupState.LAUNCHED

    AppStartupManager.markEnteredBackground(context)

    assertEquals(StartupState.LAUNCHED, AppStartupManager.startupState)
    assertEquals(emptyList<Any>(), AppStartupManager.takeUnsavedLogs())
  }

  @Test
  fun `markEnteredBackground skips the event after the max startup duration`() {
    startLaunch(durationInMs = 10 * 60 * 1000)

    AppStartupManager.markEnteredBackground(context)

    assertEquals(StartupState.INTERRUPTED, AppStartupManager.startupState)
    assertEquals(emptyList<Any>(), AppStartupManager.takeUnsavedLogs())
  }
}
