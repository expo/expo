package expo.modules.observe.storage

import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import expo.modules.appmetrics.AppMetadata
import expo.modules.appmetrics.AppMetricsPreferences
import expo.modules.appmetrics.AppUpdatesInfo
import expo.modules.appmetrics.GlobalAttributes
import expo.modules.appmetrics.records.LogEvent
import expo.modules.appmetrics.records.MetricRecord
import expo.modules.appmetrics.records.NetworkSpan
import expo.modules.appmetrics.sessions.SessionSharedObject
import expo.modules.appmetrics.sink.MetricsSinkRegistry
import expo.modules.appmetrics.sink.SessionInfo
import expo.modules.appmetrics.utils.JsonAny
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class DatabaseMetricsSinkTest {
  private lateinit var context: Context
  private lateinit var database: MetricsDatabase
  private lateinit var sessionManager: SessionManager
  private lateinit var sink: DatabaseMetricsSink

  private val start = "2025-01-10T00:00:00.000Z"

  @Before
  fun setUp() {
    GlobalAttributes.set(null)
    context = ApplicationProvider.getApplicationContext()
    database = Room
      .inMemoryDatabaseBuilder(context, MetricsDatabase::class.java)
      .allowMainThreadQueries()
      .build()
    sessionManager = SessionManager(SlowPreferencesContext(context), database)
    sink = DatabaseMetricsSink(sessionManager)
  }

  @After
  fun tearDown() {
    GlobalAttributes.set(null)
    database.close()
  }

  // region Sessions

  @Test
  fun `sessionStarted inserts the session row with its metadata and the environment`() =
    runBlocking {
      AppMetricsPreferences.setEnvironment(context, "staging")

      sink.sessionStarted(session("s", metadata = metadata()))
      awaitStart("s")

      val row = sessionManager.getSessionRow("s")!!
      assertEquals(start, row.startTimestamp)
      assertTrue(row.isActive)
      assertEquals("staging", row.environment)
      assertEquals("TestApp", row.appName)
      assertEquals("update-1", row.appUpdateId)
      assertEquals("en-US", row.languageTag)
    }

  @Test
  fun `records that arrive before the session row is inserted are written after it`() =
    runBlocking {
      sink.sessionStarted(session("s"))

      // Without the wait, each of these fails the foreign key on `sessionId`.
      sink.recordMetrics(listOf(metric("m")), "s")
      sink.recordLogs(listOf(log("l")), "s")
      sink.recordSpans(listOf(span()), "s")

      assertEquals(listOf("m"), sessionManager.getMetricsForSession("s").map { it.name })
      assertEquals(listOf("l"), sessionManager.getLogsForSession("s").map { it.name })
      assertEquals(1, sessionManager.getSpansForSession("s").size)
    }

  @Test
  fun `concurrent writers all wait for the session start`() =
    runBlocking {
      sink.sessionStarted(session("s"))

      val writers = (0 until 20).map { index ->
        launch(Dispatchers.Default) {
          sink.recordMetrics(listOf(metric("m$index")), "s")
          sink.recordLogs(listOf(log("l$index")), "s")
          sink.recordSpans(listOf(span()), "s")
        }
      }
      writers.joinAll()

      assertEquals(20, sessionManager.getMetricsForSession("s").size)
      assertEquals(20, sessionManager.getLogsForSession("s").size)
      assertEquals(20, sessionManager.getSpansForSession("s").size)
    }

  @Test
  fun `sessionEnded stamps the given end timestamp`() =
    runBlocking {
      sink.sessionStarted(session("s"))

      sink.sessionEnded("s", "2025-01-10T00:05:00.000Z")

      val row = sessionManager.getSessionRow("s")!!
      assertFalse(row.isActive)
      assertEquals("2025-01-10T00:05:00.000Z", row.endTimestamp)
    }

  @Test
  fun `a stop during a JS reload persists the end timestamp`() {
    // A reload cancels the module's scope right after `OnDestroy` ends the session with
    // `runBlocking`. The session insert must not run on that scope.
    val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    runBlocking { moduleScope.launch { sink.sessionStarted(session("s")) }.join() }
    moduleScope.cancel()

    runBlocking { sink.sessionEnded("s", "2025-01-10T00:05:00.000Z") }

    val row = runBlocking { sessionManager.getSessionRow("s") }!!
    assertFalse(row.isActive)
    assertEquals("2025-01-10T00:05:00.000Z", row.endTimestamp)
  }

  @Test
  fun `a main session sweeps only sessions that started strictly before it`() =
    runBlocking {
      sessionManager.startSessionWithIdAt("orphan", "2025-01-09T00:00:00.000Z")
      // A row that starts at the cutoff is never swept, so the new main session can't sweep itself.
      sessionManager.startSessionWithIdAt("same-start", start)

      sink.sessionStarted(session("main"))
      awaitStart("main")

      val orphan = sessionManager.getSessionRow("orphan")!!
      assertFalse(orphan.isActive)
      assertEquals(start, orphan.endTimestamp)
      assertTrue(sessionManager.getSessionRow("same-start")!!.isActive)
      assertTrue(sessionManager.getSessionRow("main")!!.isActive)
    }

  @Test
  fun `a session other than main does not sweep`() =
    runBlocking {
      sessionManager.startSessionWithIdAt("older", "2025-01-09T00:00:00.000Z")

      sink.sessionStarted(session("custom", type = "custom"))
      awaitStart("custom")

      assertTrue(sessionManager.getSessionRow("older")!!.isActive)
    }

  @Test
  fun `updateEnvironmentForActiveSessions updates active sessions only`() =
    runBlocking {
      sessionManager.startSessionWithIdAt("active", start, environment = "development")
      sessionManager.startSessionWithIdAt("ended", start, environment = "development")
      sessionManager.stopSession("ended", "2025-01-10T00:05:00.000Z")

      sink.updateEnvironmentForActiveSessions("production")

      assertEquals("production", sessionManager.getSessionRow("active")!!.environment)
      assertEquals("development", sessionManager.getSessionRow("ended")!!.environment)
    }

  // endregion

  // region Global attributes

  @Test
  fun `global attributes merged by the registry land in the stored metric and log rows`() =
    runBlocking {
      GlobalAttributes.set(mapOf("subscription_tier" to "pro", "screen" to "global"))
      MetricsSinkRegistry.register(sink)
      val session = SessionSharedObject(type = "main", customStartTimestamp = start)
      session.start()
      val perRecord = """{"screen":"checkout"}"""

      session.addMetrics(listOf(metric("m").copy(params = perRecord)))
      session.addLogs(listOf(log("l").copy(attributes = perRecord)))

      val merged = mapOf("subscription_tier" to "pro", "screen" to "checkout")
      assertEquals(merged, decode(sessionManager.getMetricsForSession(session.sessionId).single().params))
      assertEquals(merged, decode(sessionManager.getLogsForSession(session.sessionId).single().attributes))
    }

  // endregion

  // region Spans

  @Test
  fun `records spans with generated ids`() =
    runBlocking {
      sessionManager.startSessionWithIdAt("s", start)

      sink.recordSpans(listOf(span(), span()), "s")

      val rows = sessionManager.getSpansForSession("s")
      assertEquals(2, rows.size)
      assertEquals(32, rows[0].traceId.length)
      assertEquals(16, rows[0].spanId.length)
      assertTrue(rows[0].traceId != rows[1].traceId)
    }

  @Test
  fun `spans honor the row cap`() =
    runBlocking {
      sessionManager.startSessionWithIdAt("s", start)

      sink.recordSpans(List(SpanDao.SPAN_CAP + 5) { span() }, "s")

      assertEquals(SpanDao.SPAN_CAP, sessionManager.getSpansForSession("s").size)
    }

  @Test
  fun `a canceled caller does not finish recording spans`() =
    runBlocking {
      sessionManager.startSessionWithIdAt("s", start)
      var reached = false

      launch(start = CoroutineStart.UNDISPATCHED) {
        cancel()
        sink.recordSpans(listOf(span()), "s")
        // A swallowed cancellation would get here, and the caller would see the batch as written.
        reached = true
      }.join()

      assertFalse(reached)
      assertTrue(sessionManager.getSpansForSession("s").isEmpty())
    }

  @Test
  fun `drops a span whose session row does not exist`() =
    runBlocking {
      // Must not throw: recording telemetry must never break the network monitor.
      sink.recordSpans(listOf(span()), "never-inserted")

      assertTrue(sessionManager.getSpans(afterId = -1, limit = Int.MAX_VALUE).isEmpty())
    }

  // endregion

  // region Helpers

  /**
   * Slows every session insert down, so each write in a test races it: the insert reads the
   * environment from preferences first.
   */
  class SlowPreferencesContext(base: Context) : ContextWrapper(base) {
    override fun getSharedPreferences(name: String?, mode: Int): SharedPreferences {
      Thread.sleep(200)
      return super.getSharedPreferences(name, mode)
    }
  }

  // Every write waits for the session start, so an empty write returns once the start is done.
  private suspend fun awaitStart(sessionId: String) = sink.recordMetrics(emptyList(), sessionId)

  private fun decode(json: String?) = json?.let { JsonAny.decodeJsonStringToMap(it) }

  private fun session(id: String, type: String = "main", metadata: AppMetadata? = null) =
    SessionInfo(id = id, type = type, startTimestamp = start, metadata = metadata)

  private fun metadata() =
    AppMetadata(
      appName = "TestApp",
      appIdentifier = "com.test.app",
      appVersion = "1.2.3",
      appBuildNumber = "42",
      appUpdatesInfo = AppUpdatesInfo(updateId = "update-1", runtimeVersion = null, requestHeaders = null),
      appEasBuildId = null,
      languageTag = "en-US",
      deviceOs = "Android",
      deviceOsVersion = "14",
      deviceModel = "Pixel 8",
      deviceName = "oriole",
      expoSdkVersion = "52.0.0",
      reactNativeVersion = "0.76.0",
      clientVersion = "1.0.0"
    )

  private fun metric(name: String) =
    MetricRecord(timestamp = start, category = "test", name = name, value = 1.0)

  private fun log(name: String) = LogEvent(timestamp = start, name = name, severity = "info")

  private fun span() =
    NetworkSpan(
      name = "GET",
      kind = NetworkSpan.CLIENT_KIND,
      startTimestampMs = 1_000,
      endTimestampMs = 1_250,
      statusCode = null,
      statusMessage = null,
      attributes = null,
      events = null
    )

  // endregion
}
