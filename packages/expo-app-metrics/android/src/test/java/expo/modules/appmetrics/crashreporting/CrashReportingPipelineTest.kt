package expo.modules.appmetrics.crashreporting

import android.app.ApplicationExitInfo
import expo.modules.appmetrics.sink.CrashAttributionHint
import expo.modules.appmetrics.sink.FakeMetricsSink
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.appmetrics.utils.JsonAny
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * End-to-end seam test: real handler → real pending file → real processor →
 * the metrics sink. Each link is unit-tested in isolation; this pins the
 * contracts *between* them (field names, timestamp formats, the embedded-id
 * attribution hint) so they can't drift apart while every unit test stays green.
 * The sink side is covered by `CrashAttributionTest`.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CrashReportingPipelineTest {
  @get:Rule
  val tmp = TemporaryFolder()

  private val sink = FakeMetricsSink()
  private val registry = MetricsSinkRegistry().apply { register(sink) }

  @After
  fun tearDown() {
    JvmCrashHandler.resetForTesting()
  }

  @Test
  fun `a JVM crash reaches the sink with its session on the next launch`() =
    runTest {
      val crashedSessionId = "8f3aa536-7497-4c5e-a097-4b9e2c9b2f1e"
      val crashedAtMillis = 1_700_000_000_000

      // Launch 1: handler is installed, the app crashes.
      JvmCrashHandler.currentSessionId = crashedSessionId
      val writer = CrashFileWriter(tmp.root)
      val reader = CrashFileReader(tmp.root)
      val handler = JvmCrashHandler(
        fileWriter = writer,
        previousHandler = null,
        pidProvider = { 123 },
        clock = { crashedAtMillis }
      )
      handler.uncaughtException(Thread.currentThread(), IllegalStateException("boom"))

      // Launch 2: the processor matches the file against the OS death record.
      val currentSessionId = "2c9c3a82-9a3e-4f12-9302-0c2a44bb1d11"
      CrashReportProcessor(
        crashFileReader = reader,
        exitInfoProvider = ExitInfoProvider {
          listOf(
            // Matches the JVM crash file by pid + time window; attribution
            // flows through the file's embedded session id, not this record.
            ExitRecord(
              reason = ApplicationExitInfo.REASON_CRASH,
              status = 0,
              description = null,
              timestampMillis = crashedAtMillis + 100,
              pid = 123
            )
          )
        },
        lastProcessedExitStore = object : LastProcessedExitStore {
          private var cursor = 0L

          override fun get(): Long = cursor

          override fun set(timestampMillis: Long) {
            cursor = timestampMillis
          }
        },
        appVersion = "3.1.4"
      ) { sessionId, origin, report, logDetails ->
        registry.recordCrash(
          report,
          report.toLogEvent(logDetails),
          CrashAttributionHint(sessionId, origin, currentSessionId)
        )
      }.process()

      val crash = sink.calls.single() as FakeMetricsSink.Crash
      // Attribution flows through the file's embedded session id.
      assertEquals(CrashAttributionHint(crashedSessionId, CrashOrigin.JVM_FILE, currentSessionId), crash.hint)
      assertEquals("native.exception", crash.log.name)
      // The payload as the sink stores it.
      val crashReport = requireNotNull(JsonAny.decodeJsonStringToMap(crash.report.encodeToJsonString()))
      assertEquals("3.1.4", crashReport["appVersion"])
      assertEquals("java.lang.IllegalStateException: boom", crashReport["exceptionReason"])
      @Suppress("UNCHECKED_CAST")
      val tree = crashReport["callStackTree"] as? Map<String, Any?>
      assertNotNull(tree)
      @Suppress("UNCHECKED_CAST")
      val stacks = tree?.get("callStacks") as? List<Map<String, Any?>>

      @Suppress("UNCHECKED_CAST")
      val frames = stacks?.first()?.get("callStackRootFrames") as? List<Map<String, Any?>>
      assertTrue((frames?.first()?.get("symbol") as? String)!!.contains("CrashReportingPipelineTest"))

      // The crash timestamp uses the package's lexicographically-comparable format.
      assertEquals("2023-11-14T22:13:20.000Z", crashReport["timestampBegin"])
      // The pending file is consumed.
      assertEquals(emptyList<PendingJvmCrash>(), reader.listPendingCrashes())
    }
}
