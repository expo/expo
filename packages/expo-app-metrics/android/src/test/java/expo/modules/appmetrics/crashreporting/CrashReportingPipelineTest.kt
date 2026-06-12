package expo.modules.appmetrics.crashreporting

import android.app.ApplicationExitInfo
import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.storage.JsDebugSession
import expo.modules.appmetrics.storage.MetricsDatabase
import expo.modules.appmetrics.storage.SessionManager
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * End-to-end seam test: real handler → real pending file → real processor →
 * real `attributeAndStoreCrashReport` → real Room storage → real JS mapper. Each
 * link is unit-tested in isolation; this pins the contracts *between* them (field
 * names, timestamp formats, the embedded-id attribution flow) so they can't
 * drift apart while every unit test stays green.
 */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class CrashReportingPipelineTest {
  @get:Rule
  val tmp = TemporaryFolder()

  private lateinit var database: MetricsDatabase
  private lateinit var sessionManager: SessionManager

  @Before
  fun setUp() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    sessionManager = SessionManager(context, database)
  }

  @After
  fun tearDown() {
    database.close()
    JvmCrashHandler.resetForTesting()
  }

  @Test
  fun `a JVM crash surfaces in getInactiveSessions on the next launch`() =
    runTest {
      val crashedSessionId = "8f3aa536-7497-4c5e-a097-4b9e2c9b2f1e"
      val crashedAtMillis = 1_700_000_000_000

      // Launch 1: session starts, handler is installed, the app crashes.
      sessionManager.startSessionWithIdAt(crashedSessionId, "2023-11-14T22:00:00.000Z")
      JvmCrashHandler.currentSessionId = crashedSessionId
      val writer = CrashFileWriter(tmp.root).also { it.prepare() }
      val reader = CrashFileReader(tmp.root)
      val handler = JvmCrashHandler(
        fileWriter = writer,
        previousHandler = null,
        pidProvider = { 123 },
        clock = { crashedAtMillis }
      )
      handler.uncaughtException(Thread.currentThread(), IllegalStateException("boom"))

      // Launch 2: a new session starts, the sweep closes the crashed one, the
      // processor matches the file against the OS death record.
      val currentSessionId = "2c9c3a82-9a3e-4f12-9302-0c2a44bb1d11"
      sessionManager.deactivateAllSessionsBefore("2023-11-14T22:20:00.000Z")
      sessionManager.startSessionWithIdAt(currentSessionId, "2023-11-14T22:20:00.000Z")
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
      ) { sessionId, origin, report ->
        attributeAndStoreCrashReport(
          sessionManager = sessionManager,
          currentSessionId = currentSessionId,
          sessionId = sessionId,
          origin = origin,
          report = report
        )
      }.process()

      // What JS sees through getInactiveSessions.
      val sessions = sessionManager.getInactiveSessions()
        .map { JsDebugSession.fromSessionWithChildren(it) }

      val crashed = sessions.single { it.id == crashedSessionId }
      val crashReport = requireNotNull(crashed.crashReport)
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

      // The live session carries no crash report.
      assertTrue(sessions.none { it.id == currentSessionId && it.crashReport != null })
      // The pending file is consumed.
      assertEquals(emptyList<PendingJvmCrash>(), reader.listPendingCrashes())
    }
}
